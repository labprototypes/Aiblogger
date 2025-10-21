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
              <BloggerRow key={b.id} id={b.id} name={b.name} type={b.type} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function BloggerRow({ id, name, type }: { id: number; name: string; type: string }) {
  return (
    <li className="py-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-gray-400">{type}</div>
      </div>
      <DeleteButton id={id} />
    </li>
  );
}

function DeleteButton({ id }: { id: number }) {
  return (
    <form
      action={async () => {
        'use server'
        await api.bloggers.delete(id);
      }}
    >
      <button className="text-red-400 hover:text-red-300" type="submit">Удалить</button>
    </form>
  );
}
