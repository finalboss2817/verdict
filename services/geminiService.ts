import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine
 * Handles connection to Google Gemini 3 Pro.
 */
export async function analyzeObjection(input: ObjectionInput) {
  // Direct environment variable access
  const apiKey = process.env.API_KEY;
  
  // Guard against missing key to prevent hard SDK crashes
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    throw new Error("AUTH_KEY_MISSING");
  }

  // Late initialization ensures we use the most current environment state
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-pro-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst." 
Your job is to decode human intent from sales objections.
Tone: Brutally honest, high-status, neutral.
Goal: Help the salesperson decide if they should walk away or close.
Output strictly JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `OBJECTION: "${input.objection}" | CONTEXT: ${input.ticketSize} at ${input.stage} phase. | MODE: ${input.mode} | PRODUCT: ${input.product}`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 2048 },
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
    if (!text) throw new Error("EMPTY_ENGINE_OUTPUT");

    return JSON.parse(text);
  } catch (error: any) {
    const msg = (error.message || "").toLowerCase();
    
    // Check for specific "entity not found" error requiring re-auth
    if (msg.includes("requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }

    // Handle general permission/auth issues
    if (msg.includes("api key") || msg.includes("403") || msg.includes("not found") || msg.includes("invalid")) {
      throw new Error("AUTH_KEY_INVALID");
    }
    
    throw error;
  }
}