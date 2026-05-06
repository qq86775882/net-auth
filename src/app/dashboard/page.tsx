"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { TrendingUp, CheckCircle, Users, Ticket } from "lucide-react";

interface Stats {
  todayCount: number;
  successRate: string;
  onlineUsers: number;
  totalCards: number;
  recentLogs: Array<{
    id: number;
    card_no: string;
    mac: string;
    result: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayCount: 0,
    successRate: "0",
    onlineUsers: 0,
    totalCards: 0,
    recentLogs: [],
  });

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];

      // 今日验证次数
      const { count: todayCount } = await supabase
        .from("auth_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // 今日成功次数
      const { count: successCount } = await supabase
        .from("auth_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today)
        .eq("result", "success");

      // 在线用户
      const { count: onlineUsers } = await supabase
        .from("online_sessions")
        .select("*", { count: "exact", head: true })
        .gte("expire_at", new Date().toISOString());

      // 总卡密数
      const { count: totalCards } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true });

      // 最近10条日志
      const { data: recentLogs } = await supabase
        .from("auth_logs")
        .select("id, card_no, mac, result, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      const rate = todayCount && todayCount > 0
        ? ((successCount || 0) / todayCount * 100).toFixed(1)
        : "0";

      setStats({
        todayCount: todayCount || 0,
        successRate: rate,
        onlineUsers: onlineUsers || 0,
        totalCards: totalCards || 0,
        recentLogs: recentLogs || [],
      });
    })();
  }, []);

  const cards = [
    { label: "今日验证", value: stats.todayCount, icon: TrendingUp, color: "blue" },
    { label: "成功率", value: stats.successRate + "%", icon: CheckCircle, color: "green" },
    { label: "在线用户", value: stats.onlineUsers, icon: Users, color: "purple" },
    { label: "总卡密数", value: stats.totalCards, icon: Ticket, color: "orange" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">📊 仪表盘</h2>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={`rounded-xl p-5 border ${colorMap[color]} flex items-center gap-4`}
              >
                <Icon size={32} />
                <div>
                  <p className="text-sm opacity-70">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-700 mb-3">⚡ 最近验证记录</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">时间</th>
                  <th className="pb-2">卡密</th>
                  <th className="pb-2">机器码</th>
                  <th className="pb-2">结果</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="py-2 text-slate-500">
                      {new Date(log.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {log.card_no.slice(0, 8)}...
                    </td>
                    <td className="py-2 font-mono text-xs text-slate-400">
                      {log.mac.slice(0, 8)}...
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.result === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.result === "success" ? "成功" : log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
