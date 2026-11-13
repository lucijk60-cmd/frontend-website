import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "wouter";
import {
  CirclePlay,
  CirclePause,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import type { Language } from "@/lib/siteContent";
import type { ScrollAnimationConfig, ScrollAnimationStage } from "@/lib/siteCustomization";

interface ScrollAnimationSectionProps {
  config: ScrollAnimationConfig;
  language: Language;
  isAdminLoggedIn?: boolean;
}

export function ScrollAnimationSection({
  config,
  language,
  isAdminLoggedIn = false,
}: ScrollAnimationSectionProps) {
  const isArabic = language === "ar";
  const isBengali = language === "bn";

  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [progress, setProgress] = useState(0); // 0 to 1
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackMode, setPlaybackMode] = useState<"scroll" | "autoplay">("scroll");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth lerp state
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);

  const scrollHeightVh = Math.max(140, Math.min(450, config.scrollHeightVh || 260));
  const stages: ScrollAnimationStage[] = useMemo(() => {
    return Array.isArray(config.stages) && config.stages.length > 0 ? config.stages : [];
  }, [config.stages]);

  // Localized texts
  const title = useMemo(() => {
    if (isArabic) return config.titleAr || config.titleEn;
    return config.titleEn;
  }, [isArabic, config.titleAr, config.titleEn]);

  const subtitle = useMemo(() => {
    if (isArabic) return config.subtitleAr || config.subtitleEn;
    return config.subtitleEn;
  }, [isArabic, config.subtitleAr, config.subtitleEn]);

  const badgeText = useMemo(() => {
    if (isArabic) return config.badgeAr || "عرض تفاعلي حركي مع التمرير";
    if (isBengali) return "স্ক্রল-চালিত অ্যানিমেশন";
    return config.badgeEn || "INTERACTIVE SCROLL MOTION";
  }, [isArabic, isBengali, config.badgeAr, config.badgeEn]);

  const ctaText = useMemo(() => {
    if (isArabic) return config.ctaTextAr || "احجز موعد التركيب";
    if (isBengali) return "অ্যাপয়েন্টমেন্ট বুক করুন";
    return config.ctaTextEn || "Book Installation";
  }, [isArabic, isBengali, config.ctaTextAr, config.ctaTextEn]);

  // Video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 10);
    setIsVideoLoaded(true);
    video.currentTime = 0.01;
    currentTimeRef.current = 0.01;
    targetTimeRef.current = 0.01;
  }, []);

  // Continuous animation loop for butter-smooth frame scrubbing
  useEffect(() => {
    if (playbackMode === "autoplay") {
      const video = videoRef.current;
      if (video) {
        video.play().catch(() => {});
      }
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    let isRunning = true;
    const smoothing = Math.max(0.08, Math.min(0.35, config.playbackSmoothing || 0.16));

    const step = () => {
      if (!isRunning) return;
      const v = videoRef.current;
      if (v && duration > 0) {
        const target = targetTimeRef.current;
        const current = currentTimeRef.current;
        const diff = target - current;

        // When user stops scrolling, diff quickly falls below threshold and video freezes completely
        if (Math.abs(diff) > 0.003 && !isSeekingRef.current) {
          const next = current + diff * smoothing;
          currentTimeRef.current = next;
          try {
            if ("fastSeek" in v && typeof (v as any).fastSeek === "function") {
              (v as any).fastSeek(next);
            } else {
              v.currentTime = next;
            }
            setCurrentTime(next);
          } catch {
            // fallback
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackMode, duration, config.playbackSmoothing]);

  // Scroll listener: measures section relative to viewport and updates targetTime
  useEffect(() => {
    if (playbackMode === "autoplay") return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const track = trackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const windowH = window.innerHeight || 800;
        const totalDistance = rect.height - windowH;

        if (totalDistance <= 0) return;

        // Progress 0 when top touches top of viewport, 1 when bottom touches bottom
        const scrolled = -rect.top;
        const rawProgress = scrolled / totalDistance;
        const clampedProgress = Math.max(0, Math.min(1, rawProgress));

        setProgress(clampedProgress);

        if (duration > 0) {
          targetTimeRef.current = clampedProgress * duration;
        }

        // Determine active stage
        if (stages.length > 0) {
          let stageIdx = 0;
          for (let i = 0; i < stages.length; i++) {
            if (clampedProgress >= (stages[i].progress || 0) * 0.9) {
              stageIdx = i;
            }
          }
          setActiveStageIndex(stageIdx);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll(); // initial call

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [playbackMode, duration, stages]);

  // Manual interactive scrub on the progress slider
  const handleSliderScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (duration > 0) {
      const newT = val * duration;
      targetTimeRef.current = newT;
      currentTimeRef.current = newT;
      if (videoRef.current) {
        videoRef.current.currentTime = newT;
        setCurrentTime(newT);
      }
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const el = stickyRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Toggle sound
  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Toggle mode
  const toggleMode = () => {
    setPlaybackMode((prev) => (prev === "scroll" ? "autoplay" : "scroll"));
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const currentStage = stages[activeStageIndex] || stages[0];

  return (
    <section
      ref={trackRef}
      id="scroll-animation"
      className="relative w-full bg-[#080909] text-white"
      style={{ height: `${scrollHeightVh}vh` }}
      aria-label={title}
    >
      {/* Sticky viewport frame pinned while user scrolls through the track */}
      <div
        ref={stickyRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden bg-black select-none"
      >
        {/* Background Video Element */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            ref={videoRef}
            src={config.videoUrl}
            poster={config.posterUrl}
            playsInline
            muted={isMuted}
            preload="auto"
            loop={playbackMode === "autoplay"}
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full object-cover object-center transform-gpu"
            style={{ filter: "brightness(0.92) contrast(1.05)" }}
          />

          {/* Cinematic Vignette & Darkness Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              backgroundColor: `rgba(8, 9, 9, ${config.overlayDarkness ?? 0.35})`,
              background: `radial-gradient(ellipse at center, rgba(8,9,9,${Math.max(0.1, (config.overlayDarkness ?? 0.35) - 0.2)}) 0%, rgba(8,9,9,${Math.min(0.92, (config.overlayDarkness ?? 0.35) + 0.3)}) 100%)`,
            }}
          />

          {/* Top & bottom subtle film grain gradients */}
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#080909] via-[#080909]/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#080909] via-[#080909]/80 to-transparent pointer-events-none" />
        </div>

        {/* TOP HUD HEADER */}
        <div className="relative z-20 w-full px-6 md:px-12 pt-8 flex items-start justify-between gap-4 pointer-events-auto">
          <div className="max-w-xl">
            {/* Kicker Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#c8a56b]/40 text-[#c8a56b] text-xs font-mono tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#c8a56b] animate-pulse" />
              <span>{badgeText}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/80 font-bold">{Math.round(progress * 100)}%</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-white drop-shadow-md leading-tight">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-2 text-xs md:text-sm text-white/75 font-sans max-w-lg leading-relaxed drop-shadow">
                {subtitle}
              </p>
            )}
          </div>

          {/* Quick Action Buttons on Top Right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mode switch (Scroll sync vs Autoplay) */}
            {config.showControlPill !== false && (
              <button
                type="button"
                onClick={toggleMode}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-[#c8a56b] text-xs font-medium text-white transition-all duration-200 shadow-lg"
                title={
                  playbackMode === "scroll"
                    ? isArabic
                      ? "التبديل إلى التشغيل التلقائي"
                      : "Switch to Auto-Play"
                    : isArabic
                    ? "التبديل إلى التحكم مع التمرير"
                    : "Switch to Scroll-Driven"
                }
              >
                {playbackMode === "scroll" ? (
                  <>
                    <Sliders size={14} className="text-[#c8a56b]" />
                    <span>{isArabic ? "تحكم بالتمرير" : isBengali ? "স্ক্রল নিয়ন্ত্রণ" : "Scroll-Driven"}</span>
                  </>
                ) : (
                  <>
                    <CirclePlay size={14} className="text-[#c8a56b]" />
                    <span>{isArabic ? "تشغيل تلقائي" : isBengali ? "অটো প্লে" : "Auto-Playing"}</span>
                  </>
                )}
              </button>
            )}

            {/* Sound toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-[#c8a56b] text-white flex items-center justify-center transition-all shadow-lg"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-[#c8a56b]" />}
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-[#c8a56b] text-white flex items-center justify-center transition-all shadow-lg"
              aria-label="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>

            {/* Admin Direct Edit Link */}
            <Link
              href="/admin?tab=scrollAnimation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c8a56b]/20 hover:bg-[#c8a56b]/35 border border-[#c8a56b]/60 text-[#e0c995] text-xs font-mono transition-all shadow-lg"
              title="Admin Panel: Change video animation"
            >
              <Sparkles size={13} />
              <span className="hidden md:inline">{isArabic ? "تعديل الأنيميشن" : isBengali ? "ভিডিও পরিবর্তন" : "Edit Video"}</span>
            </Link>
          </div>
        </div>

        {/* MIDDLE STAGE CALLOUT CARD (BILINGUAL) */}
        {config.showStageCards !== false && currentStage && (
          <div className="relative z-20 px-6 md:px-12 my-auto pointer-events-none">
            <div className="inline-block max-w-md p-4 md:p-5 rounded-2xl bg-black/70 backdrop-blur-xl border border-[#c8a56b]/30 shadow-2xl transition-all duration-300 transform-gpu animate-fade-in pointer-events-auto">
              <div className="flex items-center gap-2 text-[#c8a56b] text-xs font-mono uppercase tracking-wider mb-1.5">
                <ShieldCheck size={14} />
                <span>{isArabic ? currentStage.labelAr : currentStage.labelEn}</span>
              </div>
              <p className="text-sm md:text-base font-sans text-white/90 leading-snug">
                {isArabic ? currentStage.descAr : currentStage.descEn}
              </p>

              {/* Progress Milestones Dots */}
              {stages.length > 1 && (
                <div className="mt-3.5 flex items-center gap-2">
                  {stages.map((st, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeStageIndex
                          ? "w-8 bg-[#c8a56b]"
                          : idx < activeStageIndex
                          ? "w-3 bg-white/60"
                          : "w-2 bg-white/20"
                      }`}
                      title={isArabic ? st.labelAr : st.labelEn}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM SCRUBBER & HUD FOOTER */}
        <div className="relative z-20 w-full px-6 md:px-12 pb-8 flex flex-col gap-3 pointer-events-auto">
          {/* Scroll instruction indicator */}
          <div className="flex items-center justify-between text-xs text-white/70 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8a56b]" />
              <span className="tracking-wide">
                {playbackMode === "scroll"
                  ? isArabic
                    ? "مرر للأسفل للتقديم · قف للإيقاف · مرر للأعلى للرجوع"
                    : isBengali
                    ? "নিচে স্ক্রল করুন: চলবে · স্থির হলে: স্থির থাকবে · উপরে: রিওয়াইন্ড"
                    : "Scroll down to advance · Stop to pause · Scroll up to scrub back"
                  : isArabic
                  ? "وضع التشغيل التلقائي نشط"
                  : isBengali
                  ? "অটো-প্লে চলছে"
                  : "Auto-play loop active"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <span className="text-[#c8a56b] font-bold">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Interactive Range Scrubber */}
          {config.showProgressBar !== false && (
            <div className="relative w-full flex items-center group">
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={handleSliderScrub}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#c8a56b] focus:outline-none transition-all group-hover:h-3"
                style={{
                  background: `linear-gradient(to right, #c8a56b 0%, #e0c995 ${progress * 100}%, rgba(255,255,255,0.2) ${progress * 100}%, rgba(255,255,255,0.2) 100%)`,
                }}
                aria-label="Video scrubber slider"
              />
            </div>
          )}

          {/* Stage milestones pills along the track */}
          {stages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              {stages.map((stage, idx) => {
                const isActive = idx === activeStageIndex;
                const isPassed = progress >= stage.progress;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const newP = stage.progress;
                      setProgress(newP);
                      if (duration > 0) {
                        targetTimeRef.current = newP * duration;
                        currentTimeRef.current = newP * duration;
                        if (videoRef.current) {
                          videoRef.current.currentTime = newP * duration;
                        }
                      }
                    }}
                    className={`text-left rtl:text-right p-2 rounded-lg border transition-all text-xs font-mono truncate ${
                      isActive
                        ? "bg-[#c8a56b]/20 border-[#c8a56b] text-white shadow-md"
                        : isPassed
                        ? "bg-black/40 border-white/20 text-white/80"
                        : "bg-black/30 border-white/10 text-white/50 hover:border-white/30"
                    }`}
                  >
                    <span className="text-[#c8a56b] font-bold block truncate">
                      {isArabic ? stage.labelAr : stage.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom CTA & Floating Bar */}
          <div className="flex items-center justify-between pt-2">
            <a
              href={config.ctaTarget || "#contact"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c8a56b] hover:bg-[#e0c995] text-black font-semibold text-xs md:text-sm tracking-wide transition-all duration-200 shadow-xl hover:scale-105"
            >
              <span>{ctaText}</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </a>

            <div className="text-[11px] text-white/50 font-mono hidden sm:block">
              {isArabic
                ? "يتم التحكم بالفيديو مباشرة من لوحة التحكم ومربوط مع فايربيس"
                : isBengali
                ? "ভিডিওটি অ্যাডমিন প্যানেল এবং ফায়ারবেস দ্বারা নিয়ন্ত্রিত"
                : "Controlled dynamically from Admin Panel & synced with Firebase"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default ScrollAnimationSection;
