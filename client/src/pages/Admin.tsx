import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FileImage, Film, LoaderCircle, LockKeyhole, LogOut, Pencil, RefreshCw, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { uploadMediaWithProgress } from "@/lib/uploadProgress";

type UploadKind = "image" | "video";
type UploadLanguage = "en" | "ar" | "shared";

type SelectedAsset = File | null;
type AdminMediaItem = { id: number; title: string; kind: "image" | "video"; language: "en" | "ar" | "shared"; status: "draft" | "published"; pairKey: string | null; url: string; mimeType: string; sizeBytes: number };

const copy = {
  en: {
    eyebrow: "PPFSTUDIO / PRIVATE CONTROL ROOM",
    title: "Media administration",
    intro: "Upload, review and publish the visual assets used across the atelier experience.",
    analyticsTitle: "Visitor analytics",
    analyticsBody: "Real page views collected by the protected website runtime. Empty values mean no events have been recorded yet.",
    totalViews: "Total views",
    uniqueVisitors: "Unique visitors",
    countries: "Top countries",
    devices: "Devices",
    noData: "No visitor data recorded yet.",
    gateTitle: "Admin access",
    gateBody: "Enter the first two private passwords to continue.",
    fields: ["Password", "PPF Password"],
    enter: "Enter panel",
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
    reviewImportTitle: "Review intake",
    reviewImportBody: "Import the 20 Arabic texts supplied by the owner as Anonymous and pending verification. No invented names, photos, or public approval are added.",
    reviewImportButton: "Add to pending review queue",
    reviewImportSuccess: "Arabic reviews added to the pending queue.",

  },
  ar: {
    eyebrow: "PPFSTUDIO / غرفة التحكم الخاصة",
    title: "إدارة الوسائط",
    intro: "ارفع وراجع وانشر الصور والفيديوهات المستخدمة في تجربة الاستوديو.",
    analyticsTitle: "تحليلات الزوار",
    analyticsBody: "مشاهدات حقيقية تجمعها المنصة المحمية. تعني القيم الفارغة أنه لم يتم تسجيل زيارات بعد.",
    totalViews: "إجمالي المشاهدات",
    uniqueVisitors: "الزوار الفريدون",
    countries: "أكثر الدول",
    devices: "الأجهزة",
    noData: "لم يتم تسجيل بيانات زوار بعد.",
    gateTitle: "دخول الإدارة",
    gateBody: "أدخل كلمتي المرور الخاصتين الأوليين للمتابعة.",
    fields: ["كلمة المرور", "كلمة مرور PPF"],
    enter: "دخول اللوحة",
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
    reviewImportTitle: "إدخال المراجعات",
    reviewImportBody: "أضف النصوص العربية العشرين التي قدمها المالك باسم مجهول وحالة قيد التحقق. لن تتم إضافة أسماء أو صور مختلقة أو نشر عام.",
    reviewImportButton: "إضافة إلى قائمة المراجعات المعلقة",
    reviewImportSuccess: "تمت إضافة المراجعات العربية إلى قائمة الانتظار للتحقق.",

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

  const replacePreview = useMemo(() => replaceFile ? URL.createObjectURL(replaceFile) : "", [replaceFile]);
  useEffect(() => () => { if (replacePreview) URL.revokeObjectURL(replacePreview); }, [replacePreview]);

  const englishPreview = useMemo(() => englishFile ? URL.createObjectURL(englishFile) : "", [englishFile]);
  const arabicPreview = useMemo(() => arabicFile ? URL.createObjectURL(arabicFile) : "", [arabicFile]);
  useEffect(() => () => { if (englishPreview) URL.revokeObjectURL(englishPreview); }, [englishPreview]);
  useEffect(() => () => { if (arabicPreview) URL.revokeObjectURL(arabicPreview); }, [arabicPreview]);

  const mediaQuery = trpc.admin.media.list.useQuery(undefined, { enabled: authenticated, retry: false });
  const analyticsQuery = trpc.admin.analytics.useQuery(undefined, { enabled: authenticated, retry: false, refetchInterval: 60_000 });
  const verifyGate = trpc.admin.verifyGate.useMutation({
    onSuccess: () => {
      setAuthenticated(true);
      toast.success(language === "ar" ? "تم الدخول بنجاح." : "Admin access granted.");
      void mediaQuery.refetch();
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
  const importArabicReviews = trpc.admin.importUserProvidedArabic.useMutation({
    onSuccess: result => toast.success(`${c.reviewImportSuccess} (${result.inserted} new, ${result.skipped} already present)`),
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

  const submitGate = (event: React.FormEvent) => {
    event.preventDefault();
    if (gateValues.some(value => !value.trim())) {
      toast.error(language === "ar" ? "أكمل كلمتي المرور الأوليين." : "Complete the first two passwords.");
      return;
    }
    verifyGate.mutate({
      password: gateValues[0],
      ppfPassword: gateValues[1],
    });
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
        <div className="admin-topbar"><button className="admin-back" onClick={() => setLocation("/")}><ArrowLeft size={16} /> {c.back}</button><button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "العربية" : "English"}</button></div>
        <section className="admin-gate-card">
          <div className="admin-gate-mark"><LockKeyhole size={22} /></div>
          <span className="admin-eyebrow">{c.eyebrow}</span>
          <h1>{c.gateTitle}</h1>
          <p>{c.gateBody}</p>
          <form onSubmit={submitGate} className="admin-gate-form">
            {c.fields.map((label, index) => <div className="admin-field" key={label}><Label htmlFor={`gate-${index}`}>{label}</Label><Input id={`gate-${index}`} type="password" value={gateValues[index]} onChange={event => setGateValues(values => values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} autoComplete="off" /></div>)}
            <Button type="submit" className="admin-submit" disabled={verifyGate.isPending}>{verifyGate.isPending ? "…" : c.enter}</Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="admin-topbar"><button className="admin-back" onClick={() => setLocation("/")}><ArrowLeft size={16} /> {c.back}</button><div className="admin-top-actions"><button className="admin-language" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "العربية" : "English"}</button><button className="admin-logout" onClick={() => logout.mutate()}><LogOut size={16} /> {c.logout}</button></div></div>
      <section className="admin-hero"><div><span className="admin-eyebrow">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></div><div className="admin-hero-stamp">PPF<br /><span>PRIVATE</span></div></section>
      <section className="admin-analytics-card" aria-labelledby="visitor-analytics-title">
        <div className="admin-card-heading"><span className="admin-index">00</span><h2 id="visitor-analytics-title">{c.analyticsTitle}</h2></div>
        <p className="admin-review-import-copy">{c.analyticsBody}</p>
        {analyticsQuery.isLoading ? <div className="admin-empty">…</div> : analyticsQuery.error ? <div className="admin-upload-status admin-upload-status--error" role="alert">{language === "ar" ? "تعذر تحميل التحليلات." : "Analytics could not be loaded."}</div> : analyticsQuery.data && analyticsQuery.data.totalViews > 0 ? <>
          <div className="admin-metric-grid"><div className="admin-metric"><span>{c.totalViews}</span><strong>{analyticsQuery.data.totalViews.toLocaleString()}</strong></div><div className="admin-metric"><span>{c.uniqueVisitors}</span><strong>{analyticsQuery.data.uniqueVisitors.toLocaleString()}</strong></div></div>
          <div className="admin-breakdown-grid"><div><h3>{c.countries}</h3>{analyticsQuery.data.byCountry.map(item => <div className="admin-breakdown-row" key={item.countryCode}><span>{item.countryCode}</span><strong>{item.views.toLocaleString()}</strong></div>)}</div><div><h3>{c.devices}</h3>{analyticsQuery.data.byDevice.map(item => <div className="admin-breakdown-row" key={item.deviceClass}><span>{item.deviceClass}</span><strong>{item.views.toLocaleString()}</strong></div>)}</div></div>
        </> : <div className="admin-empty">{c.noData}</div>}
      </section>
      <section className="admin-layout">
        <section className="admin-upload-card admin-review-import-card">
          <div className="admin-card-heading"><span className="admin-index">03</span><h2>{c.reviewImportTitle}</h2></div>
          <p className="admin-review-import-copy">{c.reviewImportBody}</p>
          <Button type="button" className="admin-submit" disabled={importArabicReviews.isPending} onClick={() => importArabicReviews.mutate()}>
            {importArabicReviews.isPending ? "…" : c.reviewImportButton}
          </Button>
        </section>
        <form className="admin-upload-card" onSubmit={submitUpload}>
          <div className="admin-card-heading"><span className="admin-index">01</span><h2>{c.uploadTitle}</h2></div>
          <div className="admin-form-grid">
            <div className="admin-field"><Label>{c.kind}</Label><Select value={kind} onValueChange={(value: UploadKind) => { setKind(value); setEnglishFile(null); setArabicFile(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image"><FileImage size={15} /> {c.image}</SelectItem><SelectItem value="video"><Film size={15} /> {c.video}</SelectItem></SelectContent></Select></div>
            </div>
          <div className="admin-field"><Label htmlFor="asset-title">{c.titleLabel}</Label><Input id="asset-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Full body PPF / حماية كاملة" maxLength={180} /></div>
          <div className="admin-pair-grid">
            {([ ["en", c.englishSlot, englishFile, englishPreview, setEnglishFile], ["ar", c.arabicSlot, arabicFile, arabicPreview, setArabicFile] ] as const).map(([slot, label, selectedFile, preview, setSelectedFile]) => (
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
    </main>
  );
}
