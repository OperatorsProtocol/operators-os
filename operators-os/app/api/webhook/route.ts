import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sender, message, deployment_id } = body; 

    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    // Connect using Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch agents belonging to this deployment batch/workforce
    const { data: agents, error } = await supabaseAdmin
      .from('agents')
      .select('name, role, system_prompt')
      .eq('batch_name', deployment_id || 'Default Workforce');

    if (error || !agents || agents.length === 0) {
      return new Response(JSON.stringify({ error: 'No workforce found for routing' }), { status: 404 });
    }

    // Format the directory for the CEO agent
    const workforceDirectory = agents.map((a: any) => `- **${a.name}** (${a.role}): ${a.system_prompt}`).join('\n');

    const ceoPrompt = `
      You are the Master CEO & Orchestrator Agent for this company's autonomous workforce.
      Your job is to analyze incoming messages from customers or leads and determine which specialized agent is best equipped to handle it.

      Here is your available workforce directory:
      ${workforceDirectory}

      Incoming Message from ${sender || 'Unknown Lead'}:
      "${message}"

      Task: 
      1. Identify the intent of the message.
      2. Choose the single best agent from the directory to handle this task.
      3. Draft a delegation instruction for that agent.
    `;

    // Ignite the CEO Agent to route the message
    const response = await generateText({
      model: google('gemini-1.5-flash') as any,
      system: ceoPrompt,
      prompt: 'Analyze the incoming message, select the best agent, and provide the delegation instructions.',
    });

    return Response.json({
      success: true,
      routedBy: 'CEO Orchestrator',
      analysisAndDelegation: response.text,
    });

  } catch (error: any) {
    console.error('Webhook Routing Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Routing failed' }), { status: 500 });
  }
}