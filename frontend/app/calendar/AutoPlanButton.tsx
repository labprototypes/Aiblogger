"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

type Props = {
  bloggerId: number | undefined;
  bloggers: Array<{ id: number; name: string }>;
  year: number;
  month: number; // 0-based (JS month index)
};

export default function AutoPlanButton({ bloggerId, bloggers, year, month }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAutoPlan = () => {
    const targetBloggerId = bloggerId || bloggers[0]?.id;
    if (!targetBloggerId) {
      alert("Выберите блогера");
      return;
    }

    if (!confirm("Создать автоплан на месяц? Контент будет распределён согласно настройкам блогера.")) {
      return;
    }

    startTransition(async () => {
      try {
        await api.tasks.autoPlan(targetBloggerId, year, month + 1);
        router.refresh();
      } catch (e: any) {
        alert(`Ошибка: ${e.message || 'Не удалось создать план'}`);
      }
    });
  };

  return (
    <button 
      onClick={handleAutoPlan} 
      disabled={pending}
      className="pill disabled:opacity-50"
    >
      {pending ? "Планирование..." : "Автоплан"}
    </button>
  );
}
