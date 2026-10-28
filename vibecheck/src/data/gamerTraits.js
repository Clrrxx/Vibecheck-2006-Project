export const options = [
  { id: "quest-planner", label: "Quest planner", icon: "🧭" },
  { id: "lore-lover", label: "Lore lover", icon: "📖" },
  { id: "team-strategist", label: "Team strategist", icon: "♟" },
  { id: "cozy-gamer", label: "Cozy gamer", icon: "🌿" },
  { id: "world-explorer", label: "World explorer", icon: "🗺️" },
  { id: "puzzle-solver", label: "Puzzle solver", icon: "🧩" },
  { id: "competitive-spirit", label: "Competitive spirit", icon: "🏆" },
  { id: "co-op-buddy", label: "Co-op buddy", icon: "🤝" },
  { id: "creative-builder", label: "Creative builder", icon: "🔨" },
];
export const suggestions = {
  "Curious Pathfinder": ["world-explorer", "lore-lover", "creative-builder"],
  "Thoughtful Navigator": ["quest-planner", "lore-lover", "team-strategist"],
  "Campfire Connector": ["co-op-buddy", "world-explorer", "competitive-spirit"],
  "Kindred Companion": ["co-op-buddy", "cozy-gamer", "team-strategist"],
  "Reflective Voyager": ["cozy-gamer", "lore-lover", "puzzle-solver"],
  "Versatile Adventurer": ["world-explorer", "co-op-buddy", "creative-builder"],
};

export function readTraits(uid) {
  try {
    const stored = JSON.parse(localStorage.getItem(`vibecheck.gamerTraits:${uid}`));
    return Array.isArray(stored) ? [...new Set(stored)].filter((id) => options.some((option) => option.id === id)).slice(0, 3) : null;
  } catch { return null; }
}

