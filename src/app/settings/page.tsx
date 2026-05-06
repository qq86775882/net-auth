"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");

  const changePassword = async () => {
    setMsg("");
    if (!oldPw || !newPw) { setMsg("璇峰～鍐欏畬鏁?); return; }
    if (newPw.length < 6) { setMsg("鏂板瘑鐮佽嚦灏?浣?); return; }

    const { data: user } = await supabase.from("admin_users").select("id").eq("username", "admin").single();
    if (!user) { setMsg("鐢ㄦ埛涓嶅瓨鍦?); return; }

    const { data: ok } = await supabase.rpc("verify_admin_password", {
      input_username: "admin",
      input_password: oldPw,
    });
    if (!ok) { setMsg("鍘熷瘑鐮侀敊璇?); return; }

    const { error } = await supabase.rpc("update_admin_password", {
      input_username: "admin",
      input_password: newPw,
    });
    if (error) { setMsg("淇敼澶辫触: " + error.message); return; }
    setMsg("鉁?瀵嗙爜淇敼鎴愬姛");
    setOldPw("");
    setNewPw("");
  };

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">鈿欙笍 绯荤粺璁剧疆</h2>

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
            <h3 className="font-semibold text-slate-700 mb-4">馃攽 淇敼绠＄悊鍛樺瘑鐮?/h3>
            <div className="space-y-3">
              <input type="password" placeholder="鍘熷瘑鐮? value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
              <input type="password" placeholder="鏂板瘑鐮侊紙鑷冲皯6浣嶏級" value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
              {msg && <p className={`text-sm ${msg.startsWith("鉁?) ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
              <button onClick={changePassword}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm">
                淇敼瀵嗙爜
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mt-4">
            <h3 className="font-semibold text-slate-700 mb-2">馃摑 API 鎺ュ彛璇存槑</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/verify</code> 鈥?鍗″瘑楠岃瘉</p>
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/heartbeat</code> 鈥?蹇冭烦淇濇椿</p>
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/logout</code> 鈥?閫€鍑虹櫥褰?/p>
              <p className="mt-2 text-xs text-slate-400">
                璇︾粏鏂囨。瑙?<code className="bg-slate-100 px-1 rounded">docs/network-auth-system.md</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
