import { demoFoodAnalysis } from "./domain.js";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const prompt = `Identify the food in this photo and estimate nutrition for the portion shown.
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"isFood":true,"food":"name","calories":0,"protein":0,"carbs":0,"fat":0,"sugar":0,"sodium":0,"fiber":0,"vitamins":["..."],"minerals":["..."],"healthScore":0}
Units: calories in kcal, protein/carbs/fat/sugar/fiber in grams, sodium in mg, healthScore 0-100.
If the image does not contain food, reply {"isFood":false}.`;

function parseImage(value) {
  const match = String(value || "").match(
    /^data:(image\/[a-z+.-]+);base64,(.+)$/i,
  );
  if (!match || !allowedTypes.includes(match[1].toLowerCase())) return null;
  return { mediaType: match[1].toLowerCase(), data: match[2] };
}

const num = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));
const list = (v) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];

export async function analyzeFood(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const image = parseImage(body.image);
  if (!apiKey || !image) return demoFoodAnalysis();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("Vision API error", res.status, await res.text());
    throw Object.assign(new Error("Food analysis failed."), { status: 502 });
  }

  const text =
    (await res.json()).content?.find((b) => b.type === "text")?.text || "";
  let data;
  try {
    data = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    throw Object.assign(new Error("Food analysis failed."), { status: 502 });
  }
  if (data.isFood === false) {
    throw Object.assign(new Error("No food was detected in that photo."), {
      status: 422,
    });
  }

  return {
    isSample: false,
    food: String(data.food || "Unknown food").slice(0, 120),
    calories: num(data.calories, 5000),
    protein: num(data.protein, 500),
    carbs: num(data.carbs, 1000),
    fat: num(data.fat, 500),
    sugar: num(data.sugar, 500),
    sodium: num(data.sodium, 10000),
    fiber: num(data.fiber, 200),
    vitamins: list(data.vitamins),
    minerals: list(data.minerals),
    healthScore: num(data.healthScore, 100),
  };
}
