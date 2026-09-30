import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Allow the Android/Web app to call the API from another origin.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, x-gemini-api-key'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Active central Gemini model
const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Extracts and initializes the GoogleGenAI client securely.
 * Priority:
 * 1. User-configured key passed in 'x-gemini-api-key' header or request body
 * 2. Environment variable GEMINI_API_KEY
 * NEVER logs the secret key.
 */
function getGeminiClient(req: Request): GoogleGenAI | null {
  const headerKey = req.headers['x-gemini-api-key'];
  const userKey = (typeof headerKey === 'string' && headerKey.trim())
    ? headerKey.trim()
    : (req.body?.apiKey && typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '');

  const effectiveKey = userKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey) return null;

  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 0. Connection Test Endpoint: Tests user's Gemini API key with a simple live prompt
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  console.log('[AI] Request started - /api/ai/test-key');
  const ai = getGeminiClient(req);
  const hasKey = Boolean(ai);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!ai) {
    console.error('[AI] Gemini request failed: No API key provided');
    return res.status(401).json({
      success: false,
      errorType: 'MISSING_KEY',
      message: 'لم يتم إدخال مفتاح API',
    });
  }

  try {
    console.log(`[AI] Sending request to Gemini with model: ${GEMINI_MODEL}`);
    // Send a minimal test prompt to verify connection
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: 'Reply with the word OK',
    });

    console.log('[AI] Gemini response received');
    const rawText = (response.text || '').trim();
    console.log('[AI] Response parsed successfully, result text:', rawText);

    return res.json({
      success: true,
      reply: rawText || 'OK',
      message: '✓ تم الاتصال بـ Gemini بنجاح',
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    const msg = String(err?.message || '').toLowerCase();
    console.error('[AI] Gemini request failed:', { status, message: err?.message || err });

    let errorType = 'GEMINI_ERROR';
    let friendlyMessage = 'خطأ من Gemini API. يرجى التحقق من المفتاح والاتصال.';

    if (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('invalid api key') ||
      msg.includes('unauthorized') ||
      msg.includes('permission_denied')
    ) {
      errorType = 'INVALID_KEY';
      friendlyMessage = 'مفتاح Gemini غير صالح أو غير مصرح باستخدامه. تحقق من المفتاح وأعد المحاولة.';
      return res.status(401).json({ success: false, errorType, message: friendlyMessage });
    } else if (status === 429 || msg.includes('quota') || msg.includes('resource_exhausted')) {
      errorType = 'QUOTA_EXCEEDED';
      friendlyMessage = 'تم تجاوز حد الاستخدام. حاول لاحقاً.';
      return res.status(429).json({ success: false, errorType, message: friendlyMessage });
    } else if (status === 404 || msg.includes('not found') || msg.includes('model not found')) {
      errorType = 'GEMINI_ERROR';
      friendlyMessage = 'النموذج غير متوفر أو غير مدعوم.';
      return res.status(404).json({ success: false, errorType, message: friendlyMessage });
    } else if (msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('network') || status === 503) {
      errorType = 'NETWORK_ERROR';
      friendlyMessage = 'تعذر الاتصال بخدمة Gemini. تحقق من اتصالك وحاول مرة أخرى.';
      return res.status(503).json({ success: false, errorType, message: friendlyMessage });
    }

    return res.status(500).json({
      success: false,
      errorType,
      message: friendlyMessage,
    });
  }
});

// 1. AI Chat Endpoint: handles natural language conversation & productivity commands
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  console.log('[AI] Request started - /api/ai/chat');
  const { message, context } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const isAr = context?.language === 'ar';
  const ai = getGeminiClient(req);
  const hasKey = Boolean(ai);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!ai) {
    console.error('[AI] Gemini request failed: No API key provided');
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      reply: isAr
        ? 'لم يتم إعداد مفتاح Gemini API بعد.\nاذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
        : 'Gemini API key is not configured yet.\nGo to Settings > Smart Assistant and add an API key.',
      proposedChanges: null,
    });
  }

  try {
    console.log(`[AI] Sending request to Gemini with prompt: "${message.trim()}"`);

    const systemPrompt = `You are "Task Watcher AI", a helpful, friendly, highly capable personal productivity coach and assistant inside the Task Watcher app.
Language: Respond naturally in ${isAr ? 'Arabic' : 'English'} matching the user's language.

Current user data for date (${context?.date || 'today'}):
- Tasks: ${JSON.stringify(context?.tasks || [])}
- Small Steps: ${JSON.stringify(context?.smallSteps || [])}
- Important Reminders: ${JSON.stringify(context?.reminders || [])}
- Water: Current ${context?.water?.currentMl || 0}ml / Target ${context?.water?.targetMl || 3000}ml
- Supplements: ${JSON.stringify(context?.supplements || [])}
- Creatine Status: ${context?.creatine?.taken ? 'Taken ✓' : 'Not Taken'} (Dose: ${context?.creatine?.dose || '5g'})
- Quote: "${context?.quote?.text || ''}"

INSTRUCTIONS:
1. Always give a warm, clear, direct conversational response in natural plain text.
2. If the user asks general questions, asks for advice, greets you, asks for productivity tips, or asks what is on their schedule, answer helpfully in plain text.
3. If and only if the user explicitly asks to add tasks, break down a task into small steps, update water, set creatine, or add reminders, you can provide an optional JSON block at the very end of your response inside:
\`\`\`json
{
  "proposedChanges": {
    "summary": "Brief explanation of actions prepared",
    "targetDate": "${context?.date || ''}",
    "tasksToAdd": [ { "title": "Task name", "time": "18:00" or null, "priority": "high"|"medium"|"low" } ],
    "tasksToUpdate": [ { "id": "task_id", "completed": true } ],
    "remindersToAdd": [ { "text": "Reminder text", "date": "${context?.date || ''}", "time": "10:00" } ],
    "waterTargetMl": 3000,
    "creatineTaken": true,
    "smallStepsToAdd": [ { "text": "Step 1" } ]
  }
}
\`\`\`
4. Do NOT wrap your conversational reply inside JSON. Write your conversational reply naturally.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: message.trim(),
      config: {
        systemInstruction: systemPrompt,
      },
    });

    console.log('[AI] Gemini response received');
    const rawText = (response.text || '').trim();

    if (!rawText) {
      console.warn('[AI] Gemini response was empty string');
      return res.json({
        reply: isAr ? 'لم يصل رد من Gemini.' : 'No response received from Gemini.',
        proposedChanges: null,
      });
    }

    // Extract any optional JSON proposal block
    let reply = rawText;
    let proposedChanges = null;

    const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        const parsedJson = JSON.parse(jsonBlockMatch[1]);
        if (parsedJson.proposedChanges) {
          proposedChanges = parsedJson.proposedChanges;
        } else if (parsedJson.tasksToAdd || parsedJson.summary) {
          proposedChanges = parsedJson;
        }
        // Remove the json block from reply text
        reply = rawText.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
      } catch (parseErr) {
        console.warn('[AI] Could not parse embedded json block, returning full text:', parseErr);
      }
    } else if (rawText.startsWith('{') && rawText.endsWith('}')) {
      // If Gemini returned pure JSON
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.reply) {
          reply = parsed.reply;
        }
        if (parsed.proposedChanges) {
          proposedChanges = parsed.proposedChanges;
        }
      } catch {
        reply = rawText;
      }
    }

    if (!reply) {
      reply = isAr ? 'لم يصل رد من Gemini.' : 'No response received from Gemini.';
    }

    console.log('[AI] Response parsed successfully');
    return res.json({
      reply,
      proposedChanges,
    });
  } catch (error: any) {
    const status = error?.status || error?.statusCode || 500;
    const msg = String(error?.message || '').toLowerCase();
    console.error('[AI] Gemini request failed:', { status, message: error?.message || error });

    if (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      msg.includes('api_key_invalid') ||
      msg.includes('unauthorized') ||
      msg.includes('permission_denied')
    ) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        reply: isAr
          ? 'مفتاح Gemini غير صالح أو غير مصرح باستخدامه. يرجى التحقق من المفتاح في الإعدادات > المساعد الذكي.'
          : 'Gemini API key is invalid or unauthorized. Please check your key in Settings > Smart Assistant.',
      });
    }

    if (status === 429 || msg.includes('quota') || msg.includes('resource_exhausted')) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        reply: isAr
          ? 'تم تجاوز حد الاستخدام لـ Gemini API. حاول لاحقاً.'
          : 'Gemini API quota exceeded. Please try again later.',
      });
    }

    if (msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('network') || status === 503) {
      return res.status(503).json({
        error: 'NETWORK_ERROR',
        reply: isAr
          ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
          : 'Unable to connect to Gemini service. Please check your internet connection.',
      });
    }

    return res.status(500).json({
      error: 'GEMINI_ERROR',
      reply: isAr
        ? 'حدث خطأ أثناء معالجة طلب المساعد الذكي. يرجى المحاولة لاحقاً.'
        : 'An error occurred while communicating with Gemini API. Please try again later.',
    });
  }
});

// 2. Plan My Day: Analyzes current tasks, times, priorities, habits and suggests organized schedule
app.post('/api/ai/plan', async (req: Request, res: Response) => {
  console.log('[AI] Request started - /api/ai/plan');
  try {
    const { date, tasks, smallSteps, reminders, water, creatine, language } = req.body;
    const isAr = language === 'ar';

    const ai = getGeminiClient(req);
    if (!ai) {
      return res.status(401).json({
        error: 'MISSING_API_KEY',
        message: isAr
          ? 'لم يتم إعداد مفتاح Gemini API بعد. اذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
          : 'Gemini API key is not configured yet. Go to Settings > Smart Assistant and add an API key.',
      });
    }

    const prompt = `You are an expert executive functioning coach and daily planner for Task Watcher.
Analyze the following items for date ${date}:
Tasks: ${JSON.stringify(tasks || [])}
Small Steps: ${JSON.stringify(smallSteps || [])}
Reminders: ${JSON.stringify(reminders || [])}
Water status: Current ${water?.currentMl || 0}ml / Target ${water?.targetMl || 3000}ml
Creatine: ${creatine?.taken ? 'Taken' : 'Not Taken'}

Language: ${isAr ? 'Arabic' : 'English'}

Provide an organized, realistic daily schedule with times and tips.
Return a valid JSON object strictly matching this format:
{
  "overview": "Encouraging daily summary",
  "schedule": [
    {
      "time": "08:00 AM",
      "title": "Task title",
      "type": "task",
      "priority": "high",
      "tips": "Practical tip"
    }
  ],
  "reorderedTasks": [
    {
      "id": "task_id_if_existing",
      "title": "Task title",
      "suggestedTime": "09:00 AM",
      "priority": "high"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.statusCode || 500;
    const msg = String(error?.message || '').toLowerCase();
    console.error('[AI] /api/ai/plan error:', { status, message: error?.message || error });

    if (status === 401 || status === 400 || msg.includes('api_key_invalid')) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        message: req.body?.language === 'ar'
          ? 'مفتاح Gemini غير صالح أو غير مصرح به.'
          : 'Invalid or unauthorized Gemini API key.',
      });
    }

    return res.status(500).json({
      error: 'GEMINI_ERROR',
      message: req.body?.language === 'ar'
        ? 'تعذر إنشاء الخطة اليومية بواسطة Gemini API حالياً.'
        : 'Failed to generate daily plan via Gemini API.',
    });
  }
});

// 3. Break Down Task into Small Steps
app.post('/api/ai/breakdown', async (req: Request, res: Response) => {
  console.log('[AI] Request started - /api/ai/breakdown');
  try {
    const { taskTitle, language } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const ai = getGeminiClient(req);
    if (!ai) {
      return res.status(401).json({
        error: 'MISSING_API_KEY',
        message: language === 'ar'
          ? 'لم يتم إعداد مفتاح Gemini API بعد. اذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
          : 'Gemini API key is not configured yet. Go to Settings > Smart Assistant and add an API key.',
      });
    }

    const prompt = `Break down this task into 4 to 6 clear, actionable, bite-sized small steps for a daily planner:
Task: "${taskTitle}"
Language: ${language === 'ar' ? 'Arabic' : 'English'}

Return JSON:
{
  "steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"steps":[]}');
    return res.json(parsed);
  } catch (error: any) {
    const status = error?.status || error?.statusCode || 500;
    const msg = String(error?.message || '').toLowerCase();
    console.error('[AI] /api/ai/breakdown error:', { status, message: error?.message || error });

    if (status === 401 || status === 400 || msg.includes('api_key_invalid')) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        message: req.body?.language === 'ar'
          ? 'مفتاح Gemini غير صالح.'
          : 'Invalid Gemini API key.',
      });
    }

    return res.status(500).json({ error: 'Failed to break down task' });
  }
});

// 4. Generate Quote for the Day
app.post('/api/ai/quote', async (req: Request, res: Response) => {
  const fallbackQuotes = {
    en: [
      { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
      { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    ],
    ar: [
      { text: "قليل دائم خير من كثير منقطع.", author: "حكمة عربية" },
      { text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.", author: "روبرت كولير" },
      { text: "ابدأ بما هو ضروري، ثم ما هو ممكن، وفجأة ستجد نفسك تفعل المستحيل.", author: "فرانسيس الأسيزي" },
      { text: "من سار على الدرب وصل، ومن زرع حصد.", author: "مثل عربي" },
      { text: "الانضباط هو الجسر بين الأهداف والإنجازات.", author: "جيم رون" },
      { text: "لا تؤجل عمل اليوم إلى الغد، فالفرص لا تنتظر المترددين.", author: "حكمة مأثورة" },
      { text: "العظماء لا يولدون عظماء، بل ينمون من خلال عاداتهم اليومية.", author: "مقولة تحفيزية" },
    ],
  };

  try {
    let { language, theme } = req.body;
    if (language === 'random') {
      language = Math.random() > 0.5 ? 'ar' : 'en';
    }
    const targetLang = language === 'ar' ? 'ar' : 'en';

    const ai = getGeminiClient(req);
    if (!ai) {
      const list = targetLang === 'ar' ? fallbackQuotes.ar : fallbackQuotes.en;
      const random = list[Math.floor(Math.random() * list.length)];
      return res.json({ ...random, language: targetLang, isFallback: true });
    }

    const prompt = `Generate an inspiring, powerful, concise motivational quote for a daily productivity planner.
Language: ${targetLang === 'ar' ? 'Arabic' : 'English'}
Theme: ${theme || 'discipline, habit consistency, focus, and purposeful action'}

Return JSON:
{
  "text": string (the quote text in ${targetLang === 'ar' ? 'Arabic' : 'English'}),
  "author": string (author name or "Anonymous" / "حكمة مأثورة")
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.text) {
      const list = targetLang === 'ar' ? fallbackQuotes.ar : fallbackQuotes.en;
      return res.json({ ...list[0], language: targetLang });
    }

    return res.json({
      text: parsed.text,
      author: parsed.author || (targetLang === 'ar' ? 'حكمة مأثورة' : 'Anonymous'),
      language: targetLang,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/quote:', error?.status || error?.message);
    const targetLang = req.body?.language === 'ar' ? 'ar' : 'en';
    const fallback = targetLang === 'ar'
      ? { text: "قليل دائم خير من كثير منقطع.", author: "حكمة عربية", language: 'ar' }
      : { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", language: 'en' };
    return res.json(fallback);
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Task Watcher server listening on port ${port}`);
  });
}

startServer();