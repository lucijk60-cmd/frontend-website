import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FileImage, Film, LockKeyhole, LogOut, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type UploadKind = "image" | "video";
type UploadLanguage = "en" | "ar" | "shared";

type SelectedAsset = File | null;

const copy = {
  en: {
    eyebrow: "PPFSTUDIO / PRIVATE CONTROL ROOM",
    title: "Media administration",
    intro: "Upload, review and publish the visual assets used across the atelier experience.",
    gateTitle: "Admin access",
    gateBody: "Enter all four private passwords to continue.",
    fields: ["Password", "PPF Password", "Admin Password", "Private Password"],
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
    pairRequired: "Select both English and Arabic files before uploading.",
    invalid: "Please complete the title and select both language files.",
    success: "Media uploaded successfully.",
    statusUpdated: "Media status updated.",
  },
  ar: {
    eyebrow: "PPFSTUDIO / غرفة التحكم الخاصة",
    title: "إدارة الوسائط",
    intro: "ارفع وراجع وانشر الصور والفيديوهات المستخدمة في تجربة الاستوديو.",
    gateTitle: "دخول الإدارة",
    gateBody: "أدخل كلمات المرور الخاصة الأربع للمتابعة.",
    fields: ["كلمة المرور", "كلمة مرور PPF", "كلمة مرور الإدارة", "كلمة المرور الخاصة"],
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
    pairRequired: "اختر الملفين الإنجليزي والعربي قبل الرفع.",
    invalid: "يرجى إدخال العنوان واختيار ملفي اللغتين.",
    success: "تم رفع الوسائط بنجاح.",
    statusUpdated: "تم تحديث حالة الوسائط.",
  },
} as const;

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
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
  const [gateValues, setGateValues] = useState(["", "", "", ""]);
  const [kind, setKind] = useState<UploadKind>("image");
  const [title, setTitle] = useState("");
  const [englishFile, setEnglishFile] = useState<SelectedAsset>(null);
  const [arabicFile, setArabicFile] = useState<SelectedAsset>(null);
  const [publish, setPublish] = useState(true);
  const [uploadStage, setUploadStage] = useState<"idle" | "english" | "arabic" | "saved">("idle");

  const englishPreview = useMemo(() => englishFile ? URL.createObjectURL(englishFile) : "", [englishFile]);
  const arabicPreview = useMemo(() => arabicFile ? URL.createObjectURL(arabicFile) : "", [arabicFile]);
  useEffect(() => () => { if (englishPreview) URL.revokeObjectURL(englishPreview); }, [englishPreview]);
  useEffect(() => () => { if (arabicPreview) URL.revokeObjectURL(arabicPreview); }, [arabicPreview]);

  const mediaQuery = trpc.admin.media.list.useQuery(undefined, { enabled: authenticated, retry: false });
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
          ? "تعذر الدخول. تحقق من كلمات المرور الأربع وحاول مرة أخرى."
          : "Login failed. Check all four passwords and try again."
    ),
  });
  const uploadMedia = trpc.admin.media.upload.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const updateStatus = trpc.admin.media.setStatus.useMutation({
    onSuccess: () => {
      toast.success(c.statusUpdated);
      void mediaQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      setAuthenticated(false);
      setGateValues(["", "", "", ""]);
    },
  });

  useEffect(() => {
    if (mediaQuery.data) setAuthenticated(true);
  }, [mediaQuery.data]);

  const canSubmit = useMemo(() => Boolean(title.trim() && englishFile && arabicFile), [title, englishFile, arabicFile]);

  const submitGate = (event: React.FormEvent) => {
    event.preventDefault();
    if (gateValues.some(value => !value.trim())) {
      toast.error(language === "ar" ? "أكمل كلمات المرور الأربع." : "Complete all four passwords.");
      return;
    }
    verifyGate.mutate({
      password: gateValues[0],
      ppfPassword: gateValues[1],
      adminPassword: gateValues[2],
      privatePassword: gateValues[3],
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
      setUploadStage("english");
      const englishDataBase64 = await readFileAsBase64(englishFile);
      await uploadMedia.mutateAsync({ kind, language: "en", pairKey, title: title.trim(), fileName: englishFile.name, mimeType: englishFile.type, dataBase64: englishDataBase64, publish });
      setUploadStage("arabic");
      const arabicDataBase64 = await readFileAsBase64(arabicFile);
      await uploadMedia.mutateAsync({ kind, language: "ar", pairKey, title: title.trim(), fileName: arabicFile.name, mimeType: arabicFile.type, dataBase64: arabicDataBase64, publish });
      setTitle("");
      setEnglishFile(null);
      setArabicFile(null);
      setPublish(true);
      setUploadStage("saved");
      toast.success(c.saved);
      void mediaQuery.refetch();
    } catch {
      setUploadStage("idle");
      toast.error(language === "ar" ? "تعذر رفع الملفين. تحقق من النوع والحجم وحاول مرة أخرى." : "Upload failed. Check both file types and sizes, then try again.");
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
      <section className="admin-layout">
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
          {uploadStage !== "idle" && <div className="admin-upload-status" aria-live="polite">{uploadStage === "english" ? c.uploadingEnglish : uploadStage === "arabic" ? c.uploadingArabic : c.saved}</div>}
          <Button type="submit" className="admin-submit" disabled={uploadMedia.isPending || !canSubmit}><Upload size={16} /> {uploadMedia.isPending ? "…" : c.upload}</Button>
        </form>
        <section className="admin-library-card"><div className="admin-card-heading"><span className="admin-index">02</span><h2>{c.library}</h2></div>{mediaQuery.isLoading ? <div className="admin-empty">…</div> : mediaQuery.data?.length ? <div className="admin-media-list">{mediaQuery.data.map(item => <article className="admin-media-item" key={item.id}><div className="admin-media-preview">{item.kind === "image" ? <img src={item.url} alt={item.title} /> : <video src={item.url} controls preload="metadata" />}</div><div className="admin-media-meta"><strong>{item.title}</strong><span>{item.language.toUpperCase()} · {item.kind.toUpperCase()}</span><span className={`admin-status admin-status--${item.status}`}>{item.status === "published" ? c.published : c.draft}</span><button className="admin-status-button" onClick={() => updateStatus.mutate({ id: item.id, status: item.status === "published" ? "draft" : "published" })}>{item.status === "published" ? c.unpublish : c.publish}</button></div></article>)}</div> : <div className="admin-empty"><X size={18} />{c.empty}</div>}</section>
      </section>
    </main>
  );
}
