"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import ImageUpload from "../../components/ImageUpload";

export default function CreateBlogger() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Form fields - только для podcaster
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [tone, setTone] = useState("");
  const [theme, setTheme] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;

    setSaving(true);
    try {
      const newBlogger = await api.bloggers.create({
        name,
        type: "podcaster",
        image: image || undefined,
        tone_of_voice: tone || undefined,
        theme: theme || undefined,
        voice_id: voiceId || undefined,
      });
      router.push(`/bloggers/${newBlogger.id}/edit`);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка при создании блогера");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
      >
        + Создать блогера
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-b border-white/10 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white">🎙️ Создать подкастера</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-lime-400 border-b border-white/10 pb-2">
              Основная информация
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Имя *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                placeholder="Введите имя блогера"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Тема контента</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                placeholder="Например: технологии, маркетинг, личностный рост"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tone of Voice</label>
              <textarea
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 min-h-[80px]"
                placeholder="Опишите стиль и тон контента"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID (ElevenLabs)</label>
              <input
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                placeholder="ID голоса из ElevenLabs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Фото персонажа</label>
              <ImageUpload 
                value={image} 
                onChange={(url) => setImage(Array.isArray(url) ? url[0] : url)} 
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-transparent backdrop-blur-sm border-t border-white/10 p-6 flex gap-3">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name}
            className="flex-1 bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 text-black font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Создание..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
