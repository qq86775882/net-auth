"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { Plus, Download, Ban, Search } from "lucide-react";

interface Software { id: number; name: string; softid: string; }
interface Card {
  id: number;
  softid: string;
  card_no: string;
  card_type: number;
  expire_time: string;
  status: number;
  bind_mac: string;
  bind_count: number;
  max_bind: number;
  used_at: string | null;
  note: string;
  created_at: string;
}

const TYPE_LABELS = ["", "澶╁崱", "鍛ㄥ崱", "鏈堝崱", "瀛ｅ崱", "骞村崱", "", "", "", "姘镐箙"];
const STATUS_LABELS = ["鏈娇鐢?, "宸蹭娇鐢?, "宸茶繃鏈?, "宸茬鐢?];
const STATUS_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-700",
  "bg-gray-100 text-gray-600",
];

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterSoftid, setFilterSoftid] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 鍒涘缓鍙傛暟
  const [createSoftid, setCreateSoftid] = useState("");
  const [createType, setCreateType] = useState(1);
  const [createCount, setCreateCount] = useState(1);
  const [createPrefix, setCreatePrefix] = useState("");
  const [createNote, setCreateNote] = useState("");

  const fetchCards = async () => {
    let q = supabase.from("cards").select("*").order("created_at", { ascending: false });
    if (filterSoftid) q = q.eq("softid", filterSoftid);
    if (filterStatus) q = q.eq("status", Number(filterStatus));
    if (searchKeyword) q = q.ilike("card_no", `%${searchKeyword}%`);
    const { data } = await q.limit(200);
    setCards(data || []);
  };

  const fetchSoftwares = async () => {
    const { data } = await supabase.from("softwares").select("id, name, softid").eq("status", 1);
    setSoftwares(data || []);
  };

  useEffect(() => { fetchSoftwares(); }, []);
  useEffect(() => { fetchCards(); }, [filterSoftid, filterStatus, searchKeyword]);

  const genCardNo = (prefix: string): string => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const check = Math.abs(
      (prefix + rand).split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    ).toString(16).toUpperCase().slice(-6);
    const p = prefix ? prefix + "-" : "";
    return `${p}${rand}-${check}`;
  };

  const calcExpire = (type: number): string => {
    const now = new Date();
    const days = [0, 1, 7, 30, 90, 365, 0, 0, 0, 0];
    if (type === 9) return "2099-12-31T23:59:59";
    now.setDate(now.getDate() + (days[type] || 1));
    return now.toISOString();
  };

  const handleBatchCreate = async () => {
    if (!createSoftid) return;
    const rows = [];
    for (let i = 0; i < createCount; i++) {
      rows.push({
        softid: createSoftid,
        card_no: genCardNo(createPrefix),
        card_type: createType,
        expire_time: calcExpire(createType),
        note: createNote,
      });
    }
    await supabase.from("cards").insert(rows);
    setShowCreate(false);
    setCreateCount(1);
    fetchCards();
  };

  const handleDisable = async (id: number) => {
    await supabase.from("cards").update({ status: 3 }).eq("id", id);
    fetchCards();
  };

  const handleExport = () => {
    const txt = cards.map((c) => c.card_no).join("\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cards-${Date.now()}.txt`;
    a.click();
  };

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">馃帿 鍗″瘑绠＄悊</h2>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg text-slate-600 hover:bg-slate-50">
                <Download size={14} /> 瀵煎嚭
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                <Plus size={14} /> 鎵归噺鐢熸垚
              </button>
            </div>
          </div>

          {/* 绛涢€夋爮 */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={filterSoftid} onChange={(e) => setFilterSoftid(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">鍏ㄩ儴杞欢</option>
              {softwares.map((s) => <option key={s.softid} value={s.softid}>{s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">鍏ㄩ儴鐘舵€?/option>
              <option value="0">鏈娇鐢?/option>
              <option value="1">宸蹭娇鐢?/option>
              <option value="2">宸茶繃鏈?/option>
              <option value="3">宸茬鐢?/option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="鎼滅储鍗″瘑..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-3 py-1.5 border rounded-lg text-sm w-48"
              />
            </div>
          </div>

          {/* 鎵归噺鐢熸垚寮圭獥 */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">馃彮 鎵归噺鐢熸垚鍗″瘑</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-600">閫夋嫨杞欢 *</label>
                    <select value={createSoftid} onChange={(e) => setCreateSoftid(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1">
                      <option value="">璇烽€夋嫨</option>
                      {softwares.map((s) => <option key={s.softid} value={s.softid}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鍗″瘑绫诲瀷</label>
                    <select value={createType} onChange={(e) => setCreateType(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 mt-1">
                      <option value={1}>澶╁崱 (1澶?</option>
                      <option value={2}>鍛ㄥ崱 (7澶?</option>
                      <option value={3}>鏈堝崱 (30澶?</option>
                      <option value={4}>瀛ｅ崱 (90澶?</option>
                      <option value={5}>骞村崱 (365澶?</option>
                      <option value={9}>姘镐箙鍗?/option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鐢熸垚鏁伴噺</label>
                    <input type="number" min={1} max={500} value={createCount}
                      onChange={(e) => setCreateCount(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鍗″瘑鍓嶇紑锛堝彲閫夛級</label>
                    <input value={createPrefix} onChange={(e) => setCreatePrefix(e.target.value.toUpperCase())}
                      className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="濡?MYAPP" maxLength={6} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">澶囨敞</label>
                    <input value={createNote} onChange={(e) => setCreateNote(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="濡傦細鍗栫粰寮犱笁" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-sm border rounded-lg text-slate-600">鍙栨秷</button>
                  <button onClick={handleBatchCreate}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                    鐢熸垚 {createCount} 寮?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 鍗″瘑鍒楄〃 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3">鍗″瘑</th>
                  <th className="px-4 py-3">绫诲瀷</th>
                  <th className="px-4 py-3">杩囨湡鏃堕棿</th>
                  <th className="px-4 py-3">鐘舵€?/th>
                  <th className="px-4 py-3">缁戝畾</th>
                  <th className="px-4 py-3">澶囨敞</th>
                  <th className="px-4 py-3">鍒涘缓鏃堕棿</th>
                  <th className="px-4 py-3">鎿嶄綔</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.card_no}</td>
                    <td className="px-4 py-3">{TYPE_LABELS[c.card_type] || "-"}</td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(c.expire_time).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.bind_mac ? `${c.bind_count}/${c.max_bind}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{c.note || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {c.status !== 3 && (
                        <button onClick={() => handleDisable(c.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">
                          <Ban size={12} /> 绂佺敤
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {cards.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">鏆傛棤鍗″瘑</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
