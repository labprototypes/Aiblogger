"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function Controls() {
  const router = useRouter();
  const [auto, setAuto] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [auto, router]);

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        className="pill"
        onClick={() => start(() => router.refresh())}
        disabled={pending}
      >{pending ? "Обновление…" : "Обновить"}</button>
      <label className="flex items-center gap-2 text-gray-400">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        Автообновление
      </label>
    </div>
  );
}
