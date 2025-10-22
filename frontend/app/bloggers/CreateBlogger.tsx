"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import ImageUpload from "../../components/ImageUpload";

export default function CreateBlogger() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = type selection, 2 = form
  const router = useRouter();

  // Step 1 - Type selection
  const [bloggerType, setBloggerType] = useState<"podcaster" | "fashion" | "">("");

  // Step 2 - Form fields
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [tone, setTone] = useState("");
  const [theme, setTheme] = useState("");
  const [voiceId, setVoiceId] = useState("");

  // New fields
  const [locations, setLocations] = useState<string[]>([]);
  const [editingType, setEditingType] = useState<"overlay" | "rotoscope" | "static">("overlay");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  
  // Content frequency: {reels: 3, post: 2, story: 1, short: 0}
  const [freqReels, setFreqReels] = useState(0);
  const [freqPost, setFreqPost] = useState(0);
  const [freqStory, setFreqStory] = useState(0);
  const [freqShort, setFreqShort] = useState(0);

  const [saving, setSaving] = useState(false);

  const handleTypeSelect = (type: "podcaster" | "fashion") => {
    setBloggerType(type);
    // Set defaults based on type
    if (type === "podcaster") {
      setEditingType("overlay");
    } else {
      setEditingType("static");
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!name || !bloggerType) return;

    const contentFrequency: any = {};
    if (freqReels > 0) contentFrequency.reels = freqReels;
    if (freqPost > 0) contentFrequency.post = freqPost;
    if (freqStory > 0) contentFrequency.story = freqStory;
    if (freqShort > 0) contentFrequency.short = freqShort;

    setSaving(true);
    try {
      await api.bloggers.create({
        name,
        type: bloggerType,
        image: image || undefined,
        // @ts-ignore
        tone_of_voice: tone || undefined,
        theme: theme || undefined,
        // @ts-ignore
        voice_id: voiceId || undefined,
        locations: locations.length > 0 ? locations : undefined,
        // @ts-ignore
        editing_type: editingType,
        // @ts-ignore
        subtitles_enabled: subtitlesEnabled ? 1 : 0,
        // @ts-ignore
        content_frequency: Object.keys(contentFrequency).length > 0 ? contentFrequency : undefined,
      } as any);
      setOpen(false);
      router.refresh();
      // Reset form
      setStep(1);
      setBloggerType("");
      setName("");
      setImage("");
      setTone("");
      setTheme("");
      setVoiceId("");
      setLocations([]);
      setEditingType("overlay");
      setSubtitlesEnabled(false);
      setFreqReels(0);
      setFreqPost(0);
      setFreqStory(0);
      setFreqShort(0);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const maxLocations = bloggerType === "podcaster" ? 2 : 5;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-lime-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-lime-300 transition"
      >
        + Создать блогера
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0A0B0F] rounded-xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0A0B0F] border-b border-white/10 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {step === 1 ? "Выберите тип блогера" : "Настройте блогера"}
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setStep(1);
                  setBloggerType("");
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {step === 1 && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => handleTypeSelect("podcaster")}
                    className="group bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 hover:border-purple-400 rounded-2xl p-8 text-center transition-all hover:scale-105"
                  >
                    <div className="text-6xl mb-4">🎙️</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Подкастер</h3>
                    <p className="text-sm text-gray-400">
                      Озвучка, overlay/rotoscope, субтитры
                    </p>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("fashion")}
                    className="group bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-2 border-pink-500/30 hover:border-pink-400 rounded-2xl p-8 text-center transition-all hover:scale-105"
                  >
                    <div className="text-6xl mb-4">👗</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Фэшн</h3>
                    <p className="text-sm text-gray-400">
                      Локации, статичный монтаж
                    </p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400 border-b border-white/10 pb-2">
                      Основная информация
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Имя *</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                        placeholder="Введите имя блогера"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tone of Voice</label>
                      <textarea
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 min-h-[80px]"
                        placeholder="Опишите стиль и тон контента"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Тема</label>
                      <input
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                        placeholder="Основная тема контента"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID (ElevenLabs)</label>
                      <input
                        value={voiceId}
                        onChange={(e) => setVoiceId(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400"
                        placeholder="Вставьте Voice ID из ElevenLabs"
                      />
                    </div>
                  </div>

                  {/* Media Uploads */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400 border-b border-white/10 pb-2">
                      Медиа
                    </h3>
                    <ImageUpload
                      label="Аватар блогера"
                      value={image}
                      onChange={(url) => setImage(url as string)}
                    />
                    <ImageUpload
                      label={`Локации (${locations.length}/${maxLocations})`}
                      value={locations}
                      onChange={(urls) => setLocations(urls as string[])}
                      multiple
                      maxFiles={maxLocations}
                    />
                  </div>

                  {/* Editing Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400 border-b border-white/10 pb-2">
                      Настройки монтажа
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Тип монтажа</label>
                      <div className="flex gap-4">
                        {bloggerType === "podcaster" ? (
                          <>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="overlay"
                                checked={editingType === "overlay"}
                                onChange={(e) => setEditingType(e.target.value as any)}
                                className="w-4 h-4"
                              />
                              <span className="text-white">Overlay</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="rotoscope"
                                checked={editingType === "rotoscope"}
                                onChange={(e) => setEditingType(e.target.value as any)}
                                className="w-4 h-4"
                              />
                              <span className="text-white">Rotoscope</span>
                            </label>
                          </>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value="static"
                              checked={editingType === "static"}
                              onChange={(e) => setEditingType(e.target.value as any)}
                              className="w-4 h-4"
                            />
                            <span className="text-white">Static</span>
                          </label>
                        )}
                      </div>
                    </div>
                    {bloggerType === "podcaster" && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subtitlesEnabled}
                          onChange={(e) => setSubtitlesEnabled(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-white">Включить субтитры</span>
                      </label>
                    )}
                  </div>

                  {/* Content Frequency */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400 border-b border-white/10 pb-2">
                      Частота контента (в неделю)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={freqReels > 0} onChange={(e) => setFreqReels(e.target.checked ? 1 : 0)} className="w-4 h-4" />
                        <span className="text-white flex-1">Reels</span>
                        {freqReels > 0 && (
                          <input
                            type="number"
                            min="0"
                            value={freqReels}
                            onChange={(e) => setFreqReels(Number(e.target.value))}
                            className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-center"
                          />
                        )}
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={freqPost > 0} onChange={(e) => setFreqPost(e.target.checked ? 1 : 0)} className="w-4 h-4" />
                        <span className="text-white flex-1">Post</span>
                        {freqPost > 0 && (
                          <input
                            type="number"
                            min="0"
                            value={freqPost}
                            onChange={(e) => setFreqPost(Number(e.target.value))}
                            className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-center"
                          />
                        )}
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={freqStory > 0} onChange={(e) => setFreqStory(e.target.checked ? 1 : 0)} className="w-4 h-4" />
                        <span className="text-white flex-1">Story</span>
                        {freqStory > 0 && (
                          <input
                            type="number"
                            min="0"
                            value={freqStory}
                            onChange={(e) => setFreqStory(Number(e.target.value))}
                            className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-center"
                          />
                        )}
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={freqShort > 0} onChange={(e) => setFreqShort(e.target.checked ? 1 : 0)} className="w-4 h-4" />
                        <span className="text-white flex-1">Short</span>
                        {freqShort > 0 && (
                          <input
                            type="number"
                            min="0"
                            value={freqShort}
                            onChange={(e) => setFreqShort(Number(e.target.value))}
                            className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-white text-center"
                          />
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-[#0A0B0F] border-t border-white/10 p-6 flex justify-between">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded-lg font-medium text-gray-300 hover:bg-white/5 transition"
                  >
                    ← Назад
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setOpen(false);
                        setStep(1);
                        setBloggerType("");
                      }}
                      className="px-6 py-3 rounded-lg font-medium text-gray-300 hover:bg-white/5 transition"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={saving || !name}
                      className="bg-lime-400 text-black px-6 py-3 rounded-lg font-medium hover:bg-lime-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Создание..." : "Создать"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
