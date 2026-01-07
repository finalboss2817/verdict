import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Atomic Execution
 */
export async function analyzeObjection(input: ObjectionInput) {
  // Always retrieve the key at the moment of execution to catch injected values
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("AUTH_KEY_MISSING");
  }

  // Create new instance for every request to ensure fresh context/key
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

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(response.text);
  } catch (error: any) {
    const msg = (error.message || "").toLowerCase();
    
    // Rule-based error categorization
    if (msg.includes("requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }
    if (msg.includes("api key") || msg.includes("403") || msg.includes("invalid")) {
      throw new Error("AUTH_KEY_INVALID");
    }
    
    throw error;
  }
}