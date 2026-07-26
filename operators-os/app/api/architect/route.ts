import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize the Gemini client using the environment variable automatically
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Call Gemini 3 Flash to act as our Architect Agent
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Master Architect Agent for Operators OS. 
      Analyze this user request and return a structured JSON blueprint of the sub-agents needed: "${prompt}"`,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}