"use client";
import { useEffect, useState, useTransition } from "react";
import { api } from "../../../lib/api";

export default function EditForm({ id }: { id: number }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
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
        await api.bloggers.update(id, { name: name.trim(), type });
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
    </form>
  );
}
