
import { GoogleGenAI, Type } from "@google/genai";

// Always use { apiKey: process.env.API_KEY }
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getScoutingReport = async (playerName: string, teamName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional football scouting report for a player named ${playerName} playing for ${teamName} in an FC 26 tournament. Include: 1. Playstyle profile (Aggressive, Tactical, Counter-attacker, etc.), 2. Key strengths, 3. One tactical recommendation. Keep it under 100 words and use professional football terminology.`,
    });
    // Use response.text property, not .text() method
    return response.text;
  } catch (error) {
    console.error("AI Scouting Report failed:", error);
    return "The scouting agency is currently offline. Please try again later.";
  }
};

export const analyzePlayerImage = async (base64Data: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this portrait. Identify the exact coordinates of the person's face and upper torso. Return a JSON object with 'x' and 'y' properties (values 0-100) representing the center point of the person's head/chest area to be used as a focus for cropping. x=50 y=30 usually works for portraits, but adjust based on the image content.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER, description: "Horizontal center of focus (0-100)" },
            y: { type: Type.NUMBER, description: "Vertical center of focus (0-100)" },
          },
          required: ["x", "y"],
        },
      },
    });

    // Use response.text property
    const jsonStr = response.text?.trim() || '{"x": 50, "y": 30}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Image analysis failed:", error);
    return { x: 50, y: 30 };
  }
};
