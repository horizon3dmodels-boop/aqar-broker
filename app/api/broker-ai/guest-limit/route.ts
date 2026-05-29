import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_guest_limit")
      .single();

    return NextResponse.json({ limit: Number(data?.value) || 5 });
  } catch {
    return NextResponse.json({ limit: 5 });
  }
}