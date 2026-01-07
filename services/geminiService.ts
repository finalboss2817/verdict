import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Lite Tier Execution
 * Optimized for maximum availability and high-speed processing.
 */
export async function analyzeObjection(input: ObjectionInput) {
  // Directly use the environment key provided by the platform
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Flash Lite is the most resilient model for accounts without premium billing
  const model = 'gemini-flash-lite-latest';

  const systemInstruction = `You are the "Sovereign Sales Analyst." 
Your job is to decode human intent from sales objections.
Tone: Brutally honest, high-status, neutral.
Goal: Help the salesperson decide if they should walk away or close.
Output strictly JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `OBJECTION: "${input.objection}" | CONTEXT: ${input.ticketSize} at ${input.stage} phase. | MODE: ${input.mode} | PRODUCT: ${input.product}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING },
            intentLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            intentExplanation: { type: Type.STRING },
            closeProbability: { type: Type.STRING },
            bestResponse: { type: Type.STRING },
            whatNotToSay: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUpStrategy: {
              type: Type.OBJECT,
              properties: {
                maxFollowUps: { type: Type.STRING },
                timeGap: { type: Type.STRING },
                stopCondition: { type: Type.STRING }
              },
              required: ["maxFollowUps", "timeGap", "stopCondition"]
            },
            walkAwaySignal: { type: Type.STRING }
          },
          required: ["meaning", "intentLevel", "intentExplanation", "closeProbability", "bestResponse", "whatNotToSay", "followUpStrategy", "walkAwaySignal"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from analysis engine.");
    
    return JSON.parse(resultText);
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Throw the raw message so the UI can display it accurately
    throw new Error(error.message || "Unknown engine error occurred.");
  }
}