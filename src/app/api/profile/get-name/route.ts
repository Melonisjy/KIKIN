import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ name: null }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json({ name: profile?.name?.trim() || null });
  } catch (error: any) {
    console.error("Error fetching name:", error);
    return NextResponse.json({ name: null }, { status: 500 });
  }
}

