import React, { useState, useRef, useEffect } from "react";
import BotInterface from "./BotInterface"; // API FILE

export default function PopcornChat({ setActive }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I’m Dobby — your smart movie assistant 🍿 Ask me anything and I'll help you find the perfect movie!"
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const pushMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  async function handleSend() {
    const q = input.trim();
    if (!q) return;

    pushMessage("user", q);
    setInput("");
    setMovies([]);
    setLoading(true);

    const res = await BotInterface(q);

    pushMessage("bot", res.summary);

    if (res.movies.length > 0) {
      setMovies(res.movies);
    } else {
      pushMessage("bot", "No results found.");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/60">
        <div>
          <div className="text-lg font-semibold text-white">Dobby Assistant</div>
          <div className="text-xs text-white/50">Movie AI Expert</div>
        </div>
        <button
          onClick={() => setActive(false)}
          className="text-red-400 text-xl hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-3 py-2 rounded-xl max-w-[75%] ${
                m.role === "user"
                  ? "bg-white text-black"
                  : "bg-emerald-600/20 text-white"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-white text-sm opacity-70">Thinking…</div>
        )}
      </div>

      {/* Movies */}
      {movies.length > 0 && (
        <div className="p-3 bg-black/50 border-t border-white/10 max-h-[40%] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {movies.map((mv) => (
              <a
                key={mv.id}
                href={`/info?id=${mv.id}`} // 🔥 رابط موقعك انت
                className="block rounded-lg overflow-hidden bg-white/10 hover:bg-white/20 transition"
              >
                {mv.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${mv.poster_path}`}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="h-36 bg-white/20 flex items-center justify-center text-white/60">
                    No Image
                  </div>
                )}

                <div className="p-2 text-white text-xs">
                  {mv.title || mv.name}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 border-t border-white/10 bg-black/60">
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-xl bg-white/10 text-white outline-none"
            placeholder="Ask about movies…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-emerald-400 text-black font-bold hover:bg-emerald-300 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}
