import { api } from "../../lib/api";

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
  PLANNED: "bg-blue-700 text-blue-100",
  SCRIPT_READY: "bg-yellow-700 text-yellow-100",
  VISUAL_READY: "bg-purple-700 text-purple-100",
  APPROVED: "bg-green-700 text-green-100",
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
          <form>
            <select
              name="blogger"
              defaultValue={bloggerId ?? ""}
              className="rounded-xl bg-[var(--bg-soft)] px-3 py-2 border border-white/10 text-gray-200"
              onChange={(e) => {
                const v = e.currentTarget.value;
                const url = new URL(window.location.href);
                if (v) url.searchParams.set("blogger", v); else url.searchParams.delete("blogger");
                url.searchParams.set("y", String(y));
                url.searchParams.set("m", String(m));
                window.location.href = url.toString();
              }}
            >
              <option value="">Все блогеры</option>
              {bloggers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </form>
          <div className="text-sm text-gray-400">Всего задач: {tasks.length}</div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => {
          const dateStr = c.date ? c.date.toISOString().slice(0, 10) : null;
          const items = dateStr ? byDate.get(dateStr) || [] : [];
          return (
            <div key={i} className="card p-3 min-h-[120px]">
              <div className="text-xs text-gray-400 mb-2 h-4">
                {c.date && c.date.getDate()}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((t) => (
                  <div key={t.id} className={`text-[11px] px-2 py-1 rounded ${statusColors[t.status] || "bg-gray-700 text-gray-200"}`}>
                    {t.content_type} — {t.status}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[11px] text-gray-400">+{items.length - 3} ещё</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
