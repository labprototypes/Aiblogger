"use client";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { useAutoSave } from "../../../hooks/useAutoSave";
import SaveIndicator from "../../../components/SaveIndicator";
import LocationSelector from "./LocationSelector";
import OutfitBuilder from "./OutfitBuilder";
import FashionFrameGenerator from "./FashionFrameGenerator";

type Task = {
  id: number;
  blogger_id: number;
  date: string;
  content_type: string;
  idea?: string | null;
  script?: string | null;
  status: string;
  location_id?: number | null;
  location_description?: string | null;
  outfit?: any;
  main_image_url?: string | null;
  prompts?: any;
  generated_images?: any;
};

type Blogger = {
  id: number;
  name: string;
  type: string;
  locations?: Array<{title: string; description: string; thumbnail?: string}> | null;
};

export default function FashionPostTask({ task: initialTask, blogger }: { task: Task; blogger: Blogger }) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState<"setup" | "generate">("setup");
  const [bloggerLocations, setBloggerLocations] = useState<Array<{title: string; description: string; thumbnail?: string}>>(blogger.locations || []);

  // Setup state
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(task.location_id ?? null);
  const [locationDescription, setLocationDescription] = useState(task.location_description || "");
  const [outfit, setOutfit] = useState(task.outfit || {});

  // Auto-save setup changes
  const saveSetup = async (data: { location_id: number | null; location_description: string; outfit: any }) => {
    await api.tasks.updateFashionSetup(task.id, data);
  };
  
  const [triggerSave, saveStatus] = useAutoSave(saveSetup, 1500) as [(data: any) => void, "idle" | "pending" | "saving" | "saved" | "error"];

  // Trigger save on any setup field change
  useEffect(() => {
    if (activeTab === "setup") {
      triggerSave({
        location_id: selectedLocationId,
        location_description: locationDescription,
        outfit,
      });
    }
  }, [selectedLocationId, locationDescription, outfit, activeTab, triggerSave]);

  // Generation state
  const [mainFrame, setMainFrame] = useState<{url: string; prompt: string; approved: boolean} | null>(
    task.main_image_url && task.prompts?.main 
      ? {url: task.main_image_url, prompt: task.prompts.main, approved: true}
      : null
  );
  const [additionalFrames, setAdditionalFrames] = useState<Array<{url: string; prompt: string; approved: boolean}>>([]);
  const [generating, setGenerating] = useState(false);

  const handleLocationChange = (locationId: number | null, description: string) => {
    setSelectedLocationId(locationId);
    setLocationDescription(description);
  };

  const handleLocationCreated = (newLocation: {title: string; description: string; thumbnail?: string}) => {
    setBloggerLocations(prev => [...prev, newLocation]);
  };

  const handleGenerate = async (type: "main" | "additional") => {
    setGenerating(true);
    try {
      if (type === "main") {
        const result = await api.tasks.generateMainFrame(task.id, {});
        setMainFrame({url: result.image_url, prompt: result.prompt, approved: false});
      } else {
        const result = await api.tasks.generateAdditionalFrames(task.id, mainFrame?.prompt);
        setAdditionalFrames(result.frames.map(f => ({url: f.image_url, prompt: f.prompt, approved: false})));
      }
    } catch (e) {
      console.error("Generation failed:", e);
      alert("Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (imageType: string, customInstructions?: string) => {
    setGenerating(true);
    try {
      if (imageType === "main") {
        const result = await api.tasks.generateMainFrame(task.id, {
          prompt: mainFrame?.prompt,
          custom_instructions: customInstructions
        });
        setMainFrame({url: result.image_url, prompt: result.prompt, approved: false});
      } else {
        // For angle regeneration, regenerate all angles based on main
        const result = await api.tasks.generateAdditionalFrames(task.id, mainFrame?.prompt);
        setAdditionalFrames(result.frames.map(f => ({url: f.image_url, prompt: f.prompt, approved: false})));
      }
    } catch (e) {
      console.error("Regeneration failed:", e);
      alert("Ошибка регенерации");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (imageType: string) => {
    try {
      await api.tasks.approveFrame(task.id, imageType);
      if (imageType === "main") {
        setMainFrame(prev => prev ? {...prev, approved: true} : null);
      } else {
        // Update specific angle approved status
        const angleIndex = parseInt(imageType.replace("angle", "")) - 1;
        setAdditionalFrames(prev => prev.map((f, i) => i === angleIndex ? {...f, approved: true} : f));
      }
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Ошибка подтверждения");
    }
  };

  const handleApproveAll = async () => {
    try {
      // Approve all 3 angles at once
      await Promise.all([
        api.tasks.approveFrame(task.id, "angle1"),
        api.tasks.approveFrame(task.id, "angle2"),
        api.tasks.approveFrame(task.id, "angle3"),
      ]);
      
      // Update all to approved
      setAdditionalFrames(prev => prev.map(f => ({...f, approved: true})));
    } catch (e) {
      console.error("Bulk approve failed:", e);
      alert("Ошибка подтверждения");
    }
  };

  const handleEditPrompt = (imageType: string, newPrompt: string) => {
    if (imageType === "main") {
      setMainFrame(prev => prev ? {...prev, prompt: newPrompt} : null);
    }
  };

  const setupComplete = selectedLocationId !== null || locationDescription.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Fashion Post — {task.date}</h1>
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
            <h3 className="text-lg font-semibold mb-3">Идея поста</h3>
            <div className="bg-white/5 p-4 rounded-lg text-gray-300">
              {task.idea || "Идея не сгенерирована"}
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Локация съёмки</h3>
            <LocationSelector
              bloggerId={blogger.id}
              bloggerLocations={bloggerLocations}
              selectedLocationId={selectedLocationId}
              customLocationDescription={locationDescription}
              onChange={handleLocationChange}
              onLocationCreated={handleLocationCreated}
            />
          </div>

          {/* Outfit */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Образ</h3>
            <OutfitBuilder outfit={outfit} onChange={setOutfit} />
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
        <div>
          <FashionFrameGenerator
            taskId={task.id}
            mainImage={mainFrame}
            additionalImages={additionalFrames}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            onApprove={handleApprove}
            onApproveAll={handleApproveAll}
            onEditPrompt={handleEditPrompt}
          />
        </div>
      )}
    </div>
  );
}
