import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Check, ChevronLeft } from "lucide-react";
import { BRAND_NAME, WHATSAPP_DISPLAY, whatsappHref } from "@/lib/siteContent";

type Language = "en" | "ar";

type SeoPage = {
  language: Language;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: Array<{ title: string; body: string; bullets?: string[] }>;
  related: Array<{ label: string; href: string }>;
};

const pages: Record<string, SeoPage> = {
  "/services/ppf-riyadh": {
    language: "en",
    title: "PPF Riyadh | Paint Protection Film Installation | PPFStudio",
    description: "Premium paint protection film installation in Riyadh for daily drivers, SUVs and luxury cars.",
    eyebrow: "SERVICE / RIYADH",
    intro: "PPFStudio provides precision paint protection film installation in Riyadh, with a measured process for full-body protection, front-end coverage and luxury vehicles.",
    sections: [
      { title: "Paint protection for Riyadh roads", body: "Dust, sand, heat and stone chips can change the finish of a vehicle quickly. Our clear PPF installation is planned around the vehicle, the driving pattern and the finish you want to preserve." },
      { title: "Choose the right coverage", body: "Ask about clear PPF, gloss PPF, matte PPF, front-end protection or a full car PPF package. We can also discuss protection for SUVs, Tesla, BMW, Mercedes, Porsche and Toyota vehicles.", bullets: ["Full body PPF Riyadh", "Front bumper, hood, fenders and mirror protection", "Luxury car and SUV PPF", "Consultation, quotation and appointment by WhatsApp"] },
      { title: "A clear quotation before installation", body: "PPF pricing depends on vehicle size, coverage and film selection. Contact PPFStudio for a current quotation rather than relying on a generic PPF price or full car PPF price." },
    ],
    related: [{ label: "Full-body PPF service", href: "/services/full-body-ppf" }, { label: "PPF protection guide", href: "/blog/ppf-riyadh-guide" }, { label: "Arabic service page", href: "/ar/services/ppf-riyadh" }],
  },
  "/services/full-body-ppf": {
    language: "en",
    title: "Full Body PPF Saudi Arabia | Premium Vehicle Protection | PPFStudio",
    description: "Explore full-body PPF and custom paint protection film packages for vehicles in Saudi Arabia.",
    eyebrow: "SERVICE / FULL BODY",
    intro: "Full-body PPF is designed for owners who want consistent protection across the painted surfaces of a vehicle, not only the front bumper or hood.",
    sections: [
      { title: "What full-body PPF covers", body: "A full-body plan may include the hood, bumpers, fenders, doors, mirrors and other painted panels. The exact plan is confirmed after inspecting the vehicle and understanding your priorities." },
      { title: "Gloss or matte finish", body: "Clear gloss PPF helps preserve the original appearance, while matte PPF creates a different visual character. Our team will explain the practical differences before installation." },
      { title: "Available across key Saudi searches", body: "Visitors looking for car PPF Saudi Arabia, full body PPF Riyadh, PPF Jeddah, PPF Dammam or PPF Khobar can start with a direct consultation and receive a vehicle-specific recommendation." },
    ],
    related: [{ label: "PPF Riyadh", href: "/services/ppf-riyadh" }, { label: "Luxury car PPF guide", href: "/blog/luxury-car-ppf" }, { label: "Contact PPFStudio", href: "/contact" }],
  },
  "/services/auto-detailing-ppf": {
    language: "en",
    title: "Car Detailing Riyadh PPF | Auto Detailing and Paint Protection | PPFStudio",
    description: "Combine professional auto detailing in Riyadh with paint protection film planning from PPFStudio.",
    eyebrow: "SERVICE / DETAILING",
    intro: "A clean, carefully prepared surface is an important part of a quality PPF installation. PPFStudio combines automotive care with a protection-first approach.",
    sections: [
      { title: "Preparation matters", body: "Before film placement, the paint should be inspected and prepared for the selected protection plan. This helps the finish, fit and visual clarity of the final result." },
      { title: "Protection beyond appearance", body: "Paint protection film helps defend vulnerable painted areas from everyday road wear. Ceramic coating and headlight protection can be discussed as separate services when they suit the vehicle." },
      { title: "From enquiry to appointment", body: "Send your vehicle model and the areas you want to protect through WhatsApp. We will guide you toward a suitable package and current quotation." },
    ],
    related: [{ label: "PPF price guidance", href: "/blog/ppf-price-saudi-arabia" }, { label: "PPF Riyadh", href: "/services/ppf-riyadh" }, { label: "Contact", href: "/contact" }],
  },
  "/ar/services/ppf-riyadh": {
    language: "ar",
    title: "حماية السيارات بالرياض وتركيب PPF | PPFStudio",
    description: "تركيب فيلم حماية الطلاء وحماية السيارات بالرياض للسيارات الفاخرة وسيارات الدفع الرباعي.",
    eyebrow: "خدمة / الرياض",
    intro: "تقدم PPFStudio خدمات تركيب حماية السيارات بالرياض باستخدام فيلم حماية الطلاء، مع خطة مناسبة للسيارة وطريقة استخدامها والنتيجة التي تريد الحفاظ عليها.",
    sections: [
      { title: "حماية الطلاء في طرق الرياض", body: "الغبار والرمل وحرارة الشمس والحصى قد تؤثر على مظهر السيارة. يساعد فيلم حماية السيارات على حماية المناطق المعرضة للاستخدام اليومي مع الحفاظ على مظهر الطلاء." },
      { title: "خيارات حماية مناسبة لسيارتك", body: "يمكنك الاستفسار عن حماية السيارة بالكامل، حماية الواجهة الأمامية، حماية لامعة أو مطفية، وحماية السيارات الفاخرة أو سيارات الدفع الرباعي.", bullets: ["تركيب PPF بالرياض", "حماية السيارة من الخدوش والحصى", "حماية تسلا وBMW ومرسيدس وبورشه وتويوتا", "عرض سعر وحجز موعد عبر واتساب"] },
      { title: "عرض سعر واضح", body: "يختلف سعر حماية السيارات بالرياض حسب حجم السيارة ونطاق التغطية ونوع الفيلم. تواصل معنا للحصول على سعر محدث يناسب سيارتك." },
    ],
    related: [{ label: "خدمة حماية السيارة بالكامل", href: "/ar/services/full-body-ppf" }, { label: "دليل حماية السيارات", href: "/ar/blog/ppf-riyadh-guide" }, { label: "English service page", href: "/services/ppf-riyadh" }],
  },
  "/ar/services/full-body-ppf": {
    language: "ar",
    title: "حماية السيارة بالكامل وفيلم حماية الطلاء في السعودية | PPFStudio",
    description: "تعرف على حماية السيارة بالكامل وخيارات فيلم حماية الطلاء للسيارات في السعودية.",
    eyebrow: "خدمة / حماية كاملة",
    intro: "تم تصميم حماية السيارة بالكامل لمن يريد حماية متناسقة لأسطح السيارة المطلية، وليس فقط الصدام الأمامي أو غطاء المحرك.",
    sections: [
      { title: "ماذا تشمل الحماية الكاملة؟", body: "قد تشمل الخطة غطاء المحرك والصدامات والرفارف والمرايا والأبواب والأسطح المطلية الأخرى. يتم تأكيد التفاصيل بعد معاينة السيارة وفهم أولوياتك." },
      { title: "حماية لامعة أو مطفية", body: "تحافظ الحماية الشفافة اللامعة على المظهر الأصلي، بينما تمنح الحماية المطفية مظهراً مختلفاً. نشرح لك الفروقات قبل التركيب." },
      { title: "خدمة للمدن السعودية", body: "إذا كنت تبحث عن PPF السعودية أو حماية السيارات بالرياض أو جدة أو الدمام أو الخبر، ابدأ باستشارة مباشرة للحصول على توصية خاصة بسيارتك." },
    ],
    related: [{ label: "حماية السيارات بالرياض", href: "/ar/services/ppf-riyadh" }, { label: "دليل أسعار PPF", href: "/ar/blog/ppf-price-saudi-arabia" }, { label: "تواصل معنا", href: "/contact" }],
  },
  "/blog/ppf-riyadh-guide": {
    language: "en",
    title: "PPF Riyadh Guide: Choosing Paint Protection Film for Saudi Roads",
    description: "A practical PPF Riyadh guide covering coverage, finish, vehicle type and quotation questions.",
    eyebrow: "JOURNAL / GUIDE",
    intro: "Choosing paint protection film is easier when you start with the areas that matter most, the way you drive and the finish you want to keep.",
    sections: [
      { title: "Start with the risk areas", body: "Front-end protection is often a useful starting point for vehicles that spend time on highways. Full-body PPF may be better for owners who want a consistent plan across the vehicle." },
      { title: "Ask about film and installation", body: "Ask which film is recommended, how the surface is prepared, what areas are included and how the installation will be cared for after collection." },
      { title: "Do not choose on price alone", body: "A low PPF cost may not describe the same coverage, film or preparation. Compare the written scope of work and the finish you expect." },
    ],
    related: [{ label: "PPF price Saudi Arabia", href: "/blog/ppf-price-saudi-arabia" }, { label: "PPF Riyadh service", href: "/services/ppf-riyadh" }, { label: "Arabic guide", href: "/ar/blog/ppf-riyadh-guide" }],
  },
  "/blog/ppf-price-saudi-arabia": {
    language: "en",
    title: "PPF Price Saudi Arabia: What Changes the Cost of Installation?",
    description: "Understand the factors behind PPF price, full car PPF price and paint protection film cost in Saudi Arabia.",
    eyebrow: "JOURNAL / PRICING",
    intro: "There is no single PPF price for every vehicle. Coverage, vehicle size, film finish, preparation and installation detail all influence a quotation.",
    sections: [
      { title: "Coverage changes the quote", body: "A front-end plan and a full-body plan protect different areas. Ask for the exact panels included in any PPF price or full car PPF price." },
      { title: "Vehicle size and shape matter", body: "SUVs, large vehicles and vehicles with complex curves can require more film and installation time than smaller cars." },
      { title: "Get a vehicle-specific quotation", body: "For a current PPF cost Saudi Arabia estimate, send your vehicle model and preferred coverage to PPFStudio rather than relying on a generic online number." },
    ],
    related: [{ label: "Full-body PPF", href: "/services/full-body-ppf" }, { label: "PPF Riyadh guide", href: "/blog/ppf-riyadh-guide" }, { label: "Arabic pricing guide", href: "/ar/blog/ppf-price-saudi-arabia" }],
  },
  "/blog/luxury-car-ppf": {
    language: "en",
    title: "Luxury Car PPF in Saudi Arabia: Protecting the Finish You Bought",
    description: "A practical guide to PPF for luxury cars, SUVs, Tesla, BMW, Mercedes, Porsche and Toyota vehicles.",
    eyebrow: "JOURNAL / VEHICLES",
    intro: "Luxury car PPF is not only about appearance. It is about planning protection around a valuable finish, the vehicle's use and the owner's expectations.",
    sections: [
      { title: "Protect the areas you use most", body: "The front bumper, hood, mirrors, door edges and loading areas can be discussed during a vehicle-specific inspection." },
      { title: "Match the finish to the vehicle", body: "Gloss PPF keeps a bright factory-like appearance. Matte PPF can change the character of a vehicle while adding a protective layer." },
      { title: "Plan care after installation", body: "Follow the installer’s care guidance and ask questions before collection so the film and finish receive the right maintenance." },
    ],
    related: [{ label: "PPF for SUV Riyadh", href: "/services/ppf-riyadh" }, { label: "Auto detailing PPF", href: "/services/auto-detailing-ppf" }, { label: "Contact PPFStudio", href: "/contact" }],
  },
  "/ar/blog/ppf-riyadh-guide": {
    language: "ar",
    title: "دليل حماية السيارات بالرياض: كيف تختار فيلم حماية الطلاء؟",
    description: "دليل عملي لاختيار حماية السيارات بالرياض حسب التغطية ونوع السيارة والنتيجة المطلوبة.",
    eyebrow: "المجلة / دليل",
    intro: "يصبح اختيار فيلم حماية الطلاء أسهل عندما تبدأ بالمناطق الأكثر تعرضاً وطريقة استخدامك للسيارة والمظهر الذي تريد الحفاظ عليه.",
    sections: [
      { title: "ابدأ بالمناطق الأكثر تعرضاً", body: "قد تكون حماية الواجهة الأمامية مناسبة للسيارات التي تستخدم الطرق السريعة، بينما تناسب حماية السيارة بالكامل من يريد خطة متناسقة لكل الأسطح." },
      { title: "اسأل عن الفيلم والتركيب", body: "اسأل عن نوع الفيلم، وتجهيز السطح، والمناطق المشمولة، وطريقة العناية بعد استلام السيارة." },
      { title: "لا تختار على أساس السعر فقط", body: "قد لا يوضح سعر PPF المنخفض نفس نطاق التغطية أو نوع الفيلم أو مستوى التجهيز. قارن تفاصيل الخدمة المكتوبة." },
    ],
    related: [{ label: "سعر حماية السيارات", href: "/ar/blog/ppf-price-saudi-arabia" }, { label: "خدمة PPF بالرياض", href: "/ar/services/ppf-riyadh" }, { label: "English guide", href: "/blog/ppf-riyadh-guide" }],
  },
  "/ar/blog/ppf-price-saudi-arabia": {
    language: "ar",
    title: "سعر PPF في السعودية: ما الذي يحدد تكلفة التركيب؟",
    description: "تعرف على العوامل التي تؤثر في سعر حماية السيارات وتكلفة فيلم حماية الطلاء في السعودية.",
    eyebrow: "المجلة / الأسعار",
    intro: "لا يوجد سعر واحد لحماية السيارات يناسب كل المركبات. تختلف التكلفة حسب التغطية وحجم السيارة ونوع الفيلم وتجهيز السطح ودقة التركيب.",
    sections: [
      { title: "نطاق التغطية يغير السعر", body: "تختلف حماية الواجهة الأمامية عن حماية السيارة بالكامل. اطلب معرفة الأجزاء المشمولة في أي سعر PPF أو سعر حماية السيارة بالكامل." },
      { title: "حجم السيارة وشكلها مهمان", body: "قد تحتاج سيارات الدفع الرباعي والسيارات الكبيرة والأسطح المعقدة إلى فيلم ووقت تركيب أكثر من السيارات الصغيرة." },
      { title: "اطلب عرض سعر خاصاً بسيارتك", body: "للحصول على تقدير محدث لتكلفة تركيب PPF، أرسل موديل السيارة ونطاق الحماية المطلوب إلى PPFStudio." },
    ],
    related: [{ label: "حماية السيارة بالكامل", href: "/ar/services/full-body-ppf" }, { label: "دليل الرياض", href: "/ar/blog/ppf-riyadh-guide" }, { label: "English pricing guide", href: "/blog/ppf-price-saudi-arabia" }],
  },
};

function updateMeta(page: SeoPage) {
  document.documentElement.lang = page.language === "ar" ? "ar" : "en";
  document.documentElement.dir = page.language === "ar" ? "rtl" : "ltr";
  document.title = page.title;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  description?.setAttribute("content", page.description);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  canonical?.setAttribute("href", `https://ppfstudio.online${window.location.pathname}`);
}

export function SeoLandingPage({ slug }: { slug: string }) {
  const page = pages[slug] ?? pages["/services/ppf-riyadh"];
  useEffect(() => updateMeta(page), [page]);
  const isArabic = page.language === "ar";
  const homeHref = isArabic ? "/" : "/";

  return (
    <main className={`seo-page ${isArabic ? "seo-page-ar" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
      <header className="seo-page-header">
        <Link href={homeHref} className="seo-brand">{BRAND_NAME}<span>.online</span></Link>
        <nav className="seo-page-nav" aria-label={isArabic ? "التنقل" : "Page navigation"}>
          <Link href={isArabic ? "/ar/services/ppf-riyadh" : "/services/ppf-riyadh"}>{isArabic ? "الخدمات" : "Services"}</Link>
          <Link href={isArabic ? "/ar/blog/ppf-riyadh-guide" : "/blog/ppf-riyadh-guide"}>{isArabic ? "المجلة" : "Journal"}</Link>
          <Link href="/contact">{isArabic ? "تواصل معنا" : "Contact"}</Link>
        </nav>
      </header>
      <section className="seo-hero">
        <p className="seo-eyebrow">{page.eyebrow}</p>
        <h1>{page.title.replace(" | PPFStudio", "")}</h1>
        <p className="seo-intro">{page.intro}</p>
        <div className="seo-hero-actions">
          <a href={whatsappHref(page.language)} target="_blank" rel="noreferrer" className="seo-primary-cta">{isArabic ? "احجز استشارتك عبر واتساب" : "Request a quotation on WhatsApp"}<ArrowUpRight size={16} /></a>
          <a href={`tel:+${"966537358631"}`} className="seo-secondary-cta">{WHATSAPP_DISPLAY}</a>
        </div>
      </section>
      <section className="seo-content-grid" aria-label={isArabic ? "معلومات الخدمة" : "Service information"}>
        {page.sections.map((section) => (
          <article key={section.title} className="seo-content-card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}><Check size={15} />{bullet}</li>)}</ul>}
          </article>
        ))}
      </section>
      <section className="seo-related">
        <p className="seo-eyebrow">{isArabic ? "استكشف المزيد" : "Continue exploring"}</p>
        <div className="seo-related-grid">{page.related.map((item) => <Link key={item.href} href={item.href}>{item.label}<ChevronLeft size={16} /></Link>)}</div>
      </section>
      <footer className="seo-page-footer">
        <span>{BRAND_NAME} / {isArabic ? "حماية السيارات في السعودية" : "Automotive protection in Saudi Arabia"}</span>
        <Link href={isArabic ? "/services/ppf-riyadh" : "/ar/services/ppf-riyadh"}>{isArabic ? "English" : "العربية"}</Link>
      </footer>
    </main>
  );
}

export function getSeoPage(slug: string) { return pages[slug]; }
