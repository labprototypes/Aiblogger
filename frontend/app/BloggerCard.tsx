"use client";

type Blogger = {
  id: number;
  name: string;
  type: string;
  image?: string | null;
  theme?: string | null;
};

export default function BloggerCard({ blogger }: { blogger: Blogger }) {
  return (
    <a
      href={`/calendar?blogger=${blogger.id}`}
      className="card p-6 hover:bg-white/5 transition group"
    >
      <div className="flex items-center gap-4 mb-4">
        {blogger.image ? (
          <img src={blogger.image} alt={blogger.name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-black">
            {blogger.name[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold text-lg">{blogger.name}</div>
          <div className="text-sm text-gray-400">{blogger.type}</div>
        </div>
      </div>
      {blogger.theme && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{blogger.theme}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Открыть календарь →</span>
        <a 
          href={`/bloggers/${blogger.id}/edit`} 
          onClick={(e) => e.stopPropagation()} 
          className="text-lime-400 hover:text-lime-300"
        >
          Настройки
        </a>
      </div>
    </a>
  );
}
