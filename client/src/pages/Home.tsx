/* Obsidian Atelier: cinematic editorial luxury, graphite surfaces, restrained champagne-gold precision cues. */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { skipToken } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CirclePlay,
  Droplets,
  Ghost,
  Globe,
  Instagram,
  Menu,
  LockKeyhole,
  Music2,
  MessageCircle,
  MoveHorizontal,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InlineBrandMark } from "@/components/InlineBrandMark";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { selectPublishedMedia, selectVideoSource } from "@/lib/media";
import { getLocalizedReviewText, getReviewSubmissionNotice, normalizeReviewReference } from "@/lib/reviews";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BRAND_NAME,
  images,
  isValidLanguage,
  LANGUAGE_OPTIONS,
  type Content,
  type Language,
  whatsappHref,
} from "@/lib/siteContent";
import {
  DEFAULT_SEO_BUTTONS,
  getCustomStaticGalleryItems,
  getCustomStaticVideoItems,
  getMergedContent,
  getMergedExtraTexts,
  useSiteCustomization,
} from "@/lib/siteCustomization";

const VIDEO_SOURCE = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
const STORAGE_KEY = "aurelis-language";
const galleryFilterKeys = ["all", "Full Body PPF", "Front PPF", "Luxury Cars", "SUV", "Before & After", "Installation"];

function getStoredReviewReference(): string {
  if (typeof window === "undefined") return "";
  const saved = window.localStorage.getItem("ppfstudio-review-reference") ?? "";
  return normalizeReviewReference(saved);
}

function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isValidLanguage(saved) ? saved : null;
}

function BrandMark({
  compact = false,
  primary = "PPF",
  secondary = "Studio",
}: {
  compact?: boolean;
  primary?: string;
  secondary?: string;
}) {
  return (
    <span className={compact ? "brand-lockup brand-lockup--compact" : "brand-lockup"} aria-label={BRAND_NAME}>
      <InlineBrandMark alt="PPF Paint Protection Film logo" className="brand-mark" />
      <span className="brand-wordmark">
        <b>{primary}</b>
        <i>{secondary}</i>
      </span>
    </span>
  );
}

function WhatsAppLink({
  language,
  children,
  className = "",
  compact = false,
  customHref,
}: {
  language: Language;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  customHref?: string;
}) {
  const resolvedHref = customHref && customHref.trim() ? customHref.trim() : whatsappHref(language);
  return (
    <a
      className={`whatsapp-link ${compact ? "whatsapp-link--compact" : ""} ${className}`}
      href={resolvedHref}
      target="_blank"
      rel="noreferrer"
      aria-label={language === "ar" ? "التواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}
    >
      <MessageCircle size={compact ? 16 : 18} strokeWidth={1.8} />
      <span>{children}</span>
    </a>
  );
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, body, align = "left" }: { eyebrow: string; title: string; body?: string; align?: "left" | "right" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <div className="eyebrow"><span className="eyebrow-rule" />{eyebrow}</div>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function getReviewStatusLabel(status: "pending" | "approved" | "rejected", c: Content) {
  if (status === "approved") return c.reviewStatusApproved;
  if (status === "rejected") return c.reviewStatusRejected;
  return c.reviewStatusPending;
}

function CraftStandard({ value, label, active }: { value: string; label: string; active: boolean }) {
  return (
    <div className={`stat-item ${active ? "stat-item--active" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const initialLanguage = getStoredLanguage() ?? "en";
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [showLanguageModal, setShowLanguageModal] = useState(() => !getStoredLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [comparison, setComparison] = useState(52);
  const [statsActive, setStatsActive] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewVehicle, setReviewVehicle] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmittedNotice, setReviewSubmittedNotice] = useState(false);
  const [reviewReference, setReviewReference] = useState(getStoredReviewReference);
  const [trackingReference, setTrackingReference] = useState(getStoredReviewReference);
  const [trackingInput, setTrackingInput] = useState(getStoredReviewReference);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [, setLocation] = useLocation();
  const statsRef = useRef<HTMLElement | null>(null);

  const serverSiteConfigQuery = trpc.admin.siteConfig.get.useQuery(undefined, { retry: false });
  const [siteCustom] = useSiteCustomization(serverSiteConfigQuery.data);

  const c: Content = useMemo(() => getMergedContent(language, siteCustom), [language, siteCustom]);
  const extraTexts = useMemo(() => getMergedExtraTexts(language, siteCustom), [language, siteCustom]);
  const isArabic = c.dir === "rtl";
  const mediaLanguage = language === "ar" ? "ar" : "en";
  const { user } = useAuth();
  const trpcUtils = trpc.useUtils();
  const reviewsQuery = trpc.reviews.list.useQuery({ limit: 24, offset: 0 });
  const trackingQueryInput = useMemo(() => trackingReference ? { publicReference: trackingReference } : undefined, [trackingReference]);
  const reviewStatusQuery = trpc.reviews.statusByReference.useQuery(trackingQueryInput ?? skipToken);
  const publishedMediaQuery = trpc.admin.media.published.useQuery();
  const pendingReviewsQuery = trpc.reviews.pending.useQuery(undefined, { enabled: user?.role === "admin" });
  const moderateReview = trpc.reviews.moderate.useMutation({
    onSuccess: async () => {
      await Promise.all([trpcUtils.reviews.list.invalidate(), trpcUtils.reviews.pending.invalidate()]);
      toast.success(isArabic ? "تم تحديث حالة المراجعة." : "Review status updated.");
    },
    onError: (error) => toast.error(error.message),
  });
  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: async (result) => {
      const currentName = reviewName;
      const currentVehicle = reviewVehicle;
      const currentRating = reviewRating;
      const currentText = reviewText;
      await Promise.all([trpcUtils.reviews.list.invalidate(), trpcUtils.reviews.pending.invalidate()]);
      setReviewName("");
      setReviewVehicle("");
      setReviewRating(5);
      setReviewText("");
      setReviewFormOpen(false);
      setReviewSubmittedNotice(true);
      setReviewReference(result.publicReference);
      window.localStorage.setItem("ppfstudio-review-reference", result.publicReference);
      setTrackingInput(result.publicReference);
      setTrackingReference(result.publicReference);
      setReferenceCopied(false);
      void import("@/lib/firebase").then(({ saveReviewToFirestore }) =>
        saveReviewToFirestore(`review-${result.id}`, {
          publicReference: result.publicReference,
          name: currentName,
          vehicle: currentVehicle,
          rating: currentRating,
          review: currentText,
        })
      ).catch(() => undefined);
      toast.success(getReviewSubmissionNotice(language));
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 820);
    const handleScroll = () => setScrolled(window.scrollY > 26);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = c.locale;
    document.documentElement.dir = c.dir;
    document.title = language === "ar" ? siteCustom.brand.pageTitleAr : siteCustom.brand.pageTitleEn;
    const description = language === "ar"
      ? siteCustom.brand.metaDescriptionAr
      : siteCustom.brand.metaDescriptionEn;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }, [c.dir, c.locale, language, siteCustom.brand]);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.32 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const selectLanguage = (next: Language) => {
    setLanguage(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setShowLanguageModal(false);
  };

  const openLanguageModal = () => {
    setMobileMenuOpen(false);
    setShowLanguageModal(true);
  };

  const scrollToSection = (idOrTarget: string) => {
    setMobileMenuOpen(false);
    const trimmed = idOrTarget.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      window.open(trimmed, "_blank", "noopener,noreferrer");
      return;
    }
    if (trimmed.startsWith("/")) {
      setLocation(trimmed);
      return;
    }
    const cleanId = trimmed.replace(/^#/, "");
    document.getElementById(cleanId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const localizedGalleryItems = useMemo(() => {
    const staticItems = getCustomStaticGalleryItems(language, siteCustom);
    const uploadedItems = selectPublishedMedia(publishedMediaQuery.data ?? [], mediaLanguage, "image")
      .map((item) => ({ id: 10000 + item.id, category: "Admin Uploads", src: item.url, alt: item.title }));
    return [...staticItems, ...uploadedItems];
  }, [language, mediaLanguage, publishedMediaQuery.data, siteCustom]);

  const videoDisplayItems = useMemo(() => {
    const staticVideos = getCustomStaticVideoItems(siteCustom);
    const uploadedVideos = selectPublishedMedia(publishedMediaQuery.data ?? [], mediaLanguage, "video")
      .map((item) => ({ title: item.title, src: item.url, poster: images.galleryCoupe, isUploaded: true }));
    return [...staticVideos, ...uploadedVideos];
  }, [mediaLanguage, publishedMediaQuery.data, siteCustom]);

  const filteredGallery = useMemo(() => {
    if (activeFilter === 0) return localizedGalleryItems;
    return localizedGalleryItems.filter((item) => item.category === galleryFilterKeys[activeFilter]);
  }, [activeFilter, localizedGalleryItems]);

  const activeLightboxItem = lightboxIndex === null ? null : localizedGalleryItems[lightboxIndex];

  const handleTrackReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeReviewReference(trackingInput);
    if (!normalized) {
      toast.error(c.reviewReferenceInvalid);
      return;
    }
    setTrackingReference(normalized);
  };

  const copyReviewReference = async () => {
    if (!reviewReference) return;
    try {
      await navigator.clipboard.writeText(reviewReference);
      setReferenceCopied(true);
      toast.success(c.reviewReferenceCopied);
    } catch {
      toast.error(c.error);
    }
  };

  const themeStyle = useMemo(
    () =>
      ({
        "--gold": siteCustom.brand.goldColor || "#c8a56b",
        "--gold-light": siteCustom.brand.goldLightColor || "#e0c995",
        "--ink": siteCustom.brand.inkColor || "#080909",
        "--green": siteCustom.brand.greenColor || "#25d366",
      }) as CSSProperties,
    [siteCustom.brand]
  );

  const customWhatsappUrl = useMemo(() => {
    const cleanNum = siteCustom.brand.whatsappNumber?.replace(/[^0-9]/g, "");
    if (cleanNum && cleanNum !== "966537358631") {
      return `https://wa.me/${cleanNum}`;
    }
    return "";
  }, [siteCustom.brand.whatsappNumber]);

  const seoButtons = siteCustom.buttons.seoButtons?.length ? siteCustom.buttons.seoButtons : DEFAULT_SEO_BUTTONS;

  return (
    <div className={`site-shell ${isArabic ? "site-shell--rtl" : ""}`} style={themeStyle}>
      {isLoading && siteCustom.sections.preloader && (
        <div className="preloader" aria-live="polite">
          <div className="preloader-orbit preloader-orbit--outer" />
          <div className="preloader-orbit preloader-orbit--inner" />
          <div className="preloader-logo-wrap"><InlineBrandMark alt="" className="preloader-mark" /><span className="preloader-corner preloader-corner--tl" /><span className="preloader-corner preloader-corner--br" /></div>
          <div className="preloader-copy"><span className="preloader-kicker">{siteCustom.brand.preloaderKicker}</span><strong>{siteCustom.brand.preloaderTitle}</strong><span className="preloader-status">{siteCustom.brand.preloaderStatus}</span></div>
          <div className="preloader-progress"><span /></div>
        </div>
      )}

      <header className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}>
        <div className="nav-inner">
          <button className="brand-button" onClick={() => scrollToSection("home")} aria-label="PPFStudio home">
            <BrandMark primary={siteCustom.brand.brandPrimary} secondary={siteCustom.brand.brandSecondary} />
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {c.nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollToSection(id)}>{label}</button>
            ))}
          </nav>
          <div className="nav-actions">
            <div className="language-switcher" aria-label="Language switcher">
              {LANGUAGE_OPTIONS.map((opt, idx) => (
                <Fragment key={opt.code}>
                  {idx > 0 && <span>/</span>}
                  <button
                    className={language === opt.code ? "active" : ""}
                    onClick={() => selectLanguage(opt.code)}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                </Fragment>
              ))}
              <button
                type="button"
                className="language-modal-trigger"
                onClick={openLanguageModal}
                aria-label="Choose language"
                title="Languages"
              >
                <Globe size={13} />
              </button>
            </div>
            <WhatsAppLink language={language} compact customHref={siteCustom.buttons.navCtaUrl || customWhatsappUrl}>{c.navCta}</WhatsAppLink>
            <button className="menu-button" onClick={() => setMobileMenuOpen(true)} aria-label={c.menu}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={isArabic ? "left" : "right"} className="mobile-sheet">
          <SheetHeader>
            <BrandMark compact primary={siteCustom.brand.brandPrimary} secondary={siteCustom.brand.brandSecondary} />
            <SheetTitle className="sr-only">{c.menu}</SheetTitle>
            <SheetDescription className="sr-only">PPFStudio navigation</SheetDescription>
          </SheetHeader>
          <div className="mobile-nav-list">
            {c.nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollToSection(id)}>{label}<ArrowUpRight size={17} /></button>
            ))}
            <button className="mobile-admin-link" onClick={() => { setMobileMenuOpen(false); setLocation("/admin"); }}><span><LockKeyhole size={16} />{language === "ar" ? "الإدارة" : "Admin"}</span><ArrowUpRight size={17} /></button>
          </div>
          <div className="mobile-sheet-footer">
            <div className="mobile-language-row" aria-label="Select language">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  className={language === opt.code ? "active" : ""}
                  onClick={() => selectLanguage(opt.code)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <WhatsAppLink language={language} customHref={siteCustom.buttons.navCtaUrl || customWhatsappUrl}>{c.navCta}</WhatsAppLink>
          </div>
        </SheetContent>
      </Sheet>

      <main>
        {siteCustom.sections.hero && (
          <section id="home" className="hero-section">
            <img src={siteCustom.media.heroImage || images.hero} alt="Black sports coupe receiving precision paint protection film installation" className="hero-image" fetchPriority="high" decoding="async" />
            <div className="hero-overlay" />
            <div className="hero-grid-lines" />
            <div className="hero-content page-width">
              <Reveal className="hero-copy">
                <div className="eyebrow eyebrow--light"><span className="eyebrow-rule" />{c.heroEyebrow}</div>
                <h1>{c.heroTitle}</h1>
                <p>{c.heroBody}</p>
                <div className="hero-actions">
                  {siteCustom.buttons.showHeroPrimary !== false && (
                    <button className="button button--gold" onClick={() => scrollToSection(siteCustom.buttons.heroPrimaryTarget || "work")}>{c.viewWork}<ArrowUpRight size={17} /></button>
                  )}
                  {siteCustom.buttons.showHeroSecondary !== false && (
                    <button className="button button--line" onClick={() => scrollToSection(siteCustom.buttons.heroSecondaryTarget || "contact")}>{c.book}<ArrowDown size={17} /></button>
                  )}
                </div>
                {siteCustom.buttons.showHeroWhatsapp !== false && (
                  <WhatsAppLink language={language} className="hero-whatsapp" customHref={siteCustom.buttons.heroWhatsappUrl || customWhatsappUrl}>{c.heroWhatsapp}</WhatsAppLink>
                )}
              </Reveal>
              <div className="hero-side-note">
                <span>01</span><span className="hero-side-rule" /><span>{extraTexts.heroSideNote}</span>
              </div>
            </div>
            <button className="scroll-cue" onClick={() => scrollToSection("services")} aria-label={c.scroll}><span>{c.scroll}</span><ChevronDown size={17} /></button>
          </section>
        )}

        {siteCustom.sections.services && (
          <section id="services" className="section services-section page-width">
            <div className="section-intro split-intro">
              <Reveal><SectionHeader eyebrow={c.servicesEyebrow} title={c.servicesTitle} body={c.servicesBody} /></Reveal>
              <Reveal delay={80} className="section-aside-note"><span>PPF / 2026</span><p>{extraTexts.servicesAsideQuote}</p></Reveal>
            </div>
            <Reveal delay={120}><div className="section-label-row"><h3>{c.servicesHeading}</h3><span>{extraTexts.servicesCountLabel}</span></div></Reveal>
            <div className="services-grid">
              {c.services.map(([title, body, number], index) => (
                <Reveal key={number || index} delay={index * 45} className="service-card">
                  <div className="service-topline"><span>{number}</span><ArrowUpRight size={18} /></div>
                  <div className="service-icon">{index === 0 ? <ShieldCheck /> : index === 1 ? <Sparkles /> : index === 2 ? <Ruler /> : index === 3 ? <Droplets /> : index === 4 ? <SunMedium /> : <Plus />}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <span className="service-underline" />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {siteCustom.sections.manifesto && (
          <section id="why-us" className="manifesto-section">
            <div className="page-width manifesto-grid">
              <Reveal><div className="manifesto-numeral">02<span>/</span></div></Reveal>
              <Reveal delay={80} className="manifesto-copy"><div className="eyebrow"><span className="eyebrow-rule" />{extraTexts.manifestoEyebrow}</div><h2>{extraTexts.manifestoTitle}</h2></Reveal>
              <Reveal delay={140} className="manifesto-points">
                {extraTexts.manifestoPoints.map(([title, body], idx) => <div className="manifesto-point" key={`${title}-${idx}`}><Check size={16} /><div><strong>{title}</strong><span>{body}</span></div></div>)}
              </Reveal>
            </div>
          </section>
        )}

        {siteCustom.sections.work && (
          <section id="work" className="section work-section page-width">
            <Reveal><SectionHeader eyebrow={c.workEyebrow} title={c.workTitle} body={c.workBody} /></Reveal>
            <Reveal delay={80} className="filter-row" aria-label="Portfolio filters">
              {c.filters.map((filter, index) => <button key={`${filter}-${index}`} className={activeFilter === index ? "active" : ""} onClick={() => setActiveFilter(index)}>{filter}</button>)}
            </Reveal>
            <div className="gallery-grid">
              {filteredGallery.map((item, index) => {
                const originalIndex = localizedGalleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
                const labelText = c.galleryLabels[originalIndex] || item.alt;
                return <Fragment key={item.id}><Reveal delay={index * 55} className={`gallery-card gallery-card--${item.id}`}><button onClick={() => setLightboxIndex(originalIndex)} aria-label={`${c.openImage}: ${item.alt}`}><img src={item.src} alt={item.alt} loading="lazy" decoding="async" sizes="(max-width: 720px) 100vw, 50vw" /><span className="gallery-shade" /><span className="gallery-meta"><span>0{item.id}</span><strong>{labelText}</strong><ArrowUpRight size={18} /></span></button></Reveal></Fragment>;
              })}
            </div>
          </section>
        )}

        {siteCustom.sections.beforeAfter && (
          <section id="before-after" className="section comparison-section page-width">
            <div className="comparison-copy">
              <Reveal><SectionHeader eyebrow={c.beforeEyebrow} title={c.beforeTitle} body={c.beforeBody} /></Reveal>
              <Reveal delay={100} className="comparison-instruction"><MoveHorizontal size={20} /><span>{extraTexts.dragToCompare}</span></Reveal>
              <Reveal delay={140} className="comparison-presets" aria-label={isArabic ? "نسبة المقارنة" : "Comparison view presets"}>
                <button type="button" className={comparison >= 85 ? "active" : ""} onClick={() => setComparison(92)}>
                  {isArabic ? (siteCustom.buttons.beforePreset1Ar || "قبل الحماية") : (siteCustom.buttons.beforePreset1En || "Before (Unprotected)")}
                </button>
                <button type="button" className={comparison > 15 && comparison < 85 ? "active" : ""} onClick={() => setComparison(50)}>
                  {isArabic ? (siteCustom.buttons.beforePreset2Ar || "مقارنة 50/50") : (siteCustom.buttons.beforePreset2En || "50 / 50 Split")}
                </button>
                <button type="button" className={comparison <= 15 ? "active" : ""} onClick={() => setComparison(8)}>
                  {isArabic ? (siteCustom.buttons.beforePreset3Ar || "بعد PPF") : (siteCustom.buttons.beforePreset3En || "After (PPF Gloss)")}
                </button>
              </Reveal>
            </div>
            <Reveal delay={100} className="comparison-frame">
              <div className="comparison-stage" dir="ltr">
                <img src={siteCustom.media.afterImage || images.secondaryDetail} alt={c.afterLabel} className="comparison-image comparison-image--after" loading="lazy" decoding="async" />
                <div className="comparison-after-sheen" aria-hidden="true" />
                <div className="comparison-before" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}>
                  <img src={siteCustom.media.beforeImage || images.detailSuv} alt={c.beforeLabel} className="comparison-image comparison-image--before" loading="lazy" decoding="async" />
                </div>
                <div className="comparison-divider" style={{ left: `${comparison}%` }}>
                  <span aria-hidden="true" />
                </div>
                <span className="comparison-label comparison-label--before">
                  <strong>{c.beforeLabel}</strong>
                  <small>{extraTexts.beforeSubLabel}</small>
                </span>
                <span className="comparison-label comparison-label--after">
                  <strong>{c.afterLabel}</strong>
                  <small>{extraTexts.afterSubLabel}</small>
                </span>
                <input className="comparison-input" type="range" min="0" max="100" value={comparison} onChange={(event) => setComparison(Number(event.target.value))} aria-label={c.beforeTitle} />
              </div>
            </Reveal>
          </section>
        )}

        {siteCustom.sections.videos && (
          <section className="section video-section">
            <div className="page-width"><Reveal><SectionHeader eyebrow={c.videoEyebrow} title={c.videoTitle} body={c.videoBody} /></Reveal><div className="video-grid">{videoDisplayItems.map((item, index) => <Fragment key={`${item.title}-${index}`}><Reveal delay={index * 55} className="video-card"><button onClick={() => setVideoIndex(index)} aria-label={`${c.playVideo}: ${item.title}`}><img src={item.poster} alt="" loading="lazy" decoding="async" sizes="(max-width: 720px) 100vw, 50vw" /><span className="video-shade" /><span className="video-play"><CirclePlay size={42} strokeWidth={1.2} /></span><span className="video-label"><span>0{index + 1}</span>{item.title}</span></button></Reveal></Fragment>)}</div></div>
          </section>
        )}

        {siteCustom.sections.process && (
          <section id="process" className="section process-section page-width">
            <Reveal><SectionHeader eyebrow={c.processEyebrow} title={c.processTitle} body={c.processBody} /></Reveal>
            <div className="process-list">{c.process.map(([title, body], index) => <Reveal key={`${title}-${index}`} delay={index * 50} className="process-row"><div className="process-number">0{index + 1}</div><div className="process-line" /><div className="process-copy"><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={20} className="process-arrow" /></Reveal>)}</div>
          </section>
        )}

        {siteCustom.sections.quality && (
          <section id="about" className="quality-section">
            <div className="quality-image-wrap"><img src={siteCustom.media.qualityImage || images.installation} alt="Precision PPF installation in a controlled studio" loading="lazy" decoding="async" /><div className="quality-image-caption"><span>07</span><span>{extraTexts.materialInstallCaption}</span></div></div>
            <div className="quality-content"><Reveal><SectionHeader eyebrow={c.qualityEyebrow} title={c.qualityTitle} body={c.qualityBody} /></Reveal><Reveal delay={100} className="quality-list">{c.qualityFeatures.map((feature, index) => <div className="quality-item" key={`${feature}-${index}`}><span>0{index + 1}</span><Check size={16} /><strong>{feature}</strong></div>)}</Reveal><Reveal delay={180}><button className="text-link" onClick={() => scrollToSection(siteCustom.buttons.qualityCtaTarget || "contact")}>{isArabic ? (siteCustom.buttons.qualityCtaTextAr || "تحدث مع فريقنا") : (siteCustom.buttons.qualityCtaTextEn || "Talk to our team")}<ArrowUpRight size={16} /></button></Reveal></div>
          </section>
        )}

        {siteCustom.sections.stats && (
          <section ref={statsRef} className="stats-section page-width" aria-label={isArabic ? "إحصائيات" : "Statistics"}><div className="stats-grid">{c.stats.map(([value, label], idx) => <CraftStandard key={`${label}-${idx}`} value={value} label={label} active={statsActive} />)}</div></section>
        )}

        {siteCustom.sections.reviews && (
          <section className="section testimonials-section page-width">
            <div className="reviews-heading-row"><Reveal><SectionHeader eyebrow={c.testimonialsEyebrow} title={c.testimonialsTitle} /></Reveal><Reveal delay={80} className="reviews-actions"><button className="review-count-button" onClick={() => setReviewsOpen(true)} aria-label={c.reviewOpen}><strong>{reviewsQuery.data?.total ?? 0}</strong><span>{c.reviewCountLabel}</span><ArrowUpRight size={17} /></button><button className="button button--line review-submit-button" onClick={() => setReviewFormOpen(true)}><Plus size={16} />{c.reviewFormSubmit}</button></Reveal></div>
            <p className="review-moderation-note">{c.reviewModeratedNote}</p>
            {reviewSubmittedNotice && <p className="review-submission-notice" aria-live="polite">{getReviewSubmissionNotice(language)}</p>}
            {reviewReference && <div className="review-reference-card"><div><span className="review-reference-label">{c.reviewReferenceLabel}</span><code>{reviewReference}</code></div><button type="button" className="button button--line" onClick={copyReviewReference}><Copy size={15} />{referenceCopied ? c.reviewReferenceCopied : c.reviewReferenceCopy}</button></div>}
            <div className="review-tracker"><div><h3>{c.reviewTrackTitle}</h3><p>{c.reviewTrackBody}</p></div><form onSubmit={handleTrackReview}><label className="sr-only" htmlFor="review-reference-input">{c.reviewReferenceLabel}</label><input id="review-reference-input" value={trackingInput} onChange={(event) => setTrackingInput(event.target.value.toUpperCase())} placeholder={c.reviewReferencePlaceholder} maxLength={16} autoComplete="off" /><button className="button button--gold" type="submit">{c.reviewTrackSubmit}</button></form>{trackingReference && reviewStatusQuery.isLoading && <p className="review-tracker-result">{c.reviewTrackLoading}</p>}{trackingReference && !reviewStatusQuery.isLoading && reviewStatusQuery.data && <div className="review-tracker-result"><strong className={`review-status review-status--${reviewStatusQuery.data.status}`}>{getReviewStatusLabel(reviewStatusQuery.data.status, c)}</strong><span>{c.reviewTrackDate}: {new Date(reviewStatusQuery.data.createdAt).toLocaleDateString(c.locale)}</span></div>}{trackingReference && !reviewStatusQuery.isLoading && !reviewStatusQuery.data && <p className="review-tracker-result review-tracker-result--error">{c.reviewTrackNotFound}</p>}</div>
            {reviewsQuery.isLoading ? <div className="review-empty-state">{isArabic ? "جارٍ تحميل المراجعات..." : "Loading approved reviews..."}</div> : <div className="testimonial-grid">{(reviewsQuery.data?.items ?? []).slice(0, 3).map((review, index) => <Reveal key={review.id} delay={index * 65} className="testimonial-card"><div className="testimonial-top"><div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill={star < review.rating ? "currentColor" : "none"} />)}</div><span>{review.rating}.0</span></div><p>“{getLocalizedReviewText(review, language)}”</p><div className="testimonial-person"><span className="testimonial-avatar">{review.name.charAt(0).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")}</small></span></div></Reveal>)}</div>}
            {!reviewsQuery.isLoading && (reviewsQuery.data?.items.length ?? 0) === 0 && <div className="review-empty-state">{c.reviewEmpty}</div>}
          </section>
        )}

        {user?.role === "admin" && <section className="admin-review-panel page-width"><div className="admin-review-heading"><span className="eyebrow"><span className="eyebrow-rule" />{c.reviewModerationTitle}</span><span>{pendingReviewsQuery.data?.length ?? 0}</span></div>{(pendingReviewsQuery.data ?? []).map((review) => <article className="admin-review-item" key={review.id}><div><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")} · {review.rating}/5</small><p>{getLocalizedReviewText(review, language)}</p></div><div className="admin-review-actions"><button className="button button--gold" onClick={() => moderateReview.mutate({ id: review.id, status: "approved" })}>{c.reviewApprove}</button><button className="button button--line" onClick={() => moderateReview.mutate({ id: review.id, status: "rejected" })}>{c.reviewReject}</button></div></article>)}{!pendingReviewsQuery.isLoading && (pendingReviewsQuery.data?.length ?? 0) === 0 && <p className="review-empty-state">{c.reviewAdminEmpty}</p>}</section>}

        {siteCustom.sections.closingCta && (
          <section id="contact" className="closing-cta">
            <div className="closing-image"><img src={siteCustom.media.closingImage || images.hero} alt="Luxury vehicle protected with clear PPF" loading="lazy" decoding="async" /><div className="closing-shade" /></div>
            <div className="closing-content page-width"><Reveal><div className="eyebrow eyebrow--light"><span className="eyebrow-rule" />{c.contactEyebrow}</div><h2>{c.contactTitle}</h2><p>{c.contactBody}</p><WhatsAppLink language={language} className="button button--gold" customHref={siteCustom.buttons.closingCtaUrl || customWhatsappUrl}>{c.ctaButton}</WhatsAppLink></Reveal><div className="closing-contact"><span>{c.contactLabel}</span><a href={siteCustom.buttons.closingCtaUrl || customWhatsappUrl || whatsappHref(language)} target="_blank" rel="noreferrer">{siteCustom.brand.whatsappDisplay}</a></div></div>
          </section>
        )}

        {siteCustom.sections.seoGuides && (
          <section className="home-seo-links page-width" aria-labelledby="home-seo-heading">
            <div className="eyebrow"><span className="eyebrow-rule" />{extraTexts.seoSectionEyebrow}</div>
            <h2 id="home-seo-heading">{extraTexts.seoSectionTitle}</h2>
            <p>{extraTexts.seoSectionBody}</p>
            <div className="home-seo-link-grid">
              {seoButtons.map((btn, index) => (
                <Link key={index} href={language === "ar" ? btn.hrefAr : btn.hrefEn}>
                  {language === "ar" ? btn.labelAr : btn.labelEn}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="page-width footer-grid">
          <div>
            <BrandMark primary={siteCustom.brand.brandPrimary} secondary={siteCustom.brand.brandSecondary} />
            <p>{c.footerDescription}</p>
          </div>
          <div className="footer-column">
            <span className="footer-label">{c.footerLinks}</span>
            {c.nav.slice(0, 5).map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)}>{label}</button>)}
            <Link className="footer-legal-link" href="/privacy">{language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <Link className="footer-legal-link" href="/terms">{language === "ar" ? "الشروط والأحكام" : "Terms of Service"}</Link>
            <Link className="footer-legal-link" href="/contact">{language === "ar" ? "التواصل" : "Contact"}</Link>
          </div>
          <div className="footer-column">
            <span className="footer-label">{c.footerContact}</span>
            <WhatsAppLink language={language} customHref={customWhatsappUrl}>{siteCustom.brand.whatsappDisplay}</WhatsAppLink>
            <div className="social-links" aria-label="PPFStudio social profiles">
              <a className="social-link" href={siteCustom.brand.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Instagram"><Instagram size={16} /> <span>Instagram</span></a>
              <a className="social-link" href={siteCustom.brand.snapchatUrl} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Snapchat"><Ghost size={16} /> <span>Snapchat</span></a>
              <a className="social-link" href={siteCustom.brand.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on TikTok"><Music2 size={16} /> <span>TikTok</span></a>
              <Link className="social-link social-link--admin" href="/admin" aria-label="Open PPFStudio Admin panel"><ShieldCheck size={16} /> <span>Admin</span></Link>
            </div>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>{c.footerCopyright}</span>
          <div className="footer-language-bar">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                className={`footer-language-pill ${language === opt.code ? "active" : ""}`}
                onClick={() => selectLanguage(opt.code)}
              >
                {opt.label}
              </button>
            ))}
            <button onClick={openLanguageModal} className="footer-language-pill">
              <Globe size={12} /> Languages
            </button>
          </div>
        </div>
      </footer>

      {siteCustom.sections.floatingWhatsapp && siteCustom.buttons.showFloatingWhatsapp !== false && (
        <a href={siteCustom.buttons.floatingWhatsappUrl || customWhatsappUrl || whatsappHref(language)} target="_blank" rel="noreferrer" className="floating-whatsapp" aria-label={language === "ar" ? "التواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}><MessageCircle size={23} /><span>{c.floatingWhatsapp}</span></a>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="lightbox-dialog"><DialogTitle className="sr-only">{activeLightboxItem?.alt}</DialogTitle><DialogDescription className="sr-only">{c.openImage}</DialogDescription>{activeLightboxItem && <div className="lightbox-inner"><img src={activeLightboxItem.src} alt={activeLightboxItem.alt} /><div className="lightbox-toolbar"><span>{activeLightboxItem.id} / {localizedGalleryItems.length}</span><div><button onClick={() => setLightboxIndex((lightboxIndex! - 1 + localizedGalleryItems.length) % localizedGalleryItems.length)} aria-label={c.previous}><ChevronLeft /></button><button onClick={() => setLightboxIndex((lightboxIndex! + 1) % localizedGalleryItems.length)} aria-label={c.next}><ChevronRight /></button><button onClick={() => setLightboxIndex(null)} aria-label={c.close}><X /></button></div></div></div>}</DialogContent>
      </Dialog>

      <Dialog open={videoIndex !== null} onOpenChange={(open) => !open && setVideoIndex(null)}>
        <DialogContent className="video-dialog"><DialogTitle className="sr-only">{videoIndex === null ? "" : videoDisplayItems[videoIndex]?.title}</DialogTitle><DialogDescription className="sr-only">{c.playVideo}</DialogDescription>{videoIndex !== null && <div className="video-modal-inner"><video src={selectVideoSource(videoDisplayItems[videoIndex], VIDEO_SOURCE)} controls autoPlay playsInline preload="none" poster={videoDisplayItems[videoIndex].poster} /></div>}</DialogContent>
      </Dialog>

      <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <DialogContent className="reviews-dialog"><DialogTitle>{c.reviewOpen}</DialogTitle><DialogDescription>{c.reviewModeratedNote}</DialogDescription><div className="review-list">{(reviewsQuery.data?.items ?? []).map((review) => <article className="review-list-item" key={review.id}><div className="testimonial-top"><div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill={star < review.rating ? "currentColor" : "none"} />)}</div><time dateTime={new Date(review.createdAt).toISOString()}>{new Date(review.createdAt).toLocaleDateString(c.locale)}</time></div><p>“{getLocalizedReviewText(review, language)}”</p><div className="testimonial-person"><span className="testimonial-avatar">{review.name.charAt(0).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")}</small></span></div></article>)}{(reviewsQuery.data?.items.length ?? 0) === 0 && <div className="review-empty-state">{c.reviewEmpty}</div>}</div></DialogContent>
      </Dialog>

      <Dialog open={reviewFormOpen} onOpenChange={setReviewFormOpen}>
        <DialogContent className="review-form-dialog"><DialogTitle>{c.reviewFormTitle}</DialogTitle><DialogDescription>{c.reviewModeratedNote}</DialogDescription><form className="review-form" onSubmit={(event) => { event.preventDefault(); submitReview.mutate({ name: reviewName, vehicle: reviewVehicle || undefined, rating: reviewRating, review: reviewText }); }}><label><span>{c.reviewFormName}</span><input value={reviewName} onChange={(event) => setReviewName(event.target.value)} minLength={2} maxLength={120} required /></label><label><span>{c.reviewFormVehicle}</span><input value={reviewVehicle} onChange={(event) => setReviewVehicle(event.target.value)} maxLength={120} /></label><fieldset><legend>{c.reviewFormRating}</legend><div className="rating-picker">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={rating <= reviewRating ? "active" : ""} onClick={() => setReviewRating(rating)} aria-label={`${rating} / 5`}><Star size={18} fill={rating <= reviewRating ? "currentColor" : "none"} /></button>)}</div></fieldset><label><span>{c.reviewFormText}</span><textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} minLength={20} maxLength={1000} rows={5} required /></label><button className="button button--gold" type="submit" disabled={submitReview.isPending}>{submitReview.isPending ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : c.reviewFormSubmit}</button></form></DialogContent>
      </Dialog>

      <Dialog open={!isLoading && showLanguageModal && siteCustom.sections.languageModalOnFirstVisit} onOpenChange={(open) => setShowLanguageModal(open)}>
        <DialogContent className="language-dialog" showCloseButton={false}>
          <DialogTitle>{c.modalTitle}</DialogTitle>
          <DialogDescription>{c.modalBody}</DialogDescription>
          <div className="language-cards language-cards--multi">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => selectLanguage(opt.code)}
                className={`language-card ${opt.dir === "rtl" ? "language-card--ar" : ""} ${language === opt.code ? "is-active" : ""}`}
              >
                <span className="language-code">{opt.short}</span>
                <strong>{opt.label}</strong>
                <small>{opt.nativeHint}</small>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
          <div className="language-modal-foot"><InlineBrandMark alt="PPF Paint Protection Film logo" /> <span>PPFSTUDIO / 2026 · 6 LANGUAGES</span></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
