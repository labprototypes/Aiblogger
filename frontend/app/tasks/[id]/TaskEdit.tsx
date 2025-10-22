"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, Task } from "../../../lib/api";

export default function TaskEdit({ task }: { task: Task }) {
  const [idea, setIdea] = useState(task.idea || "");
  const [script, setScript] = useState(task.script || "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const saveContent = () => {
    setError(null);
    startTransition(async () => {
      try {
        await api.tasks.updateContent(task.id, { idea, script });
        router.refresh();
      } catch (e) {
        setError("Не удалось сохранить");
      }
    });
  };

  const approveScript = () => {
    setError(null);
    startTransition(async () => {
      try {
        // Согласовать = сохранить скрипт + поменять статус + подобрать мета
        await api.tasks.updateContent(task.id, { script });
        await api.tasks.updateStatus(task.id, "SCRIPT_READY");
        await api.assistant.generateMeta(task.id);
        router.refresh();
      } catch (e) {
        setError("Не удалось согласовать");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Идея</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="input min-h-[100px]"
          placeholder="Опишите идею контента..."
        />
      </div>

      {script !== null && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">Сценарий</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="input min-h-[300px] font-mono text-sm"
            placeholder="Подробный сценарий с таймкодами..."
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={saveContent}
          disabled={pending}
          className="pill"
        >
          {pending ? "Сохранение…" : "Сохранить изменения"}
        </button>

        {script && task.status !== "SCRIPT_READY" && task.status !== "VISUAL_READY" && task.status !== "APPROVED" && (
          <button
            onClick={approveScript}
            disabled={pending}
            className="btn btn-primary"
          >
            {pending ? "Обработка…" : "Согласовать сценарий"}
          </button>
        )}
      </div>
    </div>
  );
}
