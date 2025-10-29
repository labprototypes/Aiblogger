"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import FashionEditForm from "./FashionEditForm";
import PodcasterEditForm from "./PodcasterEditForm";

export default function EditForm({ id }: { id: number }) {
  const [blogger, setBlogger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await api.bloggers.get(id);
        if (!alive) return;
        setBlogger(b);
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

  if (loading) return <div className="text-gray-400">Загрузка…</div>;
  if (error) return <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</div>;
  if (!blogger) return <div className="text-red-400">Блогер не найден</div>;

  // Route to appropriate form based on blogger type
  if (blogger.type === "podcaster") {
    return <PodcasterEditForm bloggerId={id} initialBlogger={blogger} />;
  } else {
    return <FashionEditForm id={id} initialBlogger={blogger} />;
  }
}
