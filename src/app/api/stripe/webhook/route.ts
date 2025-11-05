import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;

    if (userId) {
      // Update user profile to premium
      const supabase = await createClient();
      
      // We need to use service role client for admin operations
      // For now, we'll use a direct database update via RPC
      const { error } = await supabase
        .from("user_profiles")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
          { error: "Failed to update user profile" },
          { status: 500 }
        );
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    // Get user by customer ID
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("user_profiles")
        .update({
          is_premium: false,
          premium_since: null,
        })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}

