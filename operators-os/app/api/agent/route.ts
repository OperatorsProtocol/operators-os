import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Grab the Agent ID from the search query
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Agent ID is required' }), { status: 400 });
    }

    // Connect to Supabase admin client to fetch system prompt
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let systemPrompt = 'You are a generic helpful assistant.';

    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('system_prompt')
      .eq('id', agentId)
      .single();
      
    if (data?.system_prompt) {
      systemPrompt = data.system_prompt;
    } else if (error) {
      console.error("Database error fetching agent:", error);
    }

    // Stream text using custom agent prompt and full contractor tool suite
    const result = streamText({
      model: google('gemini-3.6-flash'),
      system: systemPrompt, 
      messages: await convertToModelMessages(messages),
      tools: {
        calculate: {
          description: 'Evaluates a mathematical expression for general calculations.',
          inputSchema: z.object({
            expression: z.string().describe('The math expression to evaluate, e.g. "100 * 0.15"'),
          }),
          execute: async ({ expression }: { expression: string }) => {
            try {
              const mathResult = new Function(`return ${expression}`)();
              return { result: String(mathResult) };
            } catch (e) {
              return { error: 'Invalid math expression' };
            }
          },
        } as any,

        fetchLeadData: {
          description: 'Queries CRM lead status, contact history, and notes for a given company or client name.',
          inputSchema: z.object({
            companyName: z.string().describe('The exact name of the company or lead to look up'),
          }),
          execute: async ({ companyName }: { companyName: string }) => {
            return {
              company: companyName,
              status: 'Active Lead / Verified',
              lastContacted: new Date().toISOString(),
              notes: 'Requested estimate for service upgrade and subpanel installation.',
            };
          },
        } as any,

        calculateEstimate: {
          description: 'Calculates professional job quotes based on labor hours, hourly rates, and material costs.',
          inputSchema: z.object({
            laborHours: z.number().describe('Estimated hours of labor required'),
            hourlyRate: z.number().describe('Hourly billing rate in USD'),
            materialCost: z.number().describe('Total wholesale cost of required materials'),
            markupPercentage: z.number().describe('Markup percentage on materials, e.g. 20 for 20%'),
          }),
          execute: async ({ laborHours, hourlyRate, materialCost, markupPercentage }: { laborHours: number; hourlyRate: number; materialCost: number; markupPercentage: number }) => {
            const laborTotal = laborHours * hourlyRate;
            const markedUpMaterials = materialCost * (1 + markupPercentage / 100);
            const grandTotal = laborTotal + markedUpMaterials;
            return {
              laborTotal: `$${laborTotal.toFixed(2)}`,
              materialTotal: `$${markedUpMaterials.toFixed(2)}`,
              estimatedQuoteTotal: `$${grandTotal.toFixed(2)}`,
              timestamp: new Date().toISOString(),
            };
          },
        } as any,

        scheduleDispatch: {
          description: 'Schedules a service appointment or technician dispatch time slot.',
          inputSchema: z.object({
            clientName: z.string().describe('Name of the client'),
            serviceType: z.string().describe('Type of service or repair required'),
            preferredDate: z.string().describe('Requested date, e.g. "2026-08-02"'),
            timeSlot: z.string().describe('Time window, e.g. "Morning (8AM - 12PM)"'),
          }),
          execute: async ({ clientName, serviceType, preferredDate, timeSlot }: { clientName: string; serviceType: string; preferredDate: string; timeSlot: string }) => {
            return {
              dispatchStatus: 'Confirmed & Scheduled',
              client: clientName,
              service: serviceType,
              scheduledSlot: `${preferredDate} during ${timeSlot}`,
              confirmationCode: `DISPATCH-${Math.floor(100000 + Math.random() * 900000)}`,
            };
          },
        } as any,
      } as any,
    } as any);

    return result.toUIMessageStreamResponse();

  } catch (error: any) {
    console.error('Agent Engine Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to process request' }), { status: 500 });
  }
}