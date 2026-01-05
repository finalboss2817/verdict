import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

export async function analyzeObjection(input: ObjectionInput) {
  // RULE: Always create a fresh instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using the standard Gemini 3 Flash model for speed and accessibility
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst," an elite diagnostic engine for high-ticket sales objections.
Tone: Neutral, Professional, Brutally Direct.
Your job is to decode hidden intent. If a deal is dead, say so.
Protect the salesperson's time and status. No fluff. No coaching.

Output the analysis in strict JSON format.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `
OBJECTION: "${input.objection}"
CONTEXT: ${input.ticketSize} | Sector: ${input.product} | Stage: ${input.stage}
PROTOCOL: ${input.mode}

Generate the 7-step diagnostic JSON.`,
    config: {
      systemInstruction,
      // Disable thinking budget to maximize compatibility with free-tier keys
      thinkingConfig: { thinkingBudget: 0 },
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
    throw new Error("The engine failed to produce a verdict. Check your input and try again.");
  }

  return JSON.parse(response.text);
}