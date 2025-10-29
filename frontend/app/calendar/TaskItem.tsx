"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, Task } from "../../lib/api";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-200",
  SETUP_READY: "bg-blue-700 text-blue-100",
  GENERATING: "bg-yellow-700 text-yellow-100",
  REVIEW: "bg-purple-700 text-purple-100",
  APPROVED: "bg-green-700 text-green-100",
  PUBLISHED: "bg-emerald-700 text-emerald-100",
};

function nextStatus(cur: string) {
  const order = ["DRAFT", "SETUP_READY", "GENERATING", "REVIEW", "APPROVED", "PUBLISHED"] as const;
  const i = order.indexOf(cur as any);
  return order[(i + 1) % order.length];
}

export function TaskItem({ t }: { t: Task }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const cycle = () =>
    start(async () => {
      await api.tasks.updateStatus(t.id, nextStatus(t.status));
      router.refresh();
    });
  const gen = () =>
    start(async () => {
      await api.tasks.generate(t.id);
      router.refresh();
    });
  const del = () =>
    start(async () => {
      if (!confirm("Удалить задачу?")) return;
      await api.tasks.delete(t.id);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2 opacity-100">
      <a
        href={`/tasks/${t.id}`}
        className={`text-[11px] px-2 py-1 rounded ${statusColors[t.status] || "bg-gray-700 text-gray-200"}`}
      >
        {t.content_type} — {t.status}
        {t.preview_url ? " • 🔗" : ""}
      </a>
      <button onClick={cycle} disabled={pending} className="text-[10px] text-gray-400 hover:text-white">⟳</button>
      <button onClick={gen} disabled={pending} className="text-[10px] text-purple-300 hover:text-purple-200">▶</button>
      <button onClick={del} disabled={pending} className="text-[10px] text-red-400 hover:text-red-300">✕</button>
    </div>
  );
}
