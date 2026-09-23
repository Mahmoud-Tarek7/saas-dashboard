/**
 * بيانات سور القرآن الكريم المرجعية
 * Quran Reference Data
 * 
 * يحتوي هذا الملف على البيانات المرجعية لجميع سور القرآن الكريم (114 سورة)
 * متضمنة أرقام السور، وأسماءها، وعدد آياتها، ورقم الجزء الذي تبدأ فيه، وتصنيفها (مكية أو مدنية).
 * يُستخدم هذا الملف في نماذج التسميع والمراجعة والاختبارات وحساب نسب الإنجاز.
 */

export const TOTAL_SURAHS = 114;
export const TOTAL_AYAHS = 6236;
export const TOTAL_JUZ = 30;

export const SURAHS = [
  { number: 1, name: "الفاتحة", ayahCount: 7, juz: 1, type: "مكية" },
  { number: 2, name: "البقرة", ayahCount: 286, juz: 1, type: "مدنية" },
  { number: 3, name: "آل عمران", ayahCount: 200, juz: 3, type: "مدنية" },
  { number: 4, name: "النساء", ayahCount: 176, juz: 4, type: "مدنية" },
  { number: 5, name: "المائدة", ayahCount: 120, juz: 6, type: "مدنية" },
  { number: 6, name: "الأنعام", ayahCount: 165, juz: 7, type: "مكية" },
  { number: 7, name: "الأعراف", ayahCount: 206, juz: 8, type: "مكية" },
  { number: 8, name: "الأنفال", ayahCount: 75, juz: 9, type: "مدنية" },
  { number: 9, name: "التوبة", ayahCount: 129, juz: 10, type: "مدنية" },
  { number: 10, name: "يونس", ayahCount: 109, juz: 11, type: "مكية" },
  { number: 11, name: "هود", ayahCount: 123, juz: 11, type: "مكية" },
  { number: 12, name: "يوسف", ayahCount: 111, juz: 12, type: "مكية" },
  { number: 13, name: "الرعد", ayahCount: 43, juz: 13, type: "مدنية" },
  { number: 14, name: "إبراهيم", ayahCount: 52, juz: 13, type: "مكية" },
  { number: 15, name: "الحجر", ayahCount: 99, juz: 14, type: "مكية" },
  { number: 16, name: "النحل", ayahCount: 128, juz: 14, type: "مكية" },
  { number: 17, name: "الإسراء", ayahCount: 111, juz: 15, type: "مكية" },
  { number: 18, name: "الكهف", ayahCount: 110, juz: 15, type: "مكية" },
  { number: 19, name: "مريم", ayahCount: 98, juz: 16, type: "مكية" },
  { number: 20, name: "طه", ayahCount: 135, juz: 16, type: "مكية" },
  { number: 21, name: "الأنبياء", ayahCount: 112, juz: 17, type: "مكية" },
  { number: 22, name: "الحج", ayahCount: 78, juz: 17, type: "مدنية" },
  { number: 23, name: "المؤمنون", ayahCount: 118, juz: 18, type: "مكية" },
  { number: 24, name: "النور", ayahCount: 64, juz: 18, type: "مدنية" },
  { number: 25, name: "الفرقان", ayahCount: 77, juz: 18, type: "مكية" },
  { number: 26, name: "الشعراء", ayahCount: 227, juz: 19, type: "مكية" },
  { number: 27, name: "النمل", ayahCount: 93, juz: 19, type: "مكية" },
  { number: 28, name: "القصص", ayahCount: 88, juz: 20, type: "مكية" },
  { number: 29, name: "العنكبوت", ayahCount: 69, juz: 20, type: "مكية" },
  { number: 30, name: "الروم", ayahCount: 60, juz: 21, type: "مكية" },
  { number: 31, name: "لقمان", ayahCount: 34, juz: 21, type: "مكية" },
  { number: 32, name: "السجدة", ayahCount: 30, juz: 21, type: "مكية" },
  { number: 33, name: "الأحزاب", ayahCount: 73, juz: 21, type: "مدنية" },
  { number: 34, name: "سبأ", ayahCount: 54, juz: 22, type: "مكية" },
  { number: 35, name: "فاطر", ayahCount: 45, juz: 22, type: "مكية" },
  { number: 36, name: "يس", ayahCount: 83, juz: 22, type: "مكية" },
  { number: 37, name: "الصافات", ayahCount: 182, juz: 23, type: "مكية" },
  { number: 38, name: "ص", ayahCount: 88, juz: 23, type: "مكية" },
  { number: 39, name: "الزمر", ayahCount: 75, juz: 23, type: "مكية" },
  { number: 40, name: "غافر", ayahCount: 85, juz: 24, type: "مكية" },
  { number: 41, name: "فصلت", ayahCount: 54, juz: 24, type: "مكية" },
  { number: 42, name: "الشورى", ayahCount: 53, juz: 25, type: "مكية" },
  { number: 43, name: "الزخرف", ayahCount: 89, juz: 25, type: "مكية" },
  { number: 44, name: "الدخان", ayahCount: 59, juz: 25, type: "مكية" },
  { number: 45, name: "الجاثية", ayahCount: 37, juz: 25, type: "مكية" },
  { number: 46, name: "الأحقاف", ayahCount: 35, juz: 26, type: "مكية" },
  { number: 47, name: "محمد", ayahCount: 38, juz: 26, type: "مدنية" },
  { number: 48, name: "الفتح", ayahCount: 29, juz: 26, type: "مدنية" },
  { number: 49, name: "الحجرات", ayahCount: 18, juz: 26, type: "مدنية" },
  { number: 50, name: "ق", ayahCount: 45, juz: 26, type: "مكية" },
  { number: 51, name: "الذاريات", ayahCount: 60, juz: 26, type: "مكية" },
  { number: 52, name: "الطور", ayahCount: 49, juz: 27, type: "مكية" },
  { number: 53, name: "النجم", ayahCount: 62, juz: 27, type: "مكية" },
  { number: 54, name: "القمر", ayahCount: 55, juz: 27, type: "مكية" },
  { number: 55, name: "الرحمن", ayahCount: 78, juz: 27, type: "مكية" },
  { number: 56, name: "الواقعة", ayahCount: 96, juz: 27, type: "مكية" },
  { number: 57, name: "الحديد", ayahCount: 29, juz: 27, type: "مدنية" },
  { number: 58, name: "المجادلة", ayahCount: 22, juz: 28, type: "مدنية" },
  { number: 59, name: "الحشر", ayahCount: 24, juz: 28, type: "مدنية" },
  { number: 60, name: "الممتحنة", ayahCount: 13, juz: 28, type: "مدنية" },
  { number: 61, name: "الصف", ayahCount: 14, juz: 28, type: "مدنية" },
  { number: 62, name: "الجمعة", ayahCount: 11, juz: 28, type: "مدنية" },
  { number: 63, name: "المنافقون", ayahCount: 11, juz: 28, type: "مدنية" },
  { number: 64, name: "التغابن", ayahCount: 18, juz: 28, type: "مدنية" },
  { number: 65, name: "الطلاق", ayahCount: 12, juz: 28, type: "مدنية" },
  { number: 66, name: "التحريم", ayahCount: 12, juz: 28, type: "مدنية" },
  { number: 67, name: "الملك", ayahCount: 30, juz: 29, type: "مكية" },
  { number: 68, name: "القلم", ayahCount: 52, juz: 29, type: "مكية" },
  { number: 69, name: "الحاقة", ayahCount: 52, juz: 29, type: "مكية" },
  { number: 70, name: "المعارج", ayahCount: 44, juz: 29, type: "مكية" },
  { number: 71, name: "نوح", ayahCount: 28, juz: 29, type: "مكية" },
  { number: 72, name: "الجن", ayahCount: 28, juz: 29, type: "مكية" },
  { number: 73, name: "المزمل", ayahCount: 20, juz: 29, type: "مكية" },
  { number: 74, name: "المدثر", ayahCount: 56, juz: 29, type: "مكية" },
  { number: 75, name: "القيامة", ayahCount: 40, juz: 29, type: "مكية" },
  { number: 76, name: "الإنسان", ayahCount: 31, juz: 29, type: "مدنية" },
  { number: 77, name: "المرسلات", ayahCount: 50, juz: 29, type: "مكية" },
  { number: 78, name: "النبأ", ayahCount: 40, juz: 30, type: "مكية" },
  { number: 79, name: "النازعات", ayahCount: 46, juz: 30, type: "مكية" },
  { number: 80, name: "عبس", ayahCount: 42, juz: 30, type: "مكية" },
  { number: 81, name: "التكوير", ayahCount: 29, juz: 30, type: "مكية" },
  { number: 82, name: "الانفطار", ayahCount: 19, juz: 30, type: "مكية" },
  { number: 83, name: "المطففين", ayahCount: 36, juz: 30, type: "مكية" },
  { number: 84, name: "الانشقاق", ayahCount: 25, juz: 30, type: "مكية" },
  { number: 85, name: "البروج", ayahCount: 22, juz: 30, type: "مكية" },
  { number: 86, name: "الطارق", ayahCount: 17, juz: 30, type: "مكية" },
  { number: 87, name: "الأعلى", ayahCount: 19, juz: 30, type: "مكية" },
  { number: 88, name: "الغاشية", ayahCount: 26, juz: 30, type: "مكية" },
  { number: 89, name: "الفجر", ayahCount: 30, juz: 30, type: "مكية" },
  { number: 90, name: "البلد", ayahCount: 20, juz: 30, type: "مكية" },
  { number: 91, name: "الشمس", ayahCount: 15, juz: 30, type: "مكية" },
  { number: 92, name: "الليل", ayahCount: 21, juz: 30, type: "مكية" },
  { number: 93, name: "الضحى", ayahCount: 11, juz: 30, type: "مكية" },
  { number: 94, name: "الشرح", ayahCount: 8, juz: 30, type: "مكية" },
  { number: 95, name: "التين", ayahCount: 8, juz: 30, type: "مكية" },
  { number: 96, name: "العلق", ayahCount: 19, juz: 30, type: "مكية" },
  { number: 97, name: "القدر", ayahCount: 5, juz: 30, type: "مكية" },
  { number: 98, name: "البينة", ayahCount: 8, juz: 30, type: "مدنية" },
  { number: 99, name: "الزلزلة", ayahCount: 8, juz: 30, type: "مدنية" },
  { number: 100, name: "العاديات", ayahCount: 11, juz: 30, type: "مكية" },
  { number: 101, name: "القارعة", ayahCount: 11, juz: 30, type: "مكية" },
  { number: 102, name: "التكاثر", ayahCount: 8, juz: 30, type: "مكية" },
  { number: 103, name: "العصر", ayahCount: 3, juz: 30, type: "مكية" },
  { number: 104, name: "الهمزة", ayahCount: 9, juz: 30, type: "مكية" },
  { number: 105, name: "الفيل", ayahCount: 5, juz: 30, type: "مكية" },
  { number: 106, name: "قريش", ayahCount: 4, juz: 30, type: "مكية" },
  { number: 107, name: "الماعون", ayahCount: 7, juz: 30, type: "مكية" },
  { number: 108, name: "الكوثر", ayahCount: 3, juz: 30, type: "مكية" },
  { number: 109, name: "الكافرون", ayahCount: 6, juz: 30, type: "مكية" },
  { number: 110, name: "النصر", ayahCount: 3, juz: 30, type: "مدنية" },
  { number: 111, name: "المسد", ayahCount: 5, juz: 30, type: "مكية" },
  { number: 112, name: "الإخلاص", ayahCount: 4, juz: 30, type: "مكية" },
  { number: 113, name: "الفلق", ayahCount: 5, juz: 30, type: "مكية" },
  { number: 114, name: "الناس", ayahCount: 6, juz: 30, type: "مدنية" },
];

/**
 * الحصول على بيانات السورة برقمها
 * @param {number|string} number رقم السورة (1 - 114)
 * @returns {object|null} كائن بيانات السورة أو null إذا لم تكن موجودة
 */
export function getSurahByNumber(number) {
  const num = Number(number);
  if (!num || num < 1 || num > 114) return null;
  return SURAHS[num - 1] || null;
}

/**
 * الحصول على عدد آيات السورة برقمها
 * @param {number|string} number رقم السورة (1 - 114)
 * @returns {number} إجمالي عدد الآيات في السورة، أو 0 إذا لم تكن السورة موجودة
 */
export function getSurahAyahCount(number) {
  const surah = getSurahByNumber(number);
  return surah ? surah.ayahCount : 0;
}

/**
 * الحصول على قائمة السور التي تبدأ في جزء معين
 * @param {number|string} juzNumber رقم الجزء (1 - 30)
 * @returns {Array<object>} قائمة السور التابعة للجزء المحدد
 */
export function getJuzSurahs(juzNumber) {
  const juz = Number(juzNumber);
  if (!juz || juz < 1 || juz > 30) return [];
  return SURAHS.filter((surah) => surah.juz === juz);
}
