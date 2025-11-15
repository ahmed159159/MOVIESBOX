import React, { useState } from react;
import ChatbotIcon from ....assetschatbot;
import PopcornChat from .PopcornChat;

function AiBot() {
  const [active, setActive] = useState(false);

  return (
    div className=fixed bottom-8 right-8 z-[9999]
      {!active  (
        button
          onClick={() = setActive(true)}
          className=flex justify-center items-center 
          w-24 h-24 rounded-full shadow-xl
          bg-gradient-to-br from-emerald-400 to-sky-400 
          hoverscale-105 transition-all duration-300
        
          ChatbotIcon className=scale-125 
        button
      )  (
        div
          className=
            w-[90vw] smw-[500px] mdw-[600px] 
            h-[75vh] mdh-[78vh]
            rounded-2xl shadow-2xl overflow-hidden 
            bg-black80 backdrop-blur-xl border border-white10
            animate-fadeIn
          
        
          PopcornChat setActive={setActive} 
        div
      )}
    div
  );
}

export default AiBot;
