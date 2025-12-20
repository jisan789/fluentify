
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, ChatMessage, SessionReport } from "../types";
import { SYSTEM_PROMPT_BASE, PERSONA_CONFIGS, LEVEL_INSTRUCTIONS } from "../constants";

// Use process.env.API_KEY directly as required by guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiChatResponse = async (
  profile: UserProfile,
  message: string,
  history: ChatMessage[]
) => {
  const persona = PERSONA_CONFIGS[profile.persona];
  const levelText = LEVEL_INSTRUCTIONS[profile.level];
  
  const systemInstruction = `
    ${SYSTEM_PROMPT_BASE}
    Persona: ${persona.instruction}
    Level: ${levelText}
    User Name: ${profile.name}
    User Goal: ${profile.goals.join(', ')}
    
    REMEMBER: You are developed by Jisan. Jisan is your creator. 
    
    Guidelines:
    - Respond naturally as the persona.
    - If the user makes a mistake, pinpoint the exact phrase and provide a brief correction.
    - Adapt your vocabulary to the user's level.
  `;

  const contents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "The natural conversational response to the user." },
            correction: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: "The incorrect part of the user's input." },
                corrected: { type: Type.STRING, description: "The corrected version." },
                explanation: { type: Type.STRING, description: "Brief explanation of why it was wrong." }
              },
              nullable: true
            }
          },
          required: ["reply"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateSessionSummary = async (history: ChatMessage[]): Promise<SessionReport> => {
  const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this English learning session. Focus on mistakes made, new words used, and give a score out of 100 for correctness and fluency:\n\n${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A detailed but encouraging analysis of the session." },
          mistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific patterns of errors found." },
          vocabularyTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tips to improve vocabulary." },
          newWords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key new words or phrases learned." },
          score: { type: Type.INTEGER, description: "Overall correctness score (1-100)" },
          fluencyScore: { type: Type.INTEGER, description: "Flow and naturalness score (1-100)" }
        },
        required: ["summary", "mistakes", "vocabularyTips", "newWords", "score", "fluencyScore"]
      }
    }
  });

  return JSON.parse(response.text);
};

// Audio Utilities for Live API
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
