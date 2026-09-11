import { useEffect, useRef, useState } from "react";
import { mulberry32, shuffle } from "../core/engine";
import { HudChip, useCountdown, useKey, type GameProps } from "./shared";
import { Button } from "../components/ui";
import { Icon } from "../components/icons";

// Simple word lists for different languages
const WORDS_EN = [
  "cat", "dog", "hat", "bat", "rat", "mat", "sat", "fat", "pat", "vat",
  "cup", "sun", "run", "fun", "bun", "gun", "pun", "dun", "hug", "bug",
  "rug", "mug", "jug", "tug", "rug", "nut", "cut", "put", "but", "gut",
  "hot", "dot", "lot", "not", "got", "rot", "tot", "cot", "pot", "bot",
  "red", "bed", "fed", "led", "wed", "shed", "sled", "bred", "fred",
  "big", "dig", "fig", "pig", "wig", "rig", "gig", "jig", "lig", "tig",
  "top", "pop", "mop", "hop", "cop", "drop", "stop", "shop", "crop", "flop",
  "box", "fox", "mix", "fix", "six", "wax", "tax", "max", "lax", "sax",
  "car", "bar", "far", "jar", "tar", "war", "star", "scar", "char", "mar",
  "day", "may", "say", "pay", "lay", "ray", "way", "hay", "bay", "gay",
  "eat", "eat", "eat", "eat", "eat", "eat", "eat", "eat", "eat", "eat",
  "apple", "banana", "orange", "grape", "melon", "peach", "pear", "plum", "berry", "cherry",
  "house", "mouse", "horse", "goose", "moose", "louse", "blouse", "spouse", "grouse", "trouse",
  "train", "brain", "rain", "pain", "gain", "main", "chain", "stain", "grain", "drain",
  "plant", "blank", "thank", "drink", "think", "blink", "clink", "stink", "shrink", "wink",
  "water", "later", "matter", "batter", "catter", "latter", "scatter", "chatter", "flatter", "glatter",
];

const WORDS_AR = [
  "قلم", "كتاب", "شمس", "قمر", "نجم", "بحر", "جبل", "بيت", "وردة", "شجرة",
  "ماء", "نار", "هواء", "أرض", "سماء", "يوم", "ليل", "صباح", "مساء", "وقت",
  "حليب", "خبز", "جبن", "عسل", "سكر", "ملح", "فلفل", "زيت", "زبدة", "عصير",
  "تفاحة", "موزة", "برتقال", "عنب", "بطيخ", "خوخ", "كمثرى", "برقوق", "فراولة", "كرز",
  "سيارة", "طائرة", "قطار", "حافلة", "دراجة", "سفينة", "قارب", "شاحنة", "عجلة", "مركبة",
  "مدرسة", "جامعة", "مستشفى", "مكتبة", "مسجد", "كنيسة", "سوق", "متجر", "مطعم", "فندق",
  "طبيب", "ممرض", "مهندس", "معلم", "طالب", "طالب", "شرطي", "جندي", "طيار", "سائق",
  "أب", "أم", "أخ", "أخت", "جد", "جدة", "عم", "عمة", "خال", "خالة",
  "كلب", "قطة", "حصان", "بقرة", "خروف", "جمل", "فيل", "أسد", "نمر", "دب",
  "طائر", "سمكة", "نحلة", "فراشة", "نملة", "عنكبوت", "دجاجة", "بطة", "إوزة", "حمامة",
];

// Simple 3-letter words for easier gameplay
const SIMPLE_WORDS_EN = [
  "cat", "dog", "hat", "bat", "rat", "mat", "sat", "fat", "pat", "cup", "sun", "run",
  "fun", "bun", "hot", "dot", "lot", "not", "got", "red", "bed", "big", "dig", "pig",
  "top", "pop", "car", "bar", "far", "day", "may", "say", "pay", "lay", "eat", "tea",
  "ate", "sea", "pea", "key", "way", "bay", "may", "ray", "hay", "box", "fox", "mix",
];

const SIMPLE_WORDS_AR = [
  "قلم", "شمس", "قمر", "نجم", "بحر", "جبل", "بيت", "ماء", "نار", "يوم", "ليل", "وقت",
  "حليب", "خبز", "عسل", "سكر", "ملح", "تفاح", "موز", "عنب", "كلب", "قطة", "أسد",
];

export function WordBuilder({ paused, lang, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 90;
  const [letters, setLetters] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [validWords, setValidWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "good" | "bad" | "info" } | null>(null);
  const done = useRef(false);

  // Initialize game with random letters
  useEffect(() => {
    const rng = mulberry32(Date.now() % 100000);
    const wordList = lang === "ar" ? WORDS_AR : WORDS_EN;
    const simpleWords = lang === "ar" ? SIMPLE_WORDS_AR : SIMPLE_WORDS_EN;
    
    // Pick a random word and use its letters
    const sourceWord = wordList[Math.floor(rng() * wordList.length)];
    const lettersArray = sourceWord.split("");
    
    // Add some extra random letters for variety
    const alphabet = lang === "ar" 
      ? "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
      : "abcdefghijklmnopqrstuvwxyz";
    
    while (lettersArray.length < 7) {
      const randomLetter = alphabet[Math.floor(rng() * alphabet.length)];
      lettersArray.push(randomLetter);
    }
    
    setLetters(shuffle(lettersArray, rng));
    
    // Calculate all possible words from these letters
    const possibleWords = simpleWords.filter(word => {
      const wordLetters = word.split("");
      const availableLetters = [...lettersArray];
      return wordLetters.every(letter => {
        const index = availableLetters.indexOf(letter);
        if (index === -1) return false;
        availableLetters.splice(index, 1);
        return true;
      });
    });
    
    setValidWords(possibleWords);
  }, [lang]);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score, correct: foundWords.length, total: validWords.length, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const submitWord = () => {
    if (paused || done.current || currentWord.length < 3) {
      if (currentWord.length < 3) {
        setMessage({ text: t("game.word-builder.tooShort"), type: "bad" });
        setTimeout(() => setMessage(null), 1500);
      }
      return;
    }

    if (foundWords.includes(currentWord)) {
      setMessage({ text: t("game.word-builder.alreadyFound"), type: "info" });
      setTimeout(() => setMessage(null), 1500);
      setCurrentWord("");
      return;
    }

    if (validWords.includes(currentWord)) {
      fx("good");
      const points = currentWord.length * 10;
      setScore(s => s + points);
      onScore(score + points, foundWords.length + 1);
      setFoundWords([...foundWords, currentWord]);
      setMessage({ text: t("game.word-builder.newWord"), type: "good" });
      setTimeout(() => setMessage(null), 1500);
    } else {
      fx("bad");
      setMessage({ text: t("game.word-builder.notAWord"), type: "bad" });
      setTimeout(() => setMessage(null), 1500);
    }

    setCurrentWord("");
  };

  const handleKeyPress = (key: string) => {
    if (paused || done.current) return;
    
    if (key === "Enter") {
      submitWord();
    } else if (key === "Backspace") {
      setCurrentWord(currentWord.slice(0, -1));
    } else if (key.length === 1 && letters.includes(key)) {
      setCurrentWord(currentWord + key);
    }
  };

  useKey((e) => {
    handleKeyPress(e.key);
  });

  const removeLetter = (index: number) => {
    if (paused || done.current) return;
    const letter = letters[index];
    const newLetters = [...letters];
    newLetters.splice(index, 1);
    setLetters(newLetters);
    setCurrentWord(currentWord + letter);
  };

  const returnLetter = (index: number) => {
    if (paused || done.current) return;
    const letter = currentWord[index];
    setCurrentWord(currentWord.slice(0, index) + currentWord.slice(index + 1));
    setLetters([...letters, letter]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 10 ? "text-bad" : "text-gold"} />
        <HudChip icon="star" label={`${score}`} tone="text-acc" />
        <HudChip icon="check" label={t("game.word-builder.found", { n: foundWords.length })} tone="text-good" />
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-center text-sm font-bold anim-fadeIn ${
          message.type === "good" ? "bg-good/15 text-good" :
          message.type === "bad" ? "bg-bad/15 text-bad" :
          "bg-acc/15 text-acc"
        }`}>
          {message.text}
        </div>
      )}

      {/* Current word being built */}
      <div className="flex min-h-[80px] items-center justify-center rounded-xl border-2 border-line bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {currentWord.split("").map((letter, i) => (
            <button
              key={i}
              onClick={() => returnLetter(i)}
              className="grid size-12 sm:size-14 place-items-center rounded-lg border-2 border-acc bg-acc/10 text-2xl font-black text-acc transition-all hover:scale-105"
            >
              {letter}
            </button>
          ))}
          {currentWord.length === 0 && (
            <span className="text-mut text-sm">{lang === "ar" ? "ابدأ الكتابة..." : "Start typing..."}</span>
          )}
        </div>
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((letter, i) => (
          <button
            key={i}
            onClick={() => removeLetter(i)}
            disabled={paused}
            className="btn-soft-press grid size-12 sm:size-14 place-items-center rounded-lg border-2 border-line bg-surface text-2xl font-black transition-all hover:border-acc hover:text-acc"
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-2">
        <Button onClick={submitWord} disabled={currentWord.length < 3}>
          <Icon name="check" size={16} /> {lang === "ar" ? "إرسال" : "Submit"}
        </Button>
        <Button variant="soft" onClick={() => setCurrentWord("")}>
          <Icon name="x" size={16} /> {lang === "ar" ? "مسح" : "Clear"}
        </Button>
      </div>

      {/* Found words */}
      {foundWords.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-2 text-sm font-bold text-mut">{lang === "ar" ? "الكلمات التي وجدتها:" : "Words you found:"}</h3>
          <div className="flex flex-wrap gap-2">
            {foundWords.map((word, i) => (
              <span key={i} className="rounded-md bg-good/15 px-3 py-1 text-sm font-bold text-good">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-mut">{t("game.word-builder.keys")}</p>
    </div>
  );
}
