"use client";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { useAutoSave } from "../../../hooks/useAutoSave";
import SaveIndicator from "../../../components/SaveIndicator";

type Task = {
  id: number;
  blogger_id: number;
  date: string;
  content_type: string;
  idea?: string | null;
  script?: string | null;
  status: string;
  // Podcaster-specific fields
  selected_location?: any;
  selected_frames?: any[];
  audio_url?: string | null;
  lipsync_video_url?: string | null;
};

type Blogger = {
  id: number;
  name: string;
  type: string;
  face_image?: string;
  locations?: any[] | null;
  animation_frames?: any[] | null;
  voice_id?: string;
};

export default function PodcasterTask({ task: initialTask, blogger }: { task: Task; blogger: Blogger }) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState<"setup" | "generate">("setup");

  // Setup state
  const [selectedLocation, setSelectedLocation] = useState<any>(task.selected_location || null);
  const [selectedFrames, setSelectedFrames] = useState<any[]>(task.selected_frames || []);
  const [script, setScript] = useState(task.script || "");

  // Generation state
  const [audioUrl, setAudioUrl] = useState<string | null>(task.audio_url || null);
  const [lipsyncVideoUrl, setLipsyncVideoUrl] = useState<string | null>(task.lipsync_video_url || null);
  const [generating, setGenerating] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingLipsync, setGeneratingLipsync] = useState(false);

  // Auto-save setup changes
  const saveSetup = async (data: { selected_location: any; selected_frames: any[]; script: string }) => {
    await api.tasks.updatePodcasterSetup(task.id, data);
  };
  
  const [triggerSave, saveStatus] = useAutoSave(saveSetup, 1500) as [(data: any) => void, "idle" | "pending" | "saving" | "saved" | "error"];

  // Trigger save on any setup field change
  useEffect(() => {
    if (activeTab === "setup") {
      triggerSave({
        selected_location: selectedLocation,
        selected_frames: selectedFrames,
        script,
      });
    }
  }, [selectedLocation, selectedFrames, script, activeTab, triggerSave]);

  const handleGenerateAudio = async () => {
    if (!script.trim()) {
      alert("Введите текст скрипта");
      return;
    }

    if (!blogger.voice_id) {
      alert("У блогера не указан Voice ID");
      return;
    }

    setGeneratingAudio(true);
    try {
      const result = await api.tasks.generateAudio(task.id, {
        script,
        voice_id: blogger.voice_id,
      });
      
      setAudioUrl(result.audio_url);
      alert("Аудио успешно сгенерировано!");
    } catch (e) {
      console.error("Audio generation failed:", e);
      alert("Ошибка генерации аудио");
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleGenerateLipsync = async () => {
    if (!audioUrl) {
      alert("Сначала сгенерируйте аудио");
      return;
    }

    if (!selectedLocation) {
      alert("Выберите локацию");
      return;
    }

    setGeneratingLipsync(true);
    try {
      const result = await api.tasks.generateLipsync(task.id, {
        audio_url: audioUrl,
        image_url: selectedLocation.image_url,
        frames: selectedFrames,
      });
      
      setLipsyncVideoUrl(result.video_url);
      alert("Lip-sync видео успешно сгенерировано!");
    } catch (e) {
      console.error("Lipsync generation failed:", e);
      alert("Ошибка генерации lip-sync");
    } finally {
      setGeneratingLipsync(false);
    }
  };

  const setupComplete = selectedLocation !== null && script.trim().length > 0;

  const toggleFrameSelection = (frame: any) => {
    const isSelected = selectedFrames.some(f => f.id === frame.id);
    if (isSelected) {
      setSelectedFrames(selectedFrames.filter(f => f.id !== frame.id));
    } else {
      setSelectedFrames([...selectedFrames, frame]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Подкаст — {task.date}</h1>
        <div className="text-sm text-gray-400">
          {blogger.name} • {task.content_type} • {task.status}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("setup")}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === "setup"
              ? "border-lime-400 text-lime-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          1️⃣ Настройка
        </button>
        <button
          onClick={() => setupComplete && setActiveTab("generate")}
          disabled={!setupComplete}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === "generate"
              ? "border-lime-400 text-lime-400"
              : setupComplete
              ? "border-transparent text-gray-400 hover:text-gray-200"
              : "border-transparent text-gray-600 cursor-not-allowed"
          }`}
        >
          2️⃣ Генерация
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "setup" && (
        <div className="space-y-6">
          {/* Idea */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-3">Идея выпуска</h3>
            <div className="bg-white/5 p-4 rounded-lg text-gray-300">
              {task.idea || "Идея не сгенерирована"}
            </div>
          </div>

          {/* Script */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Текст для озвучки</h3>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="input min-h-[200px] font-mono text-sm"
              placeholder="Введите или вставьте текст скрипта для подкаста..."
            />
            <div className="text-xs text-gray-500">
              💡 Этот текст будет озвучен через ElevenLabs с голосом блогера
            </div>
          </div>

          {/* Location Selection */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Выбор локации</h3>
            
            {!blogger.locations || blogger.locations.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <div className="text-yellow-400 text-sm">
                  ⚠️ У блогера нет созданных локаций. Создайте их в настройках блогера.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {blogger.locations.map((location, index) => (
                  <button
                    key={location.id || index}
                    onClick={() => setSelectedLocation(location)}
                    className={`relative rounded-lg overflow-hidden border-2 transition ${
                      selectedLocation?.id === location.id
                        ? "border-lime-400"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-white/5">
                      <img
                        src={location.image_url}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedLocation?.id === location.id && (
                      <div className="absolute top-2 right-2 bg-lime-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white line-clamp-2">{location.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Animation Frames Selection */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Кадры для анимации (опционально)</h3>
            <p className="text-sm text-gray-400">
              Выберите кадры с разными эмоциями для более динамичной анимации
            </p>
            
            {!blogger.animation_frames || blogger.animation_frames.length === 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                <div className="text-blue-300 text-sm">
                  💡 Кадры не созданы. Можно пропустить или создать их в настройках блогера.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {blogger.animation_frames.map((frame, index) => {
                  const isSelected = selectedFrames.some(f => f.id === frame.id);
                  return (
                    <button
                      key={frame.id || index}
                      onClick={() => toggleFrameSelection(frame)}
                      className={`relative rounded-lg overflow-hidden border-2 transition ${
                        isSelected
                          ? "border-lime-400"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-white/5">
                        <img
                          src={frame.image_url}
                          alt="Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-lime-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                      {frame.emotion && (
                        <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs">
                          {frame.emotion}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <SaveIndicator status={saveStatus} />
            <button
              onClick={() => setActiveTab("generate")}
              disabled={!setupComplete}
              className="btn btn-primary disabled:opacity-50"
            >
              Продолжить к генерации →
            </button>
          </div>
        </div>
      )}

      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Audio Generation */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">1. Генерация аудио</h3>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Скрипт:</div>
              <div className="text-sm font-mono text-gray-300 max-h-32 overflow-y-auto">
                {script}
              </div>
            </div>

            {blogger.voice_id && (
              <div className="text-sm text-gray-400">
                🎙️ Голос: {blogger.voice_id}
              </div>
            )}

            {!audioUrl ? (
              <button
                onClick={handleGenerateAudio}
                disabled={generatingAudio || !blogger.voice_id}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {generatingAudio ? "Генерация аудио..." : "🎵 Сгенерировать аудио"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg">
                  <div className="text-lime-400 text-sm font-medium mb-2">✓ Аудио готово</div>
                  <audio controls className="w-full" src={audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <button
                  onClick={handleGenerateAudio}
                  disabled={generatingAudio}
                  className="btn w-full"
                >
                  🔄 Перегенерировать аудио
                </button>
              </div>
            )}
          </div>

          {/* Lipsync Generation */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">2. Генерация lip-sync видео</h3>
            
            {!audioUrl ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <div className="text-yellow-400 text-sm">
                  ⚠️ Сначала сгенерируйте аудио
                </div>
              </div>
            ) : (
              <>
                {selectedLocation && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Базовый кадр:</div>
                    <div className="w-48 aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                      <img
                        src={selectedLocation.image_url}
                        alt="Location"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {selectedFrames.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">
                      Кадры для анимации ({selectedFrames.length}):
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedFrames.map((frame, index) => (
                        <div key={index} className="w-24 flex-shrink-0">
                          <div className="aspect-[3/4] rounded overflow-hidden bg-white/5 border border-white/10">
                            <img
                              src={frame.image_url}
                              alt={`Frame ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!lipsyncVideoUrl ? (
                  <button
                    onClick={handleGenerateLipsync}
                    disabled={generatingLipsync}
                    className="btn btn-primary w-full disabled:opacity-50"
                  >
                    {generatingLipsync ? "Генерация видео... (это может занять несколько минут)" : "🎬 Сгенерировать lip-sync видео"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg">
                      <div className="text-lime-400 text-sm font-medium mb-2">✓ Видео готово</div>
                      <video controls className="w-full max-w-md rounded-lg" src={lipsyncVideoUrl}>
                        Your browser does not support the video element.
                      </video>
                    </div>
                    <button
                      onClick={handleGenerateLipsync}
                      disabled={generatingLipsync}
                      className="btn w-full"
                    >
                      🔄 Перегенерировать видео
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Publishing */}
          {lipsyncVideoUrl && (
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">3. Публикация</h3>
              <p className="text-sm text-gray-400">
                Видео готово к публикации. Скачайте его или отправьте напрямую в соцсети.
              </p>
              <div className="flex gap-3">
                <a
                  href={lipsyncVideoUrl}
                  download
                  className="btn btn-primary"
                >
                  📥 Скачать видео
                </a>
                <button className="btn">
                  📤 Опубликовать
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
