// Bundled word lists for Word Scramble. No network, ever.

export const WORDS_EN: string[] = [
  "apple", "river", "storm", "piano", "beach", "cloud", "tiger", "lemon",
  "chair", "dream", "flame", "grape", "house", "juice", "knife", "light",
  "money", "night", "ocean", "plant", "queen", "radio", "smile", "table",
  "uncle", "voice", "water", "bread", "stone", "train", "brain", "quick",
  "brave", "candy", "dance", "eagle", "field", "ghost", "heart", "ivory",
  "joker", "kayak", "lucky", "magic", "noble", "olive", "pearl", "quilt",
  "robot", "solar", "torch", "urban", "vivid", "whale", "yacht", "zebra",
  "amber", "blaze", "coral", "delta", "ember", "frost", "gleam", "hazel",
  "index", "jazzy", "karma", "lunar", "maple", "north", "orbit", "plumb",
  "quest", "ridge", "spark", "thorn", "unity", "valor", "wrist", "pixel",
  "yield", "zephyr", "banana", "castle", "dragon", "engine", "forest", "garden",
  "hammer", "island", "jungle", "kitten", "ladder", "marble", "needle", "orange",
  "pencil", "quartz", "rocket", "silver", "temple", "violet", "wallet", "anchor",
  "bridge", "candle", "desert", "falcon", "goblet", "harbor", "insect", "meadow",
  "palace", "shadow", "tunnel", "voyage", "basket", "copper", "mirror", "parade",
];

export const WORDS_AR: string[] = [
  "قلم", "كتاب", "شمس", "قمر", "بحر", "جبل", "بيت", "وردة",
  "سماء", "نجم", "شجرة", "قهوة", "خبز", "ماء", "نار", "أرض",
  "مدينة", "قرية", "مدرسة", "علم", "حلم", "قلب", "عقل", "نور",
  "ليل", "نهار", "صديق", "باب", "نافذة", "حديقة", "شارع", "جسر",
  "رمل", "مطر", "ثلج", "ربيع", "صيف", "خريف", "شتاء", "أسد",
  "طائر", "سمكة", "حصان", "عسل", "تمر", "زيتون", "برتقال", "صحراء",
  "رسالة", "مفتاح", "سفينة", "طريق", "غابة", "قلعة", "ساعة", "مرآة",
  "زهرة", "نجمة", "شمعة", "ورقة",
];

export function wordListFor(lang: string): string[] {
  return lang === "ar" ? WORDS_AR : WORDS_EN;
}
