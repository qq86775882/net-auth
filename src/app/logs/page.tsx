"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

interface Log {
  id: number;
  softid: string;
  card_no: string;
  mac: string;
  version: string;
  ip: string;
  result: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filterResult, setFilterResult] = useState("");

  const fetchLogs = async () => {
    let q = supabase.from("auth_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (filterResult) q = q.eq("result", filterResult);
    const { data } = await q;
    setLogs(data || []);
  };

  useEffect(() => { fetchLogs(); }, [filterResult]);

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">馃搵 楠岃瘉鏃ュ織</h2>
            <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">鍏ㄩ儴缁撴灉</option>
              <option value="success">鎴愬姛</option>
              <option value="-1">杩囨湡</option>
              <option value="-11">鍗″瘑涓嶅瓨鍦?/option>
              <option value="-3">鏈哄櫒鐮佷笉鍖归厤</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3">鏃堕棿</th>
                  <th className="px-4 py-3">杞欢ID</th>
                  <th className="px-4 py-3">鍗″瘑</th>
                  <th className="px-4 py-3">鏈哄櫒鐮?/th>
                  <th className="px-4 py-3">鐗堟湰</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">缁撴灉</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs">
                      {new Date(l.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{l.softid}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.card_no.slice(0, 12)}...</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.mac.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-xs">{l.version}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{l.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        l.result === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {l.result === "success" ? "鎴愬姛" : l.result}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">鏆傛棤鏃ュ織</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
