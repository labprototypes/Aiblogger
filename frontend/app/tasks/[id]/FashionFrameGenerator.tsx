"use client";
import { useState, useTransition } from "react";

type GeneratedImage = {
  url: string;
  prompt: string;
  approved: boolean;
};

type Props = {
  taskId: number;
  mainImage: GeneratedImage | null;
  additionalImages: GeneratedImage[];
  onGenerate: (type: "main" | "additional") => Promise<void>;
  onRegenerate: (imageType: string, customPrompt?: string) => Promise<void>;
  onApprove: (imageType: string) => void;
  onApproveAll: () => void;
  onEditPrompt: (imageType: string, newPrompt: string) => void;
};

export default function FashionFrameGenerator({
  taskId,
  mainImage,
  additionalImages,
  onGenerate,
  onRegenerate,
  onApprove,
  onApproveAll,
  onEditPrompt,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");

  const handleGenerateMain = () => {
    startTransition(async () => {
      await onGenerate("main");
    });
  };

  const handleGenerateAdditional = () => {
    startTransition(async () => {
      await onGenerate("additional");
    });
  };

  const handleRegenerate = (imageType: string) => {
    startTransition(async () => {
      await onRegenerate(imageType, customInstructions || undefined);
      setCustomInstructions("");
    });
  };

  const handleSavePrompt = (imageType: string) => {
    onEditPrompt(imageType, tempPrompt);
    setEditingPrompt(null);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Main Frame */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Шаг 1: Основной кадр (в полный рост)</h3>
          {mainImage?.approved && (
            <span className="text-xs bg-lime-400/20 text-lime-400 px-3 py-1 rounded-full flex items-center gap-1">
              ✓ Подтверждено
            </span>
          )}
        </div>

        {!mainImage ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-gray-400 mb-4">Сгенерируйте основной кадр на основе выбранной локации и образа</p>
            <button
              onClick={handleGenerateMain}
              disabled={pending}
              className="pill disabled:opacity-50"
            >
              {pending ? "Генерация..." : "🎬 Сгенерировать основной кадр"}
            </button>
          </div>
        ) : (
          <div>
            <div className="relative rounded-lg overflow-hidden mb-4">
              <img src={mainImage.url} alt="Main frame" className="w-full aspect-[3/4] object-cover" />
              {mainImage.approved && (
                <div className="absolute top-3 right-3 w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center text-black font-bold">
                  ✓
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Промпт</label>
                {editingPrompt === "main" ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempPrompt}
                      onChange={(e) => setTempPrompt(e.target.value)}
                      className="input min-h-[100px] font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePrompt("main")}
                        className="pill text-sm"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingPrompt(null)}
                        className="pill text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 p-3 rounded-lg font-mono text-sm text-gray-300 relative group">
                    {mainImage.prompt}
                    <button
                      onClick={() => {
                        setEditingPrompt("main");
                        setTempPrompt(mainImage.prompt);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition pill text-xs"
                    >
                      ✏️ Редактировать
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Указания для доработки (опционально)</label>
                <input
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="input"
                  placeholder="Например: сделать фон светлее, изменить позу..."
                />
              </div>

              <div className="flex gap-3">
                {!mainImage.approved && (
                  <>
                    <button
                      onClick={() => handleRegenerate("main")}
                      disabled={pending}
                      className="pill disabled:opacity-50"
                    >
                      🔄 Перегенерировать
                    </button>
                    <button
                      onClick={() => onApprove("main")}
                      className="btn btn-primary"
                    >
                      ✓ Подтвердить кадр
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Additional Frames */}
      {mainImage?.approved && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Шаг 2: Дополнительные ракурсы (3 кадра)</h3>
            
            {additionalImages.length > 0 && !additionalImages.every(img => img.approved) && (
              <button
                onClick={onApproveAll}
                disabled={pending}
                className="pill bg-lime-400 hover:bg-lime-500 text-black disabled:opacity-50"
              >
                ✓ Подтвердить все
              </button>
            )}
          </div>

          {additionalImages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-gray-400 mb-4">
                Сгенерируйте 3 дополнительных ракурса на основе подтверждённого кадра
              </p>
              <button
                onClick={handleGenerateAdditional}
                disabled={pending}
                className="pill disabled:opacity-50"
              >
                {pending ? "Генерация..." : "🎨 Сгенерировать 3 ракурса"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {additionalImages.map((img, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={img.url} alt={`Frame ${idx + 2}`} className="w-full aspect-square object-cover" />
                    {img.approved && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center text-black text-sm font-bold">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 font-mono bg-white/5 p-2 rounded">
                    Кадр {idx + 2}
                  </div>

                  {!img.approved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRegenerate(`angle${idx + 1}`)}
                        className="pill text-xs flex-1"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => onApprove(`angle${idx + 1}`)}
                        className="pill text-xs flex-1"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
