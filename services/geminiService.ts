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
  // Safe accessor for the API key to prevent reference errors
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("Operational Block: API_KEY not detected in execution context.");
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-flash-latest as it is the most reliable model across all API key tiers (Free/Paid)
  const modelName = 'gemini-flash-latest';

  try {
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
            closeProbability: { type: Type.STRING, description: "Percentage range (e.g., 5-15%)." },
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
    if (!text) throw new Error("The engine connection was severed (empty response).");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Strategic Link Failure:", error);
    const msg = error.message || "";
    
    // Distinguish between key errors and model availability
    if (msg.includes("API key not found") || msg.includes("401") || msg.includes("invalid")) {
      throw new Error("API_KEY_INVALID");
    }
    
    if (msg.includes("model not found") || msg.includes("404")) {
      throw new Error("Operational Notice: 'gemini-flash-latest' is not accessible for your key tier.");
    }

    throw new Error(`Operational failure: ${msg}`);
  }
}