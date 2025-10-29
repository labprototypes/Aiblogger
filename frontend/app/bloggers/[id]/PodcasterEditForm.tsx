"use client";
import React, { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import SaveIndicator from "../../../components/SaveIndicator";
import { useAutoSave } from "../../../hooks/useAutoSave";
import FaceEditor from "./FaceEditor";
import PodcasterLocationsManager from "./PodcasterLocationsManager";
import AnimationFramesManager from "./AnimationFramesManager";

type Props = {
  bloggerId: number;
  initialBlogger: any;
};

export default function PodcasterEditForm({ bloggerId, initialBlogger }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  
  const [name, setName] = useState(initialBlogger.name);
  const [theme, setTheme] = useState((initialBlogger as any).theme || "");
  const [tone, setTone] = useState((initialBlogger as any).tone_of_voice || "");
  const [voiceId, setVoiceId] = useState((initialBlogger as any).voice_id || "");
  const [faceImage, setFaceImage] = useState((initialBlogger as any).face_image || "");
  const [facePrompt, setFacePrompt] = useState((initialBlogger as any).face_prompt || "");
  const [locations, setLocations] = useState<any[]>((initialBlogger as any).locations || []);
  const [animationFrames, setAnimationFrames] = useState<any[]>((initialBlogger as any).animation_frames || []);

  const saveChanges = async (data: any) => {
    await api.bloggers.update(bloggerId, {
      name: data.name,
      type: "podcaster",
      image: data.faceImage,
      face_image: data.faceImage,
      face_prompt: data.facePrompt,
      voice_id: data.voiceId,
      tone_of_voice: data.tone,
      theme: data.theme,
      locations: data.locations,
      animation_frames: data.animationFrames,
    } as any);
  };

  const [triggerSave, saveStatus] = useAutoSave(saveChanges, 1500) as [
    (data: any) => void,
    "idle" | "pending" | "saving" | "saved" | "error"
  ];

  useEffect(() => {
    triggerSave({
      name,
      faceImage,
      facePrompt,
      voiceId,
      tone,
      theme,
      locations,
      animationFrames,
    });
  }, [name, faceImage, facePrompt, voiceId, tone, theme, locations, animationFrames]);

  const goBack = () => {
    window.location.href = "/bloggers";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Редактирование подкастера</h1>
          <p className="text-gray-400 mt-1">{initialBlogger.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <button onClick={goBack} className="btn">← Назад к списку</button>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-white/10">
          <button onClick={() => setActiveTab(0)} className={`flex-1 py-4 px-6 font-medium transition ${activeTab === 0 ? "border-b-2 border-lime-400 text-lime-400" : "text-gray-400 hover:text-white"}`}>
            1️⃣ Персонаж
          </button>
          <button onClick={() => setActiveTab(1)} className={`flex-1 py-4 px-6 font-medium transition ${activeTab === 1 ? "border-b-2 border-lime-400 text-lime-400" : "text-gray-400 hover:text-white"}`}>
            2️⃣ Локации
          </button>
          <button onClick={() => setActiveTab(2)} className={`flex-1 py-4 px-6 font-medium transition ${activeTab === 2 ? "border-b-2 border-lime-400 text-lime-400" : "text-gray-400 hover:text-white"}`}>
            3️⃣ Кадры для анимации
          </button>
        </div>
      </div>

      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Имя подкастера</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Введите имя" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Тематика</label>
              <input value={theme} onChange={(e) => setTheme(e.target.value)} className="input" placeholder="Например: технологии, бизнес, наука" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Тональность голоса</label>
              <textarea value={tone} onChange={(e) => setTone(e.target.value)} className="input min-h-[80px]" placeholder="Описание стиля общения" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Voice ID (ElevenLabs)</label>
              <input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="input" placeholder="ID голоса" />
            </div>
          </div>
          <FaceEditor bloggerId={bloggerId} faceImage={faceImage} facePrompt={facePrompt} onFaceChange={(image: string, prompt: string) => { setFaceImage(image); setFacePrompt(prompt); }} />
        </div>
      )}

      {activeTab === 1 && (
        <PodcasterLocationsManager bloggerId={bloggerId} faceImage={faceImage} locations={locations} onLocationsChange={setLocations} />
      )}

      {activeTab === 2 && (
        <AnimationFramesManager bloggerId={bloggerId} locations={locations} frames={animationFrames} onFramesChange={setAnimationFrames} />
      )}
    </div>
  );
}
