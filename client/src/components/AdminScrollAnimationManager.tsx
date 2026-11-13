import { useState, useRef, useEffect } from "react";
import {
  Film,
  Upload,
  Globe,
  Sliders,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Save,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { uploadMediaWithProgress } from "@/lib/uploadProgress";
import { saveSiteConfigToFirestore, type FirebaseMediaItem } from "@/lib/firebaseMedia";
import type {
  ScrollAnimationConfig,
  ScrollAnimationStage,
  SiteCustomization,
} from "@/lib/siteCustomization";
import { DEFAULT_SCROLL_ANIMATION } from "@/lib/siteCustomization";

interface AdminScrollAnimationManagerProps {
  siteCustom: SiteCustomization;
  onUpdateSiteCustom: (next: SiteCustomization, message?: string) => Promise<void>;
  firestoreMedia?: FirebaseMediaItem[];
  language: "en" | "ar";
}

export function AdminScrollAnimationManager({
  siteCustom,
  onUpdateSiteCustom,
  firestoreMedia = [],
  language,
}: AdminScrollAnimationManagerProps) {
  const isArabic = language === "ar";

  const currentConfig: ScrollAnimationConfig = siteCustom.scrollAnimation || DEFAULT_SCROLL_ANIMATION;

  // Local draft state
  const [config, setConfig] = useState<ScrollAnimationConfig>(currentConfig);
  const [uploadMode, setUploadMode] = useState<"file" | "url" | "vault">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState(currentConfig.videoUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  // Live preview simulator state
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [simulatedScroll, setSimulatedScroll] = useState(0.2); // 0 to 1
  const [previewDuration, setPreviewDuration] = useState(10);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);

  // Sync when prop updates
  useEffect(() => {
    if (siteCustom.scrollAnimation) {
      setConfig(siteCustom.scrollAnimation);
      setDirectUrlInput(siteCustom.scrollAnimation.videoUrl);
    }
  }, [siteCustom.scrollAnimation]);

  // Scrub preview video when simulatedScroll changes
  useEffect(() => {
    const v = previewVideoRef.current;
    if (!v || isPlayingPreview) return;
    if (v.duration && !isNaN(v.duration)) {
      v.currentTime = simulatedScroll * v.duration;
    }
  }, [simulatedScroll, isPlayingPreview]);

  // Handle file upload directly to Firebase
  const handleUploadAnimationVideo = async () => {
    if (!videoFile) {
      toast.error(isArabic ? "يرجى اختيار ملف فيديو أولاً." : "Please select a video file first.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(5);

      const pairKey = `scroll-anim-${Date.now()}`;
      const uploaded = await uploadMediaWithProgress(
        {
          kind: "video",
          language: "shared",
          pairKey,
          title: `Scroll Animation: ${videoFile.name.slice(0, 40)}`,
          fileName: videoFile.name,
          mimeType: videoFile.type || "video/mp4",
          publish: true,
        },
        videoFile,
        (pct) => setUploadProgress(pct)
      );

      setUploadProgress(100);

      const resolvedUrl = uploaded.url;
      const nextConfig: SiteCustomization = {
        ...siteCustom,
        sections: {
          ...siteCustom.sections,
          scrollAnimation: true,
        },
        scrollAnimation: {
          ...config,
          enabled: true,
          videoUrl: resolvedUrl,
        },
      };

      setConfig(nextConfig.scrollAnimation!);
      setDirectUrlInput(resolvedUrl);
      setVideoFile(null);

      // Persist to Firestore and local state
      await onUpdateSiteCustom(
        nextConfig,
        isArabic
          ? "تم رفع فيديو الرسوم المتحركة إلى فايربيس وتحديث الموقع بنجاح!"
          : "Animation video uploaded to Firebase & site updated successfully!"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload video.";
      toast.error(isArabic ? `فشل الرفع: ${msg}` : msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Apply URL directly
  const handleApplyUrl = async () => {
    const trimmed = directUrlInput.trim();
    if (!trimmed) {
      toast.error(isArabic ? "يرجى إدخال رابط الفيديو." : "Please enter a valid video URL.");
      return;
    }

    const nextConfig: SiteCustomization = {
      ...siteCustom,
      sections: {
        ...siteCustom.sections,
        scrollAnimation: true,
      },
      scrollAnimation: {
        ...config,
        enabled: true,
        videoUrl: trimmed,
      },
    };

    setConfig(nextConfig.scrollAnimation!);
    await onUpdateSiteCustom(
      nextConfig,
      isArabic
        ? "تم تعيين رابط فيديو الرسوم المتحركة وحفظه في فايربيس."
        : "Animation video URL applied & saved to Firebase."
    );
  };

  // Save all current configuration settings
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const nextConfig: SiteCustomization = {
        ...siteCustom,
        sections: {
          ...siteCustom.sections,
          scrollAnimation: config.enabled,
        },
        scrollAnimation: config,
      };

      await onUpdateSiteCustom(
        nextConfig,
        isArabic
          ? "تم حفظ إعدادات فيديو الرسوم المتحركة في فايربيس بنجاح!"
          : "Scroll animation settings saved to Firebase successfully!"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default sample
  const handleResetSample = async () => {
    const nextConfig: SiteCustomization = {
      ...siteCustom,
      sections: {
        ...siteCustom.sections,
        scrollAnimation: true,
      },
      scrollAnimation: DEFAULT_SCROLL_ANIMATION,
    };
    setConfig(DEFAULT_SCROLL_ANIMATION);
    setDirectUrlInput(DEFAULT_SCROLL_ANIMATION.videoUrl);
    await onUpdateSiteCustom(
      nextConfig,
      isArabic ? "تمت استعادة فيديو الرسوم المتحركة الافتراضي." : "Default animation video restored."
    );
  };

  // Update a specific stage
  const handleStageChange = (
    index: number,
    field: keyof ScrollAnimationStage,
    value: string | number
  ) => {
    const nextStages = [...config.stages];
    nextStages[index] = {
      ...nextStages[index],
      [field]: value,
    };
    setConfig({ ...config, stages: nextStages });
  };

  // Filter video files from firestore vault
  const vaultVideos = firestoreMedia.filter((m) => m.kind === "video");

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6 bg-[#0e1620] border border-[#7cc4fa]/30 rounded-xl text-white">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#7cc4fa]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8a56b]/15 border border-[#c8a56b]/40 text-[#c8a56b] text-xs font-mono uppercase mb-2">
            <Film size={14} />
            <span>
              {isArabic
                ? "فيديو الرسوم المتحركة مع التمرير (فايربيس)"
                : "Scroll-Driven Animation Video (Firebase Sync)"}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {isArabic
              ? "التحكم في فيديو الرسوم المتحركة الذي يتحرك مع سكرول الصفحة"
              : "Scroll-Driven Video Animation Controller"}
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-2xl">
            {isArabic
              ? "يعرض فيديو متطور يتحرك للأمام مع التمرير للأسفل، ويثبت مكانه عند التوقف، ويرجع للوراء عند التمرير للأعلى. يمكنك رفع أي فيديو من جهازك مباشرة إلى فايربيس أو وضع رابط خارجي."
              : "Displays a cinematic video that scrubs smoothly forward as the user scrolls down, stays paused when they stop, and scrubs back when they scroll up. Upload your own video directly to Firebase or use a URL."}
          </p>
        </div>

        {/* Global Toggle & Top Save */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 cursor-pointer text-xs font-mono">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="accent-[#c8a56b] w-4 h-4 cursor-pointer"
            />
            <span className={config.enabled ? "text-[#c8a56b] font-bold" : "text-gray-400"}>
              {config.enabled
                ? isArabic
                  ? "القسم مفعل على الموقع"
                  : "Section Enabled"
                : isArabic
                ? "القسم معطل"
                : "Section Disabled"}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8a56b] hover:bg-[#e0c995] text-black font-semibold text-xs md:text-sm transition-all shadow-md disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSaving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ في فايربيس" : "Save to Firebase"}</span>
          </button>
        </div>
      </div>

      {/* STEP 1: CHANGE / UPLOAD VIDEO SOURCE */}
      <div className="bg-[#121c28] p-5 rounded-lg border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 text-[#a5d8ff]">
            <Upload size={16} />
            <span>
              {isArabic
                ? "١. تغيير الفيديو أو رفعه إلى فايربيس"
                : "1. Change or Upload Animation Video"}
            </span>
          </h3>
          <span className="text-xs font-mono text-gray-400">
            {isArabic ? "الحالي: " : "Current: "}
            <span className="text-[#c8a56b] truncate max-w-xs inline-block align-bottom">
              {config.videoUrl.split("/").pop() || "Custom Video"}
            </span>
          </span>
        </div>

        {/* Source Mode Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              uploadMode === "file"
                ? "bg-[#c8a56b] text-black font-bold"
                : "bg-black/40 text-gray-300 hover:bg-black/60 border border-white/10"
            }`}
          >
            <Upload size={13} />
            <span>{isArabic ? "رفع ملف فيديو جديد (Firebase)" : "Upload Video File (Firebase)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              uploadMode === "url"
                ? "bg-[#c8a56b] text-black font-bold"
                : "bg-black/40 text-gray-300 hover:bg-black/60 border border-white/10"
            }`}
          >
            <Globe size={13} />
            <span>{isArabic ? "رابط فيديو خارجي (URL)" : "Direct Video URL"}</span>
          </button>

          {vaultVideos.length > 0 && (
            <button
              type="button"
              onClick={() => setUploadMode("vault")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                uploadMode === "vault"
                  ? "bg-[#c8a56b] text-black font-bold"
                  : "bg-black/40 text-gray-300 hover:bg-black/60 border border-white/10"
              }`}
            >
              <Video size={13} />
              <span>
                {isArabic
                  ? `اختر من الفيديوهات المرفوعة (${vaultVideos.length})`
                  : `Pick from Vault (${vaultVideos.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetSample}
            className="ltr:ml-auto rtl:mr-auto px-2.5 py-1.5 rounded text-xs font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
            title="Restore default automotive video"
          >
            <RotateCcw size={12} />
            <span>{isArabic ? "استعادة الفيديو النموذجي" : "Reset Default"}</span>
          </button>
        </div>

        {/* Upload Mode A: File Upload */}
        {uploadMode === "file" && (
          <div className="space-y-3 pt-2">
            <div className="border-2 border-dashed border-white/20 hover:border-[#c8a56b] rounded-lg p-6 text-center transition-all bg-black/30">
              <input
                type="file"
                id="anim-video-file-input"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setVideoFile(f);
                }}
                className="hidden"
              />
              <label
                htmlFor="anim-video-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#c8a56b]/15 text-[#c8a56b] flex items-center justify-center">
                  <Film size={24} />
                </div>
                <div className="text-sm font-medium text-white">
                  {videoFile ? videoFile.name : isArabic ? "اضغط لاختيار ملف فيديو من جهازك" : "Click to select a video file"}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {videoFile
                    ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB · ${videoFile.type || "video/mp4"}`
                    : "MP4, WebM (Recommended: 720p/1080p high bitrate)"}
                </div>
              </label>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-[#c8a56b]">
                  <span>{isArabic ? "جارٍ التجزئة والرفع إلى فايربيس..." : "Uploading to Firebase in chunks..."}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c8a56b] to-[#e0c995] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {videoFile && !isUploading && (
              <button
                type="button"
                onClick={handleUploadAnimationVideo}
                className="w-full py-2.5 rounded-lg bg-[#c8a56b] hover:bg-[#e0c995] text-black font-semibold text-xs md:text-sm font-mono flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Upload size={16} />
                <span>
                  {isArabic
                    ? `رفع "${videoFile.name}" إلى فايربيس وتحديث الموقع الآن`
                    : `Upload "${videoFile.name}" to Firebase & Update Site Now`}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Upload Mode B: Direct URL */}
        {uploadMode === "url" && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={directUrlInput}
                onChange={(e) => setDirectUrlInput(e.target.value)}
                placeholder="https://example.com/animation.mp4"
                className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded text-xs md:text-sm font-mono text-white focus:outline-none focus:border-[#c8a56b]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-2 bg-[#c8a56b] hover:bg-[#e0c995] text-black font-semibold text-xs md:text-sm rounded transition-all shrink-0"
              >
                {isArabic ? "تطبيق وحفظ" : "Apply & Save"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              {isArabic
                ? "يدعم روابط MP4 و WebM المباشرة (مثل Cloud Storage أو CDN)."
                : "Supports direct MP4/WebM video links from your CDN, cloud bucket, or external server."}
            </p>
          </div>
        )}

        {/* Upload Mode C: Pick from Vault */}
        {uploadMode === "vault" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 max-h-56 overflow-y-auto">
            {vaultVideos.map((item) => (
              <div
                key={item.id}
                onClick={async () => {
                  const nextConfig: SiteCustomization = {
                    ...siteCustom,
                    sections: { ...siteCustom.sections, scrollAnimation: true },
                    scrollAnimation: { ...config, videoUrl: item.url, enabled: true },
                  };
                  setConfig(nextConfig.scrollAnimation!);
                  setDirectUrlInput(item.url);
                  await onUpdateSiteCustom(
                    nextConfig,
                    isArabic ? "تم اختيار الفيديو وحفظه في فايربيس." : "Video selected and updated."
                  );
                }}
                className={`p-2.5 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                  config.videoUrl === item.url
                    ? "bg-[#c8a56b]/20 border-[#c8a56b] text-white"
                    : "bg-black/40 border-white/10 hover:border-white/30 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Film size={14} className="text-[#c8a56b] shrink-0" />
                  <span className="text-xs font-semibold truncate">{item.title}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>{item.language.toUpperCase()}</span>
                  <span>{(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: LIVE PREVIEW & SCRUB SIMULATOR */}
      <div className="bg-[#121c28] p-5 rounded-lg border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 text-[#a5d8ff]">
            <Eye size={16} />
            <span>
              {isArabic
                ? "٢. محاكي سكرول مباشر (اختبر كيف سيتحرك الفيديو على الموقع)"
                : "2. Live Scroll Simulator (Test how video scrubs)"}
            </span>
          </h3>
          <span className="text-xs font-mono text-[#c8a56b]">
            {Math.round(simulatedScroll * 100)}% Scroll Position
          </span>
        </div>

        {/* Video Player Preview */}
        <div className="relative w-full aspect-video max-h-72 bg-black rounded-lg overflow-hidden border border-white/20 shadow-xl">
          <video
            ref={previewVideoRef}
            src={config.videoUrl}
            poster={config.posterUrl}
            playsInline
            muted={previewMuted}
            preload="metadata"
            onLoadedMetadata={() => {
              if (previewVideoRef.current) {
                setPreviewDuration(previewVideoRef.current.duration || 10);
              }
            }}
            className="w-full h-full object-cover"
          />

          {/* Simulation Overlay Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-[#c8a56b]/40 text-[#c8a56b] text-[11px] font-mono">
            {isArabic ? config.titleAr || config.titleEn : config.titleEn}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPreviewMuted(!previewMuted)}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#c8a56b]" />}
            </button>
          </div>
        </div>

        {/* Scrub Slider */}
        <div className="space-y-1.5 bg-black/40 p-3.5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono text-gray-300">
            <span>{isArabic ? "حرّك هذا الشريط لتجربة السكرول:" : "Drag slider to simulate user scrolling:"}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const v = previewVideoRef.current;
                  if (!v) return;
                  if (isPlayingPreview) {
                    v.pause();
                    setIsPlayingPreview(false);
                  } else {
                    v.play();
                    setIsPlayingPreview(true);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px]"
              >
                {isPlayingPreview ? <Pause size={11} /> : <Play size={11} />}
                <span>{isPlayingPreview ? "Pause" : "Play Loop"}</span>
              </button>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={simulatedScroll}
            onChange={(e) => {
              setIsPlayingPreview(false);
              setSimulatedScroll(parseFloat(e.target.value));
            }}
            className="w-full h-2 rounded appearance-none cursor-pointer bg-white/20 accent-[#c8a56b]"
          />
        </div>
      </div>

      {/* STEP 3: SCROLL BEHAVIOR & TIMING SETTINGS */}
      <div className="bg-[#121c28] p-5 rounded-lg border border-white/10 space-y-4">
        <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 text-[#a5d8ff]">
          <Sliders size={16} />
          <span>
            {isArabic
              ? "٣. سرعة السكرول والمظهر البصري"
              : "3. Scroll Feel, Height & Appearance"}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Scroll Height vh */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label className="text-gray-300">
                {isArabic ? "مسافة السكرول (Scroll Height):" : "Scroll Track Height (vh):"}
              </label>
              <span className="text-[#c8a56b] font-bold">{config.scrollHeightVh || 260}vh</span>
            </div>
            <input
              type="range"
              min={160}
              max={420}
              step={10}
              value={config.scrollHeightVh || 260}
              onChange={(e) => setConfig({ ...config, scrollHeightVh: parseInt(e.target.value) })}
              className="w-full h-2 rounded appearance-none cursor-pointer bg-white/20 accent-[#c8a56b]"
            />
            <p className="text-[10px] text-gray-400 font-mono">
              {isArabic
                ? "قيمة أعلى = حركة أبطأ وأكثر سلاسة مع التمرير (الموصى به: 260vh)."
                : "Higher value = more scroll distance for smoother, slower scrubbing (260vh recommended)."}
            </p>
          </div>

          {/* Overlay Darkness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label className="text-gray-300">
                {isArabic ? "عتامة التظليل السينمائي:" : "Cinematic Darkness Tint:"}
              </label>
              <span className="text-[#c8a56b] font-bold">
                {Math.round((config.overlayDarkness ?? 0.35) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.05}
              value={config.overlayDarkness ?? 0.35}
              onChange={(e) => setConfig({ ...config, overlayDarkness: parseFloat(e.target.value) })}
              className="w-full h-2 rounded appearance-none cursor-pointer bg-white/20 accent-[#c8a56b]"
            />
            <p className="text-[10px] text-gray-400 font-mono">
              {isArabic
                ? "تعتيم خلفية الفيديو لتوضيح العناوين والنصوص."
                : "Darkens the video behind text for maximum contrast and editorial cinema aesthetic."}
            </p>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <label className="flex items-center gap-2 p-2.5 rounded bg-black/40 border border-white/10 text-xs font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={config.showProgressBar !== false}
              onChange={(e) => setConfig({ ...config, showProgressBar: e.target.checked })}
              className="accent-[#c8a56b]"
            />
            <span>{isArabic ? "شريط التقدم التفاعلي" : "Show Progress Bar"}</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-black/40 border border-white/10 text-xs font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={config.showStageCards !== false}
              onChange={(e) => setConfig({ ...config, showStageCards: e.target.checked })}
              className="accent-[#c8a56b]"
            />
            <span>{isArabic ? "بطاقات مراحل التركيب" : "Show Stage Callouts"}</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-black/40 border border-white/10 text-xs font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={config.showControlPill !== false}
              onChange={(e) => setConfig({ ...config, showControlPill: e.target.checked })}
              className="accent-[#c8a56b]"
            />
            <span>{isArabic ? "زر تبديل التشغيل التلقائي" : "Show Auto-Play Switch"}</span>
          </label>
        </div>
      </div>

      {/* STEP 4: EDIT TEXTS & HEADLINES (BILINGUAL) */}
      <div className="bg-[#121c28] p-5 rounded-lg border border-white/10 space-y-4">
        <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 text-[#a5d8ff]">
          <Layers size={16} />
          <span>
            {isArabic
              ? "٤. تعديل النصوص والعناوين (عربي وإنجليزي)"
              : "4. Edit Titles & Stage Milestones"}
          </span>
        </h3>

        {/* Section Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300">Title (English):</label>
            <input
              type="text"
              value={config.titleEn}
              onChange={(e) => setConfig({ ...config, titleEn: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-xs font-mono text-white focus:outline-none focus:border-[#c8a56b]"
            />
          </div>

          <div className="space-y-1" dir="rtl">
            <label className="text-xs font-mono text-gray-300">العنوان الرئيسي (بالعربية):</label>
            <input
              type="text"
              value={config.titleAr}
              onChange={(e) => setConfig({ ...config, titleAr: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-xs font-mono text-white focus:outline-none focus:border-[#c8a56b]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-300">Subtitle (English):</label>
            <textarea
              rows={2}
              value={config.subtitleEn}
              onChange={(e) => setConfig({ ...config, subtitleEn: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-xs font-sans text-white focus:outline-none focus:border-[#c8a56b]"
            />
          </div>

          <div className="space-y-1" dir="rtl">
            <label className="text-xs font-mono text-gray-300">الوصف الفرعي (بالعربية):</label>
            <textarea
              rows={2}
              value={config.subtitleAr}
              onChange={(e) => setConfig({ ...config, subtitleAr: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-xs font-sans text-white focus:outline-none focus:border-[#c8a56b]"
            />
          </div>
        </div>

        {/* Stages Milestones */}
        <div className="space-y-3 pt-3">
          <div className="text-xs font-semibold text-[#c8a56b] font-mono uppercase">
            {isArabic ? "مراحل الشرح التفاعلي أثناء السكرول:" : "Milestone Stages During Scroll:"}
          </div>

          <div className="space-y-3">
            {config.stages.map((stage, idx) => (
              <div key={idx} className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#c8a56b]">
                  <span>Stage {idx + 1} (At {Math.round(stage.progress * 100)}% Scroll)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={stage.labelEn}
                    onChange={(e) => handleStageChange(idx, "labelEn", e.target.value)}
                    placeholder="Title (EN)"
                    className="px-2.5 py-1.5 bg-black/50 border border-white/10 rounded text-white"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={stage.labelAr}
                    onChange={(e) => handleStageChange(idx, "labelAr", e.target.value)}
                    placeholder="العنوان (بالعربية)"
                    className="px-2.5 py-1.5 bg-black/50 border border-white/10 rounded text-white"
                  />
                  <input
                    type="text"
                    value={stage.descEn}
                    onChange={(e) => handleStageChange(idx, "descEn", e.target.value)}
                    placeholder="Description (EN)"
                    className="px-2.5 py-1.5 bg-black/50 border border-white/10 rounded text-white text-[11px]"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={stage.descAr}
                    onChange={(e) => handleStageChange(idx, "descAr", e.target.value)}
                    placeholder="الوصف (بالعربية)"
                    className="px-2.5 py-1.5 bg-black/50 border border-white/10 rounded text-white text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL SAVE ACTION BAR */}
      <div className="sticky bottom-4 z-30 p-4 rounded-xl bg-black/90 backdrop-blur-xl border border-[#c8a56b]/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#c8a56b] font-bold">
            {isArabic ? "جاهز لنشر التعديلات إلى فايربيس؟" : "Ready to publish changes to Firebase?"}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            {isArabic
              ? "سيتم حفظ الفيديو وجميع النصوص في Firestore وتحديث الموقع فورياً."
              : "Saves video URL, scroll physics, and texts directly to Firebase Firestore."}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#c8a56b] hover:bg-[#e0c995] text-black font-bold text-sm tracking-wide transition-all shadow-xl hover:scale-105 disabled:opacity-50"
        >
          <Save size={16} />
          <span>
            {isSaving
              ? isArabic
                ? "جارٍ النشر إلى فايربيس..."
                : "Publishing to Firebase..."
              : isArabic
              ? "حفظ ونشر التعديلات على فايربيس"
              : "Save & Publish to Firebase"}
          </span>
        </button>
      </div>
    </div>
  );
}
export default AdminScrollAnimationManager;
