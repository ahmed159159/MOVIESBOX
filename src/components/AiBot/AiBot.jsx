import React, { useState, useRef, useEffect } from "react";
import PopcornInterface from "./BotInterface";
import MovieCardLite from "./MovieCardLite";

export default function AiBot() {
  const [messages, setMessages] = useState([
    { id: Date.now(), role: "system", text: "Hello — I'm Popcorn, your movie assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, movies, loading]);

  function pushMessage(role, text) {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), role, text }]);
  }

  async function handleAsk() {
    const text = input.trim();
    if (!text) return;

    pushMessage("user", text);
    setInput("");
    setMovies([]);
    setLoading(true);
    setStatus("Analyzing your request...");

    try {
      const res = await PopcornInterface(text);
      const summary = res.summary || "Here's what I found:";
      pushMessage("bot", summary);

      setStatus("Fetching movie results...");
      setMovies(res.movies || []);
      setStatus("");
    } catch (err) {
      console.error("AiBot error:", err);
      pushMessage("bot", "⚠️ Sorry — something went wrong. Try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Enter" && document.activeElement?.id === "ai-input") {
        e.preventDefault();
        handleAsk();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input]);

  return (
    <div className="fixed right-6 bottom-6 z-40 w-[96vw] max-w-4xl md:w-[900px] md:right-12 md:bottom-12">
      <div className="bg-gradient-to-br from-black/80 to-neutral-900/70 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400 flex items-center justify-center text-black font-bold">
              PP
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Popcorn Pilot</div>
              <div className="text-xs text-white/60">AI Movie Assistant</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-white/50">{status}</div>

            {loading && (
              <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center text-sky-300">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"></circle>
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="md:flex">

          {/* Chat + Results */}
          <div className="w-full md:w-2/3 p-4">
            
            {/* Chat */}
            <div ref={chatRef} className="max-h-[40vh] overflow-y-auto pr-2 space-y-3 mb-4">
              {messages
                .filter((m) => m.role !== "system")
                .map((m) => (
                  <div key={m.id}>
                    {m.role === "user" ? (
                      <div className="text-sm text-right">
                        <div className="inline-block bg-white/90 text-black px-3 py-2 rounded-lg max-w-[80%]">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-left">
                        <div className="inline-block bg-gradient-to-r from-emerald-700/10 to-sky-700/8 text-white px-3 py-2 rounded-lg max-w-[90%]">
                          <strong className="text-emerald-300 mr-2">Popcorn:</strong> 
                          {m.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {movies?.length > 0 ? (
                movies.map((mv) => (
                  <div key={mv.id} className="w-full">
                    <MovieCardLite movie={mv} />
                  </div>
                ))
              ) : (
                !loading && (
                  <div className="text-sm text-white/50 italic">
                    Ask me about movies — e.g. "Horror movies 2010–2015 Tom Cruise"
                  </div>
                )
              )}
            </div>
          </div>

          {/* Input Panel */}
          <div className="w-full md:w-1/3 p-4 border-l border-white/10">
            <div className="mb-3">
              <label className="text-xs text-white/60">Ask Popcorn</label>
              <input
                id="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try: "Action movies like John Wick 2014"'
                className="w-full mt-2 p-3 rounded-lg bg-white/5 text-white placeholder-white/40 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAsk}
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-emerald-400 text-black font-semibold hover:opacity-95 disabled:opacity-60"
              >
                Ask
              </button>

              <button
                onClick={() => {
                  setMessages([{ id: Date.now(), role: "system", text: "Hello — I'm Popcorn, your movie assistant." }]);
                  setMovies([]);
                  setInput("");
                }}
                className="py-3 px-4 rounded-lg bg-white/10 text-white"
              >
                Clear
              </button>
            </div>

            {/* Tip (fixed JSX issue) */}
            <div className="mt-4 text-xs text-white/50">
              Tip: Use actor, director, year, or rating — e.g. {"\"Scary movies after 2010 with rating > 7\""}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
