import { api, TASK_STATUSES } from "../../../lib/api";

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
};

export default async function DayPage({ params, searchParams }: { params: Promise<{ day: string }>; searchParams: Promise<{ blogger?: string }> }) {
  const { day } = await params;
  const sp = await searchParams;
  const bloggerId = sp.blogger ? Number(sp.blogger) : undefined;
  const tasks = await api.tasks.list({ blogger_id: bloggerId }).then(ts => ts.filter(t => t.date === day));

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{new Date(day + 'T00:00').toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1>
          <p className="text-sm text-gray-400 mt-1">Задач на день: {tasks.length}</p>
        </div>
        <a className="pill text-sm" href={`/calendar?y=${new Date(day).getFullYear()}&m=${new Date(day).getMonth()}${bloggerId?`&blogger=${bloggerId}`:''}`}>← Календарь</a>
      </div>

      {tasks.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-400">Нет задач на этот день</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((t) => {
          const icon = contentTypeIcons[t.content_type] || "📄";
          return (
            <a key={t.id} href={`/tasks/${t.id}`} className="block card p-5 hover:bg-white/5 transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div className="font-medium text-lg">{t.content_type}</div>
                </div>
                <span className={`pill text-xs ${statusColors[t.status] || 'bg-gray-700 text-gray-200'}`}>
                  {t.status}
                </span>
              </div>
              {t.idea && (
                <p className="text-gray-300 text-sm line-clamp-3 mb-3">{t.idea}</p>
              )}
              {t.preview_url && (
                <div className="text-xs text-lime-400 group-hover:text-lime-300">Превью готово →</div>
              )}
            </a>
          );
        })}
      </div>
    </main>
  );
}
