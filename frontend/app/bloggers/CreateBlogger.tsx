"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function CreateBlogger() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("tiktok");
  const [image, setImage] = useState("");
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [contentTypes, setContentTypes] = useState("");
  const [contentSchedule, setContentSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const router = useRouter();

  const reset = () => {
    setName("");
    setType("tiktok");
    setImage("");
    setTheme("");
    setTone("");
    setVoiceId("");
    setContentTypes("");
    setContentSchedule("");
    setShowAdvanced(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Укажите имя");
      return;
    }
    setLoading(true);
    try {
      await api.bloggers.create({
        name: name.trim(),
        type,
        image: image || undefined,
        theme: theme || undefined,
        // @ts-ignore backend field name
        tone_of_voice: tone || undefined,
        // @ts-ignore backend field name
        voice_id: voiceId || undefined,
        // @ts-ignore backend field name
        content_types: safeParseJSON(contentTypes),
        // @ts-ignore backend field name
        content_schedule: safeParseJSON(contentSchedule),
      } as any);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError("Не удалось создать блогера");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        + Создать блогера
      </Button>
    );
  }

  return (
    <>
      {/* Modal overlay */}
      <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      
      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <form 
          onSubmit={onSubmit} 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-6 space-y-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-[var(--bg-card)] pb-4 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold">Новый блогер</h2>
              <p className="text-sm text-gray-400 mt-1">Заполните основную информацию</p>
            </div>
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="text-gray-400 hover:text-gray-200 transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Имя блогера <span className="text-red-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Аня Стиль"
                  required
                  className="!py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Платформа <span className="text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input !py-3"
                >
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="youtube">▶️ YouTube</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Тема блога</label>
              <Input 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                placeholder="Например: мода, лайфстайл, путешествия"
                className="!py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Аватар (URL)</label>
              <Input 
                value={image} 
                onChange={(e) => setImage(e.target.value)} 
                placeholder="https://example.com/avatar.jpg"
                className="!py-3"
              />
              {image && (
                <div className="mt-2">
                  <img src={image} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-lime-400/20" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Тональность</label>
              <textarea 
                value={tone} 
                onChange={(e) => setTone(e.target.value)} 
                className="input min-h-[100px]" 
                placeholder="Опишите стиль общения: дружелюбный, энергичный, профессиональный..."
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm text-gray-300"
          >
            <span className="font-medium">⚙️ Дополнительные настройки</span>
            <span className="text-gray-400">{showAdvanced ? "▲" : "▼"}</span>
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID (ElevenLabs)</label>
                <Input 
                  value={voiceId} 
                  onChange={(e) => setVoiceId(e.target.value)} 
                  placeholder="voice_abc123..."
                  className="!py-3 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">ID голоса из ElevenLabs для озвучки</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Типы контента (JSON)</label>
                <textarea 
                  value={contentTypes} 
                  onChange={(e) => setContentTypes(e.target.value)} 
                  className="input min-h-[100px] font-mono text-sm" 
                  placeholder='{"reels": true, "post": true, "story": true}'
                />
                <p className="text-xs text-gray-500 mt-1">Какие типы контента создаёт блогер</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Расписание (JSON)</label>
                <textarea 
                  value={contentSchedule} 
                  onChange={(e) => setContentSchedule(e.target.value)} 
                  className="input min-h-[100px] font-mono text-sm" 
                  placeholder='{"mon": ["post"], "wed": ["reels"], "fri": ["story"]}'
                />
                <p className="text-xs text-gray-500 mt-1">График публикаций по дням недели</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? "Создание…" : "✓ Создать"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function safeParseJSON(text: string) {
  try {
    const v = JSON.parse(text || "null");
    return v ?? undefined;
  } catch {
    return undefined;
  }
}
