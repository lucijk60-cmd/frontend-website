/* Obsidian Atelier: cinematic editorial luxury, graphite surfaces, restrained champagne-gold precision cues. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CirclePlay,
  Droplets,
  Ghost,
  Instagram,
  Menu,
  LockKeyhole,
  Music2,
  MessageCircle,
  MoveHorizontal,
  Play,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { selectPublishedMedia, selectVideoSource } from "@/lib/media";
import { getLocalizedReviewText } from "@/lib/reviews";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BRAND_NAME,
  galleryItems,
  images,
  INSTAGRAM_URL,
  SNAPCHAT_URL,
  TIKTOK_URL,
  translations,
  type Content,
  type Language,
  videoItems,
  whatsappHref,
  WHATSAPP_DISPLAY,
} from "@/lib/siteContent";

const VIDEO_SOURCE = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
const STORAGE_KEY = "aurelis-language";
const galleryFilterKeys = ["all", "Full Body PPF", "Front PPF", "Luxury Cars", "SUV", "Before & After", "Installation"];

function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "ar" || saved === "en" ? saved : null;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-lockup brand-lockup--compact" : "brand-lockup"} aria-label={BRAND_NAME}>
      <img src={images.mark} alt="PPF Paint Protection Film logo" className="brand-mark" />
      <span className="brand-wordmark"><b>PPF</b><i>Studio</i></span>
    </span>
  );
}

function WhatsAppLink({ language, children, className = "", compact = false }: { language: Language; children: ReactNode; className?: string; compact?: boolean }) {
  const c = translations[language];
  return (
    <a
      className={`whatsapp-link ${compact ? "whatsapp-link--compact" : ""} ${className}`}
      href={whatsappHref(language)}
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
  const statsRef = useRef<HTMLElement | null>(null);
  const c: Content = translations[language];
  const isArabic = language === "ar";
  const { user } = useAuth();
  const trpcUtils = trpc.useUtils();
  const reviewsQuery = trpc.reviews.list.useQuery({ limit: 24, offset: 0 });
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
    onSuccess: () => {
      setReviewName("");
      setReviewVehicle("");
      setReviewRating(5);
      setReviewText("");
      setReviewFormOpen(false);
      toast.success(c.reviewPending);
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
    document.title = language === "ar" ? "حماية الطلاء PPF | حماية احترافية للسيارات" : "Premium PPF Film | Professional Paint Protection";
    const description = language === "ar"
      ? "حماية احترافية لطلاء السيارات باستخدام أفلام PPF عالية الجودة وتركيب دقيق في استوديو PPFStudio."
      : "Premium paint protection film, precision installation and automotive care from PPFStudio.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }, [c.dir, c.locale, language]);

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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const localizedGalleryItems = useMemo(() => {
    const staticItems = galleryItems.map((item) => isArabic && "arSrc" in item ? { ...item, src: item.arSrc, alt: item.arAlt } : item);
    const uploadedItems = selectPublishedMedia(publishedMediaQuery.data ?? [], language, "image")
      .map((item) => ({ id: 10000 + item.id, category: "Admin Uploads", src: item.url, alt: item.title }));
    return [...staticItems, ...uploadedItems];
  }, [isArabic, language, publishedMediaQuery.data]);
  const videoDisplayItems = useMemo(() => {
    const staticVideos = videoItems.map(item => ({ ...item, poster: item.src, isUploaded: false }));
    const uploadedVideos = selectPublishedMedia(publishedMediaQuery.data ?? [], language, "video")
      .map((item) => ({ title: item.title, src: item.url, poster: images.galleryCoupe, isUploaded: true }));
    return [...staticVideos, ...uploadedVideos];
  }, [language, publishedMediaQuery.data]);
  const filteredGallery = useMemo(() => {
    if (activeFilter === 0) return localizedGalleryItems;
    return localizedGalleryItems.filter((item) => item.category === galleryFilterKeys[activeFilter]);
  }, [activeFilter, localizedGalleryItems]);

  const activeLightboxItem = lightboxIndex === null ? null : localizedGalleryItems[lightboxIndex];

  return (
    <div className={`site-shell ${isArabic ? "site-shell--rtl" : ""}`}>
      {isLoading && (
        <div className="preloader" aria-live="polite">
          <div className="preloader-orbit preloader-orbit--outer" />
          <div className="preloader-orbit preloader-orbit--inner" />
          <div className="preloader-logo-wrap"><img src={images.mark} alt="" className="preloader-mark" /><span className="preloader-corner preloader-corner--tl" /><span className="preloader-corner preloader-corner--br" /></div>
          <div className="preloader-copy"><span className="preloader-kicker">PPF / PAINT PROTECTION FILM</span><strong>Preparing your finish</strong><span className="preloader-status">PPFSTUDIO / 2026</span></div>
          <div className="preloader-progress"><span /></div>
        </div>
      )}

      <header className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}>
        <div className="nav-inner">
          <button className="brand-button" onClick={() => scrollToSection("home")} aria-label="PPFStudio home">
            <BrandMark />
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {c.nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollToSection(id)}>{label}</button>
            ))}
          </nav>
          <div className="nav-actions">
            <div className="language-switcher" aria-label="Language switcher">
              <button className={language === "ar" ? "active" : ""} onClick={() => selectLanguage("ar")}>العربية</button>
              <span>/</span>
              <button className={language === "en" ? "active" : ""} onClick={() => selectLanguage("en")}>English</button>
            </div>
            <WhatsAppLink language={language} compact>{c.navCta}</WhatsAppLink>
            <button className="menu-button" onClick={() => setMobileMenuOpen(true)} aria-label={c.menu}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side={isArabic ? "left" : "right"} className="mobile-sheet">
          <SheetHeader>
            <BrandMark compact />
            <SheetTitle className="sr-only">{c.menu}</SheetTitle>
            <SheetDescription className="sr-only">PPFStudio navigation</SheetDescription>
          </SheetHeader>
          <div className="mobile-nav-list">
            {c.nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollToSection(id)}>{label}<ArrowUpRight size={17} /></button>
            ))}
            <button className="mobile-admin-link" onClick={() => { setMobileMenuOpen(false); window.location.href = "/admin"; }}><span><LockKeyhole size={16} />{isArabic ? "الإدارة" : "Admin"}</span><ArrowUpRight size={17} /></button>
          </div>
          <div className="mobile-sheet-footer">
            <div className="mobile-language-row">
              <button className={language === "ar" ? "active" : ""} onClick={() => selectLanguage("ar")}>العربية</button>
              <button className={language === "en" ? "active" : ""} onClick={() => selectLanguage("en")}>English</button>
            </div>
            <WhatsAppLink language={language}>{c.navCta}</WhatsAppLink>
          </div>
        </SheetContent>
      </Sheet>

      <main>
        <section id="home" className="hero-section">
          <img src={images.hero} alt="Black sports coupe receiving precision paint protection film installation" className="hero-image" fetchPriority="high" decoding="async" />
          <div className="hero-overlay" />
          <div className="hero-grid-lines" />
          <div className="hero-content page-width">
            <Reveal className="hero-copy">
              <div className="eyebrow eyebrow--light"><span className="eyebrow-rule" />{c.heroEyebrow}</div>
              <h1>{c.heroTitle}</h1>
              <p>{c.heroBody}</p>
              <div className="hero-actions">
                <button className="button button--gold" onClick={() => scrollToSection("work")}>{c.viewWork}<ArrowUpRight size={17} /></button>
                <button className="button button--line" onClick={() => scrollToSection("contact")}>{c.book}<ArrowDown size={17} /></button>
              </div>
              <WhatsAppLink language={language} className="hero-whatsapp">{c.heroWhatsapp}</WhatsAppLink>
            </Reveal>
            <div className="hero-side-note">
              <span>01</span><span className="hero-side-rule" /><span>{isArabic ? "حماية الطلاء" : "PAINT PROTECTION"}</span>
            </div>
          </div>
          <button className="scroll-cue" onClick={() => scrollToSection("services")} aria-label={c.scroll}><span>{c.scroll}</span><ChevronDown size={17} /></button>
        </section>

        <section id="services" className="section services-section page-width">
          <div className="section-intro split-intro">
            <Reveal><SectionHeader eyebrow={c.servicesEyebrow} title={c.servicesTitle} body={c.servicesBody} /></Reveal>
            <Reveal delay={80} className="section-aside-note"><span>PPF / 2026</span><p>{isArabic ? "حماية متقدمة. تركيب دقيق." : "Advanced protection. Measured installation."}</p></Reveal>
          </div>
          <Reveal delay={120}><div className="section-label-row"><h3>{c.servicesHeading}</h3><span>06 {isArabic ? "خدمات" : "SERVICES"}</span></div></Reveal>
          <div className="services-grid">
            {c.services.map(([title, body, number], index) => (
              <Reveal key={number} delay={index * 45} className="service-card">
                <div className="service-topline"><span>{number}</span><ArrowUpRight size={18} /></div>
                <div className="service-icon">{index === 0 ? <ShieldCheck /> : index === 1 ? <Sparkles /> : index === 2 ? <Ruler /> : index === 3 ? <Droplets /> : index === 4 ? <SunMedium /> : <Plus />}</div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="service-underline" />
              </Reveal>
            ))}
          </div>
        </section>

        <section id="why-us" className="manifesto-section">
          <div className="page-width manifesto-grid">
            <Reveal><div className="manifesto-numeral">02<span>/</span></div></Reveal>
            <Reveal delay={80} className="manifesto-copy"><div className="eyebrow"><span className="eyebrow-rule" />{isArabic ? "لماذا تختارنا؟" : "WHY PPFSTUDIO"}</div><h2>{isArabic ? "حماية لا تُرى. دقة لا تُنسى." : "Protection that disappears. Precision that remains."}</h2></Reveal>
            <Reveal delay={140} className="manifesto-points">
              {[isArabic ? ["جودة استثنائية", "مواد عالية الجودة ونتائج احترافية."] : ["Exceptional quality", "Premium materials, professionally finished."], isArabic ? ["تركيب احترافي", "عناية دقيقة بكل تفصيلة أثناء التركيب."] : ["Professional installation", "Measured care in every step of the install."], isArabic ? ["حماية غير مرئية", "حماية قوية مع الحفاظ على المظهر الأصلي."] : ["Invisible protection", "Strong protection without changing the original look."]].map(([title, body]) => <div className="manifesto-point" key={title}><Check size={16} /><div><strong>{title}</strong><span>{body}</span></div></div>)}
            </Reveal>
          </div>
        </section>

        <section id="work" className="section work-section page-width">
          <Reveal><SectionHeader eyebrow={c.workEyebrow} title={c.workTitle} body={c.workBody} /></Reveal>
          <Reveal delay={80} className="filter-row" aria-label="Portfolio filters">
            {c.filters.map((filter, index) => <button key={filter} className={activeFilter === index ? "active" : ""} onClick={() => setActiveFilter(index)}>{filter}</button>)}
          </Reveal>
          <div className="gallery-grid">
            {filteredGallery.map((item, index) => {
              const originalIndex = localizedGalleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
              return <Reveal key={item.id} delay={index * 55} className={`gallery-card gallery-card--${item.id}`}><button onClick={() => setLightboxIndex(originalIndex)} aria-label={`${c.openImage}: ${item.alt}`}><img src={item.src} alt={item.alt} loading="lazy" decoding="async" sizes="(max-width: 720px) 100vw, 50vw" /><span className="gallery-shade" /><span className="gallery-meta"><span>0{item.id}</span><strong>{c.galleryLabels[localizedGalleryItems.findIndex((galleryItem) => galleryItem.id === item.id)]}</strong><ArrowUpRight size={18} /></span></button></Reveal>;
            })}
          </div>
        </section>

        <section id="before-after" className="section comparison-section page-width">
          <div className="comparison-copy"><Reveal><SectionHeader eyebrow={c.beforeEyebrow} title={c.beforeTitle} body={c.beforeBody} /></Reveal><Reveal delay={100} className="comparison-instruction"><MoveHorizontal size={20} /><span>{isArabic ? "اسحب للمقارنة" : "Drag to compare"}</span></Reveal></div>
          <Reveal delay={100} className="comparison-frame">
            <div className="comparison-stage">
              <img src={images.secondaryDetail} alt={c.afterLabel} className="comparison-image comparison-image--after" loading="lazy" decoding="async" />
              <div className="comparison-before" style={{ width: `${comparison}%` }}><img src={images.detailSuv} alt={c.beforeLabel} className="comparison-image" loading="lazy" decoding="async" /></div>
              <div className="comparison-divider" style={{ left: `${comparison}%` }}><span /></div>
              <span className="comparison-label comparison-label--before">{c.beforeLabel}</span><span className="comparison-label comparison-label--after">{c.afterLabel}</span>
            </div>
            <input className="comparison-input" type="range" min="0" max="100" value={comparison} onChange={(event) => setComparison(Number(event.target.value))} aria-label={c.beforeTitle} />
          </Reveal>
        </section>

        <section className="section video-section">
          <div className="page-width"><Reveal><SectionHeader eyebrow={c.videoEyebrow} title={c.videoTitle} body={c.videoBody} /></Reveal><div className="video-grid">{videoDisplayItems.map((item, index) => <Reveal key={`${item.title}-${index}`} delay={index * 55} className="video-card"><button onClick={() => setVideoIndex(index)} aria-label={`${c.playVideo}: ${item.title}`}><img src={item.poster} alt="" loading="lazy" decoding="async" sizes="(max-width: 720px) 100vw, 50vw" /><span className="video-shade" /><span className="video-play"><CirclePlay size={42} strokeWidth={1.2} /></span><span className="video-label"><span>0{index + 1}</span>{item.title}</span></button></Reveal>)}</div></div>
        </section>

        <section id="process" className="section process-section page-width">
          <Reveal><SectionHeader eyebrow={c.processEyebrow} title={c.processTitle} body={c.processBody} /></Reveal>
          <div className="process-list">{c.process.map(([title, body], index) => <Reveal key={title} delay={index * 50} className="process-row"><div className="process-number">0{index + 1}</div><div className="process-line" /><div className="process-copy"><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={20} className="process-arrow" /></Reveal>)}</div>
        </section>

        <section id="about" className="quality-section">
          <div className="quality-image-wrap"><img src={images.installation} alt="Precision PPF installation in a controlled studio" loading="lazy" decoding="async" /><div className="quality-image-caption"><span>07</span><span>{isArabic ? "المواد / التركيب" : "MATERIAL / INSTALL"}</span></div></div>
          <div className="quality-content"><Reveal><SectionHeader eyebrow={c.qualityEyebrow} title={c.qualityTitle} body={c.qualityBody} /></Reveal><Reveal delay={100} className="quality-list">{c.qualityFeatures.map((feature, index) => <div className="quality-item" key={feature}><span>0{index + 1}</span><Check size={16} /><strong>{feature}</strong></div>)}</Reveal><Reveal delay={180}><button className="text-link" onClick={() => scrollToSection("contact")}>{isArabic ? "تحدث مع فريقنا" : "Talk to our team"}<ArrowUpRight size={16} /></button></Reveal></div>
        </section>

        <section ref={statsRef} className="stats-section page-width" aria-label={isArabic ? "إحصائيات" : "Statistics"}><div className="stats-grid">{c.stats.map(([value, label]) => <CraftStandard key={label} value={value} label={label} active={statsActive} />)}</div></section>

        <section className="section testimonials-section page-width">
          <div className="reviews-heading-row"><Reveal><SectionHeader eyebrow={c.testimonialsEyebrow} title={c.testimonialsTitle} /></Reveal><Reveal delay={80} className="reviews-actions"><button className="review-count-button" onClick={() => setReviewsOpen(true)} aria-label={c.reviewOpen}><strong>{reviewsQuery.data?.total ?? 0}</strong><span>{c.reviewCountLabel}</span><ArrowUpRight size={17} /></button><button className="button button--line review-submit-button" onClick={() => setReviewFormOpen(true)}><Plus size={16} />{c.reviewFormSubmit}</button></Reveal></div>
          <p className="review-moderation-note">{c.reviewModeratedNote}</p>
          {reviewsQuery.isLoading ? <div className="review-empty-state">{isArabic ? "جارٍ تحميل المراجعات..." : "Loading approved reviews..."}</div> : <div className="testimonial-grid">{(reviewsQuery.data?.items ?? []).slice(0, 3).map((review, index) => <Reveal key={review.id} delay={index * 65} className="testimonial-card"><div className="testimonial-top"><div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill={star < review.rating ? "currentColor" : "none"} />)}</div><span>{review.rating}.0</span></div><p>“{getLocalizedReviewText(review, language)}”</p><div className="testimonial-person"><span className="testimonial-avatar">{review.name.charAt(0).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")}</small></span></div></Reveal>)}</div>}
          {!reviewsQuery.isLoading && (reviewsQuery.data?.items.length ?? 0) === 0 && <div className="review-empty-state">{c.reviewEmpty}</div>}
        </section>

        {user?.role === "admin" && <section className="admin-review-panel page-width"><div className="admin-review-heading"><span className="eyebrow"><span className="eyebrow-rule" />{c.reviewModerationTitle}</span><span>{pendingReviewsQuery.data?.length ?? 0}</span></div>{(pendingReviewsQuery.data ?? []).map((review) => <article className="admin-review-item" key={review.id}><div><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")} · {review.rating}/5</small><p>{getLocalizedReviewText(review, language)}</p></div><div className="admin-review-actions"><button className="button button--gold" onClick={() => moderateReview.mutate({ id: review.id, status: "approved" })}>{c.reviewApprove}</button><button className="button button--line" onClick={() => moderateReview.mutate({ id: review.id, status: "rejected" })}>{c.reviewReject}</button></div></article>)}{!pendingReviewsQuery.isLoading && (pendingReviewsQuery.data?.length ?? 0) === 0 && <p className="review-empty-state">{c.reviewAdminEmpty}</p>}</section>}

        <section id="contact" className="closing-cta">
          <div className="closing-image"><img src={images.hero} alt="Luxury vehicle protected with clear PPF" loading="lazy" decoding="async" /><div className="closing-shade" /></div>
          <div className="closing-content page-width"><Reveal><div className="eyebrow eyebrow--light"><span className="eyebrow-rule" />{c.contactEyebrow}</div><h2>{c.contactTitle}</h2><p>{c.contactBody}</p><WhatsAppLink language={language} className="button button--gold">{c.ctaButton}</WhatsAppLink></Reveal><div className="closing-contact"><span>{c.contactLabel}</span><a href={whatsappHref(language)} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="page-width footer-grid"><div><BrandMark /><p>{c.footerDescription}</p></div><div className="footer-column"><span className="footer-label">{c.footerLinks}</span>{c.nav.slice(0, 5).map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)}>{label}</button>)}</div><div className="footer-column"><span className="footer-label">{c.footerContact}</span><WhatsAppLink language={language}>{WHATSAPP_DISPLAY}</WhatsAppLink><div className="social-links" aria-label="PPFStudio social profiles"><a className="social-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Instagram"><Instagram size={16} /> <span>Instagram</span></a><a className="social-link" href={SNAPCHAT_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Snapchat"><Ghost size={16} /> <span>Snapchat</span></a><a className="social-link" href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on TikTok"><Music2 size={16} /> <span>TikTok</span></a><a className="social-link social-link--admin" href="/admin" aria-label="Open PPFStudio Admin panel"><ShieldCheck size={16} /> <span>Admin</span></a></div></div></div><div className="page-width footer-bottom"><span>{c.footerCopyright}</span><button onClick={openLanguageModal}>{language === "ar" ? "English" : "العربية"}</button></div></footer>

      <a href={whatsappHref(language)} target="_blank" rel="noreferrer" className="floating-whatsapp" aria-label={language === "ar" ? "التواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}><MessageCircle size={23} /><span>{c.floatingWhatsapp}</span></a>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="lightbox-dialog"><DialogTitle className="sr-only">{activeLightboxItem?.alt}</DialogTitle><DialogDescription className="sr-only">{c.openImage}</DialogDescription>{activeLightboxItem && <div className="lightbox-inner"><img src={activeLightboxItem.src} alt={activeLightboxItem.alt} /><div className="lightbox-toolbar"><span>{activeLightboxItem.id} / {localizedGalleryItems.length}</span><div><button onClick={() => setLightboxIndex((lightboxIndex! - 1 + localizedGalleryItems.length) % localizedGalleryItems.length)} aria-label={c.previous}><ChevronLeft /></button><button onClick={() => setLightboxIndex((lightboxIndex! + 1) % localizedGalleryItems.length)} aria-label={c.next}><ChevronRight /></button><button onClick={() => setLightboxIndex(null)} aria-label={c.close}><X /></button></div></div></div>}</DialogContent>
      </Dialog>

      <Dialog open={videoIndex !== null} onOpenChange={(open) => !open && setVideoIndex(null)}>
        <DialogContent className="video-dialog"><DialogTitle className="sr-only">{videoIndex === null ? "" : videoDisplayItems[videoIndex]?.title}</DialogTitle><DialogDescription className="sr-only">{c.playVideo}</DialogDescription>{videoIndex !== null && <div className="video-modal-inner"><video src={selectVideoSource(videoDisplayItems[videoIndex], VIDEO_SOURCE)} controls autoPlay playsInline preload="none" poster={videoDisplayItems[videoIndex].poster} /></div>}</DialogContent>
      </Dialog>

      <Dialog open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <DialogContent className="reviews-dialog"><DialogTitle>{c.reviewOpen}</DialogTitle><DialogDescription>{c.reviewModeratedNote}</DialogDescription><div className="review-list">{(reviewsQuery.data?.items ?? []).map((review) => <article className="review-list-item" key={review.id}><div className="testimonial-top"><div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill={star < review.rating ? "currentColor" : "none"} />)}</div><time dateTime={new Date(review.createdAt).toISOString()}>{new Date(review.createdAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}</time></div><p>“{getLocalizedReviewText(review, language)}”</p><div className="testimonial-person"><span className="testimonial-avatar">{review.name.charAt(0).toUpperCase()}</span><span><strong>{review.name}</strong><small>{review.vehicle || (isArabic ? "عميل" : "Client")}</small></span></div></article>)}{(reviewsQuery.data?.items.length ?? 0) === 0 && <div className="review-empty-state">{c.reviewEmpty}</div>}</div></DialogContent>
      </Dialog>

      <Dialog open={reviewFormOpen} onOpenChange={setReviewFormOpen}>
        <DialogContent className="review-form-dialog"><DialogTitle>{c.reviewFormTitle}</DialogTitle><DialogDescription>{c.reviewModeratedNote}</DialogDescription><form className="review-form" onSubmit={(event) => { event.preventDefault(); submitReview.mutate({ name: reviewName, vehicle: reviewVehicle || undefined, rating: reviewRating, review: reviewText }); }}><label><span>{c.reviewFormName}</span><input value={reviewName} onChange={(event) => setReviewName(event.target.value)} minLength={2} maxLength={120} required /></label><label><span>{c.reviewFormVehicle}</span><input value={reviewVehicle} onChange={(event) => setReviewVehicle(event.target.value)} maxLength={120} /></label><fieldset><legend>{c.reviewFormRating}</legend><div className="rating-picker">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={rating <= reviewRating ? "active" : ""} onClick={() => setReviewRating(rating)} aria-label={`${rating} / 5`}><Star size={18} fill={rating <= reviewRating ? "currentColor" : "none"} /></button>)}</div></fieldset><label><span>{c.reviewFormText}</span><textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} minLength={20} maxLength={1000} rows={5} required /></label><button className="button button--gold" type="submit" disabled={submitReview.isPending}>{submitReview.isPending ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : c.reviewFormSubmit}</button></form></DialogContent>
      </Dialog>

      <Dialog open={!isLoading && showLanguageModal} onOpenChange={() => undefined}>
        <DialogContent className="language-dialog" showCloseButton={false}><DialogTitle>{c.modalTitle}</DialogTitle><DialogDescription>{c.modalBody}</DialogDescription><div className="language-cards"><button onClick={() => selectLanguage("ar")} className="language-card language-card--ar"><span className="language-code">AR</span><strong>{c.modalArabic}</strong><small>{c.modalArabicHint}</small><ArrowUpRight size={19} /></button><button onClick={() => selectLanguage("en")} className="language-card"><span className="language-code">EN</span><strong>{c.modalEnglish}</strong><small>{c.modalEnglishHint}</small><ArrowUpRight size={19} /></button></div><div className="language-modal-foot"><img src={images.mark} alt="PPF Paint Protection Film logo" /> <span>PPFSTUDIO / 2026</span></div></DialogContent>
      </Dialog>
    </div>
  );
}
