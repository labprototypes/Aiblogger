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

export default async function CalendarPage() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const cells = getMonthDays(y, m);

  const tasks = await api.tasks.list().catch(() => [] as Awaited<ReturnType<typeof api.tasks.list>>);
  const byDate = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }

  const monthLabel = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  return (
    <main className="space-y-4">
  <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Календарь — {monthLabel}</h1>
  <div className="text-sm text-gray-400">Всего задач: {tasks.length}</div>
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
