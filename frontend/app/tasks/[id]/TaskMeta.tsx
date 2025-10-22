"use client";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

export default function TaskMeta({ taskId }: { taskId: number }) {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [style, setStyle] = useState("");
  const [outfit, setOutfit] = useState("");
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.assistant.getMeta(taskId);
        if (!mounted) return;
        if (res.data) {
          setMeta(res.data);
          // Попробуем распарсить suggestion если это JSON-строка
          try {
            const parsed = typeof res.data.suggestion === "string" 
              ? JSON.parse(res.data.suggestion) 
              : res.data.suggestion;
            setStyle(parsed.style || "");
            setOutfit(parsed.outfit || "");
            setLocation(parsed.location || "");
            setWeather(parsed.weather || "");
          } catch {
            // Если не JSON, покажем как есть
            setStyle(res.data.suggestion || "");
          }
        }
      } catch (e) {
        console.error("Failed to load meta", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [taskId]);

  if (loading) return <div className="text-gray-400 text-sm">Загрузка рекомендаций...</div>;
  if (!meta) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Рекомендации для съёмки</h3>
        <button onClick={() => setEditing(!editing)} className="text-sm text-lime-400 hover:text-lime-300">
          {editing ? "Свернуть" : "Редактировать"}
        </button>
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-4">
          {style && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Стиль</div>
              <div className="text-sm">{style}</div>
            </div>
          )}
          {outfit && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Одежда</div>
              <div className="text-sm">{outfit}</div>
            </div>
          )}
          {location && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Локация</div>
              <div className="text-sm">{location}</div>
            </div>
          )}
          {weather && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Погода</div>
              <div className="text-sm">{weather}</div>
            </div>
          )}
          {!style && !outfit && !location && !weather && (
            <div className="col-span-2 text-gray-400 text-sm">
              {typeof meta.suggestion === "string" ? meta.suggestion : JSON.stringify(meta.suggestion, null, 2)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Стиль</label>
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="input !py-2 text-sm"
              placeholder="Например: минимализм, динамика"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Одежда</label>
            <input
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              className="input !py-2 text-sm"
              placeholder="Например: casual, спортивный стиль"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Локация</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input !py-2 text-sm"
              placeholder="Например: студия, улица, парк"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Погода</label>
            <input
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="input !py-2 text-sm"
              placeholder="Например: солнечно, пасмурно"
            />
          </div>
          <div className="col-span-2">
            <button className="pill text-sm" onClick={() => setEditing(false)}>
              Сохранить изменения
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
