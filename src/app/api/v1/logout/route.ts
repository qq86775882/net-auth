import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const body: Record<string, string> = {};
    text.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) body[k] = decodeURIComponent(v || "");
    });

    const { Token } = body;

    if (Token) {
      await supabase.from("online_sessions").delete().eq("token", Token);
    }

    return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch {
    return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
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
