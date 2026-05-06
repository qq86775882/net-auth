import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url) throw new Error("SUPABASE_URL not configured");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const text = await req.text();
    const body: Record<string, string> = {};
    text.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) body[k] = decodeURIComponent(v || "");
    });

    const { Token } = body;
    if (!Token) return new NextResponse("-20", { status: 200, headers: { "Content-Type": "text/plain" } });

    const { data: session } = await supabase.from("online_sessions").select("*").eq("token", Token).single();
    if (!session) return new NextResponse("-20", { status: 200, headers: { "Content-Type": "text/plain" } });
    if (new Date(session.expire_at) < new Date()) {
      await supabase.from("online_sessions").delete().eq("id", session.id);
      return new NextResponse("-20", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const newExpire = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("online_sessions")
      .update({ last_heart: new Date().toISOString(), expire_at: newExpire })
      .eq("id", session.id);

    return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch {
    return new NextResponse("-99", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
