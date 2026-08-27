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
  const statsRef = useRef<HTMLElement | null>(null);
  const c: Content = translations[language];
  const isArabic = language === "ar";

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
      ? "حماية احترافية لطلاء السيارات باستخدام أفلام PPF عالية الجودة وتركيب دقيق في استوديو AURELIS."
      : "Premium paint protection film, precision installation and automotive care from AURELIS.";
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

  const filteredGallery = useMemo(() => {
    if (activeFilter === 0) return galleryItems;
    return galleryItems.filter((item) => item.category === galleryFilterKeys[activeFilter]);
  }, [activeFilter]);

  const activeLightboxItem = lightboxIndex === null ? null : galleryItems[lightboxIndex];

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
          <button className="brand-button" onClick={() => scrollToSection("home")} aria-label="AURELIS home">
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
            <SheetDescription className="sr-only">AURELIS navigation</SheetDescription>
          </SheetHeader>
          <div className="mobile-nav-list">
            {c.nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollToSection(id)}>{label}<ArrowUpRight size={17} /></button>
            ))}
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
          <img src={images.hero} alt="Black sports coupe receiving precision paint protection film installation" className="hero-image" fetchPriority="high" />
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
            <Reveal delay={80} className="manifesto-copy"><div className="eyebrow"><span className="eyebrow-rule" />{isArabic ? "لماذا تختارنا؟" : "WHY AURELIS"}</div><h2>{isArabic ? "حماية لا تُرى. دقة لا تُنسى." : "Protection that disappears. Precision that remains."}</h2></Reveal>
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
              const originalIndex = galleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
              return <Reveal key={item.id} delay={index * 55} className={`gallery-card gallery-card--${item.id}`}><button onClick={() => setLightboxIndex(originalIndex)} aria-label={`${c.openImage}: ${item.alt}`}><img src={item.src} alt={item.alt} loading="lazy" /><span className="gallery-shade" /><span className="gallery-meta"><span>0{item.id}</span><strong>{c.galleryLabels[galleryItems.findIndex((galleryItem) => galleryItem.id === item.id)]}</strong><ArrowUpRight size={18} /></span></button></Reveal>;
            })}
          </div>
        </section>

        <section id="before-after" className="section comparison-section page-width">
          <div className="comparison-copy"><Reveal><SectionHeader eyebrow={c.beforeEyebrow} title={c.beforeTitle} body={c.beforeBody} /></Reveal><Reveal delay={100} className="comparison-instruction"><MoveHorizontal size={20} /><span>{isArabic ? "اسحب للمقارنة" : "Drag to compare"}</span></Reveal></div>
          <Reveal delay={100} className="comparison-frame">
            <div className="comparison-stage">
              <img src={images.secondaryDetail} alt={c.afterLabel} className="comparison-image comparison-image--after" loading="lazy" />
              <div className="comparison-before" style={{ width: `${comparison}%` }}><img src={images.detailSuv} alt={c.beforeLabel} className="comparison-image" loading="lazy" /></div>
              <div className="comparison-divider" style={{ left: `${comparison}%` }}><span /></div>
              <span className="comparison-label comparison-label--before">{c.beforeLabel}</span><span className="comparison-label comparison-label--after">{c.afterLabel}</span>
            </div>
            <input className="comparison-input" type="range" min="0" max="100" value={comparison} onChange={(event) => setComparison(Number(event.target.value))} aria-label={c.beforeTitle} />
          </Reveal>
        </section>

        <section className="section video-section">
          <div className="page-width"><Reveal><SectionHeader eyebrow={c.videoEyebrow} title={c.videoTitle} body={c.videoBody} /></Reveal><div className="video-grid">{videoItems.map((item, index) => <Reveal key={item.title} delay={index * 55} className="video-card"><button onClick={() => setVideoIndex(index)} aria-label={`${c.playVideo}: ${c.videoCategories[index]}`}><img src={item.src} alt="" loading="lazy" /><span className="video-shade" /><span className="video-play"><CirclePlay size={42} strokeWidth={1.2} /></span><span className="video-label"><span>0{index + 1}</span>{c.videoCategories[index]}</span></button></Reveal>)}</div></div>
        </section>

        <section id="process" className="section process-section page-width">
          <Reveal><SectionHeader eyebrow={c.processEyebrow} title={c.processTitle} body={c.processBody} /></Reveal>
          <div className="process-list">{c.process.map(([title, body], index) => <Reveal key={title} delay={index * 50} className="process-row"><div className="process-number">0{index + 1}</div><div className="process-line" /><div className="process-copy"><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={20} className="process-arrow" /></Reveal>)}</div>
        </section>

        <section id="about" className="quality-section">
          <div className="quality-image-wrap"><img src={images.installation} alt="Precision PPF installation in a controlled studio" loading="lazy" /><div className="quality-image-caption"><span>07</span><span>{isArabic ? "المواد / التركيب" : "MATERIAL / INSTALL"}</span></div></div>
          <div className="quality-content"><Reveal><SectionHeader eyebrow={c.qualityEyebrow} title={c.qualityTitle} body={c.qualityBody} /></Reveal><Reveal delay={100} className="quality-list">{c.qualityFeatures.map((feature, index) => <div className="quality-item" key={feature}><span>0{index + 1}</span><Check size={16} /><strong>{feature}</strong></div>)}</Reveal><Reveal delay={180}><button className="text-link" onClick={() => scrollToSection("contact")}>{isArabic ? "تحدث مع فريقنا" : "Talk to our team"}<ArrowUpRight size={16} /></button></Reveal></div>
        </section>

        <section ref={statsRef} className="stats-section page-width" aria-label={isArabic ? "إحصائيات" : "Statistics"}><div className="stats-grid">{c.stats.map(([value, label]) => <CraftStandard key={label} value={value} label={label} active={statsActive} />)}</div></section>

        <section className="section testimonials-section page-width">
          <Reveal><SectionHeader eyebrow={c.testimonialsEyebrow} title={c.testimonialsTitle} /></Reveal>
          <div className="testimonial-grid">{c.testimonials.map(([name, vehicle, review, rating], index) => <Reveal key={name} delay={index * 65} className="testimonial-card"><div className="testimonial-top"><div className="stars">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill="currentColor" />)}</div><span>{rating}</span></div><p>“{review}”</p><div className="testimonial-person"><span className="testimonial-avatar">{name.charAt(0)}</span><span><strong>{name}</strong><small>{vehicle}</small></span></div></Reveal>)}</div>
        </section>

        <section id="contact" className="closing-cta">
          <div className="closing-image"><img src={images.hero} alt="Luxury vehicle protected with clear PPF" loading="lazy" /><div className="closing-shade" /></div>
          <div className="closing-content page-width"><Reveal><div className="eyebrow eyebrow--light"><span className="eyebrow-rule" />{c.contactEyebrow}</div><h2>{c.contactTitle}</h2><p>{c.contactBody}</p><WhatsAppLink language={language} className="button button--gold">{c.ctaButton}</WhatsAppLink></Reveal><div className="closing-contact"><span>{c.contactLabel}</span><a href={whatsappHref(language)} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="page-width footer-grid"><div><BrandMark /><p>{c.footerDescription}</p></div><div className="footer-column"><span className="footer-label">{c.footerLinks}</span>{c.nav.slice(0, 5).map(([label, id]) => <button key={id} onClick={() => scrollToSection(id)}>{label}</button>)}</div><div className="footer-column"><span className="footer-label">{c.footerContact}</span><WhatsAppLink language={language}>{WHATSAPP_DISPLAY}</WhatsAppLink><div className="social-links" aria-label="PPFStudio social profiles"><a className="social-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Instagram"><Instagram size={16} /> <span>Instagram</span></a><a className="social-link" href={SNAPCHAT_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on Snapchat"><Ghost size={16} /> <span>Snapchat</span></a><a className="social-link" href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Open PPFStudio on TikTok"><Music2 size={16} /> <span>TikTok</span></a></div></div></div><div className="page-width footer-bottom"><span>{c.footerCopyright}</span><button onClick={openLanguageModal}>{language === "ar" ? "English" : "العربية"}</button></div></footer>

      <a href={whatsappHref(language)} target="_blank" rel="noreferrer" className="floating-whatsapp" aria-label={language === "ar" ? "التواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}><MessageCircle size={23} /><span>{c.floatingWhatsapp}</span></a>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="lightbox-dialog"><DialogTitle className="sr-only">{activeLightboxItem?.alt}</DialogTitle><DialogDescription className="sr-only">{c.openImage}</DialogDescription>{activeLightboxItem && <div className="lightbox-inner"><img src={activeLightboxItem.src} alt={activeLightboxItem.alt} /><div className="lightbox-toolbar"><span>0{activeLightboxItem.id} / 0{galleryItems.length}</span><div><button onClick={() => setLightboxIndex((lightboxIndex! - 1 + galleryItems.length) % galleryItems.length)} aria-label={c.previous}><ChevronLeft /></button><button onClick={() => setLightboxIndex((lightboxIndex! + 1) % galleryItems.length)} aria-label={c.next}><ChevronRight /></button><button onClick={() => setLightboxIndex(null)} aria-label={c.close}><X /></button></div></div></div>}</DialogContent>
      </Dialog>

      <Dialog open={videoIndex !== null} onOpenChange={(open) => !open && setVideoIndex(null)}>
        <DialogContent className="video-dialog"><DialogTitle className="sr-only">{videoIndex === null ? "" : c.videoCategories[videoIndex]}</DialogTitle><DialogDescription className="sr-only">{c.playVideo}</DialogDescription>{videoIndex !== null && <div className="video-modal-inner"><video src={VIDEO_SOURCE} controls autoPlay playsInline poster={videoItems[videoIndex].src} /></div>}</DialogContent>
      </Dialog>

      <Dialog open={!isLoading && showLanguageModal} onOpenChange={() => undefined}>
        <DialogContent className="language-dialog" showCloseButton={false}><DialogTitle>{c.modalTitle}</DialogTitle><DialogDescription>{c.modalBody}</DialogDescription><div className="language-cards"><button onClick={() => selectLanguage("ar")} className="language-card language-card--ar"><span className="language-code">AR</span><strong>{c.modalArabic}</strong><small>{c.modalArabicHint}</small><ArrowUpRight size={19} /></button><button onClick={() => selectLanguage("en")} className="language-card"><span className="language-code">EN</span><strong>{c.modalEnglish}</strong><small>{c.modalEnglishHint}</small><ArrowUpRight size={19} /></button></div><div className="language-modal-foot"><img src={images.mark} alt="PPF Paint Protection Film logo" /> <span>PPFSTUDIO / 2026</span></div></DialogContent>
      </Dialog>
    </div>
  );
}
