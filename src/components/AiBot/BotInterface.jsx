import React, { useState, useEffect, useRef } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_API;
const FW_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FW_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;

// ===================================
//     🔥 JSON SAFE PROMPT
// ===================================
const SYSTEM_PROMPT = `
You are Dobby, an AI movie assistant.
Your job: convert user questions into a CLEAN JSON structure ONLY.
⚠️ IMPORTANT: YOUR RESPONSE MUST BE PURE JSON ONLY — NO EXTRA TEXT.

JSON format:
{
  "summary": "short sentence explaining search",
  "genre": "action/comedy/horror/drama/etc OR null",
  "year": 2020 or null,
  "year_after": 2010 or null,
  "year_before": 2018 or null,
  "actor": "Tom Cruise" or null,
  "director": "James Cameron" or null,
  "min_rating": 7 or null,
  "count": 10
}

Rules:
- summary must be a short descriptive sentence.
- count defaults to 10 unless the user requests more specifically (like "20 movies").
- If user says "best movies", treat genre as null.
- If user only gives "2010", interpret as year = 2010.
- If user says "after 2010", set year_after = 2010.
- If user says "before 2015", set year_before = 2015.
- ALWAYS return valid JSON. NEVER add markdown or comments.
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

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, movies]);

  // =============================================
  // 🔥 CALL FIREWORKS WITH SAFETY JSON ENFORCING
  // =============================================
  async function aiParse(userText) {
    const payload = {
      model: FW_MODEL,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText }
      ]
    };

    const res = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FW_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    let raw = data?.choices?.[0]?.message?.content || "";

    // cleanup
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // =============================================
  // 🔍 TMDB MOVIE FETCH
  // =============================================
  async function fetchMovies(filters) {
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("api_key", TMDB_KEY);
    url.searchParams.set("sort_by", "popularity.desc");

    if (filters.genre) {
      const genres = {
        action: 28, comedy: 35, drama: 18, horror: 27, thriller: 53,
        romance: 10749, sci_fi: 878, crime: 80, adventure: 12
      };
      if (genres[filters.genre]) {
        url.searchParams.set("with_genres", genres[filters.genre]);
      }
    }

    if (filters.year) url.searchParams.set("primary_release_year", filters.year);
    if (filters.year_after) url.searchParams.set("primary_release_date.gte", `${filters.year_after}-01-01`);
    if (filters.year_before) url.searchParams.set("primary_release_date.lte", `${filters.year_before}-12-31`);
    if (filters.min_rating) url.searchParams.set("vote_average.gte", filters.min_rating);

    const res = await fetch(url);
    const data = await res.json();
    return data.results?.slice(0, filters.count || 10) || [];
  }

  // =============================================
  // 🚀 SEND MESSAGE
  // =============================================
  async function onSend() {
    const userText = input.trim();
    if (!userText) return;

    setInput("");
    setMovies([]);
    setLoading(true);

    setMessages((m) => [...m, { role: "user", content: userText }]);

    // Step 1: Parse with Fireworks
    const parsed = await aiParse(userText);

    if (!parsed) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Sorry — I couldn’t understand that." }]);
      setLoading(false);
      return;
    }

    // Step 2: Respond with summary
    setMessages((m) => [...m, { role: "assistant", content: parsed.summary }]);

    // Step 3: Fetch movies
    const results = await fetchMovies(parsed);
    setMovies(results);

    setLoading(false);
  }

  return (
    <div className="w-[600px] h-[650px] bg-black/90 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <div className="text-lg font-bold">Dobby AI Assistant</div>
          <div className="text-xs text-white/60">Movie recommendations</div>
        </div>
        <button className="text-red-400 text-xl" onClick={() => setActive(false)}>×</button>
      </div>

      {/* CHAT */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded-lg max-w-[85%] ${
            m.role === "user"
              ? "ml-auto bg-emerald-400 text-black"
              : "mr-auto bg-white/10"
          }`}>
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="bg-white/10 p-2 rounded animate-pulse w-[120px]">Thinking…</div>
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
                <div className="text-white/60">⭐ {m.vote_average?.toFixed(1)} | {m.release_date?.slice(0, 4)}</div>
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
            placeholder="Ask me something…"
          />
          <button onClick={onSend} className="px-4 py-2 bg-emerald-400 text-black rounded font-bold">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
