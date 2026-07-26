import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    // 1. Parse incoming payload containing user_id and context
    const payload = await request.json();
    const { user_id, event_type, customer_name, phone, message } = payload;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required to route tasks to saved agents.' },
        { status: 400 }
      );
    }

    // 2. Fetch the user's latest saved agent blueprint from Supabase
    const { data: savedBlueprint, error: dbError } = await supabase
      .from('architectures')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !savedBlueprint) {
      return NextResponse.json(
        { success: false, error: 'No saved agent network found for this user.' },
        { status: 404 }
      );
    }

    const blueprintData = savedBlueprint.blueprint;

    // 3. Build a dynamic prompt using the specific agent roster saved in DB
    const agentRoster = blueprintData.agents?.map((a: any) => 
      `- ${a.name} (${a.role}): Primary Output -> ${a.primary_output}`
    ).join('\n') || 'Generic Workforce Agent';

    const agentPrompt = `
      You are running the digital workforce system: "${blueprintData.system_name}".
      Architecture Type: ${blueprintData.architecture_type}

      ACTIVE AGENT ROSTER:
      ${agentRoster}

      INCOMING TASK EVENT:
      Type: "${event_type || 'General Lead'}"
      Client/Lead Name: "${customer_name || 'N/A'}"
      Phone/Contact: "${phone || 'N/A'}"
      Message / Context: "${message || 'No extra details provided.'}"

      INSTRUCTIONS:
      Delegate this incoming task to the relevant agent(s) in your active roster.
      Generate a structured operational response detailing how the assigned agent processes this request and what output/communication is generated.
    `;

    // 4. Send the dynamic payload to Gemini 3.6 Flash
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: agentPrompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const agentOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    // 5. Log execution to Supabase
    await supabase
      .from('agent_logs')
      .insert([
        {
          event_type: event_type || 'Dynamic Agent Execution',
          input_payload: payload,
          agent_response: agentOutput,
          status: 'success'
        }
      ]);

    return NextResponse.json({
      success: true,
      system_executed: blueprintData.system_name,
      agent_output: agentOutput
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed.' },
      { status: 500 }
    );
  }
}