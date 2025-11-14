// AiBot.jsx
import React, { useEffect, useRef, useState } from "react";
import PopcornInterface from "./BotInterface"; // same folder

export default function AiBot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => {
    // scroll results to top when new search happens
    if (resultsRef.current) {
      resultsRef.current.scrollTop = 0;
    }
  }, [movies]);

  function pushSystem(text) {
    setMessages(m => [...m, { id: Date.now(), role: "bot", text }]);
  }
  function pushUser(text) {
    setMessages(m => [...m, { id: Date.now(), role: "user", text }]);
  }

  async function handleSearch() {
    const txt = (query || "").trim();
    if (!txt) return;
    pushUser(txt);
    setMovies([]);
    setLoading(true);
    setStatus("Analyzing request...");
    try {
      const res = await PopcornInterface(txt);
      // res: { summary, movies }
      pushSystem(res.summary || "Here are the results:");
      setMovies(res.movies || []);
      setStatus("");
    } catch (err) {
      console.error(err);
      pushSystem("⚠️ Something went wrong. Try again.");
      setStatus("");
    } finally {
      setLoading(false);
      setQuery("");
    }
  }

  return (
    <>
      {/* Floating round button */}
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 60,
        }}
      >
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Open Popcorn Pilot"
          title="Popcorn Pilot"
          style={{
            width: 60,
            height: 60,
            borderRadius: "999px",
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

      {/* Chat box */}
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
            background: "linear-gradient(180deg, rgba(6,7,9,0.95), rgba(10,11,13,0.95))",
            boxShadow: "0 10px 30px rgba(2,6,23,0.6)",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            minHeight: 360,
            maxHeight: "72vh"
          }}
        >
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg,#06b6d4,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#031018" }}>
                PP
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Popcorn Pilot</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>AI Movie Assistant</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{status}</div>
              <button
                onClick={() => { setOpen(false); }}
                title="Close"
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 6 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* body: left messages + right inputs/results */}
          <div style={{ display: "flex", gap: 0, flex: 1, minHeight: 280 }}>
            {/* left: messages + results grid */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12 }}>
              <div style={{ flex: "0 0 110px", overflow: "auto", padding: 6 }}>
                {/* Messages area (compact) */}
                {messages.slice(-6).map(m => (
                  <div key={m.id} style={{ marginBottom: 8, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%",
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: m.role === "user" ? "rgba(255,255,255,0.9)" : "linear-gradient(90deg,#083344,#064047)",
                      color: m.role === "user" ? "#000" : "#c9fff1"
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Results container (scroll inside fixed area) */}
              <div ref={resultsRef} style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {movies && movies.length > 0 ? movies.map(m => (
                  <div key={m.id} style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))", borderRadius: 10, padding: 8 }}>
                    <div style={{ height: 150, borderRadius: 8, overflow: "hidden", background: "#111" }}>
                      {m.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>No Image</div>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{m.release_date ? m.release_date.slice(0,4) : ""} • ⭐ {m.vote_average || "N/A"}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.75)", maxHeight: 48, overflow: "hidden", textOverflow: "ellipsis" }}>{m.overview}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: "1 / -1", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                    {loading ? "Looking for movies..." : "Ask me about movies — e.g. \"Action movies 2010-2015 Tom Cruise\""}
                  </div>
                )}
              </div>
            </div>

            {/* right: input + controls */}
            <div style={{ width: 240, borderLeft: "1px solid rgba(255,255,255,0.03)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Ask Popcorn</label>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Try: "Action movies like John Wick 2014"'
                style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.03)", color: "#fff", outline: "none" }}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={loading} onClick={handleSearch} style={{ flex: 1, padding: 10, borderRadius: 8, background: "#06b6d4", color: "#00131a", border: "none", fontWeight: 700, cursor: "pointer" }}>
                  Ask
                </button>
                <button onClick={() => { setMessages([]); setMovies([]); setQuery(""); }} style={{ padding: 10, borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.06)" }}>
                  Clear
                </button>
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                Tip: Use actor, director, year, or rating — e.g. "Scary movies after 2010 with rating > 7"
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
