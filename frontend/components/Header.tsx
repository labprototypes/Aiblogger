export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
        <div className="h-8 w-8 rounded-full" style={{ background: "var(--accent)" }} />
        <span className="font-semibold">AI Blogger Studio</span>
      </a>
      <nav className="text-sm text-gray-400 flex gap-5">
        <a href="/" className="hover:text-white">Главная</a>
        <a href="/bloggers" className="hover:text-white">Блогеры</a>
        <a href="/calendar" className="hover:text-white">Календарь</a>
        <a href="/dashboard" className="hover:text-white">📊 Dashboard</a>
      </nav>
    </header>
  );
}
