"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { Plus, Trash2, Edit3 } from "lucide-react";

interface Software {
  id: number;
  name: string;
  softid: string;
  status: number;
  version_min: string;
  machine_bind: number;
  max_online: number;
  created_at: string;
}

export default function SoftwarePage() {
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [versionMin, setVersionMin] = useState("");
  const [machineBind, setMachineBind] = useState(1);
  const [maxOnline, setMaxOnline] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchSoftwares = async () => {
    const { data } = await supabase
      .from("softwares")
      .select("*")
      .order("created_at", { ascending: false });
    setSoftwares(data || []);
  };

  useEffect(() => { fetchSoftwares(); }, []);

  const generateSoftid = (name: string) => {
    const raw = name + Date.now() + Math.random().toString(36).slice(2);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const chr = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, "0").slice(0, 16);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const softid = generateSoftid(name);
    await supabase.from("softwares").insert({
      name: name.trim(),
      softid,
      version_min: versionMin,
      machine_bind: machineBind,
      max_online: maxOnline,
    });
    setName("");
    setVersionMin("");
    setMachineBind(1);
    setMaxOnline(0);
    setShowCreate(false);
    fetchSoftwares();
  };

  const handleEdit = async () => {
    if (!editId || !name.trim()) return;
    await supabase
      .from("softwares")
      .update({ name: name.trim(), version_min: versionMin, machine_bind: machineBind, max_online: maxOnline })
      .eq("id", editId);
    setEditId(null);
    setName("");
    setVersionMin("");
    setMachineBind(1);
    setMaxOnline(0);
    fetchSoftwares();
  };

  const handleToggle = async (id: number, status: number) => {
    await supabase.from("softwares").update({ status: status === 1 ? 0 : 1 }).eq("id", id);
    fetchSoftwares();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("纭畾鍒犻櫎锛熷叧鑱旂殑鍗″瘑涔熶細琚垹闄ゃ€?)) return;
    await supabase.from("softwares").delete().eq("id", id);
    fetchSoftwares();
  };

  const startEdit = (s: Software) => {
    setEditId(s.id);
    setName(s.name);
    setVersionMin(s.version_min);
    setMachineBind(s.machine_bind);
    setMaxOnline(s.max_online);
    setShowCreate(true);
  };

  const bindLabels = ["涓嶇粦瀹?, "棣栨缁戝畾", "姣忔鏍￠獙"];

  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">馃摝 杞欢绠＄悊</h2>
            <button
              onClick={() => { setShowCreate(true); setEditId(null); setName(""); setVersionMin(""); setMachineBind(1); setMaxOnline(0); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
            >
              <Plus size={16} /> 鍒涘缓杞欢
            </button>
          </div>

          {/* 鍒涘缓/缂栬緫寮圭獥 */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">
                  {editId ? "缂栬緫杞欢" : "鍒涘缓杞欢"}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-600">杞欢鍚嶇О *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                      placeholder="渚嬪锛氭垜鐨勫皬宸ュ叿"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鏈€浣庣増鏈彿</label>
                    <input
                      value={versionMin}
                      onChange={(e) => setVersionMin(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                      placeholder="鐣欑┖涓嶉檺鍒?
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鏈哄櫒鐮佺粦瀹氭ā寮?/label>
                    <select
                      value={machineBind}
                      onChange={(e) => setMachineBind(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    >
                      {bindLabels.map((l, i) => (
                        <option key={i} value={i}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">鏈€澶у湪绾挎暟锛?=涓嶉檺锛?/label>
                    <input
                      type="number"
                      value={maxOnline}
                      onChange={(e) => setMaxOnline(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-sm border rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    鍙栨秷
                  </button>
                  <button
                    onClick={editId ? handleEdit : handleCreate}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                  >
                    {editId ? "淇濆瓨" : "鍒涘缓"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 杞欢鍒楄〃 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3">杞欢鍚嶇О</th>
                  <th className="px-4 py-3">杞欢鏍囪瘑 (Softid)</th>
                  <th className="px-4 py-3">缁戝畾妯″紡</th>
                  <th className="px-4 py-3">鏈€浣庣増鏈?/th>
                  <th className="px-4 py-3">鏈€澶у湪绾?/th>
                  <th className="px-4 py-3">鐘舵€?/th>
                  <th className="px-4 py-3">鍒涘缓鏃堕棿</th>
                  <th className="px-4 py-3">鎿嶄綔</th>
                </tr>
              </thead>
              <tbody>
                {softwares.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{s.softid}</td>
                    <td className="px-4 py-3">{bindLabels[s.machine_bind]}</td>
                    <td className="px-4 py-3">{s.version_min || "-"}</td>
                    <td className="px-4 py-3">{s.max_online || "涓嶉檺"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(s.id, s.status)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.status === 1 ? "鍚敤" : "绂佺敤"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-blue-100 rounded text-blue-600">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {softwares.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      鏆傛棤杞欢锛岀偣鍑?鍒涘缓杞欢"寮€濮?
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
