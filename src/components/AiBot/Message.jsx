// Message.jsx
export default function Message({ role, text }) {
  if (role === "user") {
    return (
      <div className="text-right mb-2">
        <div className="inline-block bg-white text-black px-3 py-2 rounded-lg max-w-[80%]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="text-left mb-2">
      <div className="inline-block bg-sky-900/30 text-white px-3 py-2 rounded-lg max-w-[90%]">
        <strong className="text-emerald-300">Popcorn: </strong>
        {text}
      </div>
    </div>
  );
}
