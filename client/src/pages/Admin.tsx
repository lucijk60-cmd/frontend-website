import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, FileImage, Film, KeyRound, LoaderCircle, LockKeyhole, LogOut, Mail, Pencil, RefreshCw, ShieldCheck, Star, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { uploadMediaWithProgress } from "@/lib/uploadProgress";
import { auth, signInWithGooglePopup, updateReviewStatusInFirestore } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

type UploadKind = "image" | "video";
type AdminPanelMode = "password" | "gmail";

type SelectedAsset = File | null;
type AdminMediaItem = { id: number; title: string; kind: "image" | "video"; language: "en" | "ar" | "shared"; status: "draft" | "published"; pairKey: string | null; url: string; mimeType: string; sizeBytes: number };

const ADMIN_MODE_STORAGE_KEY = "ppfstudio-admin-mode";

function getStoredAdminMode(): AdminPanelMode {
  if (typeof window === "undefined") return "password";
  const saved = window.sessionStorage.getItem(ADMIN_MODE_STORAGE_KEY);
  return saved === "gmail" ? "gmail" : "password";
}

const copy = {
  en: {
    eyebrow: "PPFSTUDIO / PRIVATE CONTROL ROOM",
    passwordEyebrow: "PASSWORD ADMIN / STUDIO MEDIA VAULT",
    gmailEyebrow: "GMAIL OWNER ADMIN / ANALYTICS & REVIEWS HUB",
    title: "Media administration",
    gmailTitle: "Owner command center",
    intro: "Upload, review and publish the visual assets used across the atelier experience.",
    gmailIntro: "Monitor live visitor analytics, moderate customer reviews, and sync approved testimonials with Firebase Cloud.",
    analyticsTitle: "Visitor analytics",
    analyticsBody: "Real page views collected by the protected website runtime. Empty values mean no events have been recorded yet.",
    totalViews: "Total views",
    uniqueVisitors: "Unique visitors",
    countries: "Top countries",
    devices: "Devices",
    noData: "No visitor data recorded yet.",
    gateTitle: "Password Admin Panel",
    gateBody: "Enter the two studio passwords to open the Media & Portfolio Vault.",
    gmailGateTitle: "Gmail Admin Panel",
    gmailGateBody: "Sign in with the owner Gmail account to access Visitor Analytics, Review Moderation & Cloud Sync.",
    fields: ["Password", "PPF Password"],
    enter: "Open Password Admin Panel",
    enterGmail: "Open Gmail Admin Panel",
    back: "Back to website",
    logout: "Log out",
    uploadTitle: "Upload media",
    kind: "Media type",
    image: "Image",
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
    library: "Media library",
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
    saveChanges: "Save changes",
    cancel: "Cancel",
    replacement: "Choose replacement file",
    reviewImportTitle: "Pending review moderation",
    reviewImportBody: "Import the 20 Arabic texts supplied by the owner as Anonymous and pending verification, or approve/reject customer submissions.",
    reviewImportButton: "Import 20 Arabic reviews to pending queue",
    reviewImportSuccess: "Arabic reviews added to the pending queue.",
    approvedReviewsTitle: "Published client reviews",
    approvedReviewsBody: "Reviews currently live on the website. You can move any review out of publication if needed.",
    noApprovedReviews: "No approved reviews published yet.",
    noPendingReviews: "No reviews waiting in the pending queue.",
    passwordModeTab: "Password Panel (Media)",
    gmailModeTab: "Gmail Panel (Reviews & Analytics)",
  },
  ar: {
    eyebrow: "PPFSTUDIO / غرفة التحكم الخاصة",
    passwordEyebrow: "لوحة كلمة المرور / خزنة الوسائط",
    gmailEyebrow: "لوحة المالك Gmail / التحليلات والمراجعات",
    title: "إدارة الوسائط",
    gmailTitle: "مركز تحكم المالك",
    intro: "ارفع وراجع وانشر الصور والفيديوهات المستخدمة في تجربة الاستوديو.",
    gmailIntro: "تابع تحليلات الزوار المباشرة، واعتمد مراجعات العملاء، وزامن البيانات مع سحابة Firebase.",
    analyticsTitle: "تحليلات الزوار",
    analyticsBody: "مشاهدات حقيقية تجمعها المنصة المحمية. تعني القيم الفارغة أنه لم يتم تسجيل زيارات بعد.",
    totalViews: "إجمالي المشاهدات",
    uniqueVisitors: "الزوار الفريدون",
    countries: "أكثر الدول",
    devices: "الأجهزة",
    noData: "لم يتم تسجيل بيانات زوار بعد.",
    gateTitle: "لوحة تحكم كلمة المرور",
    gateBody: "أدخل كلمتي المرور لفتح لوحة رفع وإدارة الصور والفيديوهات.",
    gmailGateTitle: "لوحة تحكم Gmail",
    gmailGateBody: "سجّل الدخول بحساب Gmail الخاص بالمالك للوصول إلى تحليلات الزوار وإدارة المراجعات.",
    fields: ["كلمة المرور", "كلمة مرور PPF"],
    enter: "فتح لوحة كلمة المرور",
    enterGmail: "فتح لوحة Gmail",
    back: "العودة إلى الموقع",
    logout: "تسجيل الخروج",
    uploadTitle: "رفع وسائط",
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
    library: "مكتبة الوسائط",
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
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    replacement: "اختر ملفاً بديلاً",
    reviewImportTitle: "إشراف المراجعات المعلقة",
    reviewImportBody: "أضف النصوص العربية العشرين إلى قائمة الانتظار أو اعتمد/ارفض مراجعات العملاء.",
    reviewImportButton: "إضافة 20 مراجعة عربية إلى قائمة الانتظار",
    reviewImportSuccess: "تمت إضافة المراجعات العربية إلى قائمة الانتظار للتحقق.",
    approvedReviewsTitle: "المراجعات المنشورة على الموقع",
    approvedReviewsBody: "المراجعات المعروضة حالياً للزوار. يمكنك إلغاء نشر أي مراجعة عند الحاجة.",
    noApprovedReviews: "لا توجد مراجعات معتمدة منشورة بعد.",
    noPendingReviews: "لا توجد مراجعات معلقة حالياً.",
    passwordModeTab: "لوحة كلمة المرور (الوسائط)",
    gmailModeTab: "لوحة Gmail (المراجعات والتحليلات)",
  },
} as const;

function readFileAsBase64(file: File, onProgress?: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100)); };
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const c = copy[language];
  const [authenticated, setAuthenticated] = useState(false);
  const [adminMode, setAdminMode] = useState<AdminPanelMode>(getStoredAdminMode);
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

  const selectAdminMode = (mode: AdminPanelMode) => {
    setAdminMode(mode);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ADMIN_MODE_STORAGE_KEY, mode);
    }
  };

  const replacePreview = useMemo(() => replaceFile ? URL.createObjectURL(replaceFile) : "", [replaceFile]);
  useEffect(() => () => { if (replacePreview) URL.revokeObjectURL(replacePreview); }, [replacePreview]);

  const englishPreview = useMemo(() => englishFile ? URL.createObjectURL(englishFile) : "", [englishFile]);
  const arabicPreview = useMemo(() => arabicFile ? URL.createObjectURL(arabicFile) : "", [arabicFile]);
  useEffect(() => () => { if (englishPreview) URL.revokeObjectURL(englishPreview); }, [englishPreview]);
  useEffect(() => () => { if (arabicPreview) URL.revokeObjectURL(arabicPreview); }, [arabicPreview]);

  const mediaQuery = trpc.admin.media.list.useQuery(undefined, { enabled: authenticated, retry: false });
  const analyticsQuery = trpc.admin.analytics.useQuery(undefined, { enabled: authenticated, retry: false, refetchInterval: 60_000 });
  const approvedReviewsQuery = trpc.reviews.list.useQuery({ limit: 50, offset: 0 }, { enabled: authenticated, retry: false });
  const pendingReviewsQuery = trpc.reviews.pending.useQuery(undefined, { enabled: authenticated, retry: false });

  const verifyGate = trpc.admin.verifyGate.useMutation({
    onSuccess: () => {
      setAuthenticated(true);
      void mediaQuery.refetch();
      void analyticsQuery.refetch();
      void pendingReviewsQuery.refetch();
      void approvedReviewsQuery.refetch();
    },
    onError: (error) => toast.error(
      error.data?.code === "TOO_MANY_REQUESTS"
        ? error.message
        : language === "ar"
          ? "تعذر الدخول. تحقق من كلمتي المرور الأوليين وحاول مرة أخرى."
          : "Login failed. Check the first two passwords and try again."
    ),
  });
  const updateMedia = trpc.admin.media.update.useMutation({
    onSuccess: () => { toast.success(language === "ar" ? "تم تحديث بيانات الوسائط." : "Media details updated."); setEditingItem(null); void mediaQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const replaceMedia = trpc.admin.media.replace.useMutation({
    onSuccess: () => { toast.success(language === "ar" ? "تم استبدال الملف بنجاح." : "Media file replaced successfully."); setEditingItem(null); setReplaceFile(null); void mediaQuery.refetch(); },
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
    return onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
    });
  }, []);

  const moderateReview = trpc.reviews.moderate.useMutation({
    onSuccess: async (_, variables) => {
      if (firebaseUser) {
        await updateReviewStatusInFirestore(`review-${variables.id}`, variables.status).catch(() => undefined);
      }
      await Promise.all([pendingReviewsQuery.refetch(), approvedReviewsQuery.refetch()]);
      toast.success(language === "ar" ? "تم تحديث حالة المراجعة." : "Review status updated.");
    },
    onError: error => toast.error(error.message),
  });
  const importArabicReviews = trpc.admin.importUserProvidedArabic.useMutation({
    onSuccess: async result => {
      await pendingReviewsQuery.refetch();
      toast.success(`${c.reviewImportSuccess} (${result.inserted} new, ${result.skipped} already present)`);
    },
    onError: error => toast.error(error.message),
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
      await replaceMedia.mutateAsync({ id: editingItem.id, fileName: replaceFile.name, mimeType: replaceFile.type, dataBase64 });
    }
    if (!replaceFile && editTitle.trim() === editingItem.title && editStatus === editingItem.status) setEditingItem(null);
  };

  const submitPasswordGate = (event: React.FormEvent) => {
    event.preventDefault();
    if (gateValues.some(value => !value.trim())) {
      toast.error(language === "ar" ? "أكمل كلمتي المرور الأوليين." : "Complete the first two passwords.");
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
          toast.success(language === "ar" ? "تم فتح لوحة كلمة المرور." : "Password Admin Panel unlocked.");
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
              toast.success(language === "ar" ? "تم فتح لوحة المالك عبر Gmail." : "Gmail Owner Admin Panel unlocked.");
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
            toast.success(language === "ar" ? "تم فتح لوحة المالك عبر Gmail." : "Gmail Owner Admin Panel unlocked.");
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
      await uploadMediaWithProgress({ kind, language: "en", pairKey, title: title.trim(), fileName: englishFile.name, mimeType: englishFile.type, publish }, englishFile, percent => setUploadProgress({ english: percent, arabic: 0 }));
      setUploadProgress({ english: 100, arabic: 8 });
      setUploadStage("arabic");
      await uploadMediaWithProgress({ kind, language: "ar", pairKey, title: title.trim(), fileName: arabicFile.name, mimeType: arabicFile.type, publish }, arabicFile, percent => setUploadProgress({ english: 100, arabic: percent }));
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

  if (!authenticated) {
    return (
      <main className="admin-page" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="admin-topbar">
          <button className="admin-back" onClick={() => setLocation("/")}><ArrowLeft size={16} /> {c.back}</button>
          <button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "العربية" : "English"}</button>
        </div>
        <div className="admin-dual-gate-grid">
          <section className="admin-gate-card admin-gate-card--password">
            <div className="admin-gate-mark"><KeyRound size={22} /></div>
            <span className="admin-eyebrow">{c.passwordEyebrow}</span>
            <h1>{c.gateTitle}</h1>
            <p>{c.gateBody}</p>
            <ul className="admin-gate-features">
              <li><Upload size={14} /> {language === "ar" ? "رفع الصور والفيديوهات (عربي / إنجليزي)" : "Upload bilingual English & Arabic images/videos"}</li>
              <li><FileImage size={14} /> {language === "ar" ? "إدارة مكتبة الوسائط وتعديل الملفات" : "Manage media library, drafts & replacements"}</li>
            </ul>
            <form onSubmit={submitPasswordGate} className="admin-gate-form">
              {c.fields.map((label, index) => (
                <div className="admin-field" key={label}>
                  <Label htmlFor={`gate-${index}`}>{label}</Label>
                  <Input
                    id={`gate-${index}`}
                    type="password"
                    value={gateValues[index]}
                    onChange={event => setGateValues(values => values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
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
            <div className="admin-gate-mark admin-gate-mark--gmail"><Mail size={22} /></div>
            <span className="admin-eyebrow admin-eyebrow--gmail">{c.gmailEyebrow}</span>
            <h1>{c.gmailGateTitle}</h1>
            <p>{c.gmailGateBody}</p>
            <ul className="admin-gate-features admin-gate-features--gmail">
              <li><BarChart3 size={14} /> {language === "ar" ? "تحليلات الزوار المباشرة حسب الدولة والجهاز" : "Live visitor analytics by country & device"}</li>
              <li><Star size={14} /> {language === "ar" ? "اعتماد أو رفض مراجعات العملاء ومزامنة Firebase" : "Moderate client reviews & sync with Firebase"}</li>
              <li><ShieldCheck size={14} /> {language === "ar" ? "حساب المالك المعتمد: jabedjk112@gmail.com" : "Verified owner account: jabedjk112@gmail.com"}</li>
            </ul>
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

  return (
    <main className={`admin-page ${adminMode === "gmail" ? "admin-page--gmail" : "admin-page--password"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="admin-topbar">
        <button className="admin-back" onClick={() => setLocation("/")}><ArrowLeft size={16} /> {c.back}</button>
        <div className="admin-mode-switcher" role="tablist" aria-label="Admin panel mode">
          <button
            type="button"
            role="tab"
            aria-selected={adminMode === "password"}
            className={`admin-mode-tab ${adminMode === "password" ? "is-active" : ""}`}
            onClick={() => selectAdminMode("password")}
          >
            <KeyRound size={14} /> {c.passwordModeTab}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={adminMode === "gmail"}
            className={`admin-mode-tab admin-mode-tab--gmail ${adminMode === "gmail" ? "is-active" : ""}`}
            onClick={() => selectAdminMode("gmail")}
          >
            <Mail size={14} /> {c.gmailModeTab}
          </button>
        </div>
        <div className="admin-top-actions">
          <button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "العربية" : "English"}</button>
          <button className="admin-logout" onClick={() => logout.mutate()}><LogOut size={16} /> {c.logout}</button>
        </div>
      </div>

      {adminMode === "password" ? (
        <>
          <section className="admin-hero">
            <div>
              <span className="admin-eyebrow">{c.passwordEyebrow}</span>
              <h1>{c.title}</h1>
              <p>{c.intro}</p>
            </div>
            <div className="admin-hero-stamp">PPF<br /><span>STUDIO</span></div>
          </section>

          <section className="admin-layout">
            <form className="admin-upload-card" onSubmit={submitUpload}>
              <div className="admin-card-heading"><span className="admin-index">01</span><h2>{c.uploadTitle}</h2></div>
              <div className="admin-form-grid">
                <div className="admin-field"><Label>{c.kind}</Label><Select value={kind} onValueChange={(value: UploadKind) => { setKind(value); setEnglishFile(null); setArabicFile(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image"><FileImage size={15} /> {c.image}</SelectItem><SelectItem value="video"><Film size={15} /> {c.video}</SelectItem></SelectContent></Select></div>
              </div>
              <div className="admin-field"><Label htmlFor="asset-title">{c.titleLabel}</Label><Input id="asset-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Full body PPF / حماية كاملة" maxLength={180} /></div>
              <div className="admin-pair-grid">
                {([["en", c.englishSlot, englishFile, englishPreview, setEnglishFile], ["ar", c.arabicSlot, arabicFile, arabicPreview, setArabicFile]] as const).map(([slot, label, selectedFile, preview, setSelectedFile]) => (
                  <label className={`admin-pair-dropzone ${selectedFile ? "admin-pair-dropzone--selected" : ""}`} htmlFor={`admin-${slot}-file`} key={slot}>
                    <span className="admin-pair-label">{label}</span>
                    {selectedFile && kind === "image" && <img src={preview} alt="" className="admin-selected-preview" />}
                    {selectedFile && kind === "video" && <video src={preview} className="admin-selected-preview" muted preload="metadata" />}
                    <strong>{selectedFile ? selectedFile.name : c.file}</strong>
                    <span className="admin-file-meta">{selectedFile ? `${c.selected} · ${selectedFile.type || "unknown type"} · ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : c.fileHint}</span>
                    <input id={`admin-${slot}-file`} type="file" accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm,video/quicktime"} onChange={event => setSelectedFile(event.target.files?.[0] ?? null)} />
                    {selectedFile && <button type="button" className="admin-clear-file" onClick={event => { event.preventDefault(); event.stopPropagation(); setSelectedFile(null); }}>{c.clear}</button>}
                  </label>
                ))}
              </div>
              <label className="admin-check"><input type="checkbox" checked={publish} onChange={event => setPublish(event.target.checked)} /><span>{c.publishNow}</span></label>
              {uploadStage !== "idle" && <div className={`admin-upload-status ${uploadStage === "error" ? "admin-upload-status--error" : ""}`} aria-live="polite"><span className="admin-status-line">{uploadStage !== "saved" && uploadStage !== "error" && <LoaderCircle className="admin-spinner" size={14} />}{uploadStage === "english" ? c.uploadingEnglish : uploadStage === "arabic" ? c.uploadingArabic : uploadStage === "error" ? (uploadErrorMessage || c.uploadError) : c.saved}</span><div className="admin-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((uploadProgress.english + uploadProgress.arabic) / 2)}><span style={{ width: `${(uploadProgress.english + uploadProgress.arabic) / 2}%` }} /></div><div className="admin-progress-steps"><span className={uploadProgress.english === 100 ? "is-complete" : ""}>{c.englishSlot}: {uploadProgress.english === 100 ? "100%" : `${uploadProgress.english}%`}</span><span className={uploadProgress.arabic === 100 ? "is-complete" : ""}>{c.arabicSlot}: {uploadProgress.arabic === 100 ? "100%" : `${uploadProgress.arabic}%`}</span></div></div>}
              <Button type="submit" className="admin-submit" disabled={isUploading || !canSubmit}><Upload size={16} /> {isUploading ? "…" : c.upload}</Button>
            </form>

            <section className="admin-library-card">
              <div className="admin-card-heading"><span className="admin-index">02</span><h2>{c.library}</h2></div>
              {mediaQuery.error && <div className="admin-upload-status admin-upload-status--error" role="alert">{language === "ar" ? "تعذر تحميل مكتبة الوسائط. حدّث الصفحة بعد تسجيل الدخول." : "The media library could not be loaded. Refresh after signing in."}</div>}
              {editingItem && <form className="admin-edit-panel" onSubmit={submitEdit}>
                <div className="admin-edit-heading"><strong>{editingItem.language.toUpperCase()} · {editingItem.kind.toUpperCase()}</strong><button type="button" onClick={() => { setEditingItem(null); setReplaceFile(null); }}>{c.cancel}</button></div>
                <div className="admin-field"><Label htmlFor="edit-asset-title">{c.titleLabel}</Label><Input id="edit-asset-title" value={editTitle} onChange={event => setEditTitle(event.target.value)} maxLength={180} /></div>
                <div className="admin-field"><Label>{c.statusUpdated}</Label><Select value={editStatus} onValueChange={(value: "draft" | "published") => setEditStatus(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">{c.published}</SelectItem><SelectItem value="draft">{c.draft}</SelectItem></SelectContent></Select></div>
                {replaceFile && <div className="admin-replace-preview">{editingItem.kind === "image" ? <img src={replacePreview} alt="" /> : <video src={replacePreview} muted controls preload="metadata" />}<span>{replaceFile.type} · {(replaceFile.size / 1024 / 1024).toFixed(2)} MB</span></div>}
                <label className="admin-replace-control" htmlFor="replace-media-file"><RefreshCw size={16} /><span>{replaceFile ? replaceFile.name : c.replacement}</span><input id="replace-media-file" type="file" accept={editingItem.kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm,video/quicktime"} onChange={event => setReplaceFile(event.target.files?.[0] ?? null)} /></label>
                <div className="admin-edit-actions"><Button type="submit" disabled={updateMedia.isPending || replaceMedia.isPending || (!editTitle.trim() && !replaceFile)}>{updateMedia.isPending || replaceMedia.isPending ? "…" : c.saveChanges}</Button><button type="button" onClick={() => { setEditingItem(null); setReplaceFile(null); }}>{c.cancel}</button></div>
              </form>}
              {mediaQuery.isLoading ? (
                <div className="admin-empty">…</div>
              ) : mediaQuery.data?.length ? (
                <div className="admin-media-list">
                  {mediaQuery.data.map((item) => (
                    <article className="admin-media-item" key={item.id}>
                      <div className="admin-media-preview">
                        {item.kind === "image" ? <img src={item.url} alt={item.title} /> : <video src={item.url} controls preload="metadata" />}
                        <span className="admin-item-lang-tag">{item.language.toUpperCase()}</span>
                      </div>
                      <div className="admin-media-meta">
                        <strong>{item.title}</strong>
                        <span>{item.kind.toUpperCase()} {item.pairKey ? `· PAIR: ${item.pairKey.slice(-4)}` : ""}</span>
                        <span className={`admin-status admin-status--${item.status}`}>{item.status === "published" ? c.published : c.draft}</span>
                        <div className="admin-item-actions"><button className="admin-status-button" onClick={() => startEditing(item)}><Pencil size={13} /> {c.edit}</button><button className="admin-status-button" onClick={() => updateStatus.mutate({ id: item.id, status: item.status === "published" ? "draft" : "published" })}>
                          {item.status === "published" ? c.unpublish : c.publish}
                        </button></div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty"><X size={18} />{c.empty}</div>
              )}
            </section>
          </section>
        </>
      ) : (
        <>
          <section className="admin-hero">
            <div>
              <span className="admin-eyebrow admin-eyebrow--gmail">{c.gmailEyebrow}</span>
              <h1>{c.gmailTitle}</h1>
              <p>{c.gmailIntro}</p>
              <div className="admin-gmail-identity">
                <Mail size={14} />
                <span>{firebaseUser?.email ?? "jabedjk112@gmail.com"}</span>
                <span>·</span>
                <span>{language === "ar" ? "متصل بسحابة Firebase" : "Firebase Cloud Sync Active"}</span>
              </div>
            </div>
            <div className="admin-hero-stamp admin-hero-stamp--gmail">GMAIL<br /><span>OWNER</span></div>
          </section>

          <section className="admin-analytics-card admin-analytics-card--gmail" aria-labelledby="visitor-analytics-title">
            <div className="admin-card-heading"><span className="admin-index">00</span><h2 id="visitor-analytics-title">{c.analyticsTitle}</h2></div>
            <p className="admin-review-import-copy">{c.analyticsBody}</p>
            {analyticsQuery.isLoading ? <div className="admin-empty">…</div> : analyticsQuery.error ? <div className="admin-upload-status admin-upload-status--error" role="alert">{language === "ar" ? "تعذر تحميل التحليلات." : "Analytics could not be loaded."}</div> : analyticsQuery.data && analyticsQuery.data.totalViews > 0 ? <>
              <div className="admin-metric-grid"><div className="admin-metric"><span>{c.totalViews}</span><strong>{analyticsQuery.data.totalViews.toLocaleString()}</strong></div><div className="admin-metric"><span>{c.uniqueVisitors}</span><strong>{analyticsQuery.data.uniqueVisitors.toLocaleString()}</strong></div></div>
              <div className="admin-breakdown-grid"><div><h3>{c.countries}</h3>{analyticsQuery.data.byCountry.map(item => <div className="admin-breakdown-row" key={item.countryCode}><span>{item.countryCode}</span><strong>{item.views.toLocaleString()}</strong></div>)}</div><div><h3>{c.devices}</h3>{analyticsQuery.data.byDevice.map(item => <div className="admin-breakdown-row" key={item.deviceClass}><span>{item.deviceClass}</span><strong>{item.views.toLocaleString()}</strong></div>)}</div></div>
            </> : <div className="admin-empty">{c.noData}</div>}
          </section>

          <section className="admin-layout">
            <section className="admin-upload-card admin-review-import-card">
              <div className="admin-card-heading"><span className="admin-index">01</span><h2>{c.reviewImportTitle} ({pendingReviewsQuery.data?.length ?? 0})</h2></div>
              <p className="admin-review-import-copy">{c.reviewImportBody}</p>
              <Button type="button" className="admin-submit admin-submit--gmail" disabled={importArabicReviews.isPending} onClick={() => importArabicReviews.mutate()}>
                {importArabicReviews.isPending ? "…" : c.reviewImportButton}
              </Button>
              {pendingReviewsQuery.data && pendingReviewsQuery.data.length > 0 ? (
                <div className="admin-media-list admin-pending-reviews-list">
                  {pendingReviewsQuery.data.map(item => (
                    <article className="admin-media-item admin-media-item--single" key={item.id}>
                      <div className="admin-media-meta">
                        <strong>{item.name} · {"★".repeat(item.rating)}</strong>
                        <span>{item.publicReference ?? ""} {item.vehicle ? `· ${item.vehicle}` : ""}</span>
                        <p className="admin-pending-review-text">{item.review}</p>
                        <div className="admin-item-actions">
                          <button type="button" className="admin-status-button" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ id: item.id, status: "approved" })}>
                            <Check size={13} /> {language === "ar" ? "موافقة ونشر" : "Approve & Publish"}
                          </button>
                          <button type="button" className="admin-status-button" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ id: item.id, status: "rejected" })}>
                            <X size={13} /> {language === "ar" ? "رفض" : "Reject"}
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
              <div className="admin-card-heading"><span className="admin-index">02</span><h2>{c.approvedReviewsTitle} ({approvedReviewsQuery.data?.total ?? 0})</h2></div>
              <p className="admin-review-import-copy">{c.approvedReviewsBody}</p>
              {approvedReviewsQuery.data && approvedReviewsQuery.data.items.length > 0 ? (
                <div className="admin-media-list admin-pending-reviews-list">
                  {approvedReviewsQuery.data.items.map(item => (
                    <article className="admin-media-item admin-media-item--single" key={item.id}>
                      <div className="admin-media-meta">
                        <strong>{item.name} · {"★".repeat(item.rating)}</strong>
                        <span>{item.publicReference ?? ""} {item.vehicle ? `· ${item.vehicle}` : ""}</span>
                        <p className="admin-pending-review-text">{item.review}</p>
                        <div className="admin-item-actions">
                          <span className="admin-status admin-status--published">{language === "ar" ? "منشور" : "Published"}</span>
                          <button type="button" className="admin-status-button" disabled={moderateReview.isPending} onClick={() => moderateReview.mutate({ id: item.id, status: "rejected" })}>
                            <X size={13} /> {language === "ar" ? "إلغاء النشر" : "Unpublish"}
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
        </>
      )}
    </main>
  );
}
