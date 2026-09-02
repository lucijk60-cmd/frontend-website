import { ArrowLeft, Ghost, Instagram, MessageCircle, Music2, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

const WHATSAPP_DISPLAY = "+966 53 735 8631";
const WHATSAPP_URL = "https://wa.me/966537358631";
const INSTAGRAM_URL = "https://www.instagram.com/ppf_studio_com?igsi=Nmh6b3BmNGRrZ3oz";
const SNAPCHAT_URL = "https://www.snapchat.com/add/jkjabed2026?share_id=lKZ1ASIv4Jk&locale=en-US";
const TIKTOK_URL = "https://www.tiktok.com/@ppf_studio?_r=1&_t=ZS-99ECEM4AyhB";
const UPDATED = "September 2, 2026";

function LanguageToggle({ language, setLanguage }: { language: "en" | "ar"; setLanguage: (language: "en" | "ar") => void }) {
  return <button className="legal-language-toggle" onClick={() => setLanguage(language === "en" ? "ar" : "en")} aria-label={language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}>
    {language === "en" ? "العربية" : "English"}
  </button>;
}

function LegalShell({ title, arabicTitle, eyebrow, children }: { title: string; arabicTitle: string; eyebrow: string; children: (language: "en" | "ar") => ReactNode }) {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  return <main className="legal-page" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="legal-header page-width">
      <a className="legal-back" href="/"><ArrowLeft size={16} /> {language === "ar" ? "العودة إلى الموقع" : "Back to website"}</a>
      <div className="legal-actions"><LanguageToggle language={language} setLanguage={setLanguage} /><a className="legal-admin" href="/admin"><ShieldCheck size={15} /> Admin</a></div>
    </header>
    <section className="legal-hero page-width"><span className="eyebrow"><span className="eyebrow-rule" />{eyebrow}</span><h1>{language === "ar" ? arabicTitle : title}</h1><p>{language === "ar" ? "آخر تحديث: ٢ سبتمبر ٢٠٢٦" : `Last updated: ${UPDATED}`}</p></section>
    <article className="legal-content page-width">{children(language)}</article>
    <footer className="legal-footer page-width"><span>PPFStudio · 2026</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={15} /> {WHATSAPP_DISPLAY}</a></footer>
  </main>;
}

const enPrivacy = <>
  <p className="legal-lead">PPFStudio respects your privacy. This Privacy Policy explains what information we may collect when you use our website, contact us, submit a review, or request a voice call, and how we use and protect it.</p>
  <h2>1. Information we collect</h2><p>We may receive information you choose to provide, such as your name, vehicle details, review text, language preference, and contact details when you contact us through WhatsApp or another listed channel. A review may be submitted without a public identity; please do not include sensitive personal information in a review.</p>
  <p>When you use the review reference feature, we generate a private reference code so you can check the moderation status of your submission. Review submissions are stored for moderation and are not published until they pass an authenticity check.</p>
  <p>When you request a real-time voice call, the browser may ask for microphone permission. We use session and signaling information to connect the visitor with an available operator. PPFStudio does not intentionally record or store the call audio.</p>
  <p>We may collect technical visit information such as timestamp, device class, coarse country information supplied by the hosting layer, and a privacy-preserving hashed visitor key. We do not intentionally store raw IP addresses in the visitor analytics table.</p>
  <h2>2. How we use information</h2><p>We use information to provide and improve services, respond to enquiries, coordinate appointments, moderate reviews, operate voice calls, understand aggregate website usage, protect the website from abuse, and comply with applicable obligations.</p>
  <h2>3. Advertising and analytics</h2><p>Our website may use Google Analytics and Google AdSense. These services may use cookies or similar technologies, subject to Google's own policies and the status of the relevant account and domain. Advertising must never be clicked for the purpose of supporting PPFStudio. For more information, review Google's <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">advertising technologies policy</a>.</p>
  <h2>4. Sharing and retention</h2><p>We may share information with service providers that help us host the website, store data, provide analytics, deliver communications, or operate the call-signaling infrastructure. We do not sell personal information. We retain information only for as long as reasonably needed for the purpose for which it was collected, moderation, security, accounting, or legal requirements.</p>
  <h2>5. Your choices and requests</h2><p>You may ask us to correct or delete information you submitted, or ask questions about this policy, by contacting us through WhatsApp at <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a>. We may need to verify the request before acting. Deleting a review submission may also remove its status history.</p>
  <h2>6. Children and third-party links</h2><p>Our website is intended for general audiences and is not directed to children. Social-media and other external links are governed by the privacy policies of those third parties. We are not responsible for external websites.</p>
  <h2>7. Changes and contact</h2><p>We may update this policy when our services or legal obligations change. The current version will show its update date. For privacy questions, contact PPFStudio via WhatsApp using the number shown on this page.</p>
</>;

const arPrivacy = <>
  <p className="legal-lead">تحترم PPFStudio خصوصيتك. توضح سياسة الخصوصية هذه المعلومات التي قد نجمعها عند استخدام الموقع أو التواصل معنا أو إرسال مراجعة أو طلب مكالمة صوتية، وكيف نستخدمها ونحميها.</p>
  <h2>١. المعلومات التي نجمعها</h2><p>قد نتلقى المعلومات التي تختار تقديمها، مثل اسمك وتفاصيل السيارة ونص المراجعة وتفضيل اللغة وبيانات التواصل عند مراسلتنا عبر واتساب أو إحدى القنوات المذكورة. يمكنك إرسال مراجعة دون إظهار هويتك علناً؛ يرجى عدم تضمين معلومات شخصية حساسة في المراجعة.</p>
  <p>عند استخدام خاصية متابعة المراجعة، ننشئ رمزاً خاصاً لمساعدتك على معرفة حالة مراجعتك. تُحفظ المراجعات للمراجعة والإشراف ولا تُنشر قبل التحقق من أصالتها.</p>
  <p>عند طلب مكالمة صوتية مباشرة، قد يطلب المتصفح إذناً لاستخدام الميكروفون. نستخدم معلومات الجلسة والإشارات لربط الزائر بالمشغل المتاح. لا تقوم PPFStudio عمداً بتسجيل أو تخزين صوت المكالمة.</p>
  <p>قد نجمع معلومات تقنية عن الزيارة مثل الوقت ونوع الجهاز والدولة التقريبية التي توفرها طبقة الاستضافة ومفتاح زائر مُجزأ يحافظ على الخصوصية. لا نخزن عناوين IP الخام عمداً في جدول التحليلات.</p>
  <h2>٢. كيفية استخدام المعلومات</h2><p>نستخدم المعلومات لتقديم الخدمات وتحسينها والرد على الاستفسارات وتنسيق المواعيد والإشراف على المراجعات وتشغيل المكالمات وفهم استخدام الموقع بشكل إجمالي وحمايته من إساءة الاستخدام والالتزام بالمتطلبات المطبقة.</p>
  <h2>٣. الإعلانات والتحليلات</h2><p>قد يستخدم موقعنا Google Analytics وGoogle AdSense. قد تستخدم هذه الخدمات ملفات تعريف الارتباط أو تقنيات مشابهة وفقاً لسياسات Google وحالة الحساب والنطاق. لا يجوز النقر على الإعلانات بهدف دعم PPFStudio. راجع <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">سياسة تقنيات الإعلانات لدى Google</a> لمزيد من المعلومات.</p>
  <h2>٤. المشاركة والاحتفاظ</h2><p>قد نشارك المعلومات مع مزودي الخدمات الذين يساعدوننا في الاستضافة وتخزين البيانات والتحليلات والاتصالات وتشغيل البنية التحتية لإشارات المكالمات. لا نبيع المعلومات الشخصية. نحتفظ بالمعلومات للمدة اللازمة بشكل معقول لغرض جمعها أو للإشراف والأمان والمحاسبة أو المتطلبات القانونية.</p>
  <h2>٥. اختياراتك وطلباتك</h2><p>يمكنك طلب تصحيح أو حذف المعلومات التي أرسلتها أو طرح أسئلة حول هذه السياسة عبر واتساب على الرقم <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a>. قد نحتاج إلى التحقق من الطلب قبل تنفيذه. قد يؤدي حذف المراجعة إلى حذف سجل حالتها أيضاً.</p>
  <h2>٦. الأطفال والروابط الخارجية</h2><p>الموقع موجه للجمهور العام وليس للأطفال. تخضع روابط وسائل التواصل والمواقع الخارجية لسياسات الخصوصية الخاصة بها، ولا نتحمل مسؤولية المواقع الخارجية.</p>
  <h2>٧. التغييرات والتواصل</h2><p>قد نحدّث هذه السياسة عند تغير خدماتنا أو التزاماتنا القانونية. ستظهر نسخة محدثة مع تاريخ التحديث. للاستفسارات المتعلقة بالخصوصية، تواصل مع PPFStudio عبر واتساب.</p>
</>;

const enTerms = <>
  <p className="legal-lead">These Terms of Service govern your use of the PPFStudio website and the information and contact features made available through it.</p>
  <h2>1. About the service</h2><p>PPFStudio provides information about automotive paint-protection services, including PPF, ceramic coating, headlight protection, and related appointment enquiries. Website information is general information and is not a final quotation or a guarantee of a particular result.</p>
  <h2>2. Enquiries and appointments</h2><p>Submitting an enquiry or contacting us through WhatsApp does not by itself create a confirmed appointment or service contract. Pricing, availability, vehicle suitability, preparation requirements, warranty terms, and final scope must be confirmed directly with PPFStudio before work begins.</p>
  <h2>3. Reviews</h2><p>Reviews must be based on a genuine experience and must not contain unlawful, abusive, confidential, or misleading material. PPFStudio may moderate, reject, or remove submissions that do not meet these requirements. A submitted review may remain pending until an authenticity check is complete.</p>
  <h2>4. Voice calls</h2><p>Voice calling is offered subject to browser permissions, network conditions, operator availability, and technical compatibility. Calls are not guaranteed to connect. You must use the feature lawfully and respectfully. Do not share payment credentials, passwords, or highly sensitive information during a call.</p>
  <h2>5. Acceptable use</h2><p>You must not attempt to disrupt the website, bypass access controls, upload malware, impersonate another person, submit fabricated reviews, scrape private information, or use the website to violate any law or third-party right.</p>
  <h2>6. Intellectual property</h2><p>Unless otherwise stated, PPFStudio branding, copy, layouts, and original media are owned by or licensed to PPFStudio. You may view the website for personal and legitimate business enquiries, but you may not reproduce or commercially reuse its content without permission.</p>
  <h2>7. Third-party services and ads</h2><p>The website may link to WhatsApp, Instagram, Snapchat, TikTok, Google services, or other third parties. Their services are governed by their own terms. Advertisements are supplied by third parties and PPFStudio does not endorse every advertised product or service.</p>
  <h2>8. Availability and liability</h2><p>We aim to keep the website useful and available, but we do not promise uninterrupted operation or that every page, media item, call, or third-party service will always work. To the extent permitted by applicable law, PPFStudio is not responsible for indirect losses arising from use of the website or reliance on general website information.</p>
  <h2>9. Changes and contact</h2><p>We may update these terms when the website or services change. Continued use after an update means you have had an opportunity to review the revised terms. Questions may be sent to PPFStudio through <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>.</p>
</>;

const arTerms = <>
  <p className="legal-lead">تنظم شروط الخدمة هذه استخدامك لموقع PPFStudio ومعلومات التواصل والميزات المتاحة من خلاله.</p>
  <h2>١. عن الخدمة</h2><p>تقدم PPFStudio معلومات عن خدمات حماية طلاء السيارات، بما في ذلك أفلام الحماية والطلاء الخزفي وحماية المصابيح واستفسارات المواعيد. معلومات الموقع عامة وليست عرضاً نهائياً أو ضماناً لنتيجة معينة.</p>
  <h2>٢. الاستفسارات والمواعيد</h2><p>إرسال الاستفسار أو التواصل عبر واتساب لا ينشئ وحده موعداً مؤكداً أو عقد خدمة. يجب تأكيد السعر والتوفر ومدى ملاءمة السيارة ومتطلبات التجهيز وشروط الضمان ونطاق العمل النهائي مباشرة مع PPFStudio قبل بدء العمل.</p>
  <h2>٣. المراجعات</h2><p>يجب أن تستند المراجعات إلى تجربة حقيقية وألا تتضمن مواد غير قانونية أو مسيئة أو سرية أو مضللة. يجوز لـ PPFStudio مراجعة المشاركات أو رفضها أو حذفها. قد تبقى المراجعة قيد الانتظار حتى اكتمال التحقق من أصالتها.</p>
  <h2>٤. المكالمات الصوتية</h2><p>تتوفر المكالمات الصوتية حسب أذونات المتصفح وحالة الشبكة وتوفر المشغل والتوافق التقني. لا نضمن اتصال كل مكالمة. يجب استخدام الميزة بشكل قانوني ومحترم، وعدم مشاركة بيانات الدفع أو كلمات المرور أو المعلومات شديدة الحساسية أثناء المكالمة.</p>
  <h2>٥. الاستخدام المقبول</h2><p>يُمنع تعطيل الموقع أو تجاوز ضوابط الدخول أو رفع برمجيات ضارة أو انتحال شخصية أو إرسال مراجعات مختلقة أو جمع معلومات خاصة أو استخدام الموقع لانتهاك القانون أو حقوق الغير.</p>
  <h2>٦. الملكية الفكرية</h2><p>ما لم يذكر خلاف ذلك، فإن علامة PPFStudio ونصوصها وتصميماتها ووسائطها الأصلية مملوكة لـ PPFStudio أو مرخصة لها. يجوز لك تصفح الموقع للاستفسارات الشخصية والتجارية المشروعة، ولا يجوز إعادة إنتاج محتواه أو استخدامه تجارياً دون إذن.</p>
  <h2>٧. الخدمات والإعلانات الخارجية</h2><p>قد يحتوي الموقع على روابط إلى واتساب وإنستغرام وسناب شات وتيك توك وخدمات Google أو جهات خارجية أخرى. تخضع هذه الخدمات لشروطها الخاصة. تقدم الإعلانات من جهات خارجية ولا تعني PPFStudio تأييد كل منتج أو خدمة معلنة.</p>
  <h2>٨. التوفر والمسؤولية</h2><p>نسعى إلى إبقاء الموقع مفيداً ومتاحاً، لكننا لا نضمن التشغيل المتواصل أو عمل كل صفحة أو وسائط أو مكالمة أو خدمة خارجية دائماً. بالقدر الذي يسمح به القانون، لا تتحمل PPFStudio المسؤولية عن الخسائر غير المباشرة الناتجة عن استخدام الموقع أو الاعتماد على معلوماته العامة.</p>
  <h2>٩. التغييرات والتواصل</h2><p>قد نحدّث هذه الشروط عند تغير الموقع أو الخدمات. استمرارك في الاستخدام بعد التحديث يعني أن لديك فرصة لمراجعة الشروط المعدلة. يمكن إرسال الأسئلة إلى PPFStudio عبر <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">واتساب</a>.</p>
</>;

export function PrivacyPage() { return <LegalShell eyebrow="Privacy / الخصوصية" title="Privacy Policy" arabicTitle="سياسة الخصوصية">{language => language === "ar" ? arPrivacy : enPrivacy}</LegalShell>; }
export function TermsPage() { return <LegalShell eyebrow="Terms / الشروط" title="Terms of Service" arabicTitle="شروط الخدمة">{language => language === "ar" ? arTerms : enTerms}</LegalShell>; }

export function ContactPage() {
  return <LegalShell eyebrow="Contact / التواصل" title="Start a conversation" arabicTitle="ابدأ محادثة">{language => language === "ar" ? <>
    <p className="legal-lead">يسعد فريق PPFStudio بالتعرف على سيارتك واقتراح خطة حماية مناسبة. أرسل لنا رسالة عبر واتساب وسنساعدك في الخطوة التالية.</p><div className="contact-grid"><a className="contact-card contact-card--gold" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle /><span>واتساب</span><strong>{WHATSAPP_DISPLAY}</strong><small>للاستفسارات والمواعيد</small></a><div className="contact-card"><Phone /><span>التواصل المباشر</span><strong>{WHATSAPP_DISPLAY}</strong><small>يرجى ذكر نوع السيارة والخدمة المطلوبة</small></div></div><h2>تابع أعمالنا</h2><div className="contact-socials"><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a><a href={SNAPCHAT_URL} target="_blank" rel="noreferrer"><Ghost size={18} /> Snapchat</a><a href={TIKTOK_URL} target="_blank" rel="noreferrer"><Music2 size={18} /> TikTok</a></div><p className="contact-note">لم ندرج عنواناً بريدياً أو موقعاً فعلياً لأن هذه البيانات لم يتم تأكيدها بعد. ستجد أي معلومات رسمية إضافية هنا عند اعتمادها.</p>
  </> : <>
    <p className="legal-lead">The PPFStudio team would be glad to learn about your vehicle and recommend a suitable protection plan. Send us a WhatsApp message and we will guide you through the next step.</p><div className="contact-grid"><a className="contact-card contact-card--gold" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle /><span>WhatsApp</span><strong>{WHATSAPP_DISPLAY}</strong><small>Enquiries and appointments</small></a><div className="contact-card"><Phone /><span>Direct contact</span><strong>{WHATSAPP_DISPLAY}</strong><small>Please include your vehicle and requested service</small></div></div><h2>Follow our work</h2><div className="contact-socials"><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18} /> Instagram</a><a href={SNAPCHAT_URL} target="_blank" rel="noreferrer"><Ghost size={18} /> Snapchat</a><a href={TIKTOK_URL} target="_blank" rel="noreferrer"><Music2 size={18} /> TikTok</a></div><p className="contact-note">No postal address or email address is listed because those details have not been confirmed. Any additional official contact details can be added here once approved.</p>
  </> }</LegalShell>;
}
