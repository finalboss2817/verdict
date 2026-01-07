import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Flash Tier Execution
 * Optimized for standard/free tier stability.
 */
export async function analyzeObjection(input: ObjectionInput) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("AUTH_KEY_MISSING");
  }

  // Atomic instantiation
  const ai = new GoogleGenAI({ apiKey });
  
  // Using Flash to bypass Paid Billing Project requirements of the Pro model
  const model = 'gemini-3-flash-preview';

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
        // Removed thinking budget to maximize compatibility with non-paid tiers
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

    const text = response.text;
    if (!text) throw new Error("EMPTY_OUTPUT");
    
    return JSON.parse(text);
  } catch (error: any) {
    const msg = (error.message || "").toLowerCase();
    
    if (msg.includes("429") || msg.includes("quota")) {
      throw new Error("RATE_LIMIT");
    }
    
    if (msg.includes("403") || msg.includes("permission") || msg.includes("key")) {
      throw new Error("AUTH_INVALID");
    }

    throw error;
  }
}