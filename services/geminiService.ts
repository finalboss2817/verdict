import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

export async function analyzeObjection(input: ObjectionInput) {
  // Initialize instance inside the function to ensure the latest environment variables are captured.
  // We rely on the platform-injected process.env.API_KEY exclusively.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst," a specialized engine for interpreting high-ticket sales objections.
Your purpose is to provide brutal, diagnostic clarity. You are NOT a coach. You do NOT motivate.

OPERATIONAL PARAMETERS:
1. Decode the hidden intent behind the text.
2. Be brutally honest. If the deal is dead, call it.
3. Protect the salesperson's authority and time at all costs.
4. Never suggest discounts or "chasing" behavior.
5. Mode VOID: Focus on disqualification.
6. Mode NEXUS: Focus on high-status tactical clarity.

STRUCTURE YOUR OUTPUT ACCORDING TO THE PROVIDED SCHEMA.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `
INPUT SCRIPT: "${input.objection}"
CONTEXT: ${input.ticketSize} | Sector: ${input.product} | Stage: ${input.stage}
PROTOCOL: ${input.mode}

Perform interpretation and provide the 7-step analysis.`,
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
  if (!text) throw new Error("The engine failed to produce a verdict. Tactical link unstable.");
  return JSON.parse(text);
}