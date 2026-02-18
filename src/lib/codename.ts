const ADJECTIVES = [
  "Swift", "Bold", "Calm", "Dark", "Epic", "Fiery", "Grand", "Hazy",
  "Iron", "Jade", "Keen", "Loud", "Mystic", "Noble", "Onyx", "Prime",
  "Quick", "Rare", "Sly", "True", "Ultra", "Vivid", "Wild", "Zen",
  "Brave", "Clever", "Daring", "Frosty", "Ghost", "Hidden", "Lucky",
  "Neon", "Pixel", "Rapid", "Shadow", "Thunder", "Velvet", "Wicked",
  "Cosmic", "Cyber", "Ember", "Flux", "Grim", "Hyper", "Lunar",
  "Phantom", "Rogue", "Sonic", "Turbo", "Void", "Crimson", "Azure",
];

const NOUNS = [
  "Fox", "Wolf", "Hawk", "Bear", "Lion", "Viper", "Raven", "Tiger",
  "Shark", "Eagle", "Cobra", "Lynx", "Panther", "Falcon", "Orca",
  "Phoenix", "Dragon", "Sphinx", "Griffin", "Mantis", "Hornet",
  "Jaguar", "Coyote", "Sparrow", "Mustang", "Rhino", "Bison",
  "Puma", "Condor", "Badger", "Osprey", "Marlin", "Scorpion",
  "Cheetah", "Raptor", "Venom", "Blaze", "Storm", "Frost", "Shade",
];

export function generateCodeName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${adj}${noun}${num}`;
}
