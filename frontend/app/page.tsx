import { api } from "../lib/api";

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
            <a
              key={b.id}
              href={`/calendar?blogger=${b.id}`}
              className="card p-6 hover:bg-white/5 transition group"
            >
              <div className="flex items-center gap-4 mb-4">
                {b.image ? (
                  <img src={b.image} alt={b.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-black">
                    {b.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{b.name}</div>
                  <div className="text-sm text-gray-400">{b.type}</div>
                </div>
              </div>
              {b.theme && (
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{b.theme}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Открыть календарь →</span>
                <a href={`/bloggers/${b.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-lime-400 hover:text-lime-300">Настройки</a>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <a href="/bloggers" className="text-sm text-gray-400 hover:text-gray-200">Управление блогерами →</a>
      </div>
    </main>
  );
}
