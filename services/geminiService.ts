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

/**
 * Retrieves the API key using a method that avoids static replacement by build tools.
 */
function getApiKey(): string | undefined {
  const win = window as any;
  // Prioritize runtime process.env, then global API_KEY, then build-time process.env
  return (
    win.process?.env?.API_KEY || 
    win.API_KEY ||
    (typeof process !== 'undefined' ? process.env?.API_KEY : undefined)
  );
}

export async function analyzeObjection(input: ObjectionInput) {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("API_KEY_MISSING");
  }

  // Create new instance right before call for the most up-to-date key
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
CONTEXT:
Protocol: ${input.mode}
Sale Type: ${input.ticketSize}
Product: ${input.product}
Deal Stage: ${input.stage}

OBJECTION RECEIVED:
"${input.objection}"

Analyze this and provide a structured JSON verdict according to the schema.
      `,
      config: {
        systemInstruction: getSystemInstruction(input.mode),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING, description: "The brutal truth behind the words." },
            intentLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            intentExplanation: { type: Type.STRING, description: "Why the intent is ranked this way." },
            closeProbability: { type: Type.STRING, description: "Percentage range (e.g., 20-30%)." },
            bestResponse: { type: Type.STRING, description: "The exact message to send." },
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
            walkAwaySignal: { type: Type.STRING, description: "Specific behavior that signals it's over." }
          },
          required: ["meaning", "intentLevel", "intentExplanation", "closeProbability", "bestResponse", "whatNotToSay", "followUpStrategy", "walkAwaySignal"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Strategic link established but no data returned.");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    const msg = error.message || "";
    // Handle the specific "Requested entity was not found" error by signaling for key re-selection
    if (msg.includes("Requested entity was not found") || 
        msg.includes("API key not found") || 
        msg.includes("invalid") ||
        msg.includes("403") ||
        msg.includes("401")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}