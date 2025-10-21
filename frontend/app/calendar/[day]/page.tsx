import { api, TASK_STATUSES } from "../../../lib/api";

export default async function DayPage({ params, searchParams }: { params: Promise<{ day: string }>; searchParams: Promise<{ blogger?: string }> }) {
  const { day } = await params;
  const sp = await searchParams;
  const bloggerId = sp.blogger ? Number(sp.blogger) : undefined;
  const tasks = await api.tasks.list({ blogger_id: bloggerId }).then(ts => ts.filter(t => t.date === day));

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{new Date(day).toLocaleDateString("ru-RU")}</h1>
        <a className="text-sm text-gray-400" href={`/calendar?y=${new Date(day).getFullYear()}&m=${new Date(day).getMonth()}${bloggerId?`&blogger=${bloggerId}`:''}`}>← Назад к календарю</a>
      </div>

      {tasks.length === 0 && (
        <div className="card p-6 text-gray-400">Задач нет. Добавьте задачу в календаре или используйте автоплан.</div>
      )}

      <div className="space-y-3">
        {tasks.map((t) => (
          <a key={t.id} href={`/tasks/${t.id}`} className="block card p-4 hover:bg-white/5 transition">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.content_type}</div>
              <span className={`pill text-xs`}>{t.status}</span>
            </div>
            {t.idea && <div className="mt-2 text-gray-300 text-sm line-clamp-2">{t.idea}</div>}
            {t.preview_url && (
              <div className="mt-2 text-xs"><a className="text-lime-400 hover:text-lime-300" href={t.preview_url} target="_blank">Превью</a></div>
            )}
          </a>
        ))}
      </div>
    </main>
  );
}
