// AiBot.jsx
import React, { useEffect, useRef, useState } from "react";
import PopcornInterface from "./BotInterface";

export default function AiBot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text:
        "Hello! I’m Dobby — your smart movie assistant 🍿\nAsk me anything and I'll help you find the perfect movie based on genre, actors, ratings, release years and more.",
    },
  ]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    // scroll messages to bottom when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [movies]);

  function pushMessage(role, text) {
    setMessages((m) => [...m, { id: Date.now() + Math.random(), role, text }]);
  }

  async function handleAsk() {
    const txt = (query || "").trim();
    if (!txt) return;
    pushMessage("user", txt);
    setQuery("");
    setMovies([]);
    setLoading(true);

    try {
      const res = await PopcornInterface(txt);
      // res: { summary, movies }
      pushMessage("bot", res.summary || "Here are the results:");
      setMovies(res.movies || []);
    } catch (err) {
      console.error(err);
      pushMessage("bot", "⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* floating circular button */}
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="Open Popcorn Pilot"
          style={{
            width: 60,
            height: 60,
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(135deg,#10b981,#06b6d4)",
            boxShadow: "0 8px 30px rgba(6,95,70,0.25)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#031018",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          PP
        </button>
      </div>

      {/* popup box */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 90,
            zIndex: 60,
            width: 600,
            maxWidth: "calc(100vw - 40px)",
            borderRadius: 14,
            overflow: "hidden",
            background: "#05060a",
            boxShadow: "0 10px 30px rgba(2,6,23,0.6)",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            minHeight: 380,
            maxHeight: "78vh",
          }}
        >
          {/* header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 12,
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: "linear-gradient(135deg,#06b6d4,#10b981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#031018",
                }}
              >
                PP
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Popcorn Pilot</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  AI Movie Assistant
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* content */}
          <div style={{ display: "flex", gap: 0, flex: 1, minHeight: 300 }}>
            {/* left: messages + results */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12 }}>
              {/* messages */}
              <div
                ref={messagesRef}
                style={{ flex: "0 0 110px", overflow: "auto", padding: 6 }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: m.role === "user" ? "rgba(255,255,255,0.9)" : "linear-gradient(90deg,#083344,#064047)",
                        color: m.role === "user" ? "#000" : "#c9fff1",
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* results grid (scrollable, fixed area) */}
              <div
                ref={resultsRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 10,
                }}
              >
                {movies && movies.length > 0 ? (
                  movies.map((m) => (
                    <a
                      key={m.id}
                      href={m.local || `/info?id=${m.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                        borderRadius: 10,
                        padding: 8,
                        display: "block",
                      }}
                    >
                      <div style={{ height: 150, borderRadius: 8, overflow: "hidden", background: "#111" }}>
                        {m.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                            alt={m.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>No Image</div>
                        )}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 700 }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                          {m.release_date ? m.release_date.slice(0, 4) : ""} • ⭐ {m.vote_average || "N/A"}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)", maxHeight: 48, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.overview}
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div style={{ gridColumn: "1 / -1", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                    {loading ? "Looking for movies..." : "Ask me about movies — e.g. \"Action movies 2010-2015 Tom Cruise\""}
                  </div>
                )}
              </div>
            </div>

            {/* right: input */}
            <div style={{ width: 240, borderLeft: "1px solid rgba(255,255,255,0.03)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Ask Popcorn</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try: "Top 20 action movies 2010-2020 Tom Cruise"'
                style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.03)", color: "#fff", outline: "none" }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={loading} onClick={handleAsk} style={{ flex: 1, padding: 10, borderRadius: 8, background: "#06b6d4", color: "#00131a", border: "none", fontWeight: 700, cursor: "pointer" }}>
                  Ask
                </button>
                <button onClick={() => { setMessages([{ id: "welcome", role: "bot", text: "Hello! I’m Dobby — your smart movie assistant 🍿\nAsk me anything and I'll help you find the perfect movie based on genre, actors, ratings, release years and more." }]); setMovies([]); setQuery(""); }} style={{ padding: 10, borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.06)" }}>
                  Reset
                </button>
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                Tip: include numbers like "top 20" if you want more than 10 results.
              </div>

              <div style={{ marginTop: "auto", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                Popcorn Pilot — results powered by TMDB
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
