import { api, TASK_STATUSES } from "../../../lib/api";
import TaskLive from "./TaskLive";
import TaskEdit from "./TaskEdit";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  const task = await api.tasks.get(taskId);

  async function setStatus(formData: FormData) {
    'use server'
    const status = String(formData.get('status'));
    await api.tasks.updateStatus(taskId, status);
  }

  async function generate() {
    'use server'
    await api.tasks.generate(taskId);
  }

  async function generateScript() {
    'use server'
    await api.tasks.generateScript(taskId);
  }

  async function remove() {
    'use server'
    await api.tasks.delete(taskId);
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Задача #{task.id}</h1>
        <div className="text-sm text-gray-400">{task.date} • {task.content_type} • блогер #{task.blogger_id}</div>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Статус</div>
            <div className="text-lg font-medium">{task.status}</div>
          </div>
          <form action={setStatus} className="flex items-center gap-2">
            <select name="status" defaultValue={task.status} className="rounded-xl bg-[var(--bg-soft)] px-3 py-2 border border-white/10 text-gray-200">
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="submit" className="pill text-sm">Изменить</button>
          </form>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold mb-4">Контент</h2>
          <TaskEdit task={task} />
        </div>

        {task.preview_url && (
          <div className="border-t border-white/10 pt-6">
            <div className="text-sm text-gray-400 mb-2">Превью</div>
            <a className="text-lime-400 hover:text-lime-300 font-medium" href={task.preview_url} target="_blank">
              Открыть превью →
            </a>
          </div>
        )}

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold mb-3">Действия</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {!task.script && (
              <form action={generateScript}>
                <button type="submit" className="pill">Расписать сценарий (AI)</button>
              </form>
            )}
            {task.script && (
              <form action={generate}>
                <button type="submit" className="pill">Сгенерировать контент</button>
              </form>
            )}
            <TaskLive id={taskId} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <a className="text-sm text-gray-400 hover:text-gray-200" href="/calendar">← Назад в календарь</a>
        <form action={remove}>
          <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => { if (!confirm('Удалить задачу?')) throw new Error('cancel'); }}>
            Удалить задачу
          </button>
        </form>
      </div>
    </main>
  );
}
