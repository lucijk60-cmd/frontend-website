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
    invalid: "Please complete all fields and choose a file.",
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
    invalid: "يرجى إكمال الحقول واختيار ملف.",
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
  const [uploadLanguage, setUploadLanguage] = useState<UploadLanguage>("en");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publish, setPublish] = useState(false);

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
    onSuccess: () => {
      setTitle("");
      setFile(null);
      setPublish(false);
      toast.success(c.success);
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
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      setAuthenticated(false);
      setGateValues(["", "", "", ""]);
    },
  });

  useEffect(() => {
    if (mediaQuery.data) setAuthenticated(true);
  }, [mediaQuery.data]);

  const canSubmit = useMemo(() => Boolean(title.trim() && file), [title, file]);

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
    if (!file || !canSubmit) {
      toast.error(c.invalid);
      return;
    }
    const dataBase64 = await readFileAsBase64(file);
    uploadMedia.mutate({
      kind,
      language: uploadLanguage,
      title: title.trim(),
      fileName: file.name,
      mimeType: file.type,
      dataBase64,
      publish,
    });
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
            <div className="admin-field"><Label>{c.kind}</Label><Select value={kind} onValueChange={(value: UploadKind) => setKind(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image"><FileImage size={15} /> {c.image}</SelectItem><SelectItem value="video"><Film size={15} /> {c.video}</SelectItem></SelectContent></Select></div>
            <div className="admin-field"><Label>{c.language}</Label><Select value={uploadLanguage} onValueChange={(value: UploadLanguage) => setUploadLanguage(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">{c.english}</SelectItem><SelectItem value="ar">{c.arabic}</SelectItem><SelectItem value="shared">{c.shared}</SelectItem></SelectContent></Select></div>
          </div>
          <div className="admin-field"><Label htmlFor="asset-title">{c.titleLabel}</Label><Input id="asset-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Full body PPF / حماية كاملة" maxLength={180} /></div>
          <label className="admin-dropzone" htmlFor="admin-file"><Upload size={22} /><strong>{file ? file.name : c.file}</strong><span>{c.fileHint}</span><input id="admin-file" type="file" accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm,video/quicktime"} onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
          <label className="admin-check"><input type="checkbox" checked={publish} onChange={event => setPublish(event.target.checked)} /><span>{c.publishNow}</span></label>
          <Button type="submit" className="admin-submit" disabled={uploadMedia.isPending || !canSubmit}><Upload size={16} /> {uploadMedia.isPending ? "…" : c.upload}</Button>
        </form>
        <section className="admin-library-card"><div className="admin-card-heading"><span className="admin-index">02</span><h2>{c.library}</h2></div>{mediaQuery.isLoading ? <div className="admin-empty">…</div> : mediaQuery.data?.length ? <div className="admin-media-list">{mediaQuery.data.map(item => <article className="admin-media-item" key={item.id}><div className="admin-media-preview">{item.kind === "image" ? <img src={item.url} alt={item.title} /> : <video src={item.url} controls preload="metadata" />}</div><div className="admin-media-meta"><strong>{item.title}</strong><span>{item.language.toUpperCase()} · {item.kind.toUpperCase()}</span><span className={`admin-status admin-status--${item.status}`}>{item.status === "published" ? c.published : c.draft}</span><button className="admin-status-button" onClick={() => updateStatus.mutate({ id: item.id, status: item.status === "published" ? "draft" : "published" })}>{item.status === "published" ? c.unpublish : c.publish}</button></div></article>)}</div> : <div className="admin-empty"><X size={18} />{c.empty}</div>}</section>
      </section>
    </main>
  );
}
