import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - High-Stakes Logic
 * Optimized for resilience in deployed environments.
 */
export async function analyzeObjection(input: ObjectionInput) {
  // Use a temporary reference to avoid potential race conditions with process.env
  const apiKey = (typeof process !== 'undefined' && process.env.API_KEY) || null;
  
  // Guard against falsy keys to prevent SDK fatal errors
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    throw new Error("AUTH_KEY_MISSING");
  }

  // Create instance right before the call as per SDK guidelines
  let ai;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    throw new Error("AUTH_KEY_INVALID");
  }

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
        thinkingConfig: { thinkingBudget: 2000 },
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
    
    // Catch platform-level authorization issues
    if (
      msg.includes("api key") || 
      msg.includes("403") || 
      msg.includes("not found") || 
      msg.includes("permission") || 
      msg.includes("authorized") ||
      msg.includes("entity")
    ) {
      throw new Error("AUTH_KEY_INVALID");
    }
    
    throw error;
  }
}