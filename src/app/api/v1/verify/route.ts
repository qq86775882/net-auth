import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function generateToken(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
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

    // -9 鍙傛暟涓嶅畬鏁?
    if (!Softid || !Card || !Version || !Mac) {
      await log(Softid || "", Card || "", Mac, Version, ip, "-9");
      return new NextResponse("-9", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // 鈶?鏌ヨ蒋浠?
    const { data: software } = await supabase
      .from("softwares")
      .select("*")
      .eq("softid", Softid)
      .single();

    if (!software) {
      await log(Softid, Card, Mac, Version, ip, "-2");
      return new NextResponse("-2", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (software.status === 0) {
      await log(Softid, Card, Mac, Version, ip, "-5");
      return new NextResponse("-5", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // 鈶?鏌ュ崱瀵?
    const { data: card } = await supabase
      .from("cards")
      .select("*")
      .eq("card_no", Card)
      .single();

    if (!card) {
      await log(Softid, Card, Mac, Version, ip, "-11");
      return new NextResponse("-11", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (card.softid !== Softid) {
      await log(Softid, Card, Mac, Version, ip, "-11");
      return new NextResponse("-11", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    if (card.status === 3) {
      await log(Softid, Card, Mac, Version, ip, "-4");
      return new NextResponse("-4", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // -1 杩囨湡
    if (new Date(card.expire_time) < new Date()) {
      await supabase.from("cards").update({ status: 2 }).eq("id", card.id);
      await log(Softid, Card, Mac, Version, ip, "-1");
      return new NextResponse("-1", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // 鈶?鏈哄櫒鐮佹牎楠?
    const bindMode = software.machine_bind;
    if (bindMode > 0) {
      if (!card.bind_mac) {
        // 棣栨缁戝畾
        if (card.bind_count >= card.max_bind) {
          await log(Softid, Card, Mac, Version, ip, "-7");
          return new NextResponse("-7", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        await supabase
          .from("cards")
          .update({ bind_mac: Mac, bind_count: card.bind_count + 1 })
          .eq("id", card.id);
      } else {
        // 宸茬粦瀹氾紝鏍￠獙
        if (card.bind_mac !== Mac) {
          await log(Softid, Card, Mac, Version, ip, "-3");
          return new NextResponse("-3", { status: 200, headers: { "Content-Type": "text/plain" } });
        }
      }
    }

    // 鈶?鐗堟湰妫€鏌?
    if (software.version_min && Version < software.version_min) {
      await log(Softid, Card, Mac, Version, ip, "-6");
      return new NextResponse("-6", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    // 鈶?鍦ㄧ嚎鏁版鏌?
    if (software.max_online > 0) {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from("online_sessions")
        .select("*", { count: "exact", head: true })
        .eq("card_id", card.id)
        .gte("expire_at", now);

      if ((count || 0) >= software.max_online) {
        await log(Softid, Card, Mac, Version, ip, "-8");
        return new NextResponse("-8", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
    }

    // 鈶?鍏ㄩ儴閫氳繃 鉁?
    const token = generateToken();
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 鍐欏叆鍦ㄧ嚎浼氳瘽
    await supabase.from("online_sessions").insert({
      card_id: card.id,
      token,
      mac: Mac,
      ip,
      expire_at: expireAt,
    });

    // 鏇存柊鍗″瘑鐘舵€?
    const updates: Record<string, unknown> = { status: 1 };
    if (!card.used_at) updates.used_at = new Date().toISOString();
    await supabase.from("cards").update(updates).eq("id", card.id);

    // 璁板綍鏃ュ織
    await log(Softid, Card, Mac, Version, ip, "success", token);

    return new NextResponse(token, { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    console.error("verify error:", e);
    return new NextResponse("-99", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
}

async function log(
  softid: string, cardNo: string, mac: string,
  version: string, ip: string, result: string, token = ""
) {
  try {
    await supabase.from("auth_logs").insert({
      softid: softid || "unknown",
      card_no: cardNo || "unknown",
      mac: mac || "unknown",
      version: version || "unknown",
      ip,
      result,
      token,
    });
  } catch {}
}

// 澶勭悊 OPTIONS锛圕ORS锛?
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
