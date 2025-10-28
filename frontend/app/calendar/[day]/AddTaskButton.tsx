"use client";

import { useState, useTransition } from "react";
import { api } from "../../../lib/api";
import { useRouter } from "next/navigation";

type Props = {
  date: string;
  bloggerId?: number;
  bloggers: Array<{ id: number; name: string; type: string }>;
};

const CONTENT_TYPES = [
  { value: "post", label: "Пост", icon: "📝" },
  { value: "reels", label: "Reels", icon: "🎬" },
  { value: "story", label: "Story", icon: "📸" },
  { value: "short", label: "Short", icon: "▶️" },
  { value: "video", label: "Video", icon: "🎥" },
  { value: "carousel", label: "Carousel", icon: "🖼️" },
];

export default function AddTaskButton({ date, bloggerId, bloggers }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedBlogger, setSelectedBlogger] = useState(bloggerId || (bloggers.length > 0 ? bloggers[0].id : 0));
  const [selectedType, setSelectedType] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    if (!selectedBlogger || !selectedType) {
      alert("Выберите блогера и тип контента");
      return;
    }

    startTransition(async () => {
      try {
        const task = await api.tasks.create({
          blogger_id: selectedBlogger,
          date,
          content_type: selectedType,
          status: "DRAFT",
        });
        
        setShowModal(false);
        router.push(`/tasks/${task.id}`);
      } catch (e) {
        console.error("Failed to create task:", e);
        alert("Ошибка создания задачи");
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="btn btn-primary"
      >
        + Создать задачу
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !pending && setShowModal(false)}
        >
          <div 
            className="card p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Создать задачу на {new Date(date + 'T00:00').toLocaleDateString("ru-RU")}</h2>

            {/* Blogger selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Блогер
              </label>
              <select
                value={selectedBlogger}
                onChange={(e) => setSelectedBlogger(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                disabled={!!bloggerId}
              >
                {bloggers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Content type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тип контента
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setSelectedType(ct.value)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedType === ct.value
                        ? "border-lime-400 bg-lime-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-1">{ct.icon}</div>
                    <div className="text-sm font-medium">{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={pending}
                className="btn flex-1"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={pending || !selectedType}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {pending ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
