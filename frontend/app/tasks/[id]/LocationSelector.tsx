"use client";
import { useState } from "react";
import ImageUpload from "../../../components/ImageUpload";

type Location = {
  title: string;
  description: string;
  thumbnail?: string;
};

type Props = {
  bloggerLocations: Location[]; // Array of location objects
  selectedLocationId: number | null;
  customLocationDescription: string;
  onChange: (locationId: number | null, description: string) => void;
};

export default function LocationSelector({ 
  bloggerLocations, 
  selectedLocationId,
  customLocationDescription,
  onChange 
}: Props) {
  const [mode, setMode] = useState<"preset" | "custom" | "upload">(
    selectedLocationId !== null ? "preset" : customLocationDescription ? "custom" : "preset"
  );
  const [description, setDescription] = useState(customLocationDescription);

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
    </div>
  );
}
