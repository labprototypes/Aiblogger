"use client";
import { useEffect, useState } from "react";
import { api, Task } from "../../../lib/api";

export default function TaskLive({ id }: { id: number }) {
  const [task, setTask] = useState<Task | null>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let stop = false;
    let timer: any;
    async function tick() {
      try {
        const t = await api.tasks.get(id);
        if (stop) return;
        setTask(t);
      } finally {
        if (!stop && running) timer = setTimeout(tick, 3000);
      }
    }
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, running]);

  if (!task) return (
    <div className="text-xs text-gray-500">Live: загрузка… <button className="underline" onClick={() => setRunning((v) => !v)}>{running ? "стоп" : "старт"}</button></div>
  );

  const isImage = task.preview_url && /(\.png|\.jpg|\.jpeg|\.webp|placehold\.co)/i.test(task.preview_url);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>Live статус: <span className="text-gray-200">{task.status}</span></span>
        <button className="pill text-xs" onClick={() => setRunning((v) => !v)}>{running ? "Пауза" : "Старт"}</button>
      </div>
      {task.preview_url && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Превью</div>
          {isImage ? (
            <img src={task.preview_url!} alt="preview" className="rounded border border-white/10 max-h-72" />
          ) : (
            <a className="text-lime-400 hover:text-lime-300" href={task.preview_url!} target="_blank">Открыть превью</a>
          )}
        </div>
      )}
    </div>
  );
}
