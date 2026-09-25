import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    // 1. Initialize inside the handler to prevent Vercel build crashes
    const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

    const { taskPrompt, recipientEmail, clientName } = await req.json();

    if (!recipientEmail || !taskPrompt) {
      return NextResponse.json(
        { success: false, error: 'Missing recipient email or prompt' },
        { status: 400 }
      );
    }

    // 2. Ask Gemini to structure the email output as clean JSON
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const aiPrompt = `
      You are an AI growth workforce agent. 
      Task: "${taskPrompt}"
      Client Name: "${clientName || 'Valued Client'}"

      Generate a high-converting, professional email outreach or quote. 
      Return ONLY raw JSON with no markdown formatting or extra text:
      {
        "subject": "Your Email Subject Line",
        "body": "The complete email body text here..."
      }
    `;

    const result = await model.generateContent(aiPrompt);
    const rawText = result.response.text();

    // Clean JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI returned invalid format.');
    }
    const { subject, body } = JSON.parse(jsonMatch[0]);

    // 3. Dispatch the email via Resend
    const emailData = await resend.emails.send({
      from: 'Operators OS <onboarding@resend.dev>', // Default Resend test domain
      to: [recipientEmail],
      subject: subject,
      text: body,
    });

    return NextResponse.json({
      success: true,
      data: emailData,
      generatedContent: { subject, body },
    });

  } catch (error: any) {
    console.error('Execution Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute agent action' },
      { status: 500 }
    );
  }
}