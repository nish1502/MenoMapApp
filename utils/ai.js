// utils/ai.js
import axios from "axios";

const OPENROUTER_API_KEY = "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"; // replace with your actual key

export async function getSymptomAdvice(symptoms) {
  if (!symptoms || symptoms.length === 0) return ["No symptoms selected."];

  const prompt = `You are a menopause symptom coach. Give 1-2 short actionable tips for each symptom: ${symptoms.join(
    ", "
  )}`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
      }
    );

    const text = response.data.choices[0].message.content;
    return text.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error("AI API Error:", error);
    return ["Could not fetch advice. Try again later."];
  }
}
