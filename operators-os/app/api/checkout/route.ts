import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Accept either userId or user_id to prevent any mismatch
    const userId = body.userId || body.user_id;
    const priceId = body.priceId || 'price_1TxbhN00WvSfpixtXwY5oFx1';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/logs?success=true`,
      cancel_url: `${request.headers.get('origin')}/logs?canceled=true`,
      metadata: {
        supabase_user_id: userId,
      }
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}