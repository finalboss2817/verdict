import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

const getSystemInstruction = (mode: 'VOID' | 'NEXUS') => {
  const base = `You are the "Sovereign Sales Analyst," an elite engine for interpreting objections in high-ticket environments. 
  Your tone is neutral, professional, and brutally direct. You are not a coach; you are a diagnostic engine.`;

  if (mode === 'VOID') {
    return `${base}
    PROTOCOL: VOID (Disqualification Focus).
    GOAL: Look for reasons to kill the deal. Protect the user's time at all costs. 
    Assume the buyer is stalling or being polite unless intent is undeniably high. 
    Prioritize walking away over chasing.`;
  }

  return `${base}
  PROTOCOL: NEXUS (Tactical Bridge).
  GOAL: Find the high-status path to close. 
  Address legitimate hurdles without sounding desperate. 
  Provide leadership and clarity. No discounts.`;
};

export async function analyzeObjection(input: ObjectionInput) {
  // Always initialize inside the function to ensure the latest process.env.API_KEY is used
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
OBJECTION: "${input.objection}"
CONTEXT: ${input.ticketSize} | ${input.product} | ${input.stage}
PROTOCOL: ${input.mode}

Return a JSON verdict following the requested structure.`,
      config: {
        systemInstruction: getSystemInstruction(input.mode),
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
    if (!text) throw new Error("Tactical response empty.");
    return JSON.parse(text);
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }
    throw error;
  }
}