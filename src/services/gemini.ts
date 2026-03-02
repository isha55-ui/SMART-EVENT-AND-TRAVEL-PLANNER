import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTravelAdvice(destination: string, preferences: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a smart travel assistant. Provide 3-5 concise, high-value travel tips for someone visiting ${destination}. 
      Consider these preferences: ${preferences}. 
      Include advice on:
      1. Best local hidden gem.
      2. A practical travel hack for this location.
      3. A budget-saving tip.
      Keep it professional, helpful, and inspiring. Use markdown for formatting.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not fetch AI advice at this time.";
  }
}

export async function getBudgetEstimation(destination: string, duration: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Estimate a daily budget for a trip to ${destination} for ${duration} days. 
      Provide a breakdown for:
      - Low (Backpacker)
      - Mid (Comfort)
      - High (Luxury)
      Return the response as a JSON object with keys: low, mid, high, currency, and a brief note.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
