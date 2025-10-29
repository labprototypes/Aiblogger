"use client";
import { useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

type OutfitItem = {
  type: "image" | "text";
  value: string; // URL or text description
};

type Outfit = {
  top?: OutfitItem;
  bottom?: OutfitItem;
  shoes?: OutfitItem;
  socks?: OutfitItem;
  accessories?: OutfitItem;
};

type PresetOutfit = {
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
  bloggerId?: number; // Added for inline creation
  bloggerOutfits?: PresetOutfit[]; // Available preset outfits
  outfit: Outfit;
  selectedPresetId?: number | null; // Which preset is selected
  onChange: (outfit: Outfit) => void;
  onPresetSelect?: (presetId: number | null) => void; // Callback when preset is selected
  onOutfitCreated?: (outfit: PresetOutfit) => void; // Callback when new preset is created
};

const OUTFIT_ITEMS = [
  { key: "top", label: "👕 Верх", placeholder: "Описание верха (футболка, рубашка, кофта...)" },
  { key: "bottom", label: "👖 Низ", placeholder: "Описание низа (джинсы, юбка, шорты...)" },
  { key: "shoes", label: "👟 Обувь", placeholder: "Описание обуви (кроссовки, ботинки...)" },
  { key: "socks", label: "🧦 Носки", placeholder: "Описание носков (если важны)" },
  { key: "accessories", label: "👜 Аксессуары", placeholder: "Описание аксессуаров (сумка, очки, украшения...)" },
] as const;

export default function OutfitBuilder({ 
  bloggerId,
  bloggerOutfits = [],
  outfit, 
  selectedPresetId,
  onChange,
  onPresetSelect,
  onOutfitCreated,
}: Props) {
  const [mode, setMode] = useState<"preset" | "custom">(
    selectedPresetId !== null && selectedPresetId !== undefined ? "preset" : "custom"
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Inline creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [topImage, setTopImage] = useState("");
  const [bottomImage, setBottomImage] = useState("");
  const [shoesImage, setShoesImage] = useState("");
  const [accessoriesImage, setAccessoriesImage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const updateItem = (key: string, type: "image" | "text", value: string) => {
    onChange({
      ...outfit,
      [key]: value ? { type, value } : undefined,
    });
  };

  const removeItem = (key: string) => {
    const newOutfit = { ...outfit };
    delete newOutfit[key as keyof Outfit];
    onChange(newOutfit);
  };

  // Inline creation handlers
  const handleGenerateOutfit = async () => {
    if (!bloggerId || !newName.trim()) {
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
      console.error("Failed to generate outfit:", e);
      alert("Ошибка генерации образа");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptGenerated = async () => {
    if (!bloggerId || !generatedOutfit) return;

    try {
      const res = await fetch(`/api/bloggers/${bloggerId}/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          image_url: generatedOutfit,
          parts: {
            top: topImage || undefined,
            bottom: bottomImage || undefined,
            shoes: shoesImage || undefined,
            accessories: accessoriesImage || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to create outfit");
      
      const newOutfit = {
        name: newName,
        image_url: generatedOutfit,
        parts: {
          top: topImage || undefined,
          bottom: bottomImage || undefined,
          shoes: shoesImage || undefined,
          accessories: accessoriesImage || undefined,
        },
      };
      onOutfitCreated?.(newOutfit);
      
      // Auto-select the new outfit
      onPresetSelect?.(bloggerOutfits.length);
      
      // Reset and close
      resetCreateForm();
    } catch (e) {
      console.error("Failed to create outfit:", e);
      alert("Ошибка создания образа");
    }
  };

  const resetCreateForm = () => {
    setNewName("");
    setTopImage("");
    setBottomImage("");
    setShoesImage("");
    setAccessoriesImage("");
    setGeneratedOutfit(null);
    setGeneratedPrompt("");
    setShowCreateModal(false);
  };

  const handlePresetSelect = (index: number) => {
    setMode("preset");
    onPresetSelect?.(index);
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode("preset")}
          className={`pill text-sm ${mode === "preset" ? "bg-lime-400 text-black" : ""}`}
        >
          👔 Готовые образы
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("custom");
            onPresetSelect?.(null);
          }}
          className={`pill text-sm ${mode === "custom" ? "bg-lime-400 text-black" : ""}`}
        >
          ✏️ Собрать свой
        </button>
        {bloggerId && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="pill text-sm bg-lime-400/20 text-lime-400 hover:bg-lime-400/30"
          >
            ➕ Создать preset
          </button>
        )}
      </div>

      {/* Preset mode */}
      {mode === "preset" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bloggerOutfits.length === 0 ? (
            <div className="col-span-full text-gray-400 text-sm p-4 border border-dashed border-white/20 rounded-lg text-center">
              У блогера нет готовых образов. Используйте "Собрать свой" или "Создать preset"
            </div>
          ) : (
            bloggerOutfits.map((presetOutfit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(idx)}
                className={`relative rounded-lg overflow-hidden border-2 transition ${
                  selectedPresetId === idx
                    ? "border-lime-400 ring-2 ring-lime-400/50"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="aspect-[3/4] bg-white/5">
                  <img 
                    src={presetOutfit.image_url} 
                    alt={presetOutfit.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="text-xs font-medium text-white">{presetOutfit.name}</div>
                </div>
                {selectedPresetId === idx && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Custom mode */}
      {mode === "custom" && (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            💡 Заполните элементы образа или оставьте пустым — ChatGPT подберёт по трендам
          </div>

      {OUTFIT_ITEMS.map(({ key, label, placeholder }) => {
        const item = outfit[key as keyof Outfit];
        const isExpanded = expandedItem === key;

        return (
          <div
            key={key}
            className="card p-4 hover:bg-white/5 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setExpandedItem(isExpanded ? null : key)}
                className="flex items-center gap-2 text-left flex-1"
              >
                <span className="font-medium">{label}</span>
                {item && (
                  <span className="text-xs bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full">
                    {item.type === "image" ? "📷 Фото" : "✏️ Текст"}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                {item && (
                  <button
                    type="button"
                    onClick={() => removeItem(key)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    ✕ Очистить
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedItem(isExpanded ? null : key)}
                  className="text-gray-400"
                >
                  {isExpanded ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (item?.type !== "image") updateItem(key, "image", "");
                    }}
                    className={`pill text-xs ${item?.type === "image" ? "bg-lime-400 text-black" : ""}`}
                  >
                    📷 Загрузить фото
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (item?.type !== "text") updateItem(key, "text", "");
                    }}
                    className={`pill text-xs ${item?.type === "text" ? "bg-lime-400 text-black" : ""}`}
                  >
                    ✏️ Текстом
                  </button>
                </div>

                {item?.type === "image" && (
                  <ImageUpload
                    value={item.value}
                    onChange={(url) => updateItem(key, "image", url as string)}
                    multiple={false}
                  />
                )}

                {item?.type === "text" && (
                  <textarea
                    value={item.value}
                    onChange={(e) => updateItem(key, "text", e.target.value)}
                    className="input min-h-[80px]"
                    placeholder={placeholder}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
        </div>
      )}

      {/* Inline creation modal */}
      {showCreateModal && bloggerId && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !generating && setShowCreateModal(false)}
        >
          <div 
            className="card p-6 max-w-3xl w-full space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Создать новый образ</h2>
            
            <p className="text-sm text-gray-400">
              Загрузите фрагменты одежды из разных кадров. AI соберёт их в полный образ.
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
                  💡 Загрузите минимум один элемент. AI сгенерирует полный образ в full-height формате.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetCreateForm}
                    disabled={generating}
                    className="btn flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleGenerateOutfit}
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
                    onClick={handleAcceptGenerated}
                    className="btn btn-primary flex-1"
                  >
                    ✓ Создать
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
