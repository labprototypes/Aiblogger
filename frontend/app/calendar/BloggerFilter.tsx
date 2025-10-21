"use client";
import { useRouter } from "next/navigation";

type Blogger = {
  id: number;
  name: string;
};

export default function BloggerFilter({
  bloggers,
  bloggerId,
  y,
  m,
}: {
  bloggers: Blogger[];
  bloggerId?: number;
  y: number;
  m: number;
}) {
  const router = useRouter();
  return (
    <select
      name="blogger"
      defaultValue={bloggerId ?? ""}
      className="rounded-xl bg-[var(--bg-soft)] px-3 py-2 border border-white/10 text-gray-200"
      onChange={(e) => {
        const v = e.currentTarget.value;
        const url = new URL(window.location.href);
        if (v) url.searchParams.set("blogger", v);
        else url.searchParams.delete("blogger");
        url.searchParams.set("y", String(y));
        url.searchParams.set("m", String(m));
        router.push(url.toString());
      }}
    >
      <option value="">Все блогеры</option>
      {bloggers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
