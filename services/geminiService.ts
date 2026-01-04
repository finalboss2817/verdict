import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

const getSystemInstruction = (mode: 'VOID' | 'NEXUS') => {
  const base = `You are the "Sovereign Sales Analyst," an elite engine for high-ticket consultants. 
  Your tone is neutral, professional, and minimalist. 
  You NEVER sound like a standard AI assistant or a desperate salesperson. You are a cold, objective partner.`;

  if (mode === 'VOID') {
    return `${base}
    PROTOCOL: VOID (Disqualification Focus).
    YOUR GOAL: Be skeptical. Look for reasons to KILL the deal. 
    Assume the buyer is wasting time unless proven otherwise. 
    Your advice should prioritize "Sovereignty" and "Time Protection" over closing. 
    If intent is anything less than high, advise walking away. 
    Be blunt, direct, and slightly pessimistic to protect the user's time.`;
  }

  return `${base}
  PROTOCOL: NEXUS (Optimized Tactical).
  YOUR GOAL: Path to Close. Look for tactical leverage. 
  Determine if the objection is a "Smoke Screen" or a "Legitimate Hurdle." 
  If legitimate, provide the most high-status way to address it that preserves authority while providing the logical "bridge" the client needs to sign. 
  You are looking for the WIN, but only if it's a "Good Deal." Do not suggest discounts. Suggest value-clarification and leadership.`;
};

export async function analyzeObjection(input: ObjectionInput) {
  // Use the API key exclusively from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-flash-preview for text tasks
  const modelName = 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `
CONTEXT:
Protocol: ${input.mode}
Sale Type: ${input.ticketSize}
Product: ${input.product}
Deal Stage: ${input.stage}

OBJECTION RECEIVED:
"${input.objection}"

Analyze this and provide a structured JSON verdict.
    `,
    config: {
      systemInstruction: getSystemInstruction(input.mode),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meaning: { type: Type.STRING, description: "The brutal truth behind the words." },
          intentLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          intentExplanation: { type: Type.STRING, description: "One line explanation." },
          closeProbability: { type: Type.STRING, description: "Percentage range." },
          bestResponse: { type: Type.STRING, description: "The exact message to send." },
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
  if (!text) throw new Error("No analysis returned from engine.");
  return JSON.parse(text);
}