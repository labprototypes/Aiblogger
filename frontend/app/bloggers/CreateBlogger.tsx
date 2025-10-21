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
        Создать блогера
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-3xl card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Новый блогер</div>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-200">✕</button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Имя</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя блогера"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Платформа</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Аватар URL</label>
          <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Тема</label>
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="тематика" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Тональность</label>
          <textarea value={tone} onChange={(e) => setTone(e.target.value)} className="input min-h-[80px]" placeholder="короткое описание голоса" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Voice ID</label>
          <Input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="11Labs voice id" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">content_types (JSON)</label>
          <textarea value={contentTypes} onChange={(e) => setContentTypes(e.target.value)} className="input min-h-[100px] font-mono text-sm" placeholder='{"reels": true, "post": true}' />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">content_schedule (JSON)</label>
          <textarea value={contentSchedule} onChange={(e) => setContentSchedule(e.target.value)} className="input min-h-[100px] font-mono text-sm" placeholder='{"mon": ["post"], "wed": ["reels"]}' />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Сохранение…" : "Создать"}</Button>
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); }}>Отмена</Button>
      </div>
    </form>
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
