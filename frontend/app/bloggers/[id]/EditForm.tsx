"use client";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../lib/api";

export default function EditForm({ id }: { id: number }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [image, setImage] = useState("");
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await api.bloggers.get(id);
        if (!alive) return;
  setName(b.name);
  setType(b.type);
  setImage(b.image || "");
  setTheme((b as any).theme || "");
  setTone((b as any).tone_of_voice || "");
  setVoiceId((b as any).voice_id || "");
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.bloggers.update(id, {
          name: name.trim(),
          type,
          // @ts-ignore - backend accepts these optional fields
          image,
          // @ts-ignore
          theme,
          // @ts-ignore
          tone_of_voice: tone,
          // @ts-ignore
          voice_id: voiceId,
        });
        window.location.href = "/bloggers";
      } catch (e) {
        setError("Сохранение не удалось");
      }
    });
  };

  if (loading) return <div className="text-gray-400">Загрузка…</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Имя блогера"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Тип</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input" required>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary disabled:opacity-50"
        >
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        <a href="/bloggers" className="btn">Отмена</a>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Аватар URL</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className="input" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Тема</label>
          <input value={theme} onChange={(e) => setTheme(e.target.value)} className="input" placeholder="тематика" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Тональность</label>
          <textarea value={tone} onChange={(e) => setTone(e.target.value)} className="input min-h-[100px]" placeholder="короткое описание голоса" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Voice ID</label>
          <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="input" placeholder="11Labs voice id" />
        </div>
      </div>
    </form>
  );
}
