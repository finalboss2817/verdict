import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Core Service
 * Designed for high-stakes interpretation of sales objections.
 */
export async function analyzeObjection(input: ObjectionInput) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: Operational link not established.");
  }

  // Initializing fresh instance to capture latest platform injection
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst," an elite diagnostic engine for high-ticket sales objections.
Your purpose is to provide brutal, diagnostic clarity. You are NOT a coach.

OPERATIONAL PARAMETERS:
1. Decode hidden intent behind the text.
2. Be brutally honest. If the deal is dead, call it.
3. Protect authority and time. Never suggest "chasing" or discounts.
4. Mode VOID: Prioritize disqualification.
5. Mode NEXUS: Prioritize tactical high-status clarity.

STRUCTURE YOUR OUTPUT ACCORDING TO THE PROVIDED SCHEMA.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
INPUT SCRIPT: "${input.objection}"
CONTEXT: ${input.ticketSize} | Sector: ${input.product} | Stage: ${input.stage}
PROTOCOL: ${input.mode}

Perform interpretation and provide the 7-step analysis in JSON format.`,
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

    const text = response.text;
    if (!text) throw new Error("EMPTY_ENGINE_OUTPUT");
    
    return JSON.parse(text);
  } catch (error: any) {
    // Pass specialized error messages back to the UI for automatic recovery
    const msg = error.message || "";
    if (msg.includes("403") || msg.includes("permission") || msg.includes("not found")) {
      throw new Error("ENGINE_AUTH_FAILURE");
    }
    throw error;
  }
}