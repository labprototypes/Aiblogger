export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full" style={{ background: "var(--accent)" }} />
        <span className="font-semibold">AI Blogger Studio</span>
      </div>
      <nav className="text-sm text-gray-400 flex gap-5">
        <a href="/bloggers" className="hover:text-white">Блогеры</a>
        <a href="/calendar" className="hover:text-white">Календарь</a>
      </nav>
    </header>
  );
}
