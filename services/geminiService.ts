import { GoogleGenAI, Type } from "@google/genai";
import { ObjectionInput } from "../types";

export async function analyzeObjection(input: ObjectionInput) {
  // Obtain API key exclusively from environment variable as per hard requirement
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Operational Link Failure: The analysis engine environment variable is not detected. Please verify system configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use 'gemini-3-flash-preview' for rapid, seamless text analysis tasks
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `You are the "Sovereign Sales Analyst," an elite engine for interpreting objections in high-ticket environments. 
Your tone is neutral, professional, and brutally direct. You are a diagnostic engine, not a coach.

CORE PROTOCOLS:
1. Never motivate, hype, or encourage "chasing."
2. Never suggest discounts.
3. Be brutally honest about low intent; call out dead deals immediately.
4. Prefer losing a bad deal quickly over chasing a weak one for months.
5. Avoid all sales clichés.

MODES:
- VOID: Disqualification focus. Look for reasons the deal is a waste of time.
- NEXUS: Tactical bridge. Find the high-status path to clarity/close without desperation.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `
OBJECTION SCRIPT: "${input.objection}"
CONTEXT: ${input.ticketSize} | Sector: ${input.product} | Stage: ${input.stage}
CURRENT PROTOCOL: ${input.mode}

Execute the 7-step analysis strictly following the requested JSON structure.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meaning: { type: Type.STRING, description: "Brutally honest decoding of the hidden intent." },
          intentLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          intentExplanation: { type: Type.STRING, description: "One short line explanation for the intent rating." },
          closeProbability: { type: Type.STRING, description: "Realistic percentage range based on behavior." },
          bestResponse: { type: Type.STRING, description: "ONE short, calm, authority-driven message." },
          whatNotToSay: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 common desperation mistakes." },
          followUpStrategy: {
            type: Type.OBJECT,
            properties: {
              maxFollowUps: { type: Type.STRING },
              timeGap: { type: Type.STRING },
              stopCondition: { type: Type.STRING }
            },
            required: ["maxFollowUps", "timeGap", "stopCondition"]
          },
          walkAwaySignal: { type: Type.STRING, description: "Explicit signal for when to disengage." }
        },
        required: ["meaning", "intentLevel", "intentExplanation", "closeProbability", "bestResponse", "whatNotToSay", "followUpStrategy", "walkAwaySignal"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Tactical response empty. The engine failed to generate a verdict.");
  return JSON.parse(text);
}