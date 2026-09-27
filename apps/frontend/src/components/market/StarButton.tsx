import { PiStar, PiStarFill } from "react-icons/pi";

// Adds a stock to / removes it from the watchlist. Stops the click so a star
// inside a clickable row doesn't also select the row.
function StarButton({ watched, name, onToggle, size = "sm" }: { watched: boolean; name: string; onToggle: () => void; size?: "sm" | "md" }) {
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <button
      type="button"
      aria-pressed={watched}
      aria-label={watched ? `Remove ${name} from watchlist` : `Add ${name} to watchlist`}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`shrink-0 rounded p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        watched ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {watched ? <PiStarFill aria-hidden="true" className={icon} /> : <PiStar aria-hidden="true" className={icon} />}
    </button>
  );
}

export default StarButton;
