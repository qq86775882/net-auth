"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { Plus, Download, Ban, Search } from "lucide-react";

interface Software { id: number; name: string; softid: string; }
interface Card {
  id: number; softid: string; card_no: string; card_type: number;
  expire_time: string; status: number; bind_mac: string;
  bind_count: number; max_bind: number; used_at: string | null;
  note: string; created_at: string;
}

const TYPE_LABELS = ["", "Day", "Week", "Month", "Season", "Year", "", "", "", "Forever"];
const STATUS_LABELS = ["Unused", "Used", "Expired", "Disabled"];

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterSoftid, setFilterSoftid] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [createSoftid, setCreateSoftid] = useState("");
  const [createType, setCreateType] = useState(1);
  const [createCount, setCreateCount] = useState(1);
  const [createPrefix, setCreatePrefix] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [msg, setMsg] = useState("");

  const fetchCards = async () => {
    let q = supabase.from("cards").select("*").order("created_at", { ascending: false }).limit(200);
    if (filterSoftid) q = q.eq("softid", filterSoftid);
    if (filterStatus) q = q.eq("status", Number(filterStatus));
    if (searchKeyword) q = q.ilike("card_no", "%" + searchKeyword + "%");
    const { data } = await q;
    setCards(data || []);
  };

  const fetchSoftwares = async () => {
    const { data } = await supabase.from("softwares").select("id, name, softid").eq("status", 1);
    setSoftwares(data || []);
  };

  useEffect(() => { fetchSoftwares(); }, []);
  useEffect(() => { fetchCards(); }, [filterSoftid, filterStatus, searchKeyword]);

  const genCardNo = (prefix: string) => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    let sum = 0;
    for (const c of prefix + rand) sum += c.charCodeAt(0);
    const check = Math.abs(sum).toString(16).toUpperCase().slice(-6);
    return prefix ? prefix + "-" + rand + "-" + check : rand + "-" + check;
  };

  const calcExpire = (type: number) => {
    const now = new Date();
    const days = [0, 1, 7, 30, 90, 365, 0, 0, 0, 0];
    if (type === 9) return "2099-12-31T23:59:59";
    now.setDate(now.getDate() + (days[type] || 1));
    return now.toISOString();
  };

  const handleBatchCreate = async () => {
    if (!createSoftid) return;
    setMsg("Generating...");
    const rows = [];
    for (let i = 0; i < createCount; i++) {
      rows.push({
        softid: createSoftid, card_no: genCardNo(createPrefix),
        card_type: createType, expire_time: calcExpire(createType), note: createNote,
      });
    }
    const { error } = await supabase.from("cards").insert(rows);
    if (error) { setMsg("Error: " + error.message); return; }
    setMsg("Created " + createCount + " cards!");
    setShowCreate(false); setCreateCount(1); fetchCards();
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
    a.href = url; a.download = "cards-" + Date.now() + ".txt"; a.click();
  };

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Card Management</h2>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg text-slate-600 hover:bg-slate-50">
                <Download size={14} /> Export
              </button>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                <Plus size={14} /> Generate
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={filterSoftid} onChange={(e) => setFilterSoftid(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">All Software</option>
              {softwares.map((s) => <option key={s.softid} value={s.softid}>{s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">All Status</option>
              <option value="0">Unused</option><option value="1">Used</option>
              <option value="2">Expired</option><option value="3">Disabled</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search card..." value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-3 py-1.5 border rounded-lg text-sm w-48" />
            </div>
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">Generate Cards</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-600">Software *</label>
                    <select value={createSoftid} onChange={(e) => setCreateSoftid(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1">
                      <option value="">Select</option>
                      {softwares.map((s) => <option key={s.softid} value={s.softid}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Type</label>
                    <select value={createType} onChange={(e) => setCreateType(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1">
                      <option value={1}>Day (1d)</option><option value={2}>Week (7d)</option>
                      <option value={3}>Month (30d)</option><option value={4}>Season (90d)</option>
                      <option value={5}>Year (365d)</option><option value={9}>Forever</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Count</label>
                    <input type="number" min={1} max={500} value={createCount}
                      onChange={(e) => setCreateCount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Prefix (optional)</label>
                    <input value={createPrefix} onChange={(e) => setCreatePrefix(e.target.value.toUpperCase())}
                      className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="e.g. MYAPP" maxLength={6} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Note</label>
                    <input value={createNote} onChange={(e) => setCreateNote(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="e.g. Sold to John" />
                  </div>
                </div>
                {msg && <p className="text-sm text-blue-600 mt-2">{msg}</p>}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded-lg text-slate-600">Cancel</button>
                  <button onClick={handleBatchCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                    Generate {createCount}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3">Card</th><th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bind</th><th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.card_no}</td>
                    <td className="px-4 py-3">{TYPE_LABELS[c.card_type] || "-"}</td>
                    <td className="px-4 py-3 text-xs">{new Date(c.expire_time).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100">{STATUS_LABELS[c.status]}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{c.bind_mac ? c.bind_count + "/" + c.max_bind : "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{c.note || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {c.status !== 3 && (
                        <button onClick={() => handleDisable(c.id)} className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">
                          <Ban size={12} /> Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {cards.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">No cards yet</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
