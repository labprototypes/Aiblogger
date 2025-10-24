"use client";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../lib/api";
import ImageUpload from "../../../components/ImageUpload";

export default function EditForm({ id }: { id: number }) {
  const [blogger, setBlogger] = useState<any>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [editingTypesEnabled, setEditingTypesEnabled] = useState<string[]>([]);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(0);
  const [contentFrequency, setContentFrequency] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPodcaster = type === "podcaster";
  const maxLocations = isPodcaster ? 2 : 5;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await api.bloggers.get(id);
        if (!alive) return;
        setBlogger(b);
        setName(b.name);
        setType(b.type);
        setAvatarUrl((b as any).avatar_url || (b as any).image || "");
        setLocations((b as any).locations || []);
        setTheme((b as any).theme || "");
        setTone((b as any).tone_of_voice || "");
        setVoiceId((b as any).voice_id || "");
        setEditingTypesEnabled((b as any).editing_types_enabled || []);
        setSubtitlesEnabled((b as any).subtitles_enabled || 0);
        setContentFrequency((b as any).content_frequency || {});
      } catch (e) {
        setError("Не удалось загрузить блогера");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.bloggers.update(id, {
          name: name.trim(),
          type,
          image: avatarUrl, // backend still uses 'image' field
          theme,
          tone_of_voice: tone,
          voice_id: voiceId,
          // @ts-ignore
          avatar_url: avatarUrl,
          // @ts-ignore
          locations,
          // @ts-ignore
          editing_types_enabled: editingTypesEnabled,
          // @ts-ignore
          subtitles_enabled: subtitlesEnabled,
          // @ts-ignore
          content_frequency: contentFrequency,
        } as any);
        window.location.href = "/bloggers";
      } catch (e) {
        setError("Сохранение не удалось");
      }
    });
  };

  if (loading) return <div className="text-gray-400">Загрузка…</div>;

  const editingOptions = isPodcaster
    ? ["Нарезки", "Клипы", "Моушн-дизайн"]
    : ["Нарезки", "Клипы", "Моушн-дизайн", "Слайд-шоу"];

  const frequencyOptions = ["Раз в день", "Раз в неделю", "Раз в месяц"];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error}</div>}

      {/* Основная информация */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-lime-400">Основная информация</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Имя блогера</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Введите имя"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Тип блогера</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="input w-full" 
              required
            >
              <option value="podcaster">🎙️ Подкастер</option>
              <option value="fashion">👗 Фэшн-блогер</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Тема контента</label>
            <input 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)} 
              className="input w-full" 
              placeholder="Например: технологии, мода, путешествия" 
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Тональность голоса</label>
            <textarea 
              value={tone} 
              onChange={(e) => setTone(e.target.value)} 
              className="input w-full min-h-[100px]" 
              placeholder="Опишите стиль общения: дружелюбный, профессиональный, энергичный и т.д."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID (ElevenLabs)</label>
            <input 
              value={voiceId} 
              onChange={(e) => setVoiceId(e.target.value)} 
              className="input w-full" 
              placeholder="ID голоса из ElevenLabs" 
            />
          </div>
        </div>
      </section>

      {/* Медиа */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <h2 className="text-xl font-semibold text-lime-400">Медиа</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <ImageUpload
              label="Аватар блогера"
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url as string)}
              multiple={false}
            />
          </div>

          <div>
            <ImageUpload
              label={`Локации (0/${maxLocations})`}
              value={locations}
              onChange={(urls) => setLocations(urls as string[])}
              multiple={true}
              maxFiles={maxLocations}
            />
            <p className="text-xs text-gray-400 mt-2">
              {isPodcaster 
                ? "Подкастеры могут загрузить до 2 локаций" 
                : "Фэшн-блогеры могут загрузить до 5 локаций"}
            </p>
          </div>
        </div>
      </section>

      {/* Настройки монтажа */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <h2 className="text-xl font-semibold text-lime-400">Типы монтажа</h2>
        <p className="text-sm text-gray-400">Выберите, какие виды монтажа доступны для этого блогера</p>
        
        <div className="grid grid-cols-2 gap-3">
          {editingOptions.map((option) => (
            <label key={option} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-lime-400/50 transition">
              <input
                type="checkbox"
                checked={editingTypesEnabled.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditingTypesEnabled([...editingTypesEnabled, option]);
                  } else {
                    setEditingTypesEnabled(editingTypesEnabled.filter(t => t !== option));
                  }
                }}
                className="w-5 h-5 rounded border-white/20 bg-white/10 text-lime-400 focus:ring-lime-400"
              />
              <span className="text-sm font-medium">{option}</span>
            </label>
          ))}
        </div>

        {!isPodcaster && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <input
              type="checkbox"
              checked={subtitlesEnabled === 1}
              onChange={(e) => setSubtitlesEnabled(e.target.checked ? 1 : 0)}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-lime-400 focus:ring-lime-400"
            />
            <label className="text-sm font-medium">Включить субтитры для всех видео</label>
          </div>
        )}
      </section>

      {/* Частота контента */}
      <section className="space-y-4 pt-6 border-t border-white/10">
        <h2 className="text-xl font-semibold text-lime-400">Частота публикаций</h2>
        <p className="text-sm text-gray-400">Укажите, сколько раз публиковать контент для каждой частоты</p>
        
        <div className="space-y-3">
          {frequencyOptions.map((option) => {
            const key = option.toLowerCase().replace(/\s/g, '_');
            return (
              <div key={option} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <label className="flex-1 text-sm font-medium">{option}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contentFrequency[key] || 0}
                  onChange={(e) => setContentFrequency({
                    ...contentFrequency,
                    [key]: parseInt(e.target.value) || 0
                  })}
                  className="input w-24 text-center"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Кнопки */}
      <div className="flex gap-3 pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={pending}
          className="pill bg-lime-400 text-black hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3"
        >
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        <a href="/bloggers" className="pill bg-white/10 hover:bg-white/20 px-8 py-3">
          Отмена
        </a>
      </div>
    </form>
  );
}
