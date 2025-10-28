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

const contentTypeIcons: Record<string, string> = {
  reels: "🎬",
  post: "📝",
  story: "📸",
  short: "▶️",
  video: "🎥",
  carousel: "🖼️",
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
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {/* Header row with day names */}
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
          <div key={`header-${i}`} className="text-center text-xs font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
        {cells.map((c, i) => {
          const dateStr = c.date ? c.date.toISOString().slice(0, 10) : null;
          const items = dateStr ? byDate.get(dateStr) || [] : [];
          const href = dateStr ? `/calendar/${dateStr}${bloggerId?`?blogger=${bloggerId}`:''}` : undefined;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          return (
            <a 
              key={i} 
              href={href} 
              className={`block card p-3 min-h-[180px] transition hover:scale-[1.02] hover:shadow-lg ${href ? '' : 'pointer-events-none opacity-30'} ${isToday ? 'ring-2 ring-lime-400' : ''}`}
            >
              <div className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
                <span>{c.date && c.date.getDate()}</span>
                {items.length > 0 && (
                  <span className="text-[10px] bg-lime-400/20 text-lime-400 px-1.5 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {items.slice(0, 4).map((t) => {
                  const icon = contentTypeIcons[t.content_type] || "📄";
                  return (
                    <div key={t.id} className="text-xs rounded p-1.5 bg-white/5 hover:bg-white/10 transition">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{icon}</span>
                        <span className="text-gray-300 truncate flex-1">{t.content_type}</span>
                      </div>
                      <div className={`text-[10px] px-1.5 py-0.5 rounded inline-block ${statusColors[t.status] || 'bg-gray-700 text-gray-200'}`}>
                        {t.status}
                      </div>
                    </div>
                  );
                })}
                {items.length > 4 && (
                  <div className="text-[10px] text-gray-400 text-center pt-1">+{items.length - 4} ещё</div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}

