"use client";
import { useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

type Props = {
  bloggerId: number;
  faceImage: string;
  facePrompt: string;
  onFaceChange: (image: string, prompt: string) => void;
};

export default function FaceEditor({ bloggerId, faceImage, facePrompt, onFaceChange }: Props) {
  const [mode, setMode] = useState<"upload" | "generate">(faceImage && !facePrompt ? "upload" : "generate");
  const [prompt, setPrompt] = useState(facePrompt);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Введите описание лица");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/face/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      setGeneratedImage(data.image_url);
    } catch (e) {
      console.error("Failed to generate face:", e);
      alert("Ошибка генерации лица");
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedImage) {
      onFaceChange(generatedImage, prompt);
      setGeneratedImage(null);
    }
  };

  const handleUpload = (url: string | string[]) => {
    const imageUrl = Array.isArray(url) ? url[0] : url;
    onFaceChange(imageUrl, "");
  };

  return (
    <div className="card p-6 space-y-4">
      <h3 className="text-lg font-semibold">Лицо подкастера</h3>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("generate")}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
            mode === "generate"
              ? "border-lime-400 bg-lime-400/10"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          ✨ Сгенерировать через AI
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
            mode === "upload"
              ? "border-lime-400 bg-lime-400/10"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          📤 Загрузить свое
        </button>
      </div>

      {/* Current face preview */}
      {faceImage && !generatedImage && (
        <div className="relative">
          <div className="text-sm text-gray-400 mb-2">Текущее лицо:</div>
          <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-white/5 border border-white/10">
            <img src={faceImage} alt="Face" className="w-full h-full object-cover" />
          </div>
          {facePrompt && (
            <div className="text-xs text-gray-500 mt-2">
              <strong>Промпт:</strong> {facePrompt}
            </div>
          )}
        </div>
      )}

      {/* Generate mode */}
      {mode === "generate" && !generatedImage && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Описание лица</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Например: мужчина 30 лет, короткие темные волосы, дружелюбная улыбка, умные глаза, чистое лицо, профессиональный вид"
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 Seedream v4 сгенерирует лицо в формате 1:1, 4K
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            {generating ? "Генерация..." : "🎨 Сгенерировать лицо"}
          </button>
        </div>
      )}

      {/* Generated face preview */}
      {generatedImage && (
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-400 mb-2">Сгенерированное лицо:</div>
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <img src={generatedImage} alt="Generated face" className="w-full h-full object-cover" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <strong>Промпт:</strong> {prompt}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGeneratedImage(null)}
              className="btn flex-1"
            >
              ← Перегенерировать
            </button>
            <button
              onClick={handleAccept}
              className="btn btn-primary flex-1"
            >
              ✓ Принять
            </button>
          </div>
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && !generatedImage && (
        <div>
          <ImageUpload
            value={faceImage}
            onChange={handleUpload}
            label="Загрузить фото лица (1:1)"
          />
          <div className="text-xs text-gray-500 mt-2">
            💡 Рекомендуется квадратное фото, высокое разрешение
          </div>
        </div>
      )}
    </div>
  );
}
