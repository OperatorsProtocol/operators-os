import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { queueId, finalSubject, finalBody } = await req.json();

    if (!queueId) {
      return NextResponse.json({ success: false, error: 'Queue ID is required' }, { status: 400 });
    }

    // 1. Fetch item from review_queue
    const { data: item, error: fetchError } = await supabase
      .from('review_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (fetchError || !item) {
      throw new Error('Queue item not found.');
    }

    const subjectToSend = finalSubject || item.subject;
    const bodyToSend = finalBody || item.body;

    // 2. Dispatch live email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Operators OS <onboarding@resend.dev>',
      to: [item.client_email],
      subject: subjectToSend,
      text: bodyToSend,
    });

    // 3. Update status in database to APPROVED
    await supabase
      .from('review_queue')
      .update({
        subject: subjectToSend,
        body: bodyToSend,
        status: 'APPROVED',
      })
      .eq('id', queueId);

    return NextResponse.json({
      success: true,
      message: 'Email verified and dispatched successfully!',
      resendData: emailResponse,
    });

  } catch (error: any) {
    console.error('Approval Dispatch Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch approved email.' },
      { status: 500 }
    );
  }
}