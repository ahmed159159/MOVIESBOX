// ===========================
// 🔥 Popcorn AI Bot (Fireworks)
// ===========================

import { useState } from "react";

const FIREWORKS_API_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FIREWORKS_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY;

// ---------- Global context (memory)
let conversation = [
  {
    role: "system",
    content: `
You are Dobby, a smart movie assistant.
Your job is to extract filters from the user's request ONLY in JSON.

STRICT RULE:
- ALWAYS return JSON ONLY. Never return text outside JSON.
- JSON format:

{
 "type": "movie",
 "genre": "<genre or null>",
 "actor": "<actor name or null>",
 "director": "<director name or null>",
 "year": "<exact year or null>",
 "rating": "<minimum rating or null>",
 "limit": "<number of movies or null>",
 "summary": "<1 short English sentence summarizing the request>"
}

If the user asks follow-up like "from 2015" or "with Tom Cruise",
USE previous filters from the conversation and update them.

Never ask questions. Never apologize. Just return JSON.
`
  }
];

// ---------------- FIREWORKS API ----------------

async function askFireworks(prompt) {
  conversation.push({ role: "user", content: prompt });

  const res = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIREWORKS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: FIREWORKS_MODEL,
      messages: conversation,
      temperature: 0.2,
      max_tokens: 300
    })
  });

  const data = await res.json();
  let output = data?.choices?.[0]?.message?.content || "";

  // Clean non-JSON
  output = output.trim();
  if (output.startsWith("```")) {
    output = output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1);
  }

  try {
    const parsed = JSON.parse(output);
    conversation.push({ role: "assistant", content: JSON.stringify(parsed) });
    return parsed;
  } catch (err) {
    console.log("Fixing malformed JSON...");

    // fallback: ask AI again but force JSON strictly
    return await askFireworks(`
Return ONLY JSON. Fix this into valid JSON:
${output}
`);
  }
}

// ================ TMDB HELPERS ==================

async function searchByActor(name) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}`
  );
  const data = await res.json();
  return data.results?.[0]?.id || null;
}

async function getActorMovies(personId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${TMDB_KEY}`
  );
  const data = await res.json();
  return data.cast || [];
}

async function discoverMovies(filters) {
  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("sort_by", "popularity.desc");

  if (filters.genre) url.searchParams.set("with_genres", filters.genre);
  if (filters.year) url.searchParams.set("primary_release_year", filters.year);
  if (filters.rating) url.searchParams.set("vote_average.gte", filters.rating);

  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// ================ MAIN BOT FUNCTION ================

export default async function BotInterface(query) {
  try {
    // 1) Get structured filters from Fireworks AI
    const filters = await askFireworks(query);

    let movies = [];
    const limit = filters.limit ? Number(filters.limit) : 10;

    // 2) Actor
    if (filters.actor) {
      const id = await searchByActor(filters.actor);
      if (id) movies = await getActorMovies(id);
    } else {
      // 3) General discover
      movies = await discoverMovies(filters);
    }

    // 4) Limit results
    movies = movies.slice(0, limit);

    return {
      summary: filters.summary,
      movies
    };
  } catch (err) {
    console.error("Bot error:", err);
    return {
      summary: "⚠️ Sorry—couldn't fetch results.",
      movies: []
    };
  }
}
