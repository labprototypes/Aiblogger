"use client";
import { useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

type Location = {
  title: string;
  description: string;
  thumbnail?: string;
};

type Props = {
  bloggerId?: number; // Added for inline creation
  bloggerLocations: Location[];
  selectedLocationId: number | null;
  customLocationDescription: string;
  onChange: (locationId: number | null, description: string) => void;
  onLocationCreated?: (location: Location) => void; // Callback when new location is created
};

export default function LocationSelector({ 
  bloggerId,
  bloggerLocations, 
  selectedLocationId,
  customLocationDescription,
  onChange,
  onLocationCreated,
}: Props) {
  const [mode, setMode] = useState<"preset" | "custom" | "upload">(
    selectedLocationId !== null ? "preset" : customLocationDescription ? "custom" : "preset"
  );
  const [description, setDescription] = useState(customLocationDescription);
  
  // Inline creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"upload" | "generate">("upload");
  const [newTitle, setNewTitle] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handlePresetSelect = (index: number) => {
    setMode("preset");
    onChange(index, "");
  };

  const handleCustom = () => {
    setMode("custom");
    onChange(null, description);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    onChange(null, val);
  };

  // Inline creation handlers
  const handleCreateUpload = async () => {
    if (!bloggerId || !newTitle.trim() || !newThumbnail) {
      alert("Введите название и загрузите изображение");
      return;
    }

    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: "",
          thumbnail: newThumbnail,
        }),
      });

      if (!res.ok) throw new Error("Failed to create location");
      
      const newLocation = { title: newTitle, description: "", thumbnail: newThumbnail };
      onLocationCreated?.(newLocation);
      
      // Auto-select the new location (will be last index)
      onChange(bloggerLocations.length, "");
      
      // Reset and close
      setNewTitle("");
      setNewThumbnail("");
      setShowCreateModal(false);
    } catch (e) {
      console.error("Failed to create location:", e);
      alert("Ошибка создания локации");
    }
  };

  const handleGenerate = async () => {
    if (!bloggerId || !generatePrompt.trim()) {
      alert("Введите описание локации");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/locations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt }),
      });

      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      setGeneratedImage(data.image_url);
      setGeneratedPrompt(data.prompt);
    } catch (e) {
      console.error("Failed to generate:", e);
      alert("Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptGenerated = async () => {
    if (!bloggerId || !generatedImage) return;

    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle || "Сгенерированная локация",
          description: generatedPrompt,
          thumbnail: generatedImage,
        }),
      });

      if (!res.ok) throw new Error("Failed to create location");
      
      const newLocation = {
        title: newTitle || "Сгенерированная локация",
        description: generatedPrompt,
        thumbnail: generatedImage,
      };
      onLocationCreated?.(newLocation);
      
      // Auto-select the new location
      onChange(bloggerLocations.length, "");
      
      // Reset and close
      setGeneratedImage(null);
      setGeneratePrompt("");
      setNewTitle("");
      setShowCreateModal(false);
    } catch (e) {
      console.error("Failed to create location:", e);
      alert("Ошибка создания локации");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("preset")}
          className={`pill text-sm ${mode === "preset" ? "bg-lime-400 text-black" : ""}`}
        >
          📍 Готовые локации
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`pill text-sm ${mode === "custom" ? "bg-lime-400 text-black" : ""}`}
        >
          ✏️ Описать текстом
        </button>
        {bloggerId && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="pill text-sm bg-lime-400/20 text-lime-400 hover:bg-lime-400/30"
          >
            ➕ Создать новую
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`pill text-sm ${mode === "upload" ? "bg-lime-400 text-black" : ""}`}
        >
          📤 Загрузить новую
        </button>
      </div>

      {mode === "preset" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bloggerLocations.length === 0 ? (
            <div className="col-span-full text-gray-400 text-sm p-4 border border-dashed border-white/20 rounded-lg text-center">
              У блогера нет загруженных локаций. Используйте "Описать текстом" или "Загрузить новую"
            </div>
          ) : (
            bloggerLocations.map((location, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(idx)}
                className={`relative rounded-lg overflow-hidden border-2 transition ${
                  selectedLocationId === idx
                    ? "border-lime-400 ring-2 ring-lime-400/50"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {location.thumbnail ? (
                  <img src={location.thumbnail} alt={location.title} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                    <span className="text-4xl">📍</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="text-xs font-medium text-white">{location.title || `Локация ${idx + 1}`}</div>
                </div>
                {selectedLocationId === idx && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {mode === "custom" && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">Опишите локацию для генерации</label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="input min-h-[100px]"
            placeholder="Например: Современная студия с белым фоном и минималистичным интерьером, мягкий дневной свет..."
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 ChatGPT сгенерирует изображение с учётом вашего описания
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div>
          <ImageUpload
            label="Загрузите референс локации"
            value=""
            onChange={(url) => {
              // TODO: Handle image upload and reference
              console.log("Uploaded:", url);
            }}
            multiple={false}
          />
          <div className="text-xs text-gray-500 mt-2">
            💡 Загруженное изображение будет использовано как референс для генерации
          </div>
        </div>
      )}

      {/* Inline creation modal */}
      {showCreateModal && bloggerId && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !generating && setShowCreateModal(false)}
        >
          <div 
            className="card p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Создать новую локацию</h2>

            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setCreateMode("upload")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  createMode === "upload"
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                📤 Загрузить изображение
              </button>
              <button
                onClick={() => setCreateMode("generate")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  createMode === "generate"
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                ✨ Сгенерировать через AI
              </button>
            </div>

            {/* Upload mode */}
            {createMode === "upload" && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Название локации</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="input"
                    placeholder="Например: Центр города"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Изображение локации</label>
                  <ImageUpload
                    value={newThumbnail}
                    onChange={(url) => setNewThumbnail(Array.isArray(url) ? url[0] : url)}
                    label="Загрузить фото локации"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateUpload}
                    disabled={!newTitle.trim() || !newThumbnail}
                    className="btn btn-primary flex-1 disabled:opacity-50"
                  >
                    Создать
                  </button>
                </div>
              </>
            )}

            {/* Generate mode */}
            {createMode === "generate" && (
              <>
                {!generatedImage ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Название локации (опционально)</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="input"
                        placeholder="Будет использовано после генерации"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Опишите локацию для генерации</label>
                      <textarea
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        className="input min-h-[100px]"
                        placeholder="Например: Современная студия с белым фоном и минималистичным интерьером, мягкий дневной свет..."
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        💡 AI сгенерирует изображение локации на основе вашего описания
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        disabled={generating}
                        className="btn flex-1"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={generating || !generatePrompt.trim()}
                        className="btn btn-primary flex-1 disabled:opacity-50"
                      >
                        {generating ? "Генерация..." : "Сгенерировать"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Сгенерированная локация</label>
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="w-full rounded-lg"
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>Промпт:</strong> {generatedPrompt}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setGeneratedImage(null);
                          setGeneratedPrompt("");
                        }}
                        className="btn flex-1"
                      >
                        ← Перегенерировать
                      </button>
                      <button
                        onClick={handleAcceptGenerated}
                        className="btn btn-primary flex-1"
                      >
                        ✓ Создать
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
