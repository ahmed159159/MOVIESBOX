import React, { useState } from "react";
import logo from "../assets/movieHubLogo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hide navbar on home page
  if (location.pathname === '/') {
    return null;
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handelSearch = () => {
    if (searchQuery.trim()) {
      let query = searchQuery.trim().replace(/\s+/g, "+");
      navigate(`/search?q=${query}`);
    }
  };

  const handelKeyDown = (e) => {
    if (e.key === "Enter") handelSearch();
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between bg-ultra-black px-4 py-4 md:px-6 lg:px-10">

        {/* ================= LOGO (FULL-CIRCLE IMAGE LIKE THE BOT) ================= */}
        <div className="flex items-center">
          <Link
            to="/"
            className="transform hover:scale-110 transition-all duration-300 group"
          >
            <div
              className="
                w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20
                rounded-full overflow-hidden
                bg-white/20 backdrop-blur-md
                shadow-xl border border-white/30
                group-hover:bg-white/40 group-hover:scale-105
                transition-all duration-300
              "
            >
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* ======== Desktop Menu ======== */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 ml-8 lg:ml-16">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/watchlist" className="nav-item">WatchList</Link>
            <Link to="/trending" className="nav-item">Trending</Link>
            <Link to="/top-rated" className="nav-item">Top Rated</Link>
            <Link to="/upcoming" className="nav-item">Upcoming</Link>
            <Link to="/discover" className="nav-item">Discover</Link>
          </div>
        </div>

        {/* ================= SEARCH BAR ================= */}
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 group">
          <input
            value={searchQuery}
            onKeyDown={handelKeyDown}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search movies..."
            className="bg-transparent text-white placeholder-white/60 px-4 py-3 md:px-6 md:py-4 text-sm md:text-base focus:outline-none w-48 md:w-64"
          />
          <button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl transition-all duration-300 hover:scale-105 shadow-lg mr-1 group"
            onClick={handelSearch}
          >
            <span className="group-hover:animate-spin transition-transform duration-300">🔍</span>
          </button>
        </div>

        {/* ================= MOBILE MENU BUTTON ================= */}
        <div className="md:hidden">
          <button 
            onClick={toggleMenu} 
            className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-110 transition-all duration-300 focus:outline-none text-white"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE DROPDOWN MENU ================= */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-ultra-black/95 backdrop-blur-md md:hidden z-50 border-t border-white/10">
          <div className="flex flex-col items-center py-6 space-y-3">
            <Link to="/" className="mobile-item" onClick={toggleMenu}>Home</Link>
            <Link to="/watchlist" className="mobile-item" onClick={toggleMenu}>WatchList</Link>
            <Link to="/trending" className="mobile-item" onClick={toggleMenu}>Trending</Link>
            <Link to="/top-rated" className="mobile-item" onClick={toggleMenu}>Top Rated</Link>
            <Link to="/upcoming" className="mobile-item" onClick={toggleMenu}>Upcoming</Link>
            <Link to="/discover" className="mobile-item" onClick={toggleMenu}>Discover</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NavBar;
