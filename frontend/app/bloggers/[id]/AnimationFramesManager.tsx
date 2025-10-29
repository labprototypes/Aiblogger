"use client";
import { useState } from "react";

type AnimationFrame = {
  id: string;
  base_location_id: string;
  prompt: string;
  image_url: string;
  emotion?: string;
};

type Location = {
  id: string;
  prompt: string;
  image_url: string;
};

type Props = {
  bloggerId: number;
  locations: Location[];
  frames: AnimationFrame[];
  onFramesChange: (frames: AnimationFrame[]) => void;
};

const EMOTION_PRESETS = [
  { emoji: "😊", label: "Радость", prompt: "счастливое выражение лица, улыбка" },
  { emoji: "😐", label: "Нейтрально", prompt: "нейтральное выражение лица, спокойствие" },
  { emoji: "🤔", label: "Задумчивость", prompt: "задумчивый взгляд, размышление" },
  { emoji: "😮", label: "Удивление", prompt: "удивленное выражение, открытый рот" },
  { emoji: "😕", label: "Озабоченность", prompt: "озабоченный вид, легкая хмурость" },
  { emoji: "😄", label: "Восторг", prompt: "восторженное выражение, широкая улыбка" },
];

export default function AnimationFramesManager({
  bloggerId,
  locations,
  frames,
  onFramesChange,
}: Props) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateFrame = async (emotion?: string, emotionPrompt?: string) => {
    if (!selectedLocationId) {
      alert("Выберите базовую локацию");
      return;
    }

    const finalPrompt = emotionPrompt || customPrompt;
    if (!finalPrompt.trim()) {
      alert("Введите описание изменения или выберите эмоцию");
      return;
    }

    setGenerating(true);
    try {
      const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);
      if (!selectedLocation) throw new Error("Location not found");

      const res = await fetch(`/api/bloggers/${bloggerId}/frames/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_image: selectedLocation.image_url,
          prompt: finalPrompt,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const newFrame: AnimationFrame = {
        id: `frame_${Date.now()}`,
        base_location_id: selectedLocationId,
        prompt: finalPrompt,
        image_url: data.image_url,
        emotion,
      };

      onFramesChange([...frames, newFrame]);
      setCustomPrompt("");
    } catch (e) {
      console.error("Failed to generate frame:", e);
      alert("Ошибка генерации кадра");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    onFramesChange(frames.filter((frame) => frame.id !== id));
  };

  const getLocationById = (id: string) => locations.find((loc) => loc.id === id);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      {locations.length === 0 && (
        <div className="card p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="text-yellow-400 text-sm">
            ⚠️ Сначала создайте локации во вкладке &quot;Локации&quot;
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div className="card p-4 bg-blue-500/10 border-blue-500/30">
          <div className="text-blue-300 text-sm">
            💡 Создайте вариации кадров с разными эмоциями для анимации и липсинка
          </div>
        </div>
      )}

      {/* Generator */}
      {locations.length > 0 && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Создать кадр для анимации</h3>

          {/* Base location selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Базовая локация</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="input"
            >
              <option value="">Выберите локацию...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.prompt.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>

          {/* Base location preview */}
          {selectedLocationId && (
            <div>
              <div className="text-sm text-gray-400 mb-2">Базовый кадр:</div>
              <div className="relative w-48 aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={getLocationById(selectedLocationId)?.image_url}
                  alt="Base location"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Emotion presets */}
          {selectedLocationId && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Быстрый выбор эмоции</label>
              <div className="grid grid-cols-3 gap-2">
                {EMOTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleGenerateFrame(preset.label, preset.prompt)}
                    disabled={generating}
                    className="btn text-sm py-2 disabled:opacity-50"
                  >
                    <span className="mr-2">{preset.emoji}</span>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom prompt */}
          {selectedLocationId && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Или свое описание изменения
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Например: смотрит в сторону, жестикулирует руками, наклоняет голову"
                disabled={generating}
              />
              <button
                onClick={() => handleGenerateFrame(undefined, customPrompt)}
                disabled={generating || !customPrompt.trim()}
                className="btn btn-primary w-full mt-2 disabled:opacity-50"
              >
                {generating ? "Генерация..." : "🎨 Сгенерировать"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Frames grid */}
      {frames.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Кадры для анимации ({frames.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {frames.map((frame) => {
              const baseLocation = getLocationById(frame.base_location_id);
              return (
                <div key={frame.id} className="card p-3 space-y-2">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={frame.image_url}
                      alt="Frame"
                      className="w-full h-full object-cover"
                    />
                    {frame.emotion && (
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                        {EMOTION_PRESETS.find((p) => p.label === frame.emotion)?.emoji}{" "}
                        {frame.emotion}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <strong>База:</strong> {baseLocation?.prompt.slice(0, 30)}...
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2">{frame.prompt}</p>

                  <button
                    onClick={() => handleDelete(frame.id)}
                    className="btn btn-sm w-full text-red-400 hover:bg-red-500/10"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {frames.length === 0 && locations.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🎬</div>
          <div>Кадров пока нет. Создайте первый!</div>
        </div>
      )}
    </div>
  );
}
