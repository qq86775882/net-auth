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
    if (!oldPw || !newPw) { setMsg("请填写完整"); return; }
    if (newPw.length < 6) { setMsg("新密码至少6位"); return; }

    const { data: user } = await supabase.from("admin_users").select("id").eq("username", "admin").single();
    if (!user) { setMsg("用户不存在"); return; }

    const { data: ok } = await supabase.rpc("verify_admin_password", {
      input_username: "admin",
      input_password: oldPw,
    });
    if (!ok) { setMsg("原密码错误"); return; }

    const { error } = await supabase.rpc("update_admin_password", {
      input_username: "admin",
      input_password: newPw,
    });
    if (error) { setMsg("修改失败: " + error.message); return; }
    setMsg("✅ 密码修改成功");
    setOldPw("");
    setNewPw("");
  };

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">⚙️ 系统设置</h2>

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
            <h3 className="font-semibold text-slate-700 mb-4">🔑 修改管理员密码</h3>
            <div className="space-y-3">
              <input type="password" placeholder="原密码" value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
              <input type="password" placeholder="新密码（至少6位）" value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
              {msg && <p className={`text-sm ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
              <button onClick={changePassword}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm">
                修改密码
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mt-4">
            <h3 className="font-semibold text-slate-700 mb-2">📝 API 接口说明</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/verify</code> — 卡密验证</p>
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/heartbeat</code> — 心跳保活</p>
              <p><code className="bg-slate-100 px-1 rounded">POST /api/v1/logout</code> — 退出登录</p>
              <p className="mt-2 text-xs text-slate-400">
                详细文档见 <code className="bg-slate-100 px-1 rounded">docs/network-auth-system.md</code>
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
