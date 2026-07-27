import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { user_id, event_type, customer_name, phone, message } = payload;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required to route tasks to saved agents.' },
        { status: 400 }
      );
    }

    const { data: savedBlueprint, error: dbError } = await supabase
      .from('blueprints')
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

    let blueprintData = savedBlueprint.blueprint;
    if (typeof blueprintData === 'string') {
      try { blueprintData = JSON.parse(blueprintData); } catch (e) { blueprintData = {}; }
    }

    const agentsList = blueprintData?.agents || blueprintData?.blueprint?.agents || [];

    const agentRoster = agentsList.length > 0 
      ? agentsList.map((a: any) => `- ${a.name || 'Agent'} (${a.role || 'Role'}): Primary Output -> ${a.primary_output || 'N/A'}`).join('\n')
      : '- Generic Workforce Agent (Handles general intake)';

    const systemName = blueprintData?.system_name || savedBlueprint.system_name || 'Operators OS Network';
    const architectureType = blueprintData?.architecture_type || 'B2B Automation';

    const agentPrompt = `
      You are running the digital workforce system: "${systemName}".
      Architecture Type: ${architectureType}

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
    
    // Print raw response to terminal for debugging
    console.log("GEMINI RAW RESPONSE:", JSON.stringify(geminiData, null, 2));

    const agentOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(geminiData);

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
      system_executed: systemName,
      agent_output: agentOutput
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed.' },
      { status: 500 }
    );
  }
}