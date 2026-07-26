import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are the Master Architect Agent for Operators OS. 
              Analyze this user request and return a structured JSON system configuration:

              User Request: "${prompt}"`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            system_name: { type: 'STRING' },
            architecture_type: { type: 'STRING' },
            agents: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  agent_id: { type: 'STRING' },
                  name: { type: 'STRING' },
                  role: { type: 'STRING' },
                  tools: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                  primary_output: { type: 'STRING' },
                },
                required: ['agent_id', 'name', 'role', 'tools', 'primary_output'],
              },
            },
          },
          required: ['system_name', 'architecture_type', 'agents'],
        },
      },
    });

    return NextResponse.json({ result: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}