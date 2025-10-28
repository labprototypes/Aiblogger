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

type Props = {
  outfit: Outfit;
  onChange: (outfit: Outfit) => void;
};

const OUTFIT_ITEMS = [
  { key: "top", label: "👕 Верх", placeholder: "Описание верха (футболка, рубашка, кофта...)" },
  { key: "bottom", label: "👖 Низ", placeholder: "Описание низа (джинсы, юбка, шорты...)" },
  { key: "shoes", label: "👟 Обувь", placeholder: "Описание обуви (кроссовки, ботинки...)" },
  { key: "socks", label: "🧦 Носки", placeholder: "Описание носков (если важны)" },
  { key: "accessories", label: "👜 Аксессуары", placeholder: "Описание аксессуаров (сумка, очки, украшения...)" },
] as const;

export default function OutfitBuilder({ outfit, onChange }: Props) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 mb-3">
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
  );
}
