
export const CHALLENGE_LEVELS = ["Green", "Blue", "Black", "DoubleBlack"];

export const CHALLENGE_COLORS = {
  "Green": "bg-green-600",
  "Blue": "bg-blue-600", 
  "Black": "bg-gray-700",
  "DoubleBlack": "bg-black"
};

export const CHALLENGE_SHAPES = {
    // circle
    "Green": "rounded-full aspect-square flex items-center justify-center w-16",
    // square
    "Blue": "rounded-none aspect-square flex items-center justify-center w-16", 
    // diamond (rotated square)
    "Black": "rotate-45 rounded-none aspect-square flex items-center justify-center w-16",
    // diamond (rotated square)
    "DoubleBlack": "rotate-45 rounded-none aspect-square flex items-center justify-center w-16 ml-5"
  };

export const CHALLENGE_BUTTON_STYLES = {
    "Green": "bg-green-600 hover:bg-green-700 text-white font-afacad rounded-full aspect-square w-16 flex items-center justify-center transition-colors",
    "Blue": "bg-blue-600 hover:bg-blue-700 text-white font-afacad rounded-none aspect-square w-16 flex items-center justify-center transition-colors",
    "Black": "bg-gray-800 hover:bg-gray-900 text-white font-afacad rounded-none aspect-square w-16 rotate-45 flex items-center justify-center transition-colors", 
    "DoubleBlack": "bg-black hover:bg-gray-900 text-white font-afacad rounded-lg aspect-square w-16 flex items-center justify-center transition-colors"
  };