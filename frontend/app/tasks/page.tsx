import { api } from "../../lib/api";
import Link from "next/link";

export default async function TasksPage() {
  const bloggers = await api.bloggers.list();
  const allTasks = await Promise.all(
    bloggers.map(async (blogger) => {
      const tasks = await api.tasks.list({ blogger_id: blogger.id });
      return tasks.map((task: any) => ({ ...task, blogger }));
    })
  );
  const tasks = allTasks.flat().sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📋 Задачи</h1>
        <CreateTaskButton bloggers={bloggers} />
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <p className="text-lg mb-2">Нет задач</p>
            <p className="text-sm">Создайте первую задачу для вашего блогера</p>
          </div>
        ) : (
          tasks.map((task: any) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="card p-4 hover:border-lime-400/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {task.blogger.image && (
                    <img
                      src={task.blogger.image}
                      alt={task.blogger.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-white">{task.blogger.name}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(task.date).toLocaleDateString("ru-RU")} • {task.content_type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  {task.idea && (
                    <div className="max-w-md text-sm text-gray-300 truncate">
                      {task.idea}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Черновик", className: "bg-gray-500/20 text-gray-300" },
    SETUP_READY: { label: "Настроено", className: "bg-blue-500/20 text-blue-300" },
    REVIEW: { label: "На проверке", className: "bg-yellow-500/20 text-yellow-300" },
    PUBLISHED: { label: "Опубликовано", className: "bg-green-500/20 text-green-300" },
  };
  const badge = badges[status] || badges.DRAFT;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function CreateTaskButton({ bloggers }: { bloggers: any[] }) {
  return (
    <form action={createTaskAction}>
      <div className="flex items-center gap-3">
        <select
          name="bloggerId"
          required
          className="input"
        >
          <option value="">Выберите блогера</option>
          {bloggers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="input"
        />
        <input
          type="text"
          name="idea"
          placeholder="Идея выпуска (опционально)"
          className="input min-w-[300px]"
        />
        <button type="submit" className="btn btn-primary whitespace-nowrap">
          + Создать задачу
        </button>
      </div>
    </form>
  );
}

async function createTaskAction(formData: FormData) {
  "use server";
  const bloggerId = Number(formData.get("bloggerId"));
  const date = formData.get("date") as string;
  const idea = formData.get("idea") as string;

  if (!bloggerId || !date) {
    throw new Error("Blogger ID and date are required");
  }

  await api.tasks.create({
    blogger_id: bloggerId,
    date,
    content_type: "podcast",
    idea: idea || undefined,
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/tasks");
}
