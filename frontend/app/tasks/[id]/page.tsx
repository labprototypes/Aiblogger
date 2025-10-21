import { api, TASK_STATUSES } from "../../../lib/api";

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
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Задача #{task.id}</h1>
      <div className="card p-4 space-y-4">
        <div className="text-sm text-gray-400">{task.date} • блогер #{task.blogger_id}</div>
        <div>
          <div className="text-sm text-gray-400">Тип контента</div>
          <div className="font-medium">{task.content_type}</div>
        </div>
        {task.idea && (
          <div>
            <div className="text-sm text-gray-400">Идея</div>
            <div>{task.idea}</div>
          </div>
        )}
        {task.script && (
          <div>
            <div className="text-sm text-gray-400">Скрипт</div>
            <pre className="whitespace-pre-wrap text-sm bg-[var(--bg-soft)] p-3 rounded border border-white/10">{task.script}</pre>
          </div>
        )}
        {task.preview_url && (
          <div>
            <div className="text-sm text-gray-400">Превью</div>
            <a className="text-lime-400 hover:text-lime-300" href={task.preview_url} target="_blank">Открыть</a>
          </div>
        )}
        <form action={setStatus} className="flex items-center gap-2">
          <select name="status" defaultValue={task.status} className="rounded-xl bg-[var(--bg-soft)] px-3 py-2 border border-white/10 text-gray-200">
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn">Сохранить статус</button>
        </form>
        <form action={generate}>
          <button type="submit" className="pill">Generate</button>
        </form>
        <form action={generateScript}>
          <button type="submit" className="pill">Gen Script</button>
        </form>
      </div>
      <a className="text-sm text-gray-400" href="/calendar">← Назад в календарь</a>
      <form action={remove}>
        <button className="text-red-400 hover:text-red-300" onClick={() => { if (!confirm('Удалить задачу?')) throw new Error('cancel'); }}>Удалить задачу</button>
      </form>
    </main>
  );
}
