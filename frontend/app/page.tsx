import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Progress } from "../components/ui/Progress";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard — Бэтчи</h1>
          <p className="mt-1 text-gray-400">Переключайтесь между днями, смотрите прогресс и ищите по коду.</p>
        </div>
  <Button>Экспорт батча</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <span className="pill">Выбранный день: 2025-08-19</span>
          <div className="ml-auto text-sm text-gray-400">Всего: 1 · Готово: 0%</div>
        </div>
        <div className="card p-4 md:col-span-2">
          <Input placeholder="Поиск по SKU…" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 text-sm text-gray-400 border-b border-white/10">
          <div>SKU</div>
          <div>Head Profile</div>
          <div>Кадров</div>
          <div>Прогресс</div>
          <div className="text-right">Обновлено</div>
        </div>
        <div className="grid grid-cols-5 items-center gap-2 px-5 py-4">
          <a className="text-accent hover:underline" href="#">136062ZX1-00</a>
          <div>—</div>
          <div>0/4 (0%)</div>
          <div><Badge>В работе</Badge></div>
          <div className="text-right text-gray-400">8/19/2025, 9:08 AM</div>
        </div>
      </div>
    </main>
  );
}
