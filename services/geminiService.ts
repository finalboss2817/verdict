import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

/**
 * Sovereign Analysis Engine - Flash Edition
 * Optimized for speed and high-status disqualification logic.
 */
export async function analyzeObjection(input: ObjectionInput) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("AUTH_MISSING: The operational link has not been established.");
  }

  // Mandatory: Create fresh instance right before the call
  const ai = new GoogleGenAI({ apiKey });
  
  // Using Flash for maximum speed and accessibility
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst," an elite diagnostic engine for high-ticket sales objections.
Tone: Neutral, Professional, Brutally Direct.
Your job is to decode hidden intent. If a deal is dead, say so.
Protect the salesperson's time and status. No fluff. No coaching.

Output the analysis in strict JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
OBJECTION: "${input.objection}"
CONTEXT: ${input.ticketSize} | Sector: ${input.product} | Stage: ${input.stage}
PROTOCOL: ${input.mode}

Generate the 7-step diagnostic JSON based on the provided input.`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 4000 }, 
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
      throw new Error("EMPTY_ENGINE_RESPONSE");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    const msg = (error.message || "").toLowerCase();
    // Signal to the UI if a platform-level key selection is needed
    if (msg.includes("not found") || msg.includes("api key") || msg.includes("403") || msg.includes("permission")) {
      throw new Error("ENGINE_NOT_AUTHORIZED");
    }
    throw error;
  }
}