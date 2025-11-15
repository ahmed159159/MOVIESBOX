import React, { useState } from "react";
import botAvatar from "../../assets/bot-avatar.png"; // ← أيقونة البوت الجديدة
import PopcornChat from "./PopcornChat";

function AiBot() {
  const [active, setActive] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="
            flex justify-center items-center 
            w-24 h-24 rounded-full shadow-xl
            bg-gradient-to-br from-emerald-400 to-sky-400 
            hover:scale-105 transition-all duration-300
          "
        >
          <img
            src={botAvatar}
            alt="AI Bot"
            className="w-16 h-16 object-cover rounded-full shadow-md"
          />
        </button>
      ) : (
        <div
          className="
            w-[90vw] sm:w-[500px] md:w-[600px] 
            h-[75vh] md:h-[78vh]
            rounded-2xl shadow-2xl overflow-hidden 
            bg-black/80 backdrop-blur-xl border border-white/10
            animate-fadeIn
          "
        >
          <PopcornChat setActive={setActive} />
        </div>
      )}
    </div>
  );
}

export default AiBot;
