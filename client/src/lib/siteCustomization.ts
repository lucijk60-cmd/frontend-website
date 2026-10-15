import { useEffect, useState } from "react";
import { loadSiteConfigFromFirestore, saveSiteConfigToFirestore } from "./firebaseMedia";
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
  WHATSAPP_DISPLAY,
} from "./siteContent";

export const SITE_CUSTOMIZATION_STORAGE_KEY = "ppfstudio-owner-site-customization-v1";
export const SITE_CUSTOMIZATION_EVENT = "ppfstudio-site-customization-updated";

export interface CustomButtonConfig {
  heroPrimaryTarget?: string;
  heroSecondaryTarget?: string;
  heroWhatsappUrl?: string;
  navCtaUrl?: string;
  qualityCtaTextEn?: string;
  qualityCtaTextAr?: string;
  qualityCtaTarget?: string;
  closingCtaUrl?: string;
  floatingWhatsappUrl?: string;
  showHeroPrimary?: boolean;
  showHeroSecondary?: boolean;
  showHeroWhatsapp?: boolean;
  showFloatingWhatsapp?: boolean;
  beforePreset1En?: string;
  beforePreset1Ar?: string;
  beforePreset2En?: string;
  beforePreset2Ar?: string;
  beforePreset3En?: string;
  beforePreset3Ar?: string;
  seoButtons?: Array<{
    labelEn: string;
    labelAr: string;
    hrefEn: string;
    hrefAr: string;
  }>;
}

export interface SectionVisibilityConfig {
  preloader: boolean;
  languageModalOnFirstVisit: boolean;
  hero: boolean;
  services: boolean;
  manifesto: boolean;
  work: boolean;
  beforeAfter: boolean;
  videos: boolean;
  process: boolean;
  quality: boolean;
  stats: boolean;
  reviews: boolean;
  closingCta: boolean;
  seoGuides: boolean;
  floatingWhatsapp: boolean;
}

export interface BrandSystemConfig {
  brandPrimary: string;
  brandSecondary: string;
  pageTitleEn: string;
  pageTitleAr: string;
  metaDescriptionEn: string;
  metaDescriptionAr: string;
  preloaderKicker: string;
  preloaderTitle: string;
  preloaderStatus: string;
  whatsappDisplay: string;
  whatsappNumber: string;
  instagramUrl: string;
  snapchatUrl: string;
  tiktokUrl: string;
  goldColor: string;
  goldLightColor: string;
  inkColor: string;
  greenColor: string;
}

export interface MediaOverridesConfig {
  heroImage?: string;
  beforeImage?: string;
  afterImage?: string;
  qualityImage?: string;
  closingImage?: string;
  deletedGalleryIds: number[];
  deletedVideoIndices: number[];
  galleryOverrides: Record<number, { src?: string; arSrc?: string; alt?: string; category?: string }>;
  videoOverrides: Record<number, { title?: string; poster?: string; src?: string }>;
}

export interface LocalizedExtraTextOverrides {
  heroSideNote?: string;
  servicesAsideQuote?: string;
  servicesCountLabel?: string;
  manifestoEyebrow?: string;
  manifestoTitle?: string;
  manifestoPoints?: Array<[string, string]>;
  dragToCompare?: string;
  beforeSubLabel?: string;
  afterSubLabel?: string;
  materialInstallCaption?: string;
  seoSectionEyebrow?: string;
  seoSectionTitle?: string;
  seoSectionBody?: string;
}

export interface SiteCustomization {
  updatedAt: string;
  brand: BrandSystemConfig;
  sections: SectionVisibilityConfig;
  buttons: CustomButtonConfig;
  media: MediaOverridesConfig;
  contentOverrides: Partial<Record<Language, Partial<Content>>>;
  extraTextOverrides: Partial<Record<Language, LocalizedExtraTextOverrides>>;
}

export const DEFAULT_SEO_BUTTONS = [
  {
    labelEn: "PPF Riyadh",
    labelAr: "تركيب PPF بالرياض",
    hrefEn: "/services/ppf-riyadh",
    hrefAr: "/ar/services/ppf-riyadh",
  },
  {
    labelEn: "Full-body PPF",
    labelAr: "حماية السيارة بالكامل",
    hrefEn: "/services/full-body-ppf",
    hrefAr: "/ar/services/full-body-ppf",
  },
  {
    labelEn: "Auto Detailing & PPF",
    labelAr: "العناية بالسيارات وحماية الطلاء",
    hrefEn: "/services/auto-detailing-ppf",
    hrefAr: "/ar/services/auto-detailing-riyadh",
  },
  {
    labelEn: "Riyadh PPF Guide",
    labelAr: "دليل حماية السيارات بالرياض",
    hrefEn: "/blog/ppf-riyadh-guide",
    hrefAr: "/ar/blog/ppf-riyadh-guide",
  },
  {
    labelEn: "PPF price guide Saudi Arabia",
    labelAr: "أسعار PPF في السعودية",
    hrefEn: "/blog/ppf-price-saudi-arabia",
    hrefAr: "/ar/blog/ppf-price-saudi-arabia",
  },
  {
    labelEn: "Luxury Car PPF Guide",
    labelAr: "حماية السيارات الفاخرة",
    hrefEn: "/blog/luxury-car-ppf",
    hrefAr: "/blog/luxury-car-ppf",
  },
];

export function createDefaultSiteCustomization(): SiteCustomization {
  return {
    updatedAt: new Date(0).toISOString(),
    brand: {
      brandPrimary: "PPF",
      brandSecondary: "Studio",
      pageTitleEn: "PPF Studio | Premium Paint Protection Film",
      pageTitleAr: "PPF Studio | حماية الطلاء الاحترافية للسيارات",
      metaDescriptionEn: "Premium paint protection film, precision installation and automotive care from PPF Studio.",
      metaDescriptionAr: "حماية احترافية لطلاء السيارات باستخدام أفلام PPF عالية الجودة وتركيب دقيق في استوديو PPF Studio.",
      preloaderKicker: "PPF / PAINT PROTECTION FILM",
      preloaderTitle: "Preparing your finish",
      preloaderStatus: "PPF STUDIO / 2026",
      whatsappDisplay: WHATSAPP_DISPLAY,
      whatsappNumber: "966537358631",
      instagramUrl: INSTAGRAM_URL,
      snapchatUrl: SNAPCHAT_URL,
      tiktokUrl: TIKTOK_URL,
      goldColor: "#c8a56b",
      goldLightColor: "#e0c995",
      inkColor: "#080909",
      greenColor: "#25d366",
    },
    sections: {
      preloader: true,
      languageModalOnFirstVisit: true,
      hero: true,
      services: true,
      manifesto: true,
      work: true,
      beforeAfter: true,
      videos: true,
      process: true,
      quality: true,
      stats: true,
      reviews: true,
      closingCta: true,
      seoGuides: true,
      floatingWhatsapp: true,
    },
    buttons: {
      heroPrimaryTarget: "#work",
      heroSecondaryTarget: "#contact",
      heroWhatsappUrl: "",
      navCtaUrl: "",
      qualityCtaTextEn: "Talk to our team",
      qualityCtaTextAr: "تحدث مع فريقنا",
      qualityCtaTarget: "#contact",
      closingCtaUrl: "",
      floatingWhatsappUrl: "",
      showHeroPrimary: true,
      showHeroSecondary: true,
      showHeroWhatsapp: true,
      showFloatingWhatsapp: true,
      beforePreset1En: "Before (Unprotected)",
      beforePreset1Ar: "قبل الحماية",
      beforePreset2En: "50 / 50 Split",
      beforePreset2Ar: "مقارنة 50/50",
      beforePreset3En: "After (PPF Gloss)",
      beforePreset3Ar: "بعد PPF",
      seoButtons: DEFAULT_SEO_BUTTONS,
    },
    media: {
      heroImage: images.hero,
      beforeImage: images.detailSuv,
      afterImage: images.secondaryDetail,
      qualityImage: images.installation,
      closingImage: images.hero,
      deletedGalleryIds: [],
      deletedVideoIndices: [],
      galleryOverrides: {},
      videoOverrides: {},
    },
    contentOverrides: {},
    extraTextOverrides: {},
  };
}

export function mergeSiteCustomization(raw?: Partial<SiteCustomization> | null): SiteCustomization {
  const defaults = createDefaultSiteCustomization();
  if (!raw || typeof raw !== "object") return defaults;
  return {
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : defaults.updatedAt,
    brand: { ...defaults.brand, ...(raw.brand ?? {}) },
    sections: { ...defaults.sections, ...(raw.sections ?? {}) },
    buttons: {
      ...defaults.buttons,
      ...(raw.buttons ?? {}),
      seoButtons: Array.isArray(raw.buttons?.seoButtons) && raw.buttons.seoButtons.length > 0
        ? raw.buttons.seoButtons
        : defaults.buttons.seoButtons,
    },
    media: {
      ...defaults.media,
      ...(raw.media ?? {}),
      deletedGalleryIds: Array.isArray(raw.media?.deletedGalleryIds) ? raw.media.deletedGalleryIds : [],
      deletedVideoIndices: Array.isArray(raw.media?.deletedVideoIndices) ? raw.media.deletedVideoIndices : [],
      galleryOverrides: raw.media?.galleryOverrides ?? {},
      videoOverrides: raw.media?.videoOverrides ?? {},
    },
    contentOverrides: raw.contentOverrides ?? {},
    extraTextOverrides: raw.extraTextOverrides ?? {},
  };
}

export function loadLocalSiteCustomization(): SiteCustomization {
  if (typeof window === "undefined") return createDefaultSiteCustomization();
  try {
    const saved = window.localStorage.getItem(SITE_CUSTOMIZATION_STORAGE_KEY);
    if (!saved) return createDefaultSiteCustomization();
    return mergeSiteCustomization(JSON.parse(saved));
  } catch {
    return createDefaultSiteCustomization();
  }
}

export function saveLocalSiteCustomization(config: SiteCustomization) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SITE_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(SITE_CUSTOMIZATION_EVENT, { detail: config }));
    void saveSiteConfigToFirestore(config).catch(() => {});
  } catch {
    // ignore storage quota errors
  }
}

export function clearLocalSiteCustomization() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SITE_CUSTOMIZATION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SITE_CUSTOMIZATION_EVENT, { detail: createDefaultSiteCustomization() }));
  } catch {
    // ignore errors
  }
}

export function getMergedContent(language: Language, custom: SiteCustomization): Content {
  const base = translations[language];
  const overrides = custom.contentOverrides?.[language];
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    nav: Array.isArray(overrides.nav) && overrides.nav.length > 0 ? overrides.nav : base.nav,
    services: Array.isArray(overrides.services) && overrides.services.length > 0 ? overrides.services : base.services,
    filters: Array.isArray(overrides.filters) && overrides.filters.length > 0 ? overrides.filters : base.filters,
    galleryLabels: Array.isArray(overrides.galleryLabels) && overrides.galleryLabels.length > 0 ? overrides.galleryLabels : base.galleryLabels,
    process: Array.isArray(overrides.process) && overrides.process.length > 0 ? overrides.process : base.process,
    qualityFeatures: Array.isArray(overrides.qualityFeatures) && overrides.qualityFeatures.length > 0 ? overrides.qualityFeatures : base.qualityFeatures,
    stats: Array.isArray(overrides.stats) && overrides.stats.length > 0 ? overrides.stats : base.stats,
  };
}

export function getDefaultExtraTexts(language: Language): Required<LocalizedExtraTextOverrides> {
  const isArabic = language === "ar" || language === "ur";
  return {
    heroSideNote: isArabic ? "حماية الطلاء" : "PAINT PROTECTION",
    servicesAsideQuote: isArabic ? "حماية متقدمة. تركيب دقيق." : "Advanced protection. Measured installation.",
    servicesCountLabel: isArabic ? "06 خدمات" : "06 SERVICES",
    manifestoEyebrow: isArabic ? "لماذا تختارنا؟" : "WHY PPFSTUDIO",
    manifestoTitle: isArabic ? "حماية لا تُرى. دقة لا تُنسى." : "Protection that disappears. Precision that remains.",
    manifestoPoints: isArabic
      ? [
          ["جودة استثنائية", "مواد عالية الجودة ونتائج احترافية."],
          ["تركيب احترافي", "عناية دقيقة بكل تفصيلة أثناء التركيب."],
          ["حماية غير مرئية", "حماية قوية مع الحفاظ على المظهر الأصلي."],
        ]
      : [
          ["Exceptional quality", "Premium materials, professionally finished."],
          ["Professional installation", "Measured care in every step of the install."],
          ["Invisible protection", "Strong protection without changing the original look."],
        ],
    dragToCompare: isArabic ? "اسحب للمقارنة" : "Drag to compare",
    beforeSubLabel: isArabic ? "طلاء باهت وخدوش سطحية" : "Dull & swirl-marked",
    afterSubLabel: isArabic ? "حماية PPF ولمعان عميق" : "Deep PPF mirror gloss",
    materialInstallCaption: isArabic ? "المواد / التركيب" : "MATERIAL / INSTALL",
    seoSectionEyebrow: isArabic ? "خدمات حماية السيارات في السعودية" : "Saudi paint protection services",
    seoSectionTitle: isArabic ? "حماية طلاء السيارات بالرياض وخارجها" : "Paint protection film in Riyadh and Saudi Arabia",
    seoSectionBody: isArabic
      ? "نقدم تركيب PPF وحماية كاملة للسيارات والعناية بالتفاصيل للسيارات الفاخرة وSUV في الرياض، مع خدمة عملاء متعددة اللغات."
      : "Explore premium PPF installation, full-body vehicle protection and automotive detailing for luxury cars and SUVs in Riyadh, with multilingual support.",
  };
}

export function getMergedExtraTexts(language: Language, custom: SiteCustomization): Required<LocalizedExtraTextOverrides> {
  const defaults = getDefaultExtraTexts(language);
  const overrides = custom.extraTextOverrides?.[language];
  if (!overrides) return defaults;
  return {
    ...defaults,
    ...overrides,
    manifestoPoints:
      Array.isArray(overrides.manifestoPoints) && overrides.manifestoPoints.length > 0
        ? overrides.manifestoPoints
        : defaults.manifestoPoints,
  };
}

export function getCustomStaticGalleryItems(language: Language, custom: SiteCustomization) {
  const deletedSet = new Set(custom.media.deletedGalleryIds ?? []);
  return galleryItems
    .filter((item) => !deletedSet.has(item.id))
    .map((item) => {
      const ov = custom.media.galleryOverrides?.[item.id];
      const baseSrc = language === "ar" && "arSrc" in item ? item.arSrc : item.src;
      const baseAlt = language === "ar" && "arAlt" in item ? item.arAlt : item.alt;
      return {
        ...item,
        category: ov?.category || item.category,
        src: (language === "ar" ? ov?.arSrc || ov?.src : ov?.src) || baseSrc,
        alt: ov?.alt || baseAlt,
      };
    });
}

export function getCustomStaticVideoItems(custom: SiteCustomization) {
  const deletedSet = new Set(custom.media.deletedVideoIndices ?? []);
  return videoItems
    .map((item, idx) => ({ item, idx }))
    .filter(({ idx }) => !deletedSet.has(idx))
    .map(({ item, idx }) => {
      const ov = custom.media.videoOverrides?.[idx];
      const defaultVideoSrc = "videoSrc" in item && item.videoSrc ? item.videoSrc : item.src;
      return {
        index: idx,
        title: ov?.title || item.title,
        poster: ov?.poster || item.src,
        src: ov?.src || defaultVideoSrc,
        isUploaded: Boolean(ov?.src) || ("isEmbedded" in item ? item.isEmbedded : false),
      };
    });
}

export function useSiteCustomization(serverConfig?: Partial<SiteCustomization> | null) {
  const [customization, setCustomization] = useState<SiteCustomization>(() => loadLocalSiteCustomization());

  // Check Firestore remote configuration on mount
  useEffect(() => {
    let active = true;
    void loadSiteConfigFromFirestore().then((remote) => {
      if (!active || !remote || !remote.updatedAt) return;
      const local = loadLocalSiteCustomization();
      if (new Date(remote.updatedAt).getTime() >= new Date(local.updatedAt).getTime()) {
        const merged = mergeSiteCustomization(remote);
        setCustomization(merged);
        window.localStorage.setItem(SITE_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent(SITE_CUSTOMIZATION_EVENT, { detail: merged }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (serverConfig && typeof serverConfig === "object" && serverConfig.updatedAt) {
      const local = loadLocalSiteCustomization();
      if (new Date(serverConfig.updatedAt).getTime() >= new Date(local.updatedAt).getTime()) {
        const merged = mergeSiteCustomization(serverConfig);
        setCustomization(merged);
        saveLocalSiteCustomization(merged);
      }
    }
  }, [serverConfig]);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<SiteCustomization>;
      if (customEvent.detail) {
        setCustomization(mergeSiteCustomization(customEvent.detail));
      } else {
        setCustomization(loadLocalSiteCustomization());
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_CUSTOMIZATION_STORAGE_KEY) {
        setCustomization(loadLocalSiteCustomization());
      }
    };
    window.addEventListener(SITE_CUSTOMIZATION_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SITE_CUSTOMIZATION_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return [customization, setCustomization] as const;
}

export { BRAND_NAME };
