import { api } from "../../lib/api";
import CreateBlogger from "./CreateBlogger";

export default async function BloggersPage() {
  const bloggers = await api.bloggers.list().catch(() => []);
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Блогеры</h1>
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-gray-400 text-sm">Всего: {bloggers.length}</div>
          <CreateBlogger />
        </div>
        {bloggers.length === 0 ? (
          <div className="text-gray-400">Пока пусто. Добавьте первого блогера через API.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {bloggers.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-sm text-gray-400">{b.type}</div>
                </div>
                <a className="text-accent hover:underline" href={`#`}>Открыть</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
