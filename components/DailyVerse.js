"use client";

// آيات وأحاديث مشهورة وموثقة، تدور يوميًا حسب يوم السنة
const verses = [
  {
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    source: "سورة طه - الآية 114",
  },
  {
    text: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    source: "سورة المزمل - الآية 4",
  },
  {
    text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    source: "سورة القمر - الآية 17",
  },
  {
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    source: "حديث شريف - رواه البخاري",
  },
];

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

export default function DailyVerse() {
  const verse = verses[dayOfYear() % verses.length];

  return (
    <div className="bg-navy-800/50 border border-gold-500/15 rounded-xl px-5 py-3.5 flex items-center gap-3">
      <span className="text-gold-500/60 text-lg shrink-0">﴾</span>
      <div>
        <p className="font-display text-parchment-100 text-sm leading-relaxed">
          {verse.text}
        </p>
        <p className="text-mist-500 text-xs mt-1">{verse.source}</p>
      </div>
      <span className="text-gold-500/60 text-lg shrink-0 mr-auto">﴿</span>
    </div>
  );
}
