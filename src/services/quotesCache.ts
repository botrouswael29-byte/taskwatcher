import { QuoteData } from '../types';

const QUOTES_CACHE_KEY = 'tw_quotes_cache';

export const ARABIC_QUOTES: QuoteData[] = [
  { text: "قليل دائم خير من كثير منقطع.", author: "حكمة عربية", language: 'ar' },
  { text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.", author: "روبرت كولير", language: 'ar' },
  { text: "ابدأ بما هو ضروري، ثم ما هو ممكن، وفجأة ستجد نفسك تفعل المستحيل.", author: "فرانسيس الأسيزي", language: 'ar' },
  { text: "من سار على الدرب وصل، ومن زرع حصد.", author: "مثل عربي", language: 'ar' },
  { text: "الانضباط هو الجسر بين الأهداف والإنجازات.", author: "جيم رون", language: 'ar' },
  { text: "لا تؤجل عمل اليوم إلى الغد، فالفرص لا تنتظر المترددين.", author: "حكمة مأثورة", language: 'ar' },
  { text: "العظماء لا يولدون عظماء، بل ينمون من خلال عاداتهم اليومية.", author: "مقولة تحفيزية", language: 'ar' },
  { text: "سر المضي قدماً نحو الأمام هو البدء فوراً.", author: "مارك توين", language: 'ar' },
  { text: "التركيز ليس مجرد قول نعم لما تريد، بل قول لا لمئات المشتتات.", author: "ستيف جوبز", language: 'ar' },
  { text: "أنت لا ترتقي لمستوى أهدافك، بل تهبط لمستوى أنظمتك وعاداتك.", author: "جيمس كلير", language: 'ar' },
  { text: "خطوة واحدة صغيرة كل يوم تصنع فارقاً هائلاً بعد عام.", author: "روبن شارما", language: 'ar' },
  { text: "الهمة العالية لا ترضى إلا بالقمة، فابدأ يومك بعزم صادق.", author: "ابن القيم", language: 'ar' },
  { text: "الإنجاز يبدأ بقرار المحاولة، والاستمرار يحقق المعجزات.", author: "حكمة معاصرة", language: 'ar' },
  { text: "ليس المهم أن تسير بسرعة، المهم ألا تتوقف أبداً.", author: "كونفوشيوس", language: 'ar' },
  { text: "افعل اليوم شيئاً ستشكرك عليه نفسك في المستقبل.", author: "شون باتريك", language: 'ar' },
  { text: "الوقت كالسيف إن لم تقطعه قطعك، فاحرص على دقائق يومك.", author: "حكمة تراثية", language: 'ar' },
  { text: "العادات الصغيرة هي الفائدة المركبة لتطوير الذات.", author: "جيمس كلير", language: 'ar' },
  { text: "الشغف يشعل البدايات، والانضباط يضمن الوصول للنهايات.", author: "مقولة ملهمة", language: 'ar' },
  { text: "من استهان ببدايات الأمور، عجز عن بلوغ نهاياتها.", author: "حكمة عربية", language: 'ar' },
  { text: "كل صباح هو فرصة جديدة لكتابة صفحة نجاح بيضاء في حياتك.", author: "حكمة صباحية", language: 'ar' },
  { text: "ركز على أن تكون منتجاً لا مجرد مشغول.", author: "تيم فيريس", language: 'ar' },
  { text: "الالتزام هو أن تفعل ما يجب فعله حتى عندما لا ترغب في ذلك.", author: "حكمة إدارية", language: 'ar' },
  { text: "الصبر مفتاح الفرج، والمثابرة سر كل إنجاز عظيم.", author: "مثل سائر", language: 'ar' },
  { text: "أفضل استثمار يمكنك القيام به هو الاستثمار في عاداتك اليومية.", author: "وارن بافيت", language: 'ar' },
  { text: "لا تنتظر الظروف المثالية، اصنع أنت ظروفك بإرادتك وعملك.", author: "جورج برنارد شو", language: 'ar' },
  { text: "الشجرة العملاقة كانت في الأصل بذرة سُقيت كل يوم بلا انقطاع.", author: "حكمة شرقية", language: 'ar' },
  { text: "الوضوح يولد السرعة، والترتيب يوفر الجهد والوقت.", author: "براين تريسي", language: 'ar' },
  { text: "إن مع الصبر نصراً، ومع الإصرار فوزاً، ومع العمل ثمرة.", author: "حكمة عربية", language: 'ar' },
  { text: "كل عمل عظيم كان يبدو في بدايته مستحيلاً حتى تحقق.", author: "نيلسون مانديلا", language: 'ar' },
  { text: "اجعل يومك مليئاً بالخطوات الصغيرة الثابتة نحو غايتك.", author: "مقولة تطويرية", language: 'ar' },
  { text: "التميز ليس فعلاً عارضاً، بل عادة تمارسها كل يوم.", author: "أرسطو", language: 'ar' },
  { text: "من ينظم وقته يملك يومه، ومن يملك يومه يملك مستقبله.", author: "حكمة عملية", language: 'ar' },
  { text: "العزيمة الصادقة تذلل أصعب الصعاب وتفتح أوسع الأبواب.", author: "مثل عربي", language: 'ar' },
  { text: "طاقة اليوم ثمينة، فلا تهدرها في الندم على الأمس.", author: "حكمة ذهبية", language: 'ar' },
  { text: "إذا أردت نتائج مختلفة، ابدأ بتغيير خطواتك اليومية الآن.", author: "ألبرت أينشتاين", language: 'ar' }
];

export const ENGLISH_QUOTES: QuoteData[] = [
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", language: 'en' },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", language: 'en' },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", language: 'en' },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso", language: 'en' },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", language: 'en' },
  { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins", language: 'en' },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery", language: 'en' },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", language: 'en' },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", language: 'en' },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", language: 'en' },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", language: 'en' },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali", language: 'en' },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", language: 'en' },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier", language: 'en' },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki", language: 'en' },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", language: 'en' },
  { text: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.", author: "Leo Babauta", language: 'en' },
  { text: "One day or day one. You decide.", author: "Paulo Coelho", language: 'en' },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh", language: 'en' },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", language: 'en' },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn", language: 'en' },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle", language: 'en' },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", language: 'en' },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser", language: 'en' },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey", language: 'en' },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", language: 'en' },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall", language: 'en' },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin", language: 'en' },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer", language: 'en' },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King", language: 'en' },
  { text: "Action expresses priorities.", author: "Mahatma Gandhi", language: 'en' },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", language: 'en' },
  { text: "Lost time is never found again.", author: "Benjamin Franklin", language: 'en' },
  { text: "Focus is a muscle. The more you practice it, the stronger it gets.", author: "Cal Newport", language: 'en' },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain", language: 'en' }
];

export const SEED_QUOTES: QuoteData[] = [...ARABIC_QUOTES, ...ENGLISH_QUOTES];

/**
 * Deterministically retrieves a quote strictly based on the selected date string (YYYY-MM-DD).
 * Single Source of Truth rule:
 * Selected Date -> Quote of the Day
 * Same Date = Same Quote always.
 * Different Date = Different Quote.
 */
export function getDeterministicQuoteForDate(dateStr: string, language: 'en' | 'ar' = 'ar'): QuoteData {
  const pool = language === 'ar' ? ARABIC_QUOTES : ENGLISH_QUOTES;
  if (!pool || pool.length === 0) return SEED_QUOTES[0];

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;

  // Stable calculation mapping each calendar date to a distinct quote index in the pool
  const dayIndex = year * 365 + month * 31 + day;
  const index = Math.abs(dayIndex) % pool.length;

  return { ...pool[index] };
}

export function getCachedQuotes(): QuoteData[] {
  try {
    const raw = localStorage.getItem(QUOTES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read cached quotes:', e);
  }
  return SEED_QUOTES;
}

export function saveQuoteToCache(quote: QuoteData): void {
  try {
    const current = getCachedQuotes();
    const exists = current.some((q) => q.text === quote.text);
    if (!exists) {
      const updated = [quote, ...current].slice(0, 80);
      localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Failed to cache quote:', e);
  }
}

export function getRandomCachedQuote(language?: 'en' | 'ar' | 'random'): QuoteData {
  const all = getCachedQuotes();
  let pool = all;
  if (language === 'ar') {
    pool = all.filter((q) => q.language === 'ar');
  } else if (language === 'en') {
    pool = all.filter((q) => q.language === 'en');
  }

  if (pool.length === 0) {
    pool = all;
  }

  return pool[Math.floor(Math.random() * pool.length)] || SEED_QUOTES[0];
}
