import { api } from "../../lib/api";
import Controls from "./Controls";
import BloggerFilter from "./BloggerFilter";

function getMonthDays(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0..Sun=6
  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, monthIndex, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-200",
  PLANNED: "bg-sky-700 text-sky-100",
  SCRIPT_READY: "bg-amber-700 text-amber-100",
  VISUAL_READY: "bg-violet-700 text-violet-100",
  APPROVED: "bg-emerald-700 text-emerald-100",
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ y?: string; m?: string; blogger?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const y = sp.y ? Number(sp.y) : now.getFullYear();
  const m = sp.m ? Number(sp.m) : now.getMonth();
  const cells = getMonthDays(y, m);

  const bloggerId = sp.blogger ? Number(sp.blogger) : undefined;
  const tasks = await api.tasks
    .list(bloggerId ? { blogger_id: bloggerId } : undefined)
    .catch(() => [] as Awaited<ReturnType<typeof api.tasks.list>>);
  const byDate = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }

  const shown = new Date(y, m, 1);
  const monthLabel = shown.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  // compute prev/next month links
  const prev = new Date(y, m - 1, 1);
  const next = new Date(y, m + 1, 1);
  const mkLink = (d: Date, blogger?: number) => `/calendar?y=${d.getFullYear()}&m=${d.getMonth()}${blogger ? `&blogger=${blogger}` : ""}`;

  const bloggers = await api.bloggers.list().catch(() => []);

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
          <a href={mkLink(prev, bloggerId)} className="pill text-sm">←</a>
          <h1 className="text-2xl font-semibold">Календарь — {monthLabel}</h1>
          <a href={mkLink(next, bloggerId)} className="pill text-sm">→</a>
  </div>
  <div className="flex items-center gap-3">
          <BloggerFilter bloggers={bloggers} bloggerId={bloggerId} y={y} m={m} />
          <div className="text-sm text-gray-400">Всего задач: {tasks.length}</div>
          <Controls />
          <form
            action={async () => {
              'use server'
              if (!bloggerId && bloggers[0]?.id) {
                await api.tasks.autoPlan(bloggers[0].id, shown.getFullYear(), shown.getMonth() + 1);
              } else if (bloggerId) {
                await api.tasks.autoPlan(bloggerId, shown.getFullYear(), shown.getMonth() + 1);
              }
            }}
          >
            <button className="pill">Автоплан</button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => {
          const dateStr = c.date ? c.date.toISOString().slice(0, 10) : null;
          const items = dateStr ? byDate.get(dateStr) || [] : [];
          const href = dateStr ? `/calendar/${dateStr}${bloggerId?`?blogger=${bloggerId}`:''}` : undefined;
          return (
            <a key={i} href={href} className={`block card p-2 min-h-[120px] transition hover:bg-white/5 ${href ? '' : 'pointer-events-none opacity-50'}`}>
              <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                <span>{c.date && c.date.getDate()}</span>
                {items.length > 0 && <span className="text-[10px] text-gray-500">{items.length}</span>}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${statusColors[t.status] || 'bg-gray-700 text-gray-200'}`}>{t.status}</span>
                    <span className="truncate text-gray-300">{t.content_type}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[11px] text-gray-400">+{items.length - 3} ещё</div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}

