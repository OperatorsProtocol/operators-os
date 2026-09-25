import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message, clientEmail, clientName } = await req.json();

    if (!message || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing customer message or client email.' },
        { status: 400 }
      );
    }

    // 1. Fetch all active agents from your Supabase database
    const { data: agents, error: fetchError } = await supabase.from('agents').select('*');
    if (fetchError || !agents || agents.length === 0) {
      throw new Error('No agents available in the system.');
    }

    // 2. Master Agent evaluating available workforce options
    const agentRoster = agents.map((a) => `ID: ${a.id} | Name: ${a.name} | Role: ${a.role} | Prompt: ${a.system_prompt}`).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const routingPrompt = `
      You are the Master Workforce Dispatcher.
      Customer Request: "${message}"
      Client Name: "${clientName || 'Valued Customer'}"

      Available Agents:
      ${agentRoster}

      Task:
      1. Analyze the request and pick the SINGLE best agent ID from the list to handle this job.
      2. Using that agent's persona and prompt, draft a professional email reply or quote.
      
      Return ONLY raw JSON with no markdown syntax:
      {
        "selectedAgentId": "EXACT_AGENT_UUID",
        "selectedAgentName": "Agent Name",
        "subject": "Professional Subject Line",
        "body": "Complete email or quote response..."
      }
    `;

    const routerResult = await model.generateContent(routingPrompt);
    const rawText = routerResult.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Master Agent returned invalid routing format.');
    }

    const { selectedAgentId, selectedAgentName, subject, body } = JSON.parse(jsonMatch[0]);

    // 3. Deposit draft into Supabase review_queue instead of sending immediately
    const { data: queueItem, error: queueError } = await supabase
      .from('review_queue')
      .insert([
        {
          agent_id: selectedAgentId,
          agent_name: selectedAgentName,
          client_name: clientName || 'Valued Customer',
          client_email: clientEmail,
          subject: subject,
          body: body,
          status: 'PENDING_APPROVAL',
        },
      ])
      .select()
      .single();

    if (queueError) {
      throw new Error(`Failed to log to review queue: ${queueError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Draft successfully generated and routed to Approval Queue.',
      queueId: queueItem.id,
      assignedAgent: selectedAgentName,
    });

  } catch (error: any) {
    console.error('Intake Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Intake process failed.' },
      { status: 500 }
    );
  }
}