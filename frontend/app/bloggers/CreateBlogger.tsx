"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function CreateBlogger() {
  const [name, setName] = useState("");
  const [type, setType] = useState("podcaster");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.bloggers.create({ name: name.trim(), type });
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя блогера"
        className="w-56"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-xl bg-[var(--bg-soft)] px-3 py-2 border border-white/10 text-gray-200"
      >
        <option value="podcaster">podcaster</option>
        <option value="fashion">fashion</option>
      </select>
      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение…" : "Создать"}
      </Button>
    </form>
  );
}
