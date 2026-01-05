import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Optimized for instant verdicts and self-healing.
 */
export async function analyzeObjection(input: ObjectionInput) {
  const apiKey = process.env.API_KEY;
  
  // Guard against empty/undefined keys to prevent the SDK from throwing a non-catchable browser error
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error("LINK_AUTH_FAILED");
  }

  let ai;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    throw new Error("LINK_AUTH_FAILED");
  }
  
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst." 
Your job is to decode human intent from sales objections.
Tone: Brutally honest, high-status, neutral.
Goal: Help the salesperson decide if they should walk away or close.
Output strictly JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `OBJECTION: "${input.objection}" | CONTEXT: ${input.ticketSize} at ${input.stage} phase. | MODE: ${input.mode}`,
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

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    const msg = (error.message || "").toLowerCase();
    
    // Catch common platform-level issues that require a key refresh
    if (
      msg.includes("api key") || 
      msg.includes("403") || 
      msg.includes("not found") || 
      msg.includes("permission") || 
      msg.includes("authorized") ||
      msg.includes("entity")
    ) {
      throw new Error("LINK_AUTH_FAILED");
    }
    
    throw error;
  }
}