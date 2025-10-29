"use client";
import { useState } from "react";
import { API_BASE } from "../../../lib/api";

type Shot = {
  id: string;
  prompt: string;
  image_url: string;
};

type Props = {
  bloggerId: number;
  faceImage: string;
  locations: Shot[];
  onShotsChange: (locations: Shot[]) => void;
};

export default function PodcasterShotsManager({
  bloggerId,
  faceImage,
  locations,
  onShotsChange,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!faceImage) {
      alert("Сначала создайте лицо подкастера");
      return;
    }

    if (!prompt.trim()) {
      alert("Введите описание ракурса");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/bloggers/${bloggerId}/locations/generate-with-face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_image: faceImage, prompt }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const newShot: Shot = {
        id: `loc_${Date.now()}`,
        prompt,
        image_url: data.image_url,
      };

      onShotsChange([...locations, newShot]);
      setPrompt("");
    } catch (e) {
      console.error("Failed to generate location:", e);
      alert("Ошибка генерации ракурса");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    onShotsChange(locations.filter((loc) => loc.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      {!faceImage && (
        <div className="card p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="text-yellow-400 text-sm">
            ⚠️ Сначала создайте лицо подкастера во вкладке &quot;Персонаж&quot;
          </div>
        </div>
      )}

      {faceImage && (
        <div className="card p-4 bg-blue-500/10 border-blue-500/30">
          <div className="text-blue-300 text-sm">
            💡 Seedream в режиме edit использует лицо как референс и генерирует полное тело в ракурса
          </div>
        </div>
      )}

      {/* Generator */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Добавить ракурсю</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Описание ракурса</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Например: стоит в современной студии с неоновой подсветкой, на фоне книжные полки, повседневная одежда, профессиональная съемка"
            disabled={!faceImage}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim() || !faceImage}
          className="btn btn-primary disabled:opacity-50"
        >
          {generating ? "Генерация..." : "🎨 Сгенерировать ракурсю"}
        </button>
      </div>

      {/* Shots grid */}
      {locations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            ракурса ({locations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div key={location.id} className="card p-3 space-y-2">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  <img
                    src={location.image_url}
                    alt="Shot"
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-sm text-gray-400 line-clamp-2">{location.prompt}</p>

                <button
                  onClick={() => handleDelete(location.id)}
                  className="btn btn-sm w-full text-red-400 hover:bg-red-500/10"
                >
                  🗑 Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {locations.length === 0 && faceImage && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🏢</div>
          <div>ракурсй пока нет. Создайте первую!</div>
        </div>
      )}
    </div>
  );
}
