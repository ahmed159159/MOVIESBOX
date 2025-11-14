import React, { useState, useEffect, useRef } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_API;
const FW_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FW_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;

// =====================
//   STRONG JSON PROMPT
// =====================
const SYSTEM_PROMPT = `
You are Dobby, a movie assistant.
Your ONLY job is to extract filters from user text and return STRICT JSON ONLY.

Never answer with normal text. Never repeat the user message.
Never explain. Never include markdown.

Output format (ALWAYS):
{
 "summary": "short english sentence",
 "genre": "action|comedy|drama|horror|romance|null",
 "actor": "Tom Hanks|null",
 "director": "name|null",
 "year": 2000|null,
 "year_after": 2010|null,
 "year_before": 2019|null,
 "min_rating": 7|null,
 "count": 10
}

Rules:
- If user writes "Tom Hanks movies", set actor = "Tom Hanks".
- If user writes only actor name, treat as actor filter.
- If user writes "best movies", genre stays null.
- If user writes "20 movies", set count = 20.
- If no special request: count = 10.
- Always return JSON. Nothing else.
`;

export default function BotInterface({ setActive }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I’m Dobby — your smart movie assistant 🍿\nAsk me anything and I'll help you find the perfect movie!",
    },
  ]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, movies]);

  // =============================
  //  REGEX JSON CLEANER
  // =============================
  function extractJson(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  // =============================
  //  CALL FIREWORKS
  // =============================
  async function aiParse(userText) {
    const res = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FW_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: FW_MODEL,
          temperature: 0.3,
          max_tokens: 350,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText },
          ],
        }),
      }
    );

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    return extractJson(raw);
  }

  // =============================
  //   TMDB Search (Actor OR Filters)
  // =============================
  async function fetchMovies(filters) {
    // Actor search
    if (filters.actor) {
      const s = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(
          filters.actor
        )}`
      );
      const sd = await s.json();

      const actorId = sd.results?.[0]?.id;
      if (!actorId) return [];

      const cr = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_cast=${actorId}`
      );
      const cd = await cr.json();

      return cd.results.slice(0, filters.count || 10);
    }

    // Discover movie filters
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("api_key", TMDB_KEY);
    url.searchParams.set("sort_by", "popularity.desc");

    if (filters.genre) {
      const map = {
        action: 28,
        comedy: 35,
        drama: 18,
        horror: 27,
        romance: 10749,
      };
      if (map[filters.genre]) {
        url.searchParams.set("with_genres", map[filters.genre]);
      }
    }

    if (filters.year) url.searchParams.set("primary_release_year", filters.year);
    if (filters.year_after)
      url.searchParams.set(
        "primary_release_date.gte",
        `${filters.year_after}-01-01`
      );
    if (filters.year_before)
      url.searchParams.set(
        "primary_release_date.lte",
        `${filters.year_before}-12-31`
      );

    const r = await fetch(url);
    const d = await r.json();
    return d.results.slice(0, filters.count || 10);
  }

  // =============================
  //   SEND USER MESSAGE
  // =============================
  async function onSend() {
    const userText = input.trim();
    if (!userText) return;

    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setMovies([]);
    setLoading(true);

    // parse request
    const parsed = await aiParse(userText);

    if (!parsed) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "⚠️ Sorry — I couldn’t understand your request.",
        },
      ]);
      setLoading(false);
      return;
    }

    // Show summary
    setMessages((m) => [
      ...m,
      { role: "assistant", content: parsed.summary },
    ]);

    // Search TMDB
    const results = await fetchMovies(parsed);
    setMovies(results);
    setLoading(false);
  }

  return (
    <div className="w-[600px] h-[650px] bg-black/90 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <div className="text-lg font-bold">Dobby AI</div>
          <div className="text-xs text-white/60">Movie Assistant</div>
        </div>
        <button onClick={() => setActive(false)} className="text-red-500 text-xl">×</button>
      </div>

      {/* CHAT */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[85%] ${
              m.role === "user"
                ? "ml-auto bg-emerald-400 text-black"
                : "mr-auto bg-white/10"
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="bg-white/10 p-2 rounded animate-pulse w-[120px]">
            Thinking…
          </div>
        )}
      </div>

      {/* RESULTS */}
      {movies.length > 0 && (
        <div className="border-t border-white/10 max-h-[250px] overflow-y-auto p-3 space-y-3 bg-white/5">
          {movies.map((m) => (
            <a
              key={m.id}
              href={`/info?id=${m.id}`}
              className="flex gap-3 bg-white/10 rounded-lg p-2 hover:bg-white/20 transition"
            >
              {m.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                  className="w-[60px] h-[90px] rounded object-cover"
                />
              )}
              <div className="flex flex-col text-sm">
                <div className="font-semibold">{m.title}</div>
                <div className="text-white/60">
                  ⭐ {m.vote_average?.toFixed(1)} | {m.release_date?.slice(0, 4)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 border-t border-white/10 bg-black/70">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            className="flex-1 p-2 rounded bg-white/10 outline-none"
            placeholder="Ask me anything…"
          />
          <button
            onClick={onSend}
            className="px-4 py-2 bg-emerald-400 text-black rounded font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
