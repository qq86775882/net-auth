import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url) throw new Error("SUPABASE_URL not configured");
  return createClient(url, key);
}

function generateToken(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      text.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k) body[k] = decodeURIComponent(v || "");
      });
    } else {
      body = await req.json();
    }

    const { Softid, Card, Version, Mac } = body;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!Softid || !Card || !Version || !Mac) {
      await logIt(supabase, Softid || "", Card || "", Mac, Version, ip, "-9");
      return new NextResponse("-9", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const { data: software } = await supabase.from("softwares").select("*").eq("softid", Softid).single();
    if (!software) {
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-2");
      return new NextResponse("-2", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    if (software.status === 0) {
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-5");
      return new NextResponse("-5", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const { data: card } = await supabase.from("cards").select("*").eq("card_no", Card).single();
    if (!card || card.softid !== Softid) {
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-11");
      return new NextResponse("-11", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    if (card.status === 3) {
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-4");
      return new NextResponse("-4", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    if (new Date(card.expire_time) < new Date()) {
      await supabase.from("cards").update({ status: 2 }).eq("id", card.id);
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-1");
      return new NextResponse("-1", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (software.machine_bind > 0) {
      if (!card.bind_mac) {
        if (card.bind_count >= card.max_bind) {
          await logIt(supabase, Softid, Card, Mac, Version, ip, "-7");
          return new NextResponse("-7", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        await supabase.from("cards").update({ bind_mac: Mac, bind_count: card.bind_count + 1 }).eq("id", card.id);
      } else {
        if (card.bind_mac !== Mac) {
          await logIt(supabase, Softid, Card, Mac, Version, ip, "-3");
          return new NextResponse("-3", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
      }
    }

    if (software.version_min && Version < software.version_min) {
      await logIt(supabase, Softid, Card, Mac, Version, ip, "-6");
      return new NextResponse("-6", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (software.max_online > 0) {
      const { count } = await supabase.from("online_sessions")
        .select("*", { count: "exact", head: true }).eq("card_id", card.id)
        .gte("expire_at", new Date().toISOString());
      if ((count || 0) >= software.max_online) {
        await logIt(supabase, Softid, Card, Mac, Version, ip, "-8");
        return new NextResponse("-8", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
    }

    const token = generateToken();
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("online_sessions").insert({ card_id: card.id, token, mac: Mac, ip, expire_at: expireAt });
    const updates: Record<string, unknown> = { status: 1 };
    if (!card.used_at) updates.used_at = new Date().toISOString();
    await supabase.from("cards").update(updates).eq("id", card.id);
    await logIt(supabase, Softid, Card, Mac, Version, ip, "success", token);

    return new NextResponse(token, { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    console.error("verify error:", e);
    return new NextResponse("-99", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
}

async function logIt(
  supabase: any,
  softid: string, cardNo: string, mac: string,
  version: string, ip: string, result: string, token = ""
) {
  try {
    await supabase.from("auth_logs").insert({
      softid: softid || "unknown", card_no: cardNo || "unknown",
      mac: mac || "unknown", version: version || "unknown",
      ip, result, token,
    });
  } catch {}
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
