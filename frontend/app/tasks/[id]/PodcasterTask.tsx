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
  preview_url?: string | null;
  prompts?: any;
  generated_images?: any;
};

type Blogger = {
  id: number;
  name: string;
  type: string;
  theme?: string | null;
  tone_of_voice?: string | null;
  face_image?: string | null;
  locations?: any[] | null;
  animation_frames?: any[] | null;
  voice_id?: string | null;
};

export default function PodcasterTask({ task: initialTask, blogger }: { task: Task; blogger: Blogger }) {
  const [task, setTask] = useState(initialTask);
  const [activeStep, setActiveStep] = useState(1);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [fullScript, setFullScript] = useState(task.script || "");
  const [voiceoverText, setVoiceoverText] = useState(task.prompts?.voiceover_text || "");
  const [selectedLocation, setSelectedLocation] = useState<any>(task.prompts?.selected_location || null);
  const [selectedFrames, setSelectedFrames] = useState<any[]>(task.prompts?.selected_frames || []);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(task.generated_images?.audio_url || null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(task.preview_url || null);

  const saveSetup = async (data: any) => {
    await api.tasks.updatePodcasterSetup(task.id, {
      selected_location: data.selectedLocation,
      selected_frames: data.selectedFrames,
      script: data.voiceoverText,
    });
  };
  
  const [triggerSave, saveStatus] = useAutoSave(saveSetup, 1500) as [(data: any) => void, "idle" | "pending" | "saving" | "saved" | "error"];

  useEffect(() => {
    if (selectedLocation || selectedFrames.length > 0 || voiceoverText) {
      triggerSave({ selectedLocation, selectedFrames, voiceoverText });
    }
  }, [selectedLocation, selectedFrames, voiceoverText]);

  useEffect(() => {
    if (!task.script && !fullScript) {
      setActiveStep(1);
    } else if (!selectedLocation) {
      setActiveStep(2);
    } else if (!audioUrl) {
      setActiveStep(3);
    } else if (!videoUrl) {
      setActiveStep(4);
    } else {
      setActiveStep(4);
    }
  }, [task, fullScript, selectedLocation, audioUrl, videoUrl]);

  const handleGenerateScript = async () => {
    setGeneratingScript(true);
    try {
      const result = await api.tasks.generateScript(task.id);
      setFullScript(result.full_script || "");
      setVoiceoverText(result.voiceover_text || result.full_script || "");
      setTask({...task, script: result.full_script, status: result.status});
    } catch (e) {
      console.error("Script generation failed:", e);
      alert("Ошибка генерации сценария");
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!voiceoverText.trim()) {
      alert("Введите текст для озвучки");
      return;
    }
    if (!blogger.voice_id) {
      alert("У блогера не указан Voice ID");
      return;
    }
    setGeneratingAudio(true);
    try {
      const result = await api.tasks.generateAudio(task.id, {
        script: voiceoverText,
        voice_id: blogger.voice_id,
      });
      setAudioUrl(result.audio_url);
    } catch (e) {
      console.error("Audio generation failed:", e);
      alert("Ошибка генерации аудио");
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!audioUrl) {
      alert("Сначала сгенерируйте аудио");
      return;
    }
    if (!selectedLocation) {
      alert("Выберите локацию");
      return;
    }
    setGeneratingVideo(true);
    try {
      const result = await api.tasks.generateLipsync(task.id, {
        audio_url: audioUrl,
        image_url: selectedLocation.image_url,
        frames: selectedFrames,
      });
      setVideoUrl(result.video_url);
      setTask({...task, preview_url: result.video_url, status: "REVIEW"});
    } catch (e) {
      console.error("Video generation failed:", e);
      alert("Ошибка генерации видео");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const toggleFrameSelection = (frame: any) => {
    const isSelected = selectedFrames.some(f => f.id === frame.id);
    if (isSelected) {
      setSelectedFrames(selectedFrames.filter(f => f.id !== frame.id));
    } else {
      setSelectedFrames([...selectedFrames, frame]);
    }
  };

  const canProceedToStep = (step: number) => {
    if (step === 2) return fullScript.length > 0;
    if (step === 3) return selectedLocation !== null;
    if (step === 4) return audioUrl !== null;
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Подкаст — {task.date}</h1>
        <div className="text-sm text-gray-400">{blogger.name} • {task.content_type} • {task.status}</div>
      </div>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Сценарий", done: fullScript.length > 0 },
            { num: 2, label: "Настройка", done: selectedLocation !== null },
            { num: 3, label: "Аудио", done: audioUrl !== null },
            { num: 4, label: "Видео", done: videoUrl !== null },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center">
              <button
                onClick={() => canProceedToStep(step.num) && setActiveStep(step.num)}
                disabled={!canProceedToStep(step.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeStep === step.num ? "bg-lime-400/20 border-2 border-lime-400 text-lime-400" : step.done ? "bg-lime-400/10 border border-lime-400/30 text-lime-400" : "bg-white/5 border border-white/10 text-gray-400"
                } ${!canProceedToStep(step.num) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/10"}`}
              >
                {step.done ? "✓" : step.num}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < 3 && <div className="w-8 h-0.5 bg-white/10 mx-2" />}
            </div>
          ))}
        </div>
      </div>
      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Шаг 1: Генерация сценария</h3>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Идея выпуска:</div>
              <div className="text-gray-300">{task.idea || "Идея не указана"}</div>
            </div>
            {!fullScript ? (
              <button onClick={handleGenerateScript} disabled={generatingScript} className="btn btn-primary w-full disabled:opacity-50">
                {generatingScript ? "Генерация сценария..." : "🤖 Сгенерировать сценарий"}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Полный сценарий</label>
                    <button onClick={() => setFullScript("")} className="text-xs text-gray-500 hover:text-gray-300">🔄 Перегенерировать</button>
                  </div>
                  <textarea value={fullScript} onChange={(e) => setFullScript(e.target.value)} className="input min-h-[150px] font-mono text-sm" placeholder="Полный сценарий с описаниями..." />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Текст для озвучки (редактируемый)</label>
                  <textarea value={voiceoverText} onChange={(e) => setVoiceoverText(e.target.value)} className="input min-h-[200px] font-mono text-sm" placeholder="Только текст, который будет произнесен..." />
                  <div className="text-xs text-gray-500 mt-1">💡 Отредактируйте текст перед генерацией аудио</div>
                </div>
                <button onClick={() => setActiveStep(2)} className="btn btn-primary w-full">Продолжить к настройке →</button>
              </div>
            )}
          </div>
        </div>
      )}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Шаг 2: Выбор локации и кадров</h3>
            <div>
              <h4 className="text-md font-medium mb-3">Локация для видео</h4>
              {!blogger.locations || blogger.locations.length === 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <div className="text-yellow-400 text-sm">⚠️ У блогера нет созданных локаций. Создайте их в настройках блогера.</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {blogger.locations.map((location, index) => (
                    <button key={location.id || index} onClick={() => setSelectedLocation(location)} className={`relative rounded-lg overflow-hidden border-2 transition ${selectedLocation?.id === location.id ? "border-lime-400 ring-2 ring-lime-400/50" : "border-white/10 hover:border-white/30"}`}>
                      <div className="aspect-[3/4] bg-white/5">
                        <img src={location.image_url} alt="Location" className="w-full h-full object-cover" />
                      </div>
                      {selectedLocation?.id === location.id && <div className="absolute top-2 right-2 bg-lime-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">✓</div>}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white line-clamp-2">{location.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {blogger.animation_frames && blogger.animation_frames.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2">Кадры для анимации (опционально)</h4>
                <p className="text-sm text-gray-400 mb-3">Выберите кадры с разными эмоциями для более динамичной анимации</p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {blogger.animation_frames.map((frame, index) => {
                    const isSelected = selectedFrames.some(f => f.id === frame.id);
                    return (
                      <button key={frame.id || index} onClick={() => toggleFrameSelection(frame)} className={`relative rounded-lg overflow-hidden border-2 transition ${isSelected ? "border-lime-400" : "border-white/10 hover:border-white/30"}`}>
                        <div className="aspect-[3/4] bg-white/5">
                          <img src={frame.image_url} alt="Frame" className="w-full h-full object-cover" />
                        </div>
                        {isSelected && <div className="absolute top-1 right-1 bg-lime-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</div>}
                        {frame.emotion && <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs">{frame.emotion}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setActiveStep(1)} className="btn">← Назад к сценарию</button>
              <div className="flex items-center gap-3">
                <SaveIndicator status={saveStatus} />
                <button onClick={() => setActiveStep(3)} disabled={!selectedLocation} className="btn btn-primary disabled:opacity-50">Продолжить к генерации аудио →</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Шаг 3: Генерация аудио</h3>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Текст для озвучки:</div>
              <div className="text-sm font-mono text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap">{voiceoverText}</div>
            </div>
            {blogger.voice_id && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>🎙️ Голос:</span>
                <span className="text-lime-400">{blogger.voice_id}</span>
              </div>
            )}
            {!audioUrl ? (
              <button onClick={handleGenerateAudio} disabled={generatingAudio || !blogger.voice_id} className="btn btn-primary w-full disabled:opacity-50">
                {generatingAudio ? "Генерация аудио..." : "🎵 Сгенерировать аудио"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg space-y-3">
                  <div className="text-lime-400 text-sm font-medium">✓ Аудио готово</div>
                  <audio controls className="w-full" src={audioUrl}>Your browser does not support the audio element.</audio>
                </div>
                <button onClick={() => setAudioUrl(null)} className="btn w-full">🔄 Перегенерировать аудио</button>
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setActiveStep(2)} className="btn">← Назад к настройке</button>
              <button onClick={() => setActiveStep(4)} disabled={!audioUrl} className="btn btn-primary disabled:opacity-50">Продолжить к генерации видео →</button>
            </div>
          </div>
        </div>
      )}
      {activeStep === 4 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Шаг 4: Генерация lip-sync видео</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {selectedLocation && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Базовая локация:</div>
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <img src={selectedLocation.image_url} alt="Location" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              {audioUrl && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Аудио дорожка:</div>
                  <audio controls className="w-full" src={audioUrl}>Your browser does not support the audio element.</audio>
                </div>
              )}
            </div>
            {selectedFrames.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-2">Кадры для анимации ({selectedFrames.length}):</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedFrames.map((frame, index) => (
                    <div key={index} className="w-24 flex-shrink-0">
                      <div className="aspect-[3/4] rounded overflow-hidden bg-white/5 border border-white/10">
                        <img src={frame.image_url} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      {frame.emotion && <div className="text-xs text-center text-gray-400 mt-1">{frame.emotion}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!videoUrl ? (
              <button onClick={handleGenerateVideo} disabled={generatingVideo} className="btn btn-primary w-full disabled:opacity-50">
                {generatingVideo ? "Генерация видео... (это может занять 2-5 минут)" : "🎬 Сгенерировать lip-sync видео"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg space-y-3">
                  <div className="text-lime-400 text-sm font-medium">✓ Видео готово!</div>
                  <video controls className="w-full max-w-2xl mx-auto rounded-lg" src={videoUrl}>Your browser does not support the video element.</video>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setVideoUrl(null)} className="btn flex-1">🔄 Перегенерировать видео</button>
                  <a href={videoUrl} download className="btn btn-primary flex-1 text-center">📥 Скачать видео</a>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setActiveStep(3)} className="btn">← Назад к аудио</button>
              {videoUrl && <button className="btn btn-primary">📤 Опубликовать</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
