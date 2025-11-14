import React, { useState, useEffect, useRef } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_API;
const FW_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FW_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;

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
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, movies]);

  async function callFireworks(conversation) {
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
          temperature: 0.4,
          max_tokens: 500,
          messages: conversation,
        }),
      }
    );

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async function fetchMovies(filters) {
    const url = new URL(
      "https://api.themoviedb.org/3/discover/movie"
    );

    url.searchParams.set("api_key", TMDB_KEY);
    url.searchParams.set("sort_by", "popularity.desc");

    if (filters.year) url.searchParams.set("primary_release_year", filters.year);
    if (filters.year_after)
      url.searchParams.set("primary_release_date.gte", `${filters.year_after}-01-01`);
    if (filters.year_before)
      url.searchParams.set("primary_release_date.lte", `${filters.year_before}-12-31`);
    if (filters.genre_id) url.searchParams.set("with_genres", filters.genre_id);
    if (filters.min_rating)
      url.searchParams.set("vote_average.gte", filters.min_rating);

    const res = await fetch(url);
    const data = await res.json();
    return data.results?.slice(0, filters.count || 10) || [];
  }

  async function onSend() {
    const userText = input.trim();
    if (!userText) return;

    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    try {
      // حفظ المحادثة (الكونتكست)
      const conversation = [
        { role: "system", content: "You are a movie assistant. Return JSON." },
        ...messages,
        { role: "user", content: userText },
      ];

      // AI تحليل request
      const raw = await callFireworks(conversation);

      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = null;
      }

      if (!parsed || typeof parsed !== "object") {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "⚠️ Sorry — I couldn’t understand that." },
        ]);
        setLoading(false);
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: parsed.summary || "Searching…" },
      ]);

      // TMDB
      const results = await fetchMovies(parsed);
      setMovies(results);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Error fetching results." },
      ]);
    }

    setLoading(false);
  }

  function movieCard(m) {
    return (
      <a
        key={m.id}
        href={`/info?id=${m.id}`}
        className="flex gap-3 bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition p-2"
      >
        {m.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
            className="w-[60px] h-[90px] rounded object-cover"
          />
        )}
        <div className="flex flex-col justify-between text-sm">
          <div className="font-semibold">{m.title}</div>
          <div className="text-white/60">
            ⭐ {m.vote_average?.toFixed(1)} | {m.release_date?.slice(0, 4)}
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 bg-white/10 border-b border-white/10">
        <div>
          <div className="text-lg font-bold">Dobby AI</div>
          <div className="text-xs text-white/60">Movie Assistant</div>
        </div>

        <button
          onClick={() => setActive(false)}
          className="text-red-400 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
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
          <div className="mr-auto bg-white/10 p-2 rounded-lg animate-pulse">
            Thinking…
          </div>
        )}
      </div>

      {/* RESULTS */}
      {movies.length > 0 && (
        <div className="p-3 border-t border-white/10 space-y-3 overflow-y-auto max-h-[40%]">
          {movies.map(movieCard)}
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 border-t border-white/10 bg-black/40">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded bg-white/10 text-white outline-none"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />
          <button
            onClick={onSend}
            className="px-4 py-2 bg-emerald-400 rounded text-black font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
