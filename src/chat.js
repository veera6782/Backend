import { chatResponse } from './domain.js';

// Gemini's OpenAI-compatible endpoint; any provider speaking the OpenAI chat format works (Groq, OpenRouter, Ollama).
const defaultApiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
// Comma-separated; later models are tried when earlier ones are overloaded or unavailable.
const defaultModel = 'gemini-flash-latest,gemini-flash-lite-latest';
const maxHistory = 20;
const maxMessageChars = 2000;

const systemPrompt = `You are NutriOwl, a friendly, knowledgeable assistant inside a nutrition app. You help with nutrition, food, cooking and recipes, meal planning, hydration, sleep, physical activity, healthy habits and general wellness.

Guidelines:
- Give practical, evidence-based answers. Be warm and encouraging, never judgmental about food choices or bodies.
- Keep replies concise and easy to read on a phone: short paragraphs or brief bullet lists, usually under 150 words unless the user asks for detail such as a recipe or meal plan.
- Use the member's profile and today's progress (if provided below) to personalize advice, and respect their dietary preference.
- If a question is unrelated to food, nutrition, habits or wellness, do not answer it; briefly say that is outside what you can help with and steer back to how you can help.
- You are not a doctor or dietitian. Do not diagnose, prescribe, or give medication or supplement dosing. For medical conditions, pregnancy, allergies, eating disorders, medication interactions or significant symptoms, give general information only and recommend a qualified healthcare professional.
- Do not recommend very low-calorie diets, extended fasting or rapid weight loss. If the member may be under 18, avoid weight-loss advice and suggest involving a parent or guardian and a healthcare professional.
- Never claim to have looked anything up or to know facts about the member beyond what is given here.`;

const crisisPattern = /\b(kill(ing)? myself|suicid(e|al)|end my life|self[- ]?harm|hurt(ing)? myself|want to die|make myself (throw up|vomit|sick)|purg(e|ing)|starv(e|ing) myself)\b/i;

const crisisResponse = 'I\'m really sorry you\'re going through this, and I\'m glad you said something. You deserve support from a real person right now. If you might act on these thoughts or are in danger, please contact your local emergency number. Otherwise, please reach out to a crisis or eating disorder helpline in your country, a doctor, or someone you trust and tell them what you shared here. I\'m here to talk about food and wellness whenever you\'re ready.';

function chatError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function normalizeMessages(body) {
  const input = Array.isArray(body.messages)
    ? body.messages
    : [{ role: 'user', content: body.text ?? body.message }];
  const messages = input
    .filter(item => item && ['user', 'assistant'].includes(item.role))
    .map(item => ({ role: item.role, content: String(item.content ?? '').trim().slice(0, maxMessageChars) }))
    .filter(item => item.content)
    .slice(-maxHistory);
  if (messages.at(-1)?.role !== 'user') throw chatError(400, 'Message text is required.');
  // Some providers reject histories that start with an assistant turn.
  while (messages[0].role !== 'user') messages.shift();
  return messages;
}

export function buildUserContext(user, now = new Date()) {
  if (!user) return '';
  const { profile = {}, goalItems = [], scans = [] } = user;
  const preferences = profile.preferences || {};
  const lines = [
    profile.name && profile.name !== 'NutriOwl Member' && `Name: ${profile.name}`,
    profile.age && `Age: ${profile.age}`,
    profile.heightCm && `Height: ${profile.heightCm} cm`,
    profile.weightKg && `Weight: ${profile.weightKg} kg`,
    (preferences.activityLevel || profile.activityLevel) && `Activity level: ${preferences.activityLevel || profile.activityLevel}`,
    (profile.goals?.length || profile.goal) && `Goals: ${(profile.goals?.length ? profile.goals : [profile.goal]).join(', ')}`,
    preferences.dietPreference && `Diet preference: ${preferences.dietPreference}`,
    preferences.dailyCalorieGoal && `Daily calorie goal: ${preferences.dailyCalorieGoal} kcal`,
    preferences.waterGoal && `Water goal: ${preferences.waterGoal} glasses`
  ].filter(Boolean);

  const progress = goalItems.map(goal => `${goal.title}: ${goal.progress || 0}/${goal.target} ${goal.unit}`);
  const today = now.toISOString().slice(0, 10);
  const meals = scans
    .filter(scan => String(scan.timestamp).startsWith(today))
    .slice(0, 8)
    .map(scan => `${scan.name} (${Math.round(scan.calories)} kcal, ${Math.round(scan.protein)} g protein)`);

  return [
    lines.length && `Member profile:\n${lines.map(line => `- ${line}`).join('\n')}`,
    progress.length && `Goal progress:\n${progress.map(line => `- ${line}`).join('\n')}`,
    `Meals scanned today: ${meals.length ? meals.join('; ') : 'none yet'}`
  ].filter(Boolean).join('\n\n');
}

export function createChatClient({
  apiKey = process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY || '',
  apiUrl = process.env.CHAT_API_URL || defaultApiUrl,
  model = process.env.CHAT_MODEL || defaultModel,
  maxTokens = Number(process.env.CHAT_MAX_TOKENS || 1024),
  dailyLimit = Number(process.env.CHAT_DAILY_LIMIT || 50),
  timeoutMs = 25000,
  fetchImpl = fetch
} = {}) {
  // In-memory per-day counters; they reset on restart, which is acceptable for protecting a free quota.
  const usage = new Map();
  const models = String(model).split(',').map(name => name.trim()).filter(Boolean);

  function consume(key) {
    const date = new Date().toISOString().slice(0, 10);
    const entry = usage.get(key);
    if (!entry || entry.date !== date) {
      if (usage.size > 10000) usage.clear();
      usage.set(key, { date, count: 1 });
      return;
    }
    if (entry.count >= dailyLimit) {
      throw chatError(429, 'You have reached today\'s chat limit. Please try again tomorrow.');
    }
    entry.count += 1;
  }

  async function complete(messages, context) {
    const system = context ? `${systemPrompt}\n\n${context}` : systemPrompt;
    for (const name of models) {
      const res = await fetchImpl(apiUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: name,
          max_tokens: maxTokens,
          temperature: 0.6,
          messages: [{ role: 'system', content: system }, ...messages]
        })
      });
      if (!res.ok) {
        console.error('Chat API error', name, res.status, (await res.text()).slice(0, 500));
        if ([404, 429].includes(res.status) || res.status >= 500) continue;
        return null;
      }
      const text = (await res.json()).choices?.[0]?.message?.content;
      return typeof text === 'string' && text.trim() ? text.trim() : null;
    }
    return null;
  }

  return {
    async reply({ body, user, limitKey }) {
      const messages = normalizeMessages(body);
      const latest = messages.at(-1).content;
      if (crisisPattern.test(latest)) return { response: crisisResponse, source: 'safety' };

      consume(limitKey);
      if (apiKey) {
        try {
          const text = await complete(messages, buildUserContext(user));
          if (text) return { response: text, source: 'ai' };
        } catch (error) {
          console.error('Chat API request failed:', error.message);
        }
      }
      return { response: chatResponse(latest), source: 'fallback' };
    }
  };
}
