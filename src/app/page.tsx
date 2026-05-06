"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { KeyRound, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 用 Supabase 查询管理员
      const { data, error: dbError } = await supabase
        .from("admin_users")
        .select("id, username, password, status")
        .eq("username", username)
        .single();

      if (dbError || !data) {
        setError("用户名或密码错误");
        setLoading(false);
        return;
      }

      if (data.status === 0) {
        setError("账号已被禁用");
        setLoading(false);
        return;
      }

      // 用 pgcrypto 验证密码
      const { data: verifyData } = await supabase
        .rpc("verify_admin_password", { input_username: username, input_password: password });

      if (!verifyData) {
        setError("用户名或密码错误");
        setLoading(false);
        return;
      }

      // 更新最后登录
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);

      // 简单 token
      const token = btoa(`${username}:${Date.now()}`);
      localStorage.setItem("admin_token", token);
      router.replace("/dashboard");
    } catch {
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-sm border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-white">网络验证系统</h1>
          <p className="text-sm text-slate-300 mt-1">管理员登录</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="relative">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>
      </div>
    </div>
  );
}
