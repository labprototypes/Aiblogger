import { api } from "../lib/api";
import BloggerCard from "./BloggerCard";

export default async function HomePage() {
  const bloggers = await api.bloggers.list().catch(() => []);
  
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Blogger Studio</h1>
        <p className="text-gray-400">Выберите блогера для работы с контентом</p>
      </div>

      {bloggers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 mb-4">Нет блогеров. Создайте первого блогера.</p>
          <a href="/bloggers" className="pill">Создать блогера</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bloggers.map((b) => (
            <BloggerCard key={b.id} blogger={b} />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <a href="/bloggers" className="text-sm text-gray-400 hover:text-gray-200">Управление блогерами →</a>
      </div>
    </main>
  );
}
