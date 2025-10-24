"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

type Props = {
  bloggerId: number | undefined;
  bloggers: Array<{ id: number; name: string }>;
  year: number;
  month: number; // 0-based (JS month index)
};

export default function AutoPlanButton({ bloggerId, bloggers, year, month }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [contentType, setContentType] = useState<"video" | "post">("video");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAutoPlan = () => {
    const targetBloggerId = bloggerId || bloggers[0]?.id;
    if (!targetBloggerId) return;

    startTransition(async () => {
      await api.tasks.autoPlan(targetBloggerId, year, month + 1, contentType);
      setShowModal(false);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="pill">
        Автоплан
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-soft)] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Настройки автоплана</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Тип контента</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContentType("video")}
                    className={`p-4 rounded-xl border-2 transition ${
                      contentType === "video"
                        ? "border-lime-400 bg-lime-400/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">🎥</div>
                    <div className="font-medium">Видео</div>
                    <div className="text-xs text-gray-400 mt-1">Reels, shorts, видеоконтент</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setContentType("post")}
                    className={`p-4 rounded-xl border-2 transition ${
                      contentType === "post"
                        ? "border-lime-400 bg-lime-400/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">📝</div>
                    <div className="font-medium">Посты</div>
                    <div className="text-xs text-gray-400 mt-1">Статичные кадры, карусели</div>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-400 bg-white/5 p-3 rounded-lg">
                💡 Автоплан сгенерирует задачи на каждый день месяца для выбранного типа контента
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoPlan}
                disabled={pending}
                className="pill flex-1"
              >
                {pending ? "Планирование..." : "Создать план"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={pending}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
