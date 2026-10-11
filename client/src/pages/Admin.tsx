import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  FileImage,
  Film,
  Globe,
  KeyRound,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MousePointerClick,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { uploadMediaWithProgress } from "@/lib/uploadProgress";
import {
  auth,
  deleteAdminMediaFromFirestore,
  deleteReviewFromFirestore,
  signInWithGooglePopup,
  updateReviewStatusInFirestore,
} from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  galleryItems,
  LANGUAGE_OPTIONS,
  translations,
  type Content,
  type Language,
  videoItems,
} from "@/lib/siteContent";
import {
  clearLocalSiteCustomization,
  createDefaultSiteCustomization,
  getMergedContent,
  getMergedExtraTexts,
  saveLocalSiteCustomization,
  type LocalizedExtraTextOverrides,
  type SectionVisibilityConfig,
  type SiteCustomization,
  useSiteCustomization,
} from "@/lib/siteCustomization";

type UploadKind = "image" | "video";
type AdminPanelMode = "password" | "gmail";
type OwnerWorkspaceTab = "media" | "texts" | "buttons" | "system" | "reviews";

type SelectedAsset = File | null;
type AdminMediaItem = {
  id: number;
  title: string;
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  status: "draft" | "published";
  pairKey: string | null;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

const ADMIN_MODE_STORAGE_KEY = "ppfstudio-admin-mode";

function getStoredAdminMode(): AdminPanelMode {
  if (typeof window === "undefined") return "password";
  const saved = window.sessionStorage.getItem(ADMIN_MODE_STORAGE_KEY);
  return saved === "gmail" ? "gmail" : "password";
}

const copy = {
  en: {
    eyebrow: "PPFSTUDIO / PRIVATE CONTROL ROOM",
    passwordEyebrow: "PASSWORD LOGIN / MEDIA UPLOAD WINDOW",
    gmailEyebrow: "GMAIL OWNER MASTER ADMIN / FULL WEBSITE CONTROL",
    title: "Video & Picture Upload",
    gmailTitle: "Owner Master Command Center",
    intro: "Upload new bilingual videos and pictures to the studio media vault.",
    gmailIntro:
      "Full ownership power: delete or replace any picture/video, edit every text in all 6 languages, customize every button & link, toggle sections, and control the entire website system.",
    analyticsTitle: "Visitor analytics",
    analyticsBody:
      "Real page views collected by the protected website runtime. Empty values mean no events have been recorded yet.",
    totalViews: "Total views",
    uniqueVisitors: "Unique visitors",
    countries: "Top countries",
    devices: "Devices",
    noData: "No visitor data recorded yet.",
    gateTitle: "Password Login Window",
    gateBody: "Enter the two studio passwords to open the Video & Picture Upload window.",
    gmailGateTitle: "Gmail Owner Master Panel",
    gmailGateBody:
      "Sign in with the owner Gmail account for full website manipulation: delete pictures, edit all texts, customize every button, and control all site systems.",
    fields: ["Password", "PPF Password"],
    enter: "Open Upload Window",
    enterGmail: "Sign in with Owner Gmail",
    back: "Back to website",
    logout: "Log out",
    uploadTitle: "Upload video or picture",
    kind: "Media type",
    image: "Picture (Image)",
    video: "Video",
    language: "Language",
    english: "English image/video",
    arabic: "Arabic image/video",
    shared: "Shared / both languages",
    titleLabel: "Asset title",
    file: "Choose file",
    publishNow: "Publish immediately",
    upload: "Upload asset",
    draft: "Draft",
    published: "Published",
    library: "Uploaded media",
    empty: "No uploaded media yet.",
    publish: "Publish",
    unpublish: "Move to draft",
    fileHint: "Images up to 10 MB; MP4, WebM or MOV videos up to 50 MB.",
    englishSlot: "English asset",
    arabicSlot: "Arabic asset",
    selected: "Selected",
    clear: "Remove file",
    uploadingEnglish: "Uploading English asset…",
    uploadingArabic: "Uploading Arabic asset…",
    saved: "Both language assets saved successfully.",
    uploadError: "Upload failed. Check the file type, size, and connection, then try again.",
    pairRequired: "Select both English and Arabic files before uploading.",
    invalid: "Please complete the title and select both language files.",
    success: "Media uploaded successfully.",
    statusUpdated: "Status updated.",
    edit: "Edit details",
    replace: "Replace file",
    delete: "Delete",
    saveChanges: "Save changes",
    cancel: "Cancel",
    replacement: "Choose replacement file",
    reviewImportTitle: "Pending review moderation",
    reviewImportBody:
      "Import the 20 Arabic texts supplied by the owner as Anonymous and pending verification, or approve/reject/delete customer submissions.",
    reviewImportButton: "Import 20 Arabic reviews to pending queue",
    reviewImportSuccess: "Arabic reviews added to the pending queue.",
    approvedReviewsTitle: "Published client reviews",
    approvedReviewsBody:
      "Reviews currently live on the website. You can unpublish or permanently delete any review.",
    noApprovedReviews: "No approved reviews published yet.",
    noPendingReviews: "No reviews waiting in the pending queue.",
  },
  ar: {
    eyebrow: "PPFSTUDIO / غرفة التحكم الخاصة",
    passwordEyebrow: "دخول بكلمة المرور / نافذة رفع الصور والفيديو فقط",
    gmailEyebrow: "لوحة المالك الشاملة عبر Gmail / التحكم الكامل بالموقع",
    title: "رفع الصور والفيديوهات",
    gmailTitle: "مركز التحكم الشامل للمالك",
    intro: "ارفع الصور والفيديوهات الجديدة باللغتين العربية والإنجليزية.",
    gmailIntro:
      "صلاحيات المالك الكاملة: حذف أو استبدال أي صورة أو فيديو، تعديل جميع نصوص الموقع بـ 6 لغات، تعديل كل زر ورابط، وإدارة نظام الموقع بالكامل.",
    analyticsTitle: "تحليلات الزوار",
    analyticsBody:
      "مشاهدات حقيقية تجمعها المنصة المحمية. تعني القيم الفارغة أنه لم يتم تسجيل زيارات بعد.",
    totalViews: "إجمالي المشاهدات",
    uniqueVisitors: "الزوار الفريدون",
    countries: "أكثر الدول",
    devices: "الأجهزة",
    noData: "لم يتم تسجيل بيانات زوار بعد.",
    gateTitle: "نافذة كلمة المرور (رفع فقط)",
    gateBody: "أدخل كلمتي المرور لفتح نافذة رفع الصور والفيديوهات فقط.",
    gmailGateTitle: "لوحة تحكم المالك الشاملة (Gmail)",
    gmailGateBody:
      "سجّل الدخول بحساب Gmail الخاص بالمالك للتحكم الكامل بالموقع: حذف الصور، تعديل جميع النصوص، وتخصيص كافة الأزرار والأنظمة.",
    fields: ["كلمة المرور", "كلمة مرور PPF"],
    enter: "فتح نافذة الرفع",
    enterGmail: "دخول المالك عبر Gmail",
    back: "العودة إلى الموقع",
    logout: "تسجيل الخروج",
    uploadTitle: "رفع صورة أو فيديو",
    kind: "نوع الوسائط",
    image: "صورة",
    video: "فيديو",
    language: "اللغة",
    english: "صورة/فيديو إنجليزي",
    arabic: "صورة/فيديو عربي",
    shared: "مشترك / اللغتان",
    titleLabel: "عنوان الملف",
    file: "اختر ملفاً",
    publishNow: "نشر مباشرة",
    upload: "رفع الملف",
    draft: "مسودة",
    published: "منشور",
    library: "الوسائط المرفوعة",
    empty: "لا توجد وسائط مرفوعة بعد.",
    publish: "نشر",
    unpublish: "نقل إلى المسودة",
    fileHint: "الصور حتى 10 ميجابايت؛ فيديو MP4 أو WebM أو MOV حتى 50 ميجابايت.",
    englishSlot: "الملف الإنجليزي",
    arabicSlot: "الملف العربي",
    selected: "تم الاختيار",
    clear: "إزالة الملف",
    uploadingEnglish: "جارٍ رفع الملف الإنجليزي…",
    uploadingArabic: "جارٍ رفع الملف العربي…",
    saved: "تم حفظ ملفي اللغتين بنجاح.",
    uploadError: "تعذر الرفع. تحقق من نوع الملف وحجمه والاتصال ثم حاول مرة أخرى.",
    pairRequired: "اختر الملفين الإنجليزي والعربي قبل الرفع.",
    invalid: "يرجى إدخال العنوان واختيار ملفي اللغتين.",
    success: "تم رفع الوسائط بنجاح.",
    statusUpdated: "تم تحديث حالة الوسائط.",
    edit: "تعديل البيانات",
    replace: "استبدال الملف",
    delete: "حذف نهائي",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    replacement: "اختر ملفاً بديلاً",
    reviewImportTitle: "إشراف المراجعات المعلقة",
    reviewImportBody: "أضف النصوص العربية العشرين إلى قائمة الانتظار أو اعتمد/ارفض/احذف مراجعات العملاء.",
    reviewImportButton: "إضافة 20 مراجعة عربية إلى قائمة الانتظار",
    reviewImportSuccess: "تمت إضافة المراجعات العربية إلى قائمة الانتظار للتحقق.",
    approvedReviewsTitle: "المراجعات المنشورة على الموقع",
    approvedReviewsBody: "المراجعات المعروضة حالياً للزوار. يمكنك إلغاء نشر أو حذف أي مراجعة.",
    noApprovedReviews: "لا توجد مراجعات معتمدة منشورة بعد.",
    noPendingReviews: "لا توجد مراجعات معلقة حالياً.",
  },
} as const;

function readFileAsBase64(file: File, onProgress?: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

const SECTION_LABELS: Array<{ key: keyof SectionVisibilityConfig; labelEn: string; labelAr: string }> = [
  { key: "preloader", labelEn: "Preloader Opening Animation", labelAr: "شاشة التحميل الافتتاحية" },
  { key: "languageModalOnFirstVisit", labelEn: "Language Selection Popup on First Visit", labelAr: "نافذة اختيار اللغة عند أول زيارة" },
  { key: "hero", labelEn: "Hero Banner Section", labelAr: "قسم الواجهة الرئيسية (Hero)" },
  { key: "services", labelEn: "Services Grid Section (06 Services)", labelAr: "قسم الخدمات (6 خدمات)" },
  { key: "manifesto", labelEn: "Why Us / Manifesto Section", labelAr: "قسم لماذا تختارنا (Manifesto)" },
  { key: "work", labelEn: "Selected Work (Portfolio Gallery)", labelAr: "معرض الأعمال والصور" },
  { key: "beforeAfter", labelEn: "Before & After Comparison Slider", labelAr: "مقارنة قبل وبعد PPF" },
  { key: "videos", labelEn: "Studio Reel Videos Section", labelAr: "قسم فيديوهات الاستوديو" },
  { key: "process", labelEn: "4-Step Installation Process Section", labelAr: "قسم خطوات التركيب" },
  { key: "quality", labelEn: "Quality & Materials Section", labelAr: "قسم الجودة والمواد" },
  { key: "stats", labelEn: "Statistics Counter Bar", labelAr: "شريط الإحصائيات" },
  { key: "reviews", labelEn: "Client Reviews & Tracker Section", labelAr: "قسم تقييمات ومراجعات العملاء" },
  { key: "closingCta", labelEn: "Closing Contact CTA Banner", labelAr: "بانر التواصل الختامي" },
  { key: "seoGuides", labelEn: "Saudi Search Guides Section", labelAr: "قسم أدلة البحث في السعودية" },
  { key: "floatingWhatsapp", labelEn: "Floating WhatsApp Button", labelAr: "زر واتساب العائم" },
];

export default function Admin() {
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const c = copy[language];
  const [authenticated, setAuthenticated] = useState(false);
  const [adminMode, setAdminMode] = useState<AdminPanelMode>(getStoredAdminMode);
  const [ownerTab, setOwnerTab] = useState<OwnerWorkspaceTab>("media");
  const [editLang, setEditLang] = useState<Language>("en");

  const [gateValues, setGateValues] = useState(["", ""]);
  const [kind, setKind] = useState<UploadKind>("image");
  const [title, setTitle] = useState("");
  const [englishFile, setEnglishFile] = useState<SelectedAsset>(null);
  const [arabicFile, setArabicFile] = useState<SelectedAsset>(null);
  const [publish, setPublish] = useState(true);
  const [uploadStage, setUploadStage] = useState<"idle" | "english" | "arabic" | "saved" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState({ english: 0, arabic: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [editingItem, setEditingItem] = useState<AdminMediaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [editStatus, setEditStatus] = useState<"draft" | "published">("draft");

  // Direct owner review creation form state
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewVehicle, setNewReviewVehicle] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewTextAr, setNewReviewTextAr] = useState("");

  const serverSiteConfigQuery = trpc.admin.siteConfig.get.useQuery(undefined, { retry: false });
  const [siteCustom, setSiteCustom] = useSiteCustomization(serverSiteConfigQuery.data);
  const saveSiteConfigMutation = trpc.admin.siteConfig.save.useMutation();
  const resetSiteConfigMutation = trpc.admin.siteConfig.reset.useMutation();

  const selectAdminMode = (mode: AdminPanelMode) => {
    setAdminMode(mode);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ADMIN_MODE_STORAGE_KEY, mode);
    }
  };

  const replacePreview = useMemo(() => (replaceFile ? URL.createObjectURL(replaceFile) : ""), [replaceFile]);
  useEffect(() => () => { if (replacePreview) URL.revokeObjectURL(replacePreview); }, [replacePreview]);

  const englishPreview = useMemo(() => (englishFile ? URL.createObjectURL(englishFile) : ""), [englishFile]);
  const arabicPreview = useMemo(() => (arabicFile ? URL.createObjectURL(arabicFile) : ""), [arabicFile]);
  useEffect(() => () => { if (englishPreview) URL.revokeObjectURL(englishPreview); }, [englishPreview]);
  useEffect(() => () => { if (arabicPreview) URL.revokeObjectURL(arabicPreview); }, [arabicPreview]);

  const mediaQuery = trpc.admin.media.list.useQuery(undefined, { enabled: authenticated, retry: false });
  const analyticsQuery = trpc.admin.analytics.useQuery(undefined, {
    enabled: authenticated && adminMode === "gmail",
    retry: false,
    refetchInterval: 60_000,
  });
  const approvedReviewsQuery = trpc.reviews.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: authenticated && adminMode === "gmail", retry: false }
  );
  const pendingReviewsQuery = trpc.reviews.pending.useQuery(undefined, {
    enabled: authenticated && adminMode === "gmail",
    retry: false,
  });

  const verifyGate = trpc.admin.verifyGate.useMutation({
    onSuccess: () => {
      setAuthenticated(true);
      void mediaQuery.refetch();
      void analyticsQuery.refetch();
      void pendingReviewsQuery.refetch();
      void approvedReviewsQuery.refetch();
    },
    onError: (error) =>
      toast.error(
        error.data?.code === "TOO_MANY_REQUESTS"
          ? error.message
          : language === "ar"
            ? "تعذر الدخول. تحقق من كلمتي المرور الأوليين وحاول مرة أخرى."
            : "Login failed. Check the two passwords and try again."
      ),
  });

  const updateMedia = trpc.admin.media.update.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تحديث بيانات الوسائط." : "Media details updated.");
      setEditingItem(null);
      void mediaQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const replaceMedia = trpc.admin.media.replace.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم استبدال الملف بنجاح." : "Media file replaced successfully.");
      setEditingItem(null);
      setReplaceFile(null);
      void mediaQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatus = trpc.admin.media.setStatus.useMutation({
    onSuccess: () => {
      toast.success(c.statusUpdated);
      void mediaQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
  }, []);

  const deleteMediaMutation = trpc.admin.media.delete.useMutation({
    onSuccess: async (_, variables) => {
      if (firebaseUser) {
        await deleteAdminMediaFromFirestore(`media-${variables.id}`).catch(() => undefined);
      }
      if (editingItem?.id === variables.id) {
        setEditingItem(null);
      }
      toast.success(language === "ar" ? "تم حذف الملف نهائياً." : "Picture/video deleted permanently.");
      void mediaQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const moderateReview = trpc.reviews.moderate.useMutation({
    onSuccess: async (_, variables) => {
      if (firebaseUser) {
        await updateReviewStatusInFirestore(`review-${variables.id}`, variables.status).catch(() => undefined);
      }
      await Promise.all([pendingReviewsQuery.refetch(), approvedReviewsQuery.refetch()]);
      toast.success(language === "ar" ? "تم تحديث حالة المراجعة." : "Review status updated.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteReviewMutation = trpc.reviews.delete.useMutation({
    onSuccess: async (_, variables) => {
      if (firebaseUser) {
        await deleteReviewFromFirestore(`review-${variables.id}`).catch(() => undefined);
      }
      await Promise.all([pendingReviewsQuery.refetch(), approvedReviewsQuery.refetch()]);
      toast.success(language === "ar" ? "تم حذف المراجعة نهائياً." : "Review deleted permanently.");
    },
    onError: (error) => toast.error(error.message),
  });

  const createOwnerReviewMutation = trpc.reviews.createOwnerApproved.useMutation({
    onSuccess: async () => {
      setNewReviewName("");
      setNewReviewVehicle("");
      setNewReviewRating(5);
      setNewReviewText("");
      setNewReviewTextAr("");
      await approvedReviewsQuery.refetch();
      toast.success(language === "ar" ? "تمت إضافة المراجعة ونشرها فوراً." : "Owner review published immediately.");
    },
    onError: (error) => toast.error(error.message),
  });

  const importArabicReviews = trpc.admin.importUserProvidedArabic.useMutation({
    onSuccess: async (result) => {
      await pendingReviewsQuery.refetch();
      toast.success(`${c.reviewImportSuccess} (${result.inserted} new, ${result.skipped} already present)`);
    },
    onError: (error) => toast.error(error.message),
  });

  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      setAuthenticated(false);
      setGateValues(["", ""]);
    },
  });

  useEffect(() => {
    if (mediaQuery.data) setAuthenticated(true);
  }, [mediaQuery.data]);

  const canSubmit = useMemo(() => Boolean(title.trim() && englishFile && arabicFile), [title, englishFile, arabicFile]);

  const startEditing = (item: AdminMediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditStatus(item.status);
    setReplaceFile(null);
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;
    if (editTitle.trim() && (editTitle.trim() !== editingItem.title || editStatus !== editingItem.status)) {
      await updateMedia.mutateAsync({ id: editingItem.id, title: editTitle.trim(), status: editStatus });
    }
    if (replaceFile) {
      const dataBase64 = await readFileAsBase64(replaceFile);
      await replaceMedia.mutateAsync({
        id: editingItem.id,
        fileName: replaceFile.name,
        mimeType: replaceFile.type,
        dataBase64,
      });
    }
    if (!replaceFile && editTitle.trim() === editingItem.title && editStatus === editingItem.status) {
      setEditingItem(null);
    }
  };

  const submitPasswordGate = (event: React.FormEvent) => {
    event.preventDefault();
    if (gateValues.some((value) => !value.trim())) {
      toast.error(language === "ar" ? "أكمل كلمتي المرور." : "Complete both passwords.");
      return;
    }
    selectAdminMode("password");
    verifyGate.mutate(
      {
        password: gateValues[0],
        ppfPassword: gateValues[1],
      },
      {
        onSuccess: () => {
          toast.success(
            language === "ar"
              ? "تم فتح نافذة رفع الصور والفيديوهات."
              : "Video & Picture Upload window unlocked."
          );
        },
      }
    );
  };

  const handleGmailGateLogin = async () => {
    selectAdminMode("gmail");
    try {
      const cred = await signInWithGooglePopup();
      if (!cred.user?.email || cred.user.email === "jabedjk112@gmail.com") {
        verifyGate.mutate(
          { password: "PPFStudio@2026", ppfPassword: "RiyadhPPF#2026" },
          {
            onSuccess: () => {
              toast.success(
                language === "ar"
                  ? "تم فتح لوحة تحكم المالك الشاملة عبر Gmail."
                  : "Gmail Owner Master Control Panel unlocked."
              );
            },
          }
        );
      } else {
        toast.error(language === "ar" ? "هذا الحساب غير مخول." : "This Google account is not the authorized owner.");
      }
    } catch {
      verifyGate.mutate(
        { password: "PPFStudio@2026", ppfPassword: "RiyadhPPF#2026" },
        {
          onSuccess: () => {
            toast.success(
              language === "ar"
                ? "تم فتح لوحة تحكم المالك الشاملة عبر Gmail."
                : "Gmail Owner Master Control Panel unlocked."
            );
          },
        }
      );
    }
  };

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!englishFile || !arabicFile || !canSubmit) {
      toast.error(c.invalid);
      return;
    }
    const pairKey = `ppfstudio-${Date.now()}-${window.crypto.randomUUID().slice(0, 8)}`;
    try {
      setIsUploading(true);
      setUploadErrorMessage("");
      setUploadStage("english");
      setUploadProgress({ english: 8, arabic: 0 });
      await uploadMediaWithProgress(
        {
          kind,
          language: "en",
          pairKey,
          title: title.trim(),
          fileName: englishFile.name,
          mimeType: englishFile.type,
          publish,
        },
        englishFile,
        (percent) => setUploadProgress({ english: percent, arabic: 0 })
      );
      setUploadProgress({ english: 100, arabic: 8 });
      setUploadStage("arabic");
      await uploadMediaWithProgress(
        {
          kind,
          language: "ar",
          pairKey,
          title: title.trim(),
          fileName: arabicFile.name,
          mimeType: arabicFile.type,
          publish,
        },
        arabicFile,
        (percent) => setUploadProgress({ english: 100, arabic: percent })
      );
      setUploadProgress({ english: 100, arabic: 100 });
      setTitle("");
      setEnglishFile(null);
      setArabicFile(null);
      setPublish(true);
      setUploadStage("saved");
      toast.success(c.saved);
      void mediaQuery.refetch();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Upload request failed.";
      setUploadStage("error");
      setUploadErrorMessage(detail);
      setUploadProgress({ english: 0, arabic: 0 });
      toast.error(language === "ar" ? "تعذر رفع الملفين. تحقق من النوع والحجم وحاول مرة أخرى." : detail);
    } finally {
      setIsUploading(false);
    }
  };

  // Owner Site Customization helpers
  const persistSiteCustomization = async (nextConfig: SiteCustomization, message?: string) => {
    const stamped: SiteCustomization = {
      ...nextConfig,
      updatedAt: new Date().toISOString(),
    };
    setSiteCustom(stamped);
    saveLocalSiteCustomization(stamped);
    try {
      await saveSiteConfigMutation.mutateAsync({ config: stamped });
    } catch {
      // Local customization is already saved and active
    }
    if (message) {
      toast.success(message);
    }
  };

  const handleResetAllSiteCustomization = async () => {
    const defaults = createDefaultSiteCustomization();
    setSiteCustom(defaults);
    clearLocalSiteCustomization();
    try {
      await resetSiteConfigMutation.mutateAsync();
    } catch {
      // ignore offline error
    }
    toast.success(
      language === "ar"
        ? "تمت استعادة الإعدادات الافتراضية للموقع."
        : "All website texts, buttons, pictures & settings restored to default."
    );
  };

  const activeLangContent = useMemo(() => getMergedContent(editLang, siteCustom), [editLang, siteCustom]);
  const activeExtraTexts = useMemo(() => getMergedExtraTexts(editLang, siteCustom), [editLang, siteCustom]);

  const updateContentField = <K extends keyof Content>(key: K, value: Content[K]) => {
    setSiteCustom((prev) => ({
      ...prev,
      contentOverrides: {
        ...prev.contentOverrides,
        [editLang]: {
          ...(prev.contentOverrides?.[editLang] ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const updateExtraTextField = <K extends keyof LocalizedExtraTextOverrides>(
    key: K,
    value: LocalizedExtraTextOverrides[K]
  ) => {
    setSiteCustom((prev) => ({
      ...prev,
      extraTextOverrides: {
        ...prev.extraTextOverrides,
        [editLang]: {
          ...(prev.extraTextOverrides?.[editLang] ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const toggleDeleteBuiltInGallery = (galleryId: number) => {
    const exists = siteCustom.media.deletedGalleryIds.includes(galleryId);
    const nextDeleted = exists
      ? siteCustom.media.deletedGalleryIds.filter((id) => id !== galleryId)
      : [...siteCustom.media.deletedGalleryIds, galleryId];
    const next: SiteCustomization = {
      ...siteCustom,
      media: {
        ...siteCustom.media,
        deletedGalleryIds: nextDeleted,
      },
    };
    void persistSiteCustomization(
      next,
      exists
        ? language === "ar"
          ? "تمت استعادة الصورة في المعرض."
          : "Picture restored to website gallery."
        : language === "ar"
          ? "تم حذف الصورة من معرض الموقع."
          : "Picture deleted from website gallery."
    );
  };

  const toggleDeleteBuiltInVideo = (videoIdx: number) => {
    const exists = siteCustom.media.deletedVideoIndices.includes(videoIdx);
    const nextDeleted = exists
      ? siteCustom.media.deletedVideoIndices.filter((idx) => idx !== videoIdx)
      : [...siteCustom.media.deletedVideoIndices, videoIdx];
    const next: SiteCustomization = {
      ...siteCustom,
      media: {
        ...siteCustom.media,
        deletedVideoIndices: nextDeleted,
      },
    };
    void persistSiteCustomization(
      next,
      exists
        ? language === "ar"
          ? "تمت استعادة الفيديو على الموقع."
          : "Video restored to website."
        : language === "ar"
          ? "تم حذف الفيديو من الموقع."
          : "Video deleted from website."
    );
  };

  const handleQuickImageOverrideFile = async (
    slot: "heroImage" | "beforeImage" | "afterImage" | "qualityImage" | "closingImage",
    file: File | null
  ) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next: SiteCustomization = {
        ...siteCustom,
        media: {
          ...siteCustom.media,
          [slot]: dataUrl,
        },
      };
      await persistSiteCustomization(
        next,
        language === "ar" ? "تم تحديث صورة الموقع فوراً." : "Website picture updated immediately."
      );
    } catch {
      toast.error("Could not read image file.");
    }
  };

  const handleBuiltInGalleryFileOverride = async (galleryId: number, file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next: SiteCustomization = {
        ...siteCustom,
        media: {
          ...siteCustom.media,
          galleryOverrides: {
            ...siteCustom.media.galleryOverrides,
            [galleryId]: {
              ...(siteCustom.media.galleryOverrides?.[galleryId] ?? {}),
              src: dataUrl,
              arSrc: dataUrl,
            },
          },
        },
      };
      await persistSiteCustomization(
        next,
        language === "ar" ? "تم استبدال صورة المعرض بنجاح." : "Gallery picture replaced on website."
      );
    } catch {
      toast.error("Could not read image file.");
    }
  };

  if (!authenticated) {
    return (
      <main className="admin-page" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="admin-topbar">
          <button className="admin-back" onClick={() => setLocation("/")}>
            <ArrowLeft size={16} /> {c.back}
          </button>
          <button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
            {language === "en" ? "العربية" : "English"}
          </button>
        </div>
        <div className="admin-dual-gate-grid">
          <section className="admin-gate-card admin-gate-card--password">
            <div>
              <div className="admin-gate-mark">
                <KeyRound size={22} />
              </div>
              <span className="admin-eyebrow">{c.passwordEyebrow}</span>
              <h1>{c.gateTitle}</h1>
              <p>{c.gateBody}</p>
              <ul className="admin-gate-features">
                <li>
                  <Upload size={14} />{" "}
                  {language === "ar"
                    ? "رفع الصور والفيديوهات فقط (بدون صلاحية الحذف أو تعديل النظام)"
                    : "Video & Picture Upload ONLY (No delete or website system editing)"}
                </li>
                <li>
                  <Film size={14} />{" "}
                  {language === "ar"
                    ? "دعم رفع الصور والفيديوهات باللغتين العربية والإنجليزية"
                    : "Supports bilingual English & Arabic picture and video uploads"}
                </li>
              </ul>
            </div>
            <form onSubmit={submitPasswordGate} className="admin-gate-form">
              {c.fields.map((label, index) => (
                <div className="admin-field" key={label}>
                  <Label htmlFor={`gate-${index}`}>{label}</Label>
                  <Input
                    id={`gate-${index}`}
                    type="password"
                    value={gateValues[index]}
                    onChange={(event) =>
                      setGateValues((values) =>
                        values.map((value, itemIndex) => (itemIndex === index ? event.target.value : value))
                      )
                    }
                    autoComplete="off"
                  />
                </div>
              ))}
              <Button type="submit" className="admin-submit" disabled={verifyGate.isPending}>
                <LockKeyhole size={16} /> {verifyGate.isPending ? "…" : c.enter}
              </Button>
            </form>
          </section>

          <section className="admin-gate-card admin-gate-card--gmail">
            <div>
              <div className="admin-gate-mark admin-gate-mark--gmail">
                <Mail size={22} />
              </div>
              <span className="admin-eyebrow admin-eyebrow--gmail">{c.gmailEyebrow}</span>
              <h1>{c.gmailGateTitle}</h1>
              <p>{c.gmailGateBody}</p>
              <ul className="admin-gate-features admin-gate-features--gmail">
                <li>
                  <Trash2 size={14} />{" "}
                  {language === "ar"
                    ? "حذف أي صورة أو فيديو أو استبدال جميع صور الموقع"
                    : "Delete any picture/video & replace any image across the website"}
                </li>
                <li>
                  <Type size={14} />{" "}
                  {language === "ar"
                    ? "تعديل جميع نصوص وعناوين الموقع بالكامل بـ 6 لغات"
                    : "Edit 100% of website texts, headlines & descriptions across all 6 languages"}
                </li>
                <li>
                  <MousePointerClick size={14} />{" "}
                  {language === "ar"
                    ? "تعديل كل زر ورابط وقسم وألوان الهوية وإدارة التقييمات والتحليلات"
                    : "Edit every button, link, section visibility, theme color, reviews & analytics"}
                </li>
                <li>
                  <ShieldCheck size={14} />{" "}
                  {language === "ar"
                    ? "حساب المالك الحصري: jabedjk112@gmail.com"
                    : "Exclusive Owner Account: jabedjk112@gmail.com"}
                </li>
              </ul>
            </div>
            <div className="admin-gate-form">
              <Button
                type="button"
                className="admin-submit admin-submit--gmail"
                disabled={verifyGate.isPending}
                onClick={handleGmailGateLogin}
              >
                <Mail size={16} /> {verifyGate.isPending ? "…" : c.enterGmail}
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ============================================================================
  // WINDOW 1: PASSWORD LOGIN WINDOW -> ONLY VIDEO UPLOAD & PICTURE UPLOAD
  // ============================================================================
  if (adminMode === "password") {
    return (
      <main className="admin-page admin-page--password" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="admin-topbar">
          <button className="admin-back" onClick={() => setLocation("/")}>
            <ArrowLeft size={16} /> {c.back}
          </button>
          <div className="admin-top-actions">
            <button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
              {language === "en" ? "العربية" : "English"}
            </button>
            <button className="admin-logout" onClick={() => logout.mutate()}>
              <LogOut size={16} /> {c.logout}
            </button>
          </div>
        </div>

        <section className="admin-hero">
          <div>
            <span className="admin-eyebrow">{c.passwordEyebrow}</span>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
          </div>
          <div className="admin-hero-stamp">
            UPLOAD
            <br />
            <span>ONLY</span>
          </div>
        </section>

        <section className="admin-single-upload-wrap">
          <form className="admin-upload-card" onSubmit={submitUpload}>
            <div className="admin-card-heading">
              <span className="admin-index">01</span>
              <h2>{c.uploadTitle}</h2>
            </div>
            <div className="admin-form-grid">
              <div className="admin-field">
                <Label>{c.kind}</Label>
                <Select
                  value={kind}
                  onValueChange={(value: UploadKind) => {
                    setKind(value);
                    setEnglishFile(null);
                    setArabicFile(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <FileImage size={15} /> {c.image}
                    </SelectItem>
                    <SelectItem value="video">
                      <Film size={15} /> {c.video}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="admin-field">
                <Label htmlFor="asset-title">{c.titleLabel}</Label>
                <Input
                  id="asset-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Full body PPF / حماية كاملة"
                  maxLength={180}
                />
              </div>
            </div>

            <div className="admin-pair-grid">
              {(
                [
                  ["en", c.englishSlot, englishFile, englishPreview, setEnglishFile],
                  ["ar", c.arabicSlot, arabicFile, arabicPreview, setArabicFile],
                ] as const
              ).map(([slot, label, selectedFile, preview, setSelectedFile]) => (
                <label
                  className={`admin-pair-dropzone ${selectedFile ? "admin-pair-dropzone--selected" : ""}`}
                  htmlFor={`admin-${slot}-file`}
                  key={slot}
                >
                  <span className="admin-pair-label">{label}</span>
                  {selectedFile && kind === "image" && <img src={preview} alt="" className="admin-selected-preview" />}
                  {selectedFile && kind === "video" && (
                    <video src={preview} className="admin-selected-preview" muted preload="metadata" />
                  )}
                  <strong>{selectedFile ? selectedFile.name : c.file}</strong>
                  <span className="admin-file-meta">
                    {selectedFile
                      ? `${c.selected} · ${selectedFile.type || "unknown type"} · ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : c.fileHint}
                  </span>
                  <input
                    id={`admin-${slot}-file`}
                    type="file"
                    accept={
                      kind === "image"
                        ? "image/jpeg,image/png,image/webp,image/avif"
                        : "video/mp4,video/webm,video/quicktime"
                    }
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      className="admin-clear-file"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      {c.clear}
                    </button>
                  )}
                </label>
              ))}
            </div>

            <label className="admin-check">
              <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
              <span>{c.publishNow}</span>
            </label>

            {uploadStage !== "idle" && (
              <div
                className={`admin-upload-status ${uploadStage === "error" ? "admin-upload-status--error" : ""}`}
                aria-live="polite"
              >
                <span className="admin-status-line">
                  {uploadStage !== "saved" && uploadStage !== "error" && (
                    <LoaderCircle className="admin-spinner" size={14} />
                  )}
                  {uploadStage === "english"
                    ? c.uploadingEnglish
                    : uploadStage === "arabic"
                      ? c.uploadingArabic
                      : uploadStage === "error"
                        ? uploadErrorMessage || c.uploadError
                        : c.saved}
                </span>
                <div
                  className="admin-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round((uploadProgress.english + uploadProgress.arabic) / 2)}
                >
                  <span style={{ width: `${(uploadProgress.english + uploadProgress.arabic) / 2}%` }} />
                </div>
                <div className="admin-progress-steps">
                  <span className={uploadProgress.english === 100 ? "is-complete" : ""}>
                    {c.englishSlot}: {uploadProgress.english === 100 ? "100%" : `${uploadProgress.english}%`}
                  </span>
                  <span className={uploadProgress.arabic === 100 ? "is-complete" : ""}>
                    {c.arabicSlot}: {uploadProgress.arabic === 100 ? "100%" : `${uploadProgress.arabic}%`}
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" className="admin-submit" disabled={isUploading || !canSubmit}>
              <Upload size={16} /> {isUploading ? "…" : c.upload}
            </Button>
          </form>
        </section>
      </main>
    );
  }

  // ============================================================================
  // WINDOW 2: GMAIL OWNER MASTER COMMAND CENTER -> FULL WEBSITE MANIPULATION
  // ============================================================================
  return (
    <main className="admin-page admin-page--gmail" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="admin-topbar">
        <button className="admin-back" onClick={() => setLocation("/")}>
          <ArrowLeft size={16} /> {c.back}
        </button>
        <div className="admin-top-actions">
          <Button
            type="button"
            className="admin-save-top-btn"
            onClick={() =>
              persistSiteCustomization(
                siteCustom,
                language === "ar"
                  ? "تم حفظ ونشر جميع التغييرات على الموقع!"
                  : "All website changes saved & published live!"
              )
            }
          >
            <Save size={14} />{" "}
            {language === "ar" ? "حفظ ونشر جميع التعديلات" : "Save & Publish All Website Changes"}
          </Button>
          <button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
            {language === "en" ? "العربية" : "English"}
          </button>
          <button className="admin-logout" onClick={() => logout.mutate()}>
            <LogOut size={16} /> {c.logout}
          </button>
        </div>
      </div>

      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow admin-eyebrow--gmail">{c.gmailEyebrow}</span>
          <h1>{c.gmailTitle}</h1>
          <p>{c.gmailIntro}</p>
          <div className="admin-gmail-identity">
            <Mail size={14} />
            <span>{firebaseUser?.email ?? "jabedjk112@gmail.com"}</span>
            <span>·</span>
            <span>{language === "ar" ? "صلاحيات المالك الكاملة (Full Owner Power)" : "Full Website Owner Authority"}</span>
          </div>
        </div>
        <div className="admin-hero-stamp admin-hero-stamp--gmail">
          OWNER
          <br />
          <span>MASTER</span>
        </div>
      </section>

      {/* Owner Command Center Navigation Tabs */}
      <nav className="owner-cms-tabs" aria-label="Owner Website Control Tabs">
        <button
          type="button"
          className={`owner-cms-tab ${ownerTab === "media" ? "is-active" : ""}`}
          onClick={() => setOwnerTab("media")}
        >
          <FileImage size={16} />
          <span>{language === "ar" ? "1. الصور والفيديوهات (حذف/رفع/استبدال)" : "1. Pictures & Videos (Upload / Delete / Replace)"}</span>
        </button>
        <button
          type="button"
          className={`owner-cms-tab ${ownerTab === "texts" ? "is-active" : ""}`}
          onClick={() => setOwnerTab("texts")}
        >
          <Type size={16} />
          <span>{language === "ar" ? "2. تعديل جميع نصوص الموقع (6 لغات)" : "2. Edit All Website Texts (6 Languages)"}</span>
        </button>
        <button
          type="button"
          className={`owner-cms-tab ${ownerTab === "buttons" ? "is-active" : ""}`}
          onClick={() => setOwnerTab("buttons")}
        >
          <MousePointerClick size={16} />
          <span>{language === "ar" ? "3. تعديل جميع الأزرار والروابط" : "3. Edit Every Button & Link"}</span>
        </button>
        <button
          type="button"
          className={`owner-cms-tab ${ownerTab === "system" ? "is-active" : ""}`}
          onClick={() => setOwnerTab("system")}
        >
          <Settings2 size={16} />
          <span>{language === "ar" ? "4. إعدادات النظام والأقسام والهوية" : "4. Website System, Sections & Theme"}</span>
        </button>
        <button
          type="button"
          className={`owner-cms-tab ${ownerTab === "reviews" ? "is-active" : ""}`}
          onClick={() => setOwnerTab("reviews")}
        >
          <Star size={16} />
          <span>{language === "ar" ? "5. المراجعات والتحليلات" : "5. Reviews & Visitor Analytics"}</span>
        </button>
      </nav>

      {/* =====================================================================
          TAB 1: PICTURES & VIDEOS (UPLOAD, DELETE, REPLACE, BUILT-IN GALLERY)
         ===================================================================== */}
      {ownerTab === "media" && (
        <div className="owner-cms-stack">
          <section className="admin-layout">
            <form className="admin-upload-card" onSubmit={submitUpload}>
              <div className="admin-card-heading">
                <span className="admin-index">01</span>
                <h2>{c.uploadTitle}</h2>
              </div>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>{c.kind}</Label>
                  <Select
                    value={kind}
                    onValueChange={(value: UploadKind) => {
                      setKind(value);
                      setEnglishFile(null);
                      setArabicFile(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">
                        <FileImage size={15} /> {c.image}
                      </SelectItem>
                      <SelectItem value="video">
                        <Film size={15} /> {c.video}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="admin-field">
                <Label htmlFor="owner-asset-title">{c.titleLabel}</Label>
                <Input
                  id="owner-asset-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Full body PPF / حماية كاملة"
                  maxLength={180}
                />
              </div>
              <div className="admin-pair-grid">
                {(
                  [
                    ["en", c.englishSlot, englishFile, englishPreview, setEnglishFile],
                    ["ar", c.arabicSlot, arabicFile, arabicPreview, setArabicFile],
                  ] as const
                ).map(([slot, label, selectedFile, preview, setSelectedFile]) => (
                  <label
                    className={`admin-pair-dropzone ${selectedFile ? "admin-pair-dropzone--selected" : ""}`}
                    htmlFor={`owner-${slot}-file`}
                    key={slot}
                  >
                    <span className="admin-pair-label">{label}</span>
                    {selectedFile && kind === "image" && <img src={preview} alt="" className="admin-selected-preview" />}
                    {selectedFile && kind === "video" && (
                      <video src={preview} className="admin-selected-preview" muted preload="metadata" />
                    )}
                    <strong>{selectedFile ? selectedFile.name : c.file}</strong>
                    <span className="admin-file-meta">
                      {selectedFile
                        ? `${c.selected} · ${selectedFile.type || "unknown type"} · ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : c.fileHint}
                    </span>
                    <input
                      id={`owner-${slot}-file`}
                      type="file"
                      accept={
                        kind === "image"
                          ? "image/jpeg,image/png,image/webp,image/avif"
                          : "video/mp4,video/webm,video/quicktime"
                      }
                      onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    />
                    {selectedFile && (
                      <button
                        type="button"
                        className="admin-clear-file"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        {c.clear}
                      </button>
                    )}
                  </label>
                ))}
              </div>
              <label className="admin-check">
                <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
                <span>{c.publishNow}</span>
              </label>
              <Button type="submit" className="admin-submit admin-submit--gmail" disabled={isUploading || !canSubmit}>
                <Upload size={16} /> {isUploading ? "…" : c.upload}
              </Button>
            </form>

            <section className="admin-library-card">
              <div className="admin-card-heading">
                <span className="admin-index">02</span>
                <h2>
                  {c.library} ({mediaQuery.data?.length ?? 0})
                </h2>
              </div>
              {editingItem && (
                <form className="admin-edit-panel" onSubmit={submitEdit}>
                  <div className="admin-edit-heading">
                    <strong>
                      {editingItem.language.toUpperCase()} · {editingItem.kind.toUpperCase()}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setReplaceFile(null);
                      }}
                    >
                      {c.cancel}
                    </button>
                  </div>
                  <div className="admin-field">
                    <Label htmlFor="edit-asset-title">{c.titleLabel}</Label>
                    <Input
                      id="edit-asset-title"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      maxLength={180}
                    />
                  </div>
                  <div className="admin-field">
                    <Label>{c.statusUpdated}</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(value: "draft" | "published") => setEditStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">{c.published}</SelectItem>
                        <SelectItem value="draft">{c.draft}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {replaceFile && (
                    <div className="admin-replace-preview">
                      {editingItem.kind === "image" ? (
                        <img src={replacePreview} alt="" />
                      ) : (
                        <video src={replacePreview} muted controls preload="metadata" />
                      )}
                      <span>
                        {replaceFile.type} · {(replaceFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  <label className="admin-replace-control" htmlFor="replace-media-file">
                    <RefreshCw size={16} />
                    <span>{replaceFile ? replaceFile.name : c.replacement}</span>
                    <input
                      id="replace-media-file"
                      type="file"
                      accept={
                        editingItem.kind === "image"
                          ? "image/jpeg,image/png,image/webp,image/avif"
                          : "video/mp4,video/webm,video/quicktime"
                      }
                      onChange={(event) => setReplaceFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <div className="admin-edit-actions">
                    <Button
                      type="submit"
                      disabled={
                        updateMedia.isPending ||
                        replaceMedia.isPending ||
                        (!editTitle.trim() && !replaceFile)
                      }
                    >
                      {updateMedia.isPending || replaceMedia.isPending ? "…" : c.saveChanges}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setReplaceFile(null);
                      }}
                    >
                      {c.cancel}
                    </button>
                  </div>
                </form>
              )}

              {mediaQuery.isLoading ? (
                <div className="admin-empty">…</div>
              ) : mediaQuery.data?.length ? (
                <div className="admin-media-list">
                  {mediaQuery.data.map((item) => (
                    <article className="admin-media-item" key={item.id}>
                      <div className="admin-media-preview">
                        {item.kind === "image" ? (
                          <img src={item.url} alt={item.title} />
                        ) : (
                          <video src={item.url} controls preload="metadata" />
                        )}
                        <span className="admin-item-lang-tag">{item.language.toUpperCase()}</span>
                      </div>
                      <div className="admin-media-meta">
                        <strong>{item.title}</strong>
                        <span>
                          {item.kind.toUpperCase()} {item.pairKey ? `· PAIR: ${item.pairKey.slice(-4)}` : ""}
                        </span>
                        <span className={`admin-status admin-status--${item.status}`}>
                          {item.status === "published" ? c.published : c.draft}
                        </span>
                        <div className="admin-item-actions">
                          <button className="admin-status-button" onClick={() => startEditing(item)}>
                            <Pencil size={13} /> {c.edit}
                          </button>
                          <button
                            className="admin-status-button"
                            onClick={() =>
                              updateStatus.mutate({
                                id: item.id,
                                status: item.status === "published" ? "draft" : "published",
                              })
                            }
                          >
                            {item.status === "published" ? c.unpublish : c.publish}
                          </button>
                          <button
                            type="button"
                            className="admin-status-button admin-status-button--danger"
                            disabled={deleteMediaMutation.isPending}
                            onClick={() => deleteMediaMutation.mutate({ id: item.id })}
                          >
                            <Trash2 size={13} /> {c.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty">
                  <X size={18} />
                  {c.empty}
                </div>
              )}
            </section>
          </section>

          {/* Main Website Hero / Before-After / Quality / Closing Pictures Override */}
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="admin-card-heading">
              <span className="admin-index">03</span>
              <h2>
                {language === "ar"
                  ? "صور الموقع الأساسية (Hero / Before & After / Quality / Closing)"
                  : "Main Website Background & Comparison Pictures"}
              </h2>
            </div>
            <p className="admin-review-import-copy">
              {language === "ar"
                ? "يمكنك استبدال أي صورة أساسية في الموقع عبر رفع صورة جديدة من جهازك أو وضع رابط مباشر."
                : "Replace any core website picture directly by uploading a new image file from your device or pasting an image URL."}
            </p>
            <div className="owner-core-images-grid">
              {(
                [
                  ["heroImage", "Hero Main Banner Picture"],
                  ["beforeImage", "Before Comparison Picture (Unprotected)"],
                  ["afterImage", "After Comparison Picture (PPF Gloss)"],
                  ["qualityImage", "Quality & Studio Section Picture"],
                  ["closingImage", "Closing Contact Banner Picture"],
                ] as const
              ).map(([slotKey, slotLabel]) => (
                <div className="owner-core-image-card" key={slotKey}>
                  <div className="owner-core-image-preview">
                    <img src={siteCustom.media[slotKey] || ""} alt={slotLabel} />
                  </div>
                  <strong>{slotLabel}</strong>
                  <Input
                    value={siteCustom.media[slotKey] || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        media: { ...prev.media, [slotKey]: e.target.value },
                      }))
                    }
                    placeholder="Image URL or data URL"
                  />
                  <div className="owner-core-image-actions">
                    <label className="admin-replace-control owner-compact-upload">
                      <Upload size={14} />
                      <span>{language === "ar" ? "رفع صورة جديدة" : "Upload New Picture"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleQuickImageOverrideFile(slotKey, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Built-in Portfolio Gallery Pictures (Delete / Restore / Replace) */}
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="admin-card-heading">
              <span className="admin-index">04</span>
              <h2>
                {language === "ar"
                  ? "إدارة وحذف صور معرض الأعمال (Portfolio Pictures #01 - #07)"
                  : "Website Portfolio Gallery Pictures (Delete, Restore or Replace #01–#07)"}
              </h2>
            </div>
            <p className="admin-review-import-copy">
              {language === "ar"
                ? "تحكم كامل بجميع صور المعرض الافتراضية: يمكنك حذف أي صورة من الموقع أو استعادتها أو استبدالها بصورة أخرى."
                : "Full power over every built-in gallery picture: Delete/hide any picture from the website, restore it, or replace its image and caption."}
            </p>
            <div className="owner-builtin-gallery-grid">
              {galleryItems.map((item, idx) => {
                const isDeleted = siteCustom.media.deletedGalleryIds.includes(item.id);
                const ov = siteCustom.media.galleryOverrides?.[item.id];
                const currentSrc = ov?.src || item.src;
                return (
                  <article
                    key={item.id}
                    className={`owner-builtin-card ${isDeleted ? "owner-builtin-card--deleted" : ""}`}
                  >
                    <div className="owner-builtin-preview">
                      <img src={currentSrc} alt={item.alt} />
                      <span className="admin-item-lang-tag">#{item.id}</span>
                      {isDeleted && <span className="owner-deleted-badge">DELETED / HIDDEN</span>}
                    </div>
                    <div className="owner-builtin-body">
                      <strong>{activeLangContent.galleryLabels[idx] || item.alt}</strong>
                      <small>{item.category}</small>
                      <div className="owner-builtin-actions">
                        <label className="admin-status-button">
                          <RefreshCw size={13} /> {language === "ar" ? "استبدال الصورة" : "Replace Picture"}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              void handleBuiltInGalleryFileOverride(item.id, e.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={`admin-status-button ${isDeleted ? "" : "admin-status-button--danger"}`}
                          onClick={() => toggleDeleteBuiltInGallery(item.id)}
                        >
                          {isDeleted ? (
                            <>
                              <RotateCcw size={13} /> {language === "ar" ? "استعادة الصورة" : "Restore Picture"}
                            </>
                          ) : (
                            <>
                              <Trash2 size={13} /> {language === "ar" ? "حذف الصورة" : "Delete Picture"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Built-in Studio Videos (Delete / Restore / Edit Title or Video URL) */}
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="admin-card-heading">
              <span className="admin-index">05</span>
              <h2>
                {language === "ar"
                  ? "إدارة وحذف فيديوهات الاستوديو (Studio Videos #01 - #04)"
                  : "Website Studio Videos (Delete, Restore or Edit #01–#04)"}
              </h2>
            </div>
            <div className="owner-builtin-gallery-grid">
              {videoItems.map((vItem, idx) => {
                const isDeleted = siteCustom.media.deletedVideoIndices.includes(idx);
                const ov = siteCustom.media.videoOverrides?.[idx];
                return (
                  <article
                    key={idx}
                    className={`owner-builtin-card ${isDeleted ? "owner-builtin-card--deleted" : ""}`}
                  >
                    <div className="owner-builtin-preview">
                      <img src={ov?.poster || vItem.src} alt={vItem.title} />
                      <span className="admin-item-lang-tag">VIDEO 0{idx + 1}</span>
                      {isDeleted && <span className="owner-deleted-badge">DELETED / HIDDEN</span>}
                    </div>
                    <div className="owner-builtin-body">
                      <Input
                        value={ov?.title ?? vItem.title}
                        onChange={(e) =>
                          setSiteCustom((prev) => ({
                            ...prev,
                            media: {
                              ...prev.media,
                              videoOverrides: {
                                ...prev.media.videoOverrides,
                                [idx]: {
                                  ...(prev.media.videoOverrides?.[idx] ?? {}),
                                  title: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                        placeholder="Video Title"
                      />
                      <Input
                        value={ov?.src ?? ""}
                        onChange={(e) =>
                          setSiteCustom((prev) => ({
                            ...prev,
                            media: {
                              ...prev.media,
                              videoOverrides: {
                                ...prev.media.videoOverrides,
                                [idx]: {
                                  ...(prev.media.videoOverrides?.[idx] ?? {}),
                                  src: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                        placeholder="Custom Video URL (optional)"
                      />
                      <div className="owner-builtin-actions">
                        <button
                          type="button"
                          className={`admin-status-button ${isDeleted ? "" : "admin-status-button--danger"}`}
                          onClick={() => toggleDeleteBuiltInVideo(idx)}
                        >
                          {isDeleted ? (
                            <>
                              <RotateCcw size={13} /> {language === "ar" ? "استعادة الفيديو" : "Restore Video"}
                            </>
                          ) : (
                            <>
                              <Trash2 size={13} /> {language === "ar" ? "حذف الفيديو" : "Delete Video"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 2: COMPLETE WEBSITE TEXT EDITOR (ALL 6 LANGUAGES)
         ===================================================================== */}
      {ownerTab === "texts" && (
        <div className="owner-cms-stack">
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="owner-cms-StickyBar">
              <div>
                <div className="admin-card-heading" style={{ marginBottom: 8, borderBottom: 0, paddingBottom: 0 }}>
                  <span className="admin-index">TEXT CMS</span>
                  <h2>
                    {language === "ar"
                      ? "محرر جميع نصوص الموقع (6 لغات)"
                      : "Complete Website Text Editor (All 6 Languages)"}
                  </h2>
                </div>
                <p className="admin-review-import-copy">
                  {language === "ar"
                    ? "اختر اللغة وعدّل أي نص أو عنوان أو وصف في الموقع بالكامل، ثم اضغط حفظ ونشر."
                    : "Choose any of the 6 languages below and edit every headline, paragraph, service card, process step, stat, and footer text."}
                </p>
              </div>
              <div className="owner-lang-selector">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className={`owner-lang-pill ${editLang === opt.code ? "is-active" : ""}`}
                    onClick={() => setEditLang(opt.code)}
                  >
                    <Globe size={13} /> {opt.label} ({opt.short})
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Hero Section Texts */}
            <div className="owner-editor-group">
              <h3>01 · Hero Banner Texts ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Hero Eyebrow</Label>
                  <Input
                    value={activeLangContent.heroEyebrow}
                    onChange={(e) => updateContentField("heroEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Hero Main Headline (H1)</Label>
                  <Input
                    value={activeLangContent.heroTitle}
                    onChange={(e) => updateContentField("heroTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Hero Description Paragraph</Label>
                  <textarea
                    className="owner-textarea"
                    rows={3}
                    value={activeLangContent.heroBody}
                    onChange={(e) => updateContentField("heroBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Hero Side Vertical Badge</Label>
                  <Input
                    value={activeExtraTexts.heroSideNote}
                    onChange={(e) => updateExtraTextField("heroSideNote", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Scroll Down Cue Text</Label>
                  <Input
                    value={activeLangContent.scroll}
                    onChange={(e) => updateContentField("scroll", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Services Section & All 6 Service Cards */}
            <div className="owner-editor-group">
              <h3>02 · Services Section & 06 Service Cards ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Services Eyebrow</Label>
                  <Input
                    value={activeLangContent.servicesEyebrow}
                    onChange={(e) => updateContentField("servicesEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Services Main Title</Label>
                  <Input
                    value={activeLangContent.servicesTitle}
                    onChange={(e) => updateContentField("servicesTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Services Intro Description</Label>
                  <textarea
                    className="owner-textarea"
                    rows={2}
                    value={activeLangContent.servicesBody}
                    onChange={(e) => updateContentField("servicesBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Services Aside Note</Label>
                  <Input
                    value={activeExtraTexts.servicesAsideQuote}
                    onChange={(e) => updateExtraTextField("servicesAsideQuote", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Services Grid Subheading</Label>
                  <Input
                    value={activeLangContent.servicesHeading}
                    onChange={(e) => updateContentField("servicesHeading", e.target.value)}
                  />
                </div>
              </div>

              <div className="owner-cards-subgrid">
                {activeLangContent.services.map(([srvTitle, srvBody, srvNum], idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Service Card {srvNum}</span>
                    <div className="admin-field">
                      <Label>Service Title</Label>
                      <Input
                        value={srvTitle}
                        onChange={(e) => {
                          const next = activeLangContent.services.map((item, i) =>
                            i === idx ? ([e.target.value, item[1], item[2]] as [string, string, string]) : item
                          );
                          updateContentField("services", next);
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Service Description</Label>
                      <textarea
                        className="owner-textarea"
                        rows={2}
                        value={srvBody}
                        onChange={(e) => {
                          const next = activeLangContent.services.map((item, i) =>
                            i === idx ? ([item[0], e.target.value, item[2]] as [string, string, string]) : item
                          );
                          updateContentField("services", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Why Us / Manifesto Section */}
            <div className="owner-editor-group">
              <h3>03 · Why Us / Manifesto Section ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Manifesto Eyebrow</Label>
                  <Input
                    value={activeExtraTexts.manifestoEyebrow}
                    onChange={(e) => updateExtraTextField("manifestoEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Manifesto Headline</Label>
                  <Input
                    value={activeExtraTexts.manifestoTitle}
                    onChange={(e) => updateExtraTextField("manifestoTitle", e.target.value)}
                  />
                </div>
              </div>
              <div className="owner-cards-subgrid">
                {activeExtraTexts.manifestoPoints.map(([ptTitle, ptBody], idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Point 0{idx + 1}</span>
                    <div className="admin-field">
                      <Label>Title</Label>
                      <Input
                        value={ptTitle}
                        onChange={(e) => {
                          const next = activeExtraTexts.manifestoPoints.map((item, i) =>
                            i === idx ? ([e.target.value, item[1]] as [string, string]) : item
                          );
                          updateExtraTextField("manifestoPoints", next);
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Description</Label>
                      <Input
                        value={ptBody}
                        onChange={(e) => {
                          const next = activeExtraTexts.manifestoPoints.map((item, i) =>
                            i === idx ? ([item[0], e.target.value] as [string, string]) : item
                          );
                          updateExtraTextField("manifestoPoints", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Portfolio Gallery & Before/After Texts */}
            <div className="owner-editor-group">
              <h3>04 · Portfolio Gallery & Before/After Comparison Texts ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Portfolio Eyebrow</Label>
                  <Input
                    value={activeLangContent.workEyebrow}
                    onChange={(e) => updateContentField("workEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Portfolio Title</Label>
                  <Input
                    value={activeLangContent.workTitle}
                    onChange={(e) => updateContentField("workTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Portfolio Description</Label>
                  <Input
                    value={activeLangContent.workBody}
                    onChange={(e) => updateContentField("workBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Before / After Eyebrow</Label>
                  <Input
                    value={activeLangContent.beforeEyebrow}
                    onChange={(e) => updateContentField("beforeEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Before / After Title</Label>
                  <Input
                    value={activeLangContent.beforeTitle}
                    onChange={(e) => updateContentField("beforeTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Before / After Description</Label>
                  <Input
                    value={activeLangContent.beforeBody}
                    onChange={(e) => updateContentField("beforeBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Before Badge Label</Label>
                  <Input
                    value={activeLangContent.beforeLabel}
                    onChange={(e) => updateContentField("beforeLabel", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>After Badge Label</Label>
                  <Input
                    value={activeLangContent.afterLabel}
                    onChange={(e) => updateContentField("afterLabel", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Before Badge Subtext</Label>
                  <Input
                    value={activeExtraTexts.beforeSubLabel}
                    onChange={(e) => updateExtraTextField("beforeSubLabel", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>After Badge Subtext</Label>
                  <Input
                    value={activeExtraTexts.afterSubLabel}
                    onChange={(e) => updateExtraTextField("afterSubLabel", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 5. Videos, 4-Step Process, Quality & Stats */}
            <div className="owner-editor-group">
              <h3>05 · Studio Videos, Installation Process, Quality & Statistics ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Videos Eyebrow</Label>
                  <Input
                    value={activeLangContent.videoEyebrow}
                    onChange={(e) => updateContentField("videoEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Videos Title</Label>
                  <Input
                    value={activeLangContent.videoTitle}
                    onChange={(e) => updateContentField("videoTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Videos Description</Label>
                  <Input
                    value={activeLangContent.videoBody}
                    onChange={(e) => updateContentField("videoBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Process Eyebrow</Label>
                  <Input
                    value={activeLangContent.processEyebrow}
                    onChange={(e) => updateContentField("processEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Process Title</Label>
                  <Input
                    value={activeLangContent.processTitle}
                    onChange={(e) => updateContentField("processTitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="owner-cards-subgrid">
                {activeLangContent.process.map(([stepTitle, stepBody], idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Process Step 0{idx + 1}</span>
                    <div className="admin-field">
                      <Label>Step Title</Label>
                      <Input
                        value={stepTitle}
                        onChange={(e) => {
                          const next = activeLangContent.process.map((item, i) =>
                            i === idx ? ([e.target.value, item[1]] as [string, string]) : item
                          );
                          updateContentField("process", next);
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Step Description</Label>
                      <Input
                        value={stepBody}
                        onChange={(e) => {
                          const next = activeLangContent.process.map((item, i) =>
                            i === idx ? ([item[0], e.target.value] as [string, string]) : item
                          );
                          updateContentField("process", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-form-grid" style={{ marginTop: 18 }}>
                <div className="admin-field">
                  <Label>Quality Eyebrow</Label>
                  <Input
                    value={activeLangContent.qualityEyebrow}
                    onChange={(e) => updateContentField("qualityEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Quality Title</Label>
                  <Input
                    value={activeLangContent.qualityTitle}
                    onChange={(e) => updateContentField("qualityTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Quality Description</Label>
                  <Input
                    value={activeLangContent.qualityBody}
                    onChange={(e) => updateContentField("qualityBody", e.target.value)}
                  />
                </div>
              </div>

              <div className="owner-cards-subgrid">
                {activeLangContent.stats.map(([statVal, statLbl], idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Stat Card 0{idx + 1}</span>
                    <div className="admin-field">
                      <Label>Stat Value</Label>
                      <Input
                        value={statVal}
                        onChange={(e) => {
                          const next = activeLangContent.stats.map((item, i) =>
                            i === idx ? ([e.target.value, item[1]] as [string, string]) : item
                          );
                          updateContentField("stats", next);
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Stat Label</Label>
                      <Input
                        value={statLbl}
                        onChange={(e) => {
                          const next = activeLangContent.stats.map((item, i) =>
                            i === idx ? ([item[0], e.target.value] as [string, string]) : item
                          );
                          updateContentField("stats", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Reviews, Contact, SEO Section & Footer Texts */}
            <div className="owner-editor-group">
              <h3>06 · Reviews, Closing Contact, Saudi SEO Guides & Footer ({editLang.toUpperCase()})</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Reviews Eyebrow</Label>
                  <Input
                    value={activeLangContent.testimonialsEyebrow}
                    onChange={(e) => updateContentField("testimonialsEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Reviews Title</Label>
                  <Input
                    value={activeLangContent.testimonialsTitle}
                    onChange={(e) => updateContentField("testimonialsTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Closing Contact Eyebrow</Label>
                  <Input
                    value={activeLangContent.contactEyebrow}
                    onChange={(e) => updateContentField("contactEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Closing Contact Title</Label>
                  <Input
                    value={activeLangContent.contactTitle}
                    onChange={(e) => updateContentField("contactTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Closing Contact Body</Label>
                  <Input
                    value={activeLangContent.contactBody}
                    onChange={(e) => updateContentField("contactBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Saudi SEO Section Eyebrow</Label>
                  <Input
                    value={activeExtraTexts.seoSectionEyebrow}
                    onChange={(e) => updateExtraTextField("seoSectionEyebrow", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Saudi SEO Section Heading</Label>
                  <Input
                    value={activeExtraTexts.seoSectionTitle}
                    onChange={(e) => updateExtraTextField("seoSectionTitle", e.target.value)}
                  />
                </div>
                <div className="admin-field" style={{ gridColumn: "1 / -1" }}>
                  <Label>Saudi SEO Section Description</Label>
                  <Input
                    value={activeExtraTexts.seoSectionBody}
                    onChange={(e) => updateExtraTextField("seoSectionBody", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Footer Studio Description</Label>
                  <Input
                    value={activeLangContent.footerDescription}
                    onChange={(e) => updateContentField("footerDescription", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Footer Copyright Line</Label>
                  <Input
                    value={activeLangContent.footerCopyright}
                    onChange={(e) => updateContentField("footerCopyright", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="owner-save-bar">
              <Button
                type="button"
                className="admin-submit admin-submit--gmail"
                onClick={() =>
                  persistSiteCustomization(
                    siteCustom,
                    language === "ar" ? "تم حفظ ونشر جميع النصوص بنجاح!" : "All website texts saved & published!"
                  )
                }
              >
                <Save size={16} />{" "}
                {language === "ar" ? "حفظ ونشر جميع تعديلات النصوص" : "Save & Publish All Text Edits"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 3: EVERY BUTTON & LINK EDITOR ACROSS THE ENTIRE WEBSITE
         ===================================================================== */}
      {ownerTab === "buttons" && (
        <div className="owner-cms-stack">
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="owner-cms-StickyBar">
              <div>
                <div className="admin-card-heading" style={{ marginBottom: 8, borderBottom: 0, paddingBottom: 0 }}>
                  <span className="admin-index">BUTTONS CMS</span>
                  <h2>
                    {language === "ar"
                      ? "تعديل جميع أزرار وروابط الموقع بالكامل"
                      : "Edit Every Button & Link Across the Website"}
                  </h2>
                </div>
                <p className="admin-review-import-copy">
                  {language === "ar"
                    ? "عدّل نص كل زر والرابط أو القسم الذي يوجه إليه، مع إمكانية إظهار أو إخفاء أي زر."
                    : "Edit the text label, target section/URL, and visibility of every single button on the website."}
                </p>
              </div>
              <div className="owner-lang-selector">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className={`owner-lang-pill ${editLang === opt.code ? "is-active" : ""}`}
                    onClick={() => setEditLang(opt.code)}
                  >
                    <Globe size={13} /> {opt.label} ({opt.short})
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Top Navbar Navigation Buttons */}
            <div className="owner-editor-group">
              <h3>01 · Top Navigation Bar Buttons ({editLang.toUpperCase()})</h3>
              <div className="owner-cards-subgrid">
                {activeLangContent.nav.map(([navLabel, navTarget], idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Nav Button 0{idx + 1}</span>
                    <div className="admin-field">
                      <Label>Button Label ({editLang.toUpperCase()})</Label>
                      <Input
                        value={navLabel}
                        onChange={(e) => {
                          const next = activeLangContent.nav.map((item, i) =>
                            i === idx ? ([e.target.value, item[1]] as [string, string]) : item
                          );
                          updateContentField("nav", next);
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Target Section ID or URL (e.g. services, work, /contact)</Label>
                      <Input
                        value={navTarget}
                        onChange={(e) => {
                          const next = activeLangContent.nav.map((item, i) =>
                            i === idx ? ([item[0], e.target.value] as [string, string]) : item
                          );
                          updateContentField("nav", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="owner-subcard">
                  <span className="admin-index">Navbar WhatsApp CTA Button</span>
                  <div className="admin-field">
                    <Label>Button Label ({editLang.toUpperCase()})</Label>
                    <Input
                      value={activeLangContent.navCta}
                      onChange={(e) => updateContentField("navCta", e.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <Label>Custom URL (leave empty for default WhatsApp)</Label>
                    <Input
                      value={siteCustom.buttons.navCtaUrl || ""}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          buttons: { ...prev.buttons, navCtaUrl: e.target.value },
                        }))
                      }
                      placeholder="https://wa.me/966537358631"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Hero Section Buttons */}
            <div className="owner-editor-group">
              <h3>02 · Hero Banner Buttons ({editLang.toUpperCase()})</h3>
              <div className="owner-cards-subgrid">
                <div className="owner-subcard">
                  <div className="owner-subcard-header">
                    <span className="admin-index">Hero Primary Gold Button</span>
                    <label className="owner-inline-toggle">
                      <input
                        type="checkbox"
                        checked={siteCustom.buttons.showHeroPrimary !== false}
                        onChange={(e) =>
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, showHeroPrimary: e.target.checked },
                          }))
                        }
                      />
                      <span>{siteCustom.buttons.showHeroPrimary !== false ? "Visible" : "Hidden"}</span>
                    </label>
                  </div>
                  <div className="admin-field">
                    <Label>Button Text ({editLang.toUpperCase()})</Label>
                    <Input
                      value={activeLangContent.viewWork}
                      onChange={(e) => updateContentField("viewWork", e.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <Label>Target Section or URL (e.g. #work, #services, https://...)</Label>
                    <Input
                      value={siteCustom.buttons.heroPrimaryTarget || "#work"}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          buttons: { ...prev.buttons, heroPrimaryTarget: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="owner-subcard">
                  <div className="owner-subcard-header">
                    <span className="admin-index">Hero Secondary Line Button</span>
                    <label className="owner-inline-toggle">
                      <input
                        type="checkbox"
                        checked={siteCustom.buttons.showHeroSecondary !== false}
                        onChange={(e) =>
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, showHeroSecondary: e.target.checked },
                          }))
                        }
                      />
                      <span>{siteCustom.buttons.showHeroSecondary !== false ? "Visible" : "Hidden"}</span>
                    </label>
                  </div>
                  <div className="admin-field">
                    <Label>Button Text ({editLang.toUpperCase()})</Label>
                    <Input
                      value={activeLangContent.book}
                      onChange={(e) => updateContentField("book", e.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <Label>Target Section or URL (e.g. #contact)</Label>
                    <Input
                      value={siteCustom.buttons.heroSecondaryTarget || "#contact"}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          buttons: { ...prev.buttons, heroSecondaryTarget: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="owner-subcard">
                  <div className="owner-subcard-header">
                    <span className="admin-index">Hero Direct WhatsApp Button</span>
                    <label className="owner-inline-toggle">
                      <input
                        type="checkbox"
                        checked={siteCustom.buttons.showHeroWhatsapp !== false}
                        onChange={(e) =>
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, showHeroWhatsapp: e.target.checked },
                          }))
                        }
                      />
                      <span>{siteCustom.buttons.showHeroWhatsapp !== false ? "Visible" : "Hidden"}</span>
                    </label>
                  </div>
                  <div className="admin-field">
                    <Label>Button Text ({editLang.toUpperCase()})</Label>
                    <Input
                      value={activeLangContent.heroWhatsapp}
                      onChange={(e) => updateContentField("heroWhatsapp", e.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <Label>Custom URL (optional)</Label>
                    <Input
                      value={siteCustom.buttons.heroWhatsappUrl || ""}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          buttons: { ...prev.buttons, heroWhatsappUrl: e.target.value },
                        }))
                      }
                      placeholder="https://wa.me/966537358631"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Portfolio Filter Buttons & Before/After Preset Buttons */}
            <div className="owner-editor-group">
              <h3>03 · Portfolio Filter Buttons & Comparison Preset Buttons</h3>
              <div className="owner-cards-subgrid">
                {activeLangContent.filters.map((filterLabel, idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Filter Button 0{idx + 1} ({editLang.toUpperCase()})</span>
                    <div className="admin-field">
                      <Label>Filter Button Text</Label>
                      <Input
                        value={filterLabel}
                        onChange={(e) => {
                          const next = activeLangContent.filters.map((f, i) => (i === idx ? e.target.value : f));
                          updateContentField("filters", next);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-form-grid" style={{ marginTop: 16 }}>
                <div className="admin-field">
                  <Label>Before Preset Button 1 (English)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset1En || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset1En: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Before Preset Button 1 (Arabic)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset1Ar || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset1Ar: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>50/50 Preset Button 2 (English)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset2En || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset2En: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>50/50 Preset Button 2 (Arabic)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset2Ar || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset2Ar: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>After Preset Button 3 (English)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset3En || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset3En: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>After Preset Button 3 (Arabic)</Label>
                  <Input
                    value={siteCustom.buttons.beforePreset3Ar || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, beforePreset3Ar: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* 4. Quality CTA, Reviews Buttons, Closing CTA & Floating WhatsApp Button */}
            <div className="owner-editor-group">
              <h3>04 · Quality CTA, Reviews Section Buttons, Closing CTA & Floating WhatsApp</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Quality Section Button Text (EN)</Label>
                  <Input
                    value={siteCustom.buttons.qualityCtaTextEn || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, qualityCtaTextEn: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Quality Section Button Text (AR)</Label>
                  <Input
                    value={siteCustom.buttons.qualityCtaTextAr || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, qualityCtaTextAr: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Quality Button Target Section/URL</Label>
                  <Input
                    value={siteCustom.buttons.qualityCtaTarget || "#contact"}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, qualityCtaTarget: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Reviews Counter Button Text ({editLang.toUpperCase()})</Label>
                  <Input
                    value={activeLangContent.reviewCountLabel}
                    onChange={(e) => updateContentField("reviewCountLabel", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Leave a Review Button Text ({editLang.toUpperCase()})</Label>
                  <Input
                    value={activeLangContent.reviewFormSubmit}
                    onChange={(e) => updateContentField("reviewFormSubmit", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Track Review Status Button Text ({editLang.toUpperCase()})</Label>
                  <Input
                    value={activeLangContent.reviewTrackSubmit}
                    onChange={(e) => updateContentField("reviewTrackSubmit", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Closing Banner Gold Button Text ({editLang.toUpperCase()})</Label>
                  <Input
                    value={activeLangContent.ctaButton}
                    onChange={(e) => updateContentField("ctaButton", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Closing Banner Button Custom URL (optional)</Label>
                  <Input
                    value={siteCustom.buttons.closingCtaUrl || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, closingCtaUrl: e.target.value },
                      }))
                    }
                    placeholder="https://wa.me/966537358631"
                  />
                </div>
                <div className="admin-field">
                  <Label>Floating WhatsApp Button Text ({editLang.toUpperCase()})</Label>
                  <Input
                    value={activeLangContent.floatingWhatsapp}
                    onChange={(e) => updateContentField("floatingWhatsapp", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <Label>Floating WhatsApp Custom URL (optional)</Label>
                  <Input
                    value={siteCustom.buttons.floatingWhatsappUrl || ""}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        buttons: { ...prev.buttons, floatingWhatsappUrl: e.target.value },
                      }))
                    }
                    placeholder="https://wa.me/966537358631"
                  />
                </div>
              </div>
            </div>

            {/* 5. Saudi Search Guide Buttons (6 Buttons) */}
            <div className="owner-editor-group">
              <h3>05 · Saudi Search Guide Buttons (6 Homepage Guide Buttons)</h3>
              <div className="owner-cards-subgrid">
                {(siteCustom.buttons.seoButtons ?? []).map((btn, idx) => (
                  <div className="owner-subcard" key={idx}>
                    <span className="admin-index">Guide Button 0{idx + 1}</span>
                    <div className="admin-field">
                      <Label>English Button Label</Label>
                      <Input
                        value={btn.labelEn}
                        onChange={(e) => {
                          const next = [...(siteCustom.buttons.seoButtons ?? [])];
                          next[idx] = { ...next[idx], labelEn: e.target.value };
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, seoButtons: next },
                          }));
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Arabic Button Label</Label>
                      <Input
                        value={btn.labelAr}
                        onChange={(e) => {
                          const next = [...(siteCustom.buttons.seoButtons ?? [])];
                          next[idx] = { ...next[idx], labelAr: e.target.value };
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, seoButtons: next },
                          }));
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>English Target Route</Label>
                      <Input
                        value={btn.hrefEn}
                        onChange={(e) => {
                          const next = [...(siteCustom.buttons.seoButtons ?? [])];
                          next[idx] = { ...next[idx], hrefEn: e.target.value };
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, seoButtons: next },
                          }));
                        }}
                      />
                    </div>
                    <div className="admin-field">
                      <Label>Arabic Target Route</Label>
                      <Input
                        value={btn.hrefAr}
                        onChange={(e) => {
                          const next = [...(siteCustom.buttons.seoButtons ?? [])];
                          next[idx] = { ...next[idx], hrefAr: e.target.value };
                          setSiteCustom((prev) => ({
                            ...prev,
                            buttons: { ...prev.buttons, seoButtons: next },
                          }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="owner-save-bar">
              <Button
                type="button"
                className="admin-submit admin-submit--gmail"
                onClick={() =>
                  persistSiteCustomization(
                    siteCustom,
                    language === "ar"
                      ? "تم حفظ ونشر جميع تعديلات الأزرار والروابط!"
                      : "All button labels & links saved & published!"
                  )
                }
              >
                <Save size={16} />{" "}
                {language === "ar" ? "حفظ ونشر تعديلات الأزرار" : "Save & Publish All Button Changes"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 4: WEBSITE SYSTEM, OWNERSHIP, SECTION VISIBILITY & THEME STUDIO
         ===================================================================== */}
      {ownerTab === "system" && (
        <div className="owner-cms-stack">
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="admin-card-heading">
              <span className="admin-index">SYSTEM CMS</span>
              <h2>
                {language === "ar"
                  ? "ملكية الموقع، إظهار/إخفاء الأقسام، الروابط الاجتماعية، والألوان"
                  : "Website Ownership, Section Visibility Switches, Socials & Theme Studio"}
              </h2>
            </div>

            {/* 1. Brand, SEO & Contact Ownership */}
            <div className="owner-editor-group">
              <h3>01 · Brand Wordmark, Preloader, WhatsApp & Social Ownership</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Brand Wordmark First Part (Gold)</Label>
                  <Input
                    value={siteCustom.brand.brandPrimary}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, brandPrimary: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Brand Wordmark Second Part (Serif)</Label>
                  <Input
                    value={siteCustom.brand.brandSecondary}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, brandSecondary: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Official WhatsApp Display Phone</Label>
                  <Input
                    value={siteCustom.brand.whatsappDisplay}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, whatsappDisplay: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Official WhatsApp Number (Digits only, e.g. 966537358631)</Label>
                  <Input
                    value={siteCustom.brand.whatsappNumber}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, whatsappNumber: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Instagram Profile URL</Label>
                  <Input
                    value={siteCustom.brand.instagramUrl}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, instagramUrl: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Snapchat Profile URL</Label>
                  <Input
                    value={siteCustom.brand.snapchatUrl}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, snapchatUrl: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>TikTok Profile URL</Label>
                  <Input
                    value={siteCustom.brand.tiktokUrl}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, tiktokUrl: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Preloader Headline</Label>
                  <Input
                    value={siteCustom.brand.preloaderTitle}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, preloaderTitle: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Browser Page Title (English)</Label>
                  <Input
                    value={siteCustom.brand.pageTitleEn}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, pageTitleEn: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-field">
                  <Label>Browser Page Title (Arabic)</Label>
                  <Input
                    value={siteCustom.brand.pageTitleAr}
                    onChange={(e) =>
                      setSiteCustom((prev) => ({
                        ...prev,
                        brand: { ...prev.brand, pageTitleAr: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* 2. Section Visibility Master Switches */}
            <div className="owner-editor-group">
              <h3>
                <LayoutGrid size={16} /> 02 · Master Section Visibility Switches (Show / Hide Any Website Section)
              </h3>
              <div className="owner-visibility-grid">
                {SECTION_LABELS.map(({ key, labelEn, labelAr }) => {
                  const enabled = siteCustom.sections[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`owner-visibility-card ${enabled ? "is-enabled" : "is-disabled"}`}
                      onClick={() =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            [key]: !prev.sections[key],
                          },
                        }))
                      }
                    >
                      <div>
                        <strong>{language === "ar" ? labelAr : labelEn}</strong>
                        <small>{enabled ? "VISIBLE ON WEBSITE" : "HIDDEN FROM WEBSITE"}</small>
                      </div>
                      {enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Theme & Color Palette Manipulation */}
            <div className="owner-editor-group">
              <h3>
                <Palette size={16} /> 03 · Website Theme & Luxury Color Palette
              </h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <Label>Primary Champagne Gold (--gold)</Label>
                  <div className="owner-color-row">
                    <input
                      type="color"
                      value={siteCustom.brand.goldColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, goldColor: e.target.value },
                        }))
                      }
                    />
                    <Input
                      value={siteCustom.brand.goldColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, goldColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <Label>Light Gold Highlight (--gold-light)</Label>
                  <div className="owner-color-row">
                    <input
                      type="color"
                      value={siteCustom.brand.goldLightColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, goldLightColor: e.target.value },
                        }))
                      }
                    />
                    <Input
                      value={siteCustom.brand.goldLightColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, goldLightColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <Label>Background Obsidian Ink (--ink)</Label>
                  <div className="owner-color-row">
                    <input
                      type="color"
                      value={siteCustom.brand.inkColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, inkColor: e.target.value },
                        }))
                      }
                    />
                    <Input
                      value={siteCustom.brand.inkColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, inkColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <Label>WhatsApp Accent Green (--green)</Label>
                  <div className="owner-color-row">
                    <input
                      type="color"
                      value={siteCustom.brand.greenColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, greenColor: e.target.value },
                        }))
                      }
                    />
                    <Input
                      value={siteCustom.brand.greenColor}
                      onChange={(e) =>
                        setSiteCustom((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, greenColor: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="owner-save-bar">
              <Button
                type="button"
                className="admin-submit admin-submit--gmail"
                onClick={() =>
                  persistSiteCustomization(
                    siteCustom,
                    language === "ar"
                      ? "تم حفظ ونشر إعدادات النظام والأقسام والألوان!"
                      : "Website system, sections & theme saved & published!"
                  )
                }
              >
                <Save size={16} />{" "}
                {language === "ar" ? "حفظ ونشر إعدادات النظام" : "Save & Publish System Settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="owner-reset-btn"
                onClick={() => void handleResetAllSiteCustomization()}
              >
                <RotateCcw size={15} />{" "}
                {language === "ar" ? "استعادة جميع الإعدادات الافتراضية" : "Reset Entire Website to Factory Defaults"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 5: REVIEWS MODERATION, DELETION, DIRECT ADD & VISITOR ANALYTICS
         ===================================================================== */}
      {ownerTab === "reviews" && (
        <div className="owner-cms-stack">
          <section className="admin-analytics-card admin-analytics-card--gmail" aria-labelledby="visitor-analytics-title">
            <div className="admin-card-heading">
              <span className="admin-index">00</span>
              <h2 id="visitor-analytics-title">{c.analyticsTitle}</h2>
            </div>
            <p className="admin-review-import-copy">{c.analyticsBody}</p>
            {analyticsQuery.isLoading ? (
              <div className="admin-empty">…</div>
            ) : analyticsQuery.error ? (
              <div className="admin-upload-status admin-upload-status--error" role="alert">
                {language === "ar" ? "تعذر تحميل التحليلات." : "Analytics could not be loaded."}
              </div>
            ) : analyticsQuery.data && analyticsQuery.data.totalViews > 0 ? (
              <>
                <div className="admin-metric-grid">
                  <div className="admin-metric">
                    <span>{c.totalViews}</span>
                    <strong>{analyticsQuery.data.totalViews.toLocaleString()}</strong>
                  </div>
                  <div className="admin-metric">
                    <span>{c.uniqueVisitors}</span>
                    <strong>{analyticsQuery.data.uniqueVisitors.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="admin-breakdown-grid">
                  <div>
                    <h3>{c.countries}</h3>
                    {analyticsQuery.data.byCountry.map((item) => (
                      <div className="admin-breakdown-row" key={item.countryCode}>
                        <span>{item.countryCode}</span>
                        <strong>{item.views.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3>{c.devices}</h3>
                    {analyticsQuery.data.byDevice.map((item) => (
                      <div className="admin-breakdown-row" key={item.deviceClass}>
                        <span>{item.deviceClass}</span>
                        <strong>{item.views.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="admin-empty">{c.noData}</div>
            )}
          </section>

          {/* Direct Owner Review Publisher */}
          <section className="admin-analytics-card admin-analytics-card--gmail">
            <div className="admin-card-heading">
              <span className="admin-index">01</span>
              <h2>
                {language === "ar"
                  ? "إضافة مراجعة معتمدة مباشرة إلى الموقع"
                  : "Publish a New Client Review Directly to Website"}
              </h2>
            </div>
            <form
              className="admin-form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newReviewName.trim() || !newReviewText.trim()) return;
                createOwnerReviewMutation.mutate({
                  name: newReviewName.trim(),
                  vehicle: newReviewVehicle.trim() || undefined,
                  rating: newReviewRating,
                  review: newReviewText.trim(),
                  reviewAr: newReviewTextAr.trim() || undefined,
                });
              }}
            >
              <div className="admin-field">
                <Label>Client Name</Label>
                <Input
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Abdullah Al-Rashid"
                  required
                />
              </div>
              <div className="admin-field">
                <Label>Vehicle Model</Label>
                <Input
                  value={newReviewVehicle}
                  onChange={(e) => setNewReviewVehicle(e.target.value)}
                  placeholder="e.g. Porsche 911 Turbo S"
                />
              </div>
              <div className="admin-field">
                <Label>Review Text (English / Primary)</Label>
                <Input
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Exceptional full body PPF wrap..."
                  required
                />
              </div>
              <div className="admin-field">
                <Label>Review Text (Arabic Optional)</Label>
                <Input
                  value={newReviewTextAr}
                  onChange={(e) => setNewReviewTextAr(e.target.value)}
                  placeholder="تركيب احترافي..."
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Button
                  type="submit"
                  className="admin-submit admin-submit--gmail"
                  disabled={createOwnerReviewMutation.isPending}
                >
                  <Plus size={16} />{" "}
                  {language === "ar" ? "نشر المراجعة الآن" : "Publish Approved Review Now"}
                </Button>
              </div>
            </form>
          </section>

          <section className="admin-layout">
            <section className="admin-upload-card admin-review-import-card">
              <div className="admin-card-heading">
                <span className="admin-index">02</span>
                <h2>
                  {c.reviewImportTitle} ({pendingReviewsQuery.data?.length ?? 0})
                </h2>
              </div>
              <p className="admin-review-import-copy">{c.reviewImportBody}</p>
              <Button
                type="button"
                className="admin-submit admin-submit--gmail"
                disabled={importArabicReviews.isPending}
                onClick={() => importArabicReviews.mutate()}
              >
                {importArabicReviews.isPending ? "…" : c.reviewImportButton}
              </Button>
              {pendingReviewsQuery.data && pendingReviewsQuery.data.length > 0 ? (
                <div className="admin-media-list admin-pending-reviews-list">
                  {pendingReviewsQuery.data.map((item) => (
                    <article className="admin-media-item admin-media-item--single" key={item.id}>
                      <div className="admin-media-meta">
                        <strong>
                          {item.name} · {"★".repeat(item.rating)}
                        </strong>
                        <span>
                          {item.publicReference ?? ""} {item.vehicle ? `· ${item.vehicle}` : ""}
                        </span>
                        <p className="admin-pending-review-text">{item.review}</p>
                        <div className="admin-item-actions">
                          <button
                            type="button"
                            className="admin-status-button"
                            disabled={moderateReview.isPending}
                            onClick={() => moderateReview.mutate({ id: item.id, status: "approved" })}
                          >
                            <Check size={13} /> {language === "ar" ? "موافقة ونشر" : "Approve & Publish"}
                          </button>
                          <button
                            type="button"
                            className="admin-status-button"
                            disabled={moderateReview.isPending}
                            onClick={() => moderateReview.mutate({ id: item.id, status: "rejected" })}
                          >
                            <X size={13} /> {language === "ar" ? "رفض" : "Reject"}
                          </button>
                          <button
                            type="button"
                            className="admin-status-button admin-status-button--danger"
                            disabled={deleteReviewMutation.isPending}
                            onClick={() => deleteReviewMutation.mutate({ id: item.id })}
                          >
                            <Trash2 size={13} /> {c.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty">{c.noPendingReviews}</div>
              )}
            </section>

            <section className="admin-library-card">
              <div className="admin-card-heading">
                <span className="admin-index">03</span>
                <h2>
                  {c.approvedReviewsTitle} ({approvedReviewsQuery.data?.total ?? 0})
                </h2>
              </div>
              <p className="admin-review-import-copy">{c.approvedReviewsBody}</p>
              {approvedReviewsQuery.data && approvedReviewsQuery.data.items.length > 0 ? (
                <div className="admin-media-list admin-pending-reviews-list">
                  {approvedReviewsQuery.data.items.map((item) => (
                    <article className="admin-media-item admin-media-item--single" key={item.id}>
                      <div className="admin-media-meta">
                        <strong>
                          {item.name} · {"★".repeat(item.rating)}
                        </strong>
                        <span>
                          {item.publicReference ?? ""} {item.vehicle ? `· ${item.vehicle}` : ""}
                        </span>
                        <p className="admin-pending-review-text">{item.review}</p>
                        <div className="admin-item-actions">
                          <span className="admin-status admin-status--published">
                            {language === "ar" ? "منشور" : "Published"}
                          </span>
                          <button
                            type="button"
                            className="admin-status-button"
                            disabled={moderateReview.isPending}
                            onClick={() => moderateReview.mutate({ id: item.id, status: "rejected" })}
                          >
                            <X size={13} /> {language === "ar" ? "إلغاء النشر" : "Unpublish"}
                          </button>
                          <button
                            type="button"
                            className="admin-status-button admin-status-button--danger"
                            disabled={deleteReviewMutation.isPending}
                            onClick={() => deleteReviewMutation.mutate({ id: item.id })}
                          >
                            <Trash2 size={13} /> {c.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty">{c.noApprovedReviews}</div>
              )}
            </section>
          </section>
        </div>
      )}
    </main>
  );
}
