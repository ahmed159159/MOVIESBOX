import React from "react";
import { Github, Mail, Linkedin } from "lucide-react"; 
import { Twitter } from "lucide-react"; // 

function Footer() {
  return (
    <footer className="bg-black text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">

          {/* Logo & Name */}
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-amber-400">MoviesBox</h2>
          </div>

          {/* TMDB Logo */}
          <div>
            <a
              href="https://www.themoviedb.org/"
              className="flex h-20"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://img.icons8.com/?size=512&id=AxHFXpfUuWsm&format=png"
                alt="TMDB Logo"
              />
            </a>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            {/* GitHub */}
            <a
              href="https://github.com/ahmed159159"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-400 hover:text-black transition-colors"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>

            {/* Email */}
            <a
              href="mailto:ahmednftnftnft@gmail.com"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-400 hover:text-black transition-colors"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>

            {/* Twitter (X) */}
            <a
              href="https://x.com/ahmed83203489"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-400 hover:text-black transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-400 hover:text-black transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Attribution Line */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Powered by TMDB API. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
