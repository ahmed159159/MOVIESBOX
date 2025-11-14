// MovieCardLite.jsx
import React from "react";

export default function MovieCardLite({ movie }) {
  if (!movie) return null;

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);

  const imdb = `https://www.imdb.com/find/?q=${encodeURIComponent(
    `${title} ${year}`
  )}`;

  return (
    <div className="bg-white/10 rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] transition p-2">
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          className="w-full h-64 object-cover rounded-lg"
          alt={title}
        />
      ) : (
        <div className="h-64 bg-black/40 flex items-center justify-center text-white/40">
          No Image
        </div>
      )}

      <div className="mt-2">
        <div className="text-white text-lg font-semibold">{title}</div>
        <div className="text-white/60 text-sm">
          ⭐ {movie.vote_average?.toFixed(1) || "N/A"} • {year || "Unknown"}
        </div>

        <a
          href={imdb}
          target="_blank"
          className="text-sky-300 underline text-sm"
        >
          IMDb
        </a>
      </div>
    </div>
  );
}
