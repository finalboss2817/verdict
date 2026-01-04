import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

export async function analyzeObjection(input: ObjectionInput) {
  // Initialize precisely as instructed by the core guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-pro-preview for complex reasoning tasks like sales psychology
  const modelName = 'gemini-3-pro-preview';

  const systemInstruction = `You are a Sales Objection Analysis Engine. 
Your job is to help professionals interpret objections correctly, decide deal viability, and respond to protect authority.

TONE: Neutral, Professional, Direct, Slightly conservative. You are an experienced partner, not a coach.
RULES:
1. Never motivate or hype.
2. Never suggest discounts.
3. Be brutally honest about low intent.
4. Prefer losing bad deals over forcing weak ones.
5. No sales clichés.

PROTOCOL: ${input.mode === 'VOID' ? 'VOID (Disqualification Focus - Look for reasons to kill the deal)' : 'NEXUS (Tactical Bridge - Find the high-status path to clarity)'}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `
INPUT DATA:
Objection: "${input.objection}"
Context: ${input.ticketSize} | ${input.product} | Stage: ${input.stage}

Perform the 7-step analysis now.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meaning: { type: Type.STRING, description: "Brutally honest hidden intent." },
          intentLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          intentExplanation: { type: Type.STRING, description: "One short line explanation." },
          closeProbability: { type: Type.STRING, description: "Percentage range based on behavior." },
          bestResponse: { type: Type.STRING, description: "Short, calm, authority-driven message." },
          whatNotToSay: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 common mistakes." },
          followUpStrategy: {
            type: Type.OBJECT,
            properties: {
              maxFollowUps: { type: Type.STRING },
              timeGap: { type: Type.STRING },
              stopCondition: { type: Type.STRING }
            },
            required: ["maxFollowUps", "timeGap", "stopCondition"]
          },
          walkAwaySignal: { type: Type.STRING, description: "Explicit disengagement signal." }
        },
        required: ["meaning", "intentLevel", "intentExplanation", "closeProbability", "bestResponse", "whatNotToSay", "followUpStrategy", "walkAwaySignal"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Analysis failed. No data received.");
  return JSON.parse(text);
}