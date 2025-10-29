"use client";
import { useState, useTransition } from "react";
import ImageUpload from "../../../components/ImageUpload";

type Location = {
  title: string;
  description: string;
  thumbnail?: string;
};

type Props = {
  bloggerId: number;
  locations: Location[];
  onUpdate: (locations: Location[]) => void;
};

export default function LocationsManager({ bloggerId, locations, onUpdate }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<"upload" | "generate">("upload");
  
  // Upload mode
  const [newTitle, setNewTitle] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  
  // Generate mode
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  
  const [pending, startTransition] = useTransition();

  const handleAddUpload = () => {
    if (!newTitle.trim() || !newThumbnail) {
      alert("Введите название и загрузите изображение");
      return;
    }

    const updated = [...locations, {
      title: newTitle,
      description: "",
      thumbnail: newThumbnail,
    }];
    
    onUpdate(updated);
    setNewTitle("");
    setNewThumbnail("");
    setShowAddModal(false);
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
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

  const handleAcceptGenerated = () => {
    if (!generatedImage) return;

    const updated = [...locations, {
      title: newTitle || "Сгенерированная локация",
      description: generatedPrompt,
      thumbnail: generatedImage,
    }];
    
    onUpdate(updated);
    setGeneratedImage(null);
    setGeneratePrompt("");
    setNewTitle("");
    setShowAddModal(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm("Удалить эту локацию?")) return;
    
    const updated = locations.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Локации ({locations.length})</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary text-sm"
        >
          + Добавить локацию
        </button>
      </div>

      {/* Locations grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {locations.map((location, idx) => (
          <div key={idx} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
              {location.thumbnail ? (
                <img 
                  src={location.thumbnail} 
                  alt={location.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  📍
                </div>
              )}
            </div>
            <div className="mt-2 text-sm font-medium truncate">{location.title}</div>
            {location.description && (
              <div className="text-xs text-gray-400 line-clamp-2">{location.description}</div>
            )}
            
            {/* Delete button */}
            <button
              onClick={() => handleDelete(idx)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {locations.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8 border border-dashed border-white/20 rounded-lg">
            Нет локаций. Добавьте первую локацию
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !generating && setShowAddModal(false)}
        >
          <div 
            className="card p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Добавить локацию</h2>

            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode("upload")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  addMode === "upload"
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                📤 Загрузить изображение
              </button>
              <button
                onClick={() => setAddMode("generate")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  addMode === "generate"
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                ✨ Сгенерировать через AI
              </button>
            </div>

            {/* Upload mode */}
            {addMode === "upload" && (
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
                    onClick={() => setShowAddModal(false)}
                    className="btn flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddUpload}
                    disabled={!newTitle.trim() || !newThumbnail}
                    className="btn btn-primary flex-1 disabled:opacity-50"
                  >
                    Добавить
                  </button>
                </div>
              </>
            )}

            {/* Generate mode */}
            {addMode === "generate" && (
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
                        💡 SDXL 4.0 сгенерирует изображение локации на основе вашего описания
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddModal(false)}
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
                        ✓ Принять
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
