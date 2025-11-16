import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import { faImdb } from "@fortawesome/free-brands-svg-icons";
import Recomendation from "./Recomendation";
import { MyContext } from "../Context/WatchListContext";
import { MySwitchContext } from "../Context/MovieTVcontext";
import axios from "axios";
import { API_KEY } from "../../assets/key";
import { getFunDesc } from "./prompt";
import InfoLoading from "./InfoLoading";
import { FullScreenLoader } from "../commonComponents/CircularLoader";
import { useLoadingProgress } from "../../hooks/useLoadingProgress";

function Info() {
  const { watchList, setWatchList } = useContext(MyContext);
  const { switchmov } = useContext(MySwitchContext);
  const location = useLocation();
  const [movie, setMovie] = useState({});
  const [isLiked, setIsLiked] = useState(false);
  const [ytLink, setytLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [funDesc, setFunDesc] = useState("");
  const progress = useLoadingProgress(isLoading);

  const title = movie?.title || movie?.name || "Untitled";
  const date = movie?.release_date || movie?.first_air_date || "No date found";

  useEffect(() => {
    const fetchMovieData = async () => {
      setIsLoading(true);

      try {
        const movID = new URLSearchParams(location.search).get("id");
        if (!movID) throw new Error("No movie ID provided");

        const movieResponse = await axios.get(
          `https://api.themoviedb.org/3/${switchmov}/${movID}?api_key=${API_KEY}&language=en-US`
        );

        setFunDesc(
          getFunDesc({
            movieName: movieResponse.data.title,
            releaseDate: movieResponse.data.release_date,
            lang: movieResponse.data.original_language,
          })
        );

        setMovie(movieResponse.data);

        const videosResponse = await axios.get(
          `https://api.themoviedb.org/3/${switchmov}/${movID}/videos?api_key=${API_KEY}`
        );

        if (videosResponse.data.results?.length > 0) {
          const trailer =
            videosResponse.data.results.find(
              (v) => v.type === "Trailer" && v.site === "YouTube"
            ) || videosResponse.data.results[0];

          setytLink(trailer.key);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieData();
  }, [location.search, switchmov]);

  useEffect(() => {
    if (!movie?.id) return;
    setIsLiked(watchList.some((mov) => mov.id === movie.id));
  }, [watchList, movie]);

  const handleLike = () => {
    if (!movie?.id) return;

    if (isLiked) {
      setWatchList(watchList.filter((mov) => mov.id !== movie.id));
    } else {
      setWatchList([...watchList, movie]);
    }
    setIsLiked(!isLiked);
  };

  if (isLoading) {
    return (
      <>
        <FullScreenLoader
          progress={progress}
          text="Loading Movie Details..."
          subText="Fetching trailers, cast info, and recommendations"
        />
        <InfoLoading />
      </>
    );
  }

  if (!movie?.id) {
    return (
      <div className="min-h-screen bg-ultra-black flex items-center justify-center text-white text-4xl font-bold">
        No movie data available 😟
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ultra-black text-white">
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {movie.backdrop_path && (
          <>
            <img
              src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
              className="w-full h-full object-cover"
              alt="Backdrop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20"></div>
          </>
        )}
      </div>

      <div className="relative -mt-32 z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0 w-full lg:w-80 mx-auto lg:mx-0">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`}
                  className="w-full lg:w-80 rounded-2xl shadow-2xl object-cover"
                  alt="poster"
                />
              ) : (
                <div className="w-full lg:w-80 h-96 bg-white/10 rounded-2xl flex items-center justify-center">
                  No Image
                </div>
              )}
            </div>

            <div className="flex flex-col flex-grow">
              <div className="flex items-center mb-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {title}
                </h1>

                <button
                  onClick={handleLike}
                  className="text-red-500 bg-white/10 p-3 rounded-full ml-4 border border-white/20"
                >
                  <FontAwesomeIcon
                    icon={isLiked ? solidHeart : regularHeart}
                    className="text-xl"
                  />
                </button>
              </div>

              <p className="text-white/80 text-lg mb-8">
                {movie.overview || "No description available"}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                {ytLink && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105"
                  >
                    🎬 Watch Trailer
                  </button>
                )}

                {movie.homepage && (
                  <a
                    href={movie.homepage}
                    target="_blank"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105"
                  >
                    🏠 Official Site
                  </a>
                )}

                {movie.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                    target="_blank"
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-full shadow-lg hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faImdb} className="mr-2" />
                    IMDB
                  </a>
                )}
              </div>

              {funDesc && (
                <p className="text-cyan-300 text-lg italic mb-4 bg-white/5 p-4 rounded-2xl border border-cyan-500/20">
                  {funDesc}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movie.vote_average > 0 && (
            <div className="bg-white/10 p-6 rounded-2xl">
              ⭐ {movie.vote_average.toFixed(1)} / 10
            </div>
          )}

          {date && (
            <div className="bg-white/10 p-6 rounded-2xl">
              📅 {date}
            </div>
          )}

          {movie.genres?.length > 0 && (
            <div className="bg-white/10 p-6 rounded-2xl">
              🎭 {movie.genres.map((g) => g.name).join(", ")}
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">🎬 You Might Also Like</h2>
          <Recomendation />
        </div>
      </div>

      {showTrailer && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[9999]"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${ytLink}?autoplay=1`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 bg-red-600 text-white w-12 h-12 rounded-full text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Info;
