import React, { useState } from "react";
import ChatbotIcon from "../../assets/chatbot";
import BotInterface from "./BotInterface";

function AiBot() {
  const [active, setActive] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="flex justify-center items-center 
          w-24 h-24 rounded-full shadow-xl
          bg-gradient-to-br from-emerald-400 to-sky-400 
          hover:scale-105 transition-all duration-300"
        >
          <ChatbotIcon className="scale-125" />
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
          <BotInterface setActive={setActive} />
        </div>
      )}
    </div>
  );
}

export default AiBot;
