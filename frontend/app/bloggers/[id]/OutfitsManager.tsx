"use client";
import { useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

type Outfit = {
  name: string;
  image_url: string;
  parts?: {
    top?: string;
    bottom?: string;
    shoes?: string;
    accessories?: string;
  };
};

type Props = {
  bloggerId: number;
  outfits: Outfit[];
  onUpdate: (outfits: Outfit[]) => void;
};

export default function OutfitsManager({ bloggerId, outfits, onUpdate }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Parts from different frames
  const [topImage, setTopImage] = useState("");
  const [bottomImage, setBottomImage] = useState("");
  const [shoesImage, setShoesImage] = useState("");
  const [accessoriesImage, setAccessoriesImage] = useState("");
  
  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleGenerate = async () => {
    if (!newName.trim()) {
      alert("Введите название образа");
      return;
    }

    if (!topImage && !bottomImage && !shoesImage) {
      alert("Загрузите хотя бы одну часть образа");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/outfits/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          parts: {
            top: topImage || undefined,
            bottom: bottomImage || undefined,
            shoes: shoesImage || undefined,
            accessories: accessoriesImage || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      
      const data = await res.json();
      setGeneratedOutfit(data.image_url);
      setGeneratedPrompt(data.prompt);
    } catch (e) {
      console.error("Failed to generate:", e);
      alert("Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = () => {
    if (!generatedOutfit) return;

    const updated = [...outfits, {
      name: newName,
      image_url: generatedOutfit,
      parts: {
        top: topImage || undefined,
        bottom: bottomImage || undefined,
        shoes: shoesImage || undefined,
        accessories: accessoriesImage || undefined,
      },
    }];
    
    onUpdate(updated);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setTopImage("");
    setBottomImage("");
    setShoesImage("");
    setAccessoriesImage("");
    setGeneratedOutfit(null);
    setGeneratedPrompt("");
    setShowAddModal(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm("Удалить этот образ?")) return;
    
    const updated = outfits.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Образы ({outfits.length})</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary text-sm"
        >
          + Создать образ
        </button>
      </div>

      {/* Outfits grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {outfits.map((outfit, idx) => (
          <div key={idx} className="relative group">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <img 
                src={outfit.image_url} 
                alt={outfit.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-2 text-sm font-medium truncate">{outfit.name}</div>
            
            {/* Delete button */}
            <button
              onClick={() => handleDelete(idx)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {outfits.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8 border border-dashed border-white/20 rounded-lg">
            Нет образов. Создайте первый образ
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
            className="card p-6 max-w-3xl w-full space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Создать новый образ</h2>
            
            <p className="text-sm text-gray-400">
              Загрузите фрагменты одежды из разных кадров. SDXL соберёт их в полный образ.
            </p>

            {!generatedOutfit ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Название образа *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input"
                    placeholder="Например: Casual летний"
                  />
                </div>

                {/* Parts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">👕 Верх</label>
                    <ImageUpload
                      value={topImage}
                      onChange={(url) => setTopImage(Array.isArray(url) ? url[0] : url)}
                      label="Загрузить кадр с верхом"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">👖 Низ</label>
                    <ImageUpload
                      value={bottomImage}
                      onChange={(url) => setBottomImage(Array.isArray(url) ? url[0] : url)}
                      label="Загрузить кадр с низом"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">👟 Обувь</label>
                    <ImageUpload
                      value={shoesImage}
                      onChange={(url) => setShoesImage(Array.isArray(url) ? url[0] : url)}
                      label="Загрузить кадр с обувью"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">👜 Аксессуары</label>
                    <ImageUpload
                      value={accessoriesImage}
                      onChange={(url) => setAccessoriesImage(Array.isArray(url) ? url[0] : url)}
                      label="Загрузить кадр с аксессуарами"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-white/5 p-3 rounded-lg">
                  💡 Загрузите минимум один элемент. SDXL 4.0 сгенерирует полный образ в full-height формате.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    disabled={generating}
                    className="btn flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !newName.trim() || (!topImage && !bottomImage && !shoesImage)}
                    className="btn btn-primary flex-1 disabled:opacity-50"
                  >
                    {generating ? "Генерация..." : "Сгенерировать образ"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Сгенерированный образ: {newName}</label>
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5">
                    <img 
                      src={generatedOutfit} 
                      alt="Generated outfit" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <strong>Промпт:</strong> {generatedPrompt}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setGeneratedOutfit(null);
                      setGeneratedPrompt("");
                    }}
                    className="btn flex-1"
                  >
                    ← Перегенерировать
                  </button>
                  <button
                    onClick={handleAccept}
                    className="btn btn-primary flex-1"
                  >
                    ✓ Принять и сохранить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
