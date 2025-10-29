"use client";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../lib/api";
import ImageUpload from "../../../components/ImageUpload";
import LocationsManager from "./LocationsManager";
import OutfitsManager from "./OutfitsManager";
import SaveIndicator from "../../../components/SaveIndicator";
import { useAutoSave } from "../../../hooks/useAutoSave";

export default function EditForm({ id }: { id: number }) {
  const [blogger, setBlogger] = useState<any>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [editingTypesEnabled, setEditingTypesEnabled] = useState<string[]>([]);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPodcaster = type === "podcaster";
  const isFashion = type === "fashion";

  // Auto-save setup
  const [autoSave, saveStatus] = useAutoSave(async (data: any) => {
    await api.bloggers.update(id, data);
  }, 1500); // 1.5 second debounce

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await api.bloggers.get(id);
        if (!alive) return;
        setBlogger(b);
        setName(b.name);
        setType(b.type);
        setAvatarUrl((b as any).image || "");
        setLocations((b as any).locations || []);
        setOutfits((b as any).outfits || []);
        setTheme((b as any).theme || "");
        setTone((b as any).tone_of_voice || "");
        setVoiceId((b as any).voice_id || "");
        setEditingTypesEnabled((b as any).editing_types_enabled || []);
        setSubtitlesEnabled(((b as any).subtitles_enabled || 0) === 1);
      } catch (e) {
        setError("Не удалось загрузить блогера");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Auto-save effect - triggers on any field change
  useEffect(() => {
    if (loading || !blogger) return; // Don't save during initial load
    
    autoSave({
      name: name.trim(),
      type,
      // @ts-ignore
      image: avatarUrl || undefined,
      // @ts-ignore
      locations: locations.length > 0 ? locations : undefined,
      // @ts-ignore
      outfits: outfits.length > 0 ? outfits : undefined,
      // @ts-ignore
      theme: theme || undefined,
      // @ts-ignore
      tone_of_voice: tone || undefined,
      // @ts-ignore
      voice_id: voiceId || undefined,
      // @ts-ignore
      editing_types_enabled: editingTypesEnabled.length > 0 ? editingTypesEnabled : undefined,
      // @ts-ignore
      subtitles_enabled: subtitlesEnabled ? 1 : 0,
    });
  }, [name, type, avatarUrl, locations, outfits, theme, tone, voiceId, editingTypesEnabled, subtitlesEnabled]);

  const toggleEditingType = (et: string) => {
    if (editingTypesEnabled.includes(et)) {
      setEditingTypesEnabled(editingTypesEnabled.filter(t => t !== et));
    } else {
      setEditingTypesEnabled([...editingTypesEnabled, et]);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-save handles saving, just redirect back
    window.location.href = "/bloggers";
  };

  if (loading) return <div className="text-gray-400">Загрузка…</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</div>}

      {/* Basic Info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Имя блогера</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Введите имя"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Тип блогера</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)} 
            className="input" 
            required
          >
            <option value="">Выберите тип</option>
            <option value="podcaster">🎙️ Podcaster</option>
            <option value="fashion">👗 Fashion</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Тематика</label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="input"
            placeholder="Например: технологии, мода, путешествия"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Тональность голоса</label>
          <textarea
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Описание стиля общения (дружелюбный, профессиональный, юмористичный и т.д.)"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Voice ID (ElevenLabs)</label>
          <input
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="input"
            placeholder="ID голоса из ElevenLabs"
          />
        </div>
      </div>

      {/* Media */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Медиа</h2>
        
        <ImageUpload
          label="Аватар блогера"
          value={avatarUrl}
          onChange={(url) => setAvatarUrl(url as string)}
          multiple={false}
        />
      </div>

      {/* Fashion Locations & Outfits */}
      {isFashion && (
        <>
          <div className="card p-6">
            <LocationsManager 
              bloggerId={id} 
              locations={locations} 
              onUpdate={setLocations} 
            />
          </div>

          <div className="card p-6">
            <OutfitsManager 
              bloggerId={id} 
              outfits={outfits} 
              onUpdate={setOutfits} 
            />
          </div>
        </>
      )}

      {/* Editing Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Настройки монтажа</h2>
        
        <div>
          <label className="block text-sm text-gray-400 mb-3">Типы монтажа (выберите все подходящие)</label>
          <div className="space-y-2">
            {isPodcaster ? (
              <>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTypesEnabled.includes("overlay")}
                    onChange={() => toggleEditingType("overlay")}
                    className="w-4 h-4"
                  />
                  <span>Overlay — наложение графики поверх видео</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTypesEnabled.includes("dynamic")}
                    onChange={() => toggleEditingType("dynamic")}
                    className="w-4 h-4"
                  />
                  <span>Dynamic — динамичная нарезка с эффектами</span>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTypesEnabled.includes("static")}
                    onChange={() => toggleEditingType("static")}
                    className="w-4 h-4"
                  />
                  <span>Static — статичные кадры без спецэффектов</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTypesEnabled.includes("dynamic")}
                    onChange={() => toggleEditingType("dynamic")}
                    className="w-4 h-4"
                  />
                  <span>Dynamic — динамичная нарезка с эффектами</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTypesEnabled.includes("carousel")}
                    onChange={() => toggleEditingType("carousel")}
                    className="w-4 h-4"
                  />
                  <span>Carousel — карусель из нескольких изображений</span>
                </label>
              </>
            )}
          </div>
        </div>

        {isPodcaster && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={subtitlesEnabled}
              onChange={(e) => setSubtitlesEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Включить субтитры для всех видео</span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || saveStatus === 'saving'}
            className="btn btn-primary disabled:opacity-50"
          >
            {pending ? "Сохранение…" : "Вернуться к списку"}
          </button>
          <a href="/bloggers" className="btn">Назад</a>
        </div>
        
        <SaveIndicator status={saveStatus as 'idle' | 'pending' | 'saving' | 'saved' | 'error'} />
      </div>
    </form>
  );
}
