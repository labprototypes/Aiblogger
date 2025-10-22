"use client";
import { useState, useRef } from "react";
import { API_BASE } from "../lib/api";

type ImageUploadProps = {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  maxFiles?: number;
};

export default function ImageUpload({ value, onChange, multiple = false, label, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrls = Array.isArray(value) ? value : value ? [value] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/api/upload/image`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      
      if (multiple) {
        const newUrls = [...currentUrls, ...urls].slice(0, maxFiles);
        onChange(newUrls);
      } else {
        onChange(urls[0]);
      }
    } catch (e) {
      setError("Не удалось загрузить файл");
      console.error(e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (url: string) => {
    if (multiple) {
      onChange(currentUrls.filter((u) => u !== url));
    } else {
      onChange("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const input = fileInputRef.current;
    if (input && e.dataTransfer.files) {
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

      {/* Preview */}
      {currentUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {currentUrls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Upload ${idx + 1}`}
                className="w-24 h-24 object-cover rounded-lg border-2 border-white/10"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {(!multiple || currentUrls.length < maxFiles) && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-lime-400/50 transition cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
          {uploading ? (
            <div className="text-gray-400">Загрузка...</div>
          ) : (
            <>
              <div className="text-4xl mb-2">📸</div>
              <div className="text-sm text-gray-400">
                Нажмите или перетащите {multiple ? "изображения" : "изображение"}
              </div>
              {multiple && (
                <div className="text-xs text-gray-500 mt-1">
                  Можно загрузить до {maxFiles} файлов
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
