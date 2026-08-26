# Design Direction — Premium PPF Studio

## তিনটি সম্ভাব্য ভিজ্যুয়াল পদ্ধতি

### Theme Name: Obsidian Atelier
**Very Brief Intro:** Cinematic automotive editorial-এর সঙ্গে quiet luxury craftsmanship মেশানো একটি dark graphite experience। Precision lines, champagne-metal accents এবং asymmetrical composition-এর মাধ্যমে একটি established PPF studio-এর authority প্রকাশ করবে।
**Probability:** 0.07

### Theme Name: Silverline Motion
**Very Brief Intro:** Bright studio photography, brushed aluminium surfaces এবং architectural white space দিয়ে তৈরি একটি technical-luxury direction। এটি precision, cleanliness এবং engineering confidence-কে সামনে আনবে।
**Probability:** 0.03

### Theme Name: Desert Noir
**Very Brief Intro:** Gulf-inspired warm black, sand, smoked bronze এবং dusk lighting-এর একটি atmospheric direction। মরুভূমির আলো ও premium automotive night photography-র মাধ্যমে local character তৈরি করবে।
**Probability:** 0.09

## নির্বাচিত পদ্ধতি: Obsidian Atelier

### Design Movement
Contemporary editorial luxury এবং neo-industrial automotive minimalism। Reference হবে premium car configurator, specialist detailing atelier এবং high-end fashion lookbook—কিন্তু কোনো নির্দিষ্ট brand-এর layout copy করা হবে না।

### Core Principles
1. **Protection as precision:** প্রতিটি line, divider এবং spacing যেন cut pattern, film edge অথবা polished body panel-এর precision মনে করায়।
2. **Darkness with legibility:** graphite-black surface depth থাকবে, কিন্তু typography এবং interactive states সবসময় পরিষ্কার contrast বজায় রাখবে।
3. **Quiet confidence:** champagne gold কেবল focal cue হিসেবে থাকবে—headline marker, fine rule, icon বা hover state-এ; সর্বত্র নয়।
4. **Editorial rhythm:** centred template-এর বদলে offset columns, oversized numerals এবং cinematic image crops ব্যবহার হবে।

### Color Philosophy
Deep obsidian (#080909) হবে primary environment—এটি গাড়ির paint surface এবং privacy-এর অনুভূতি দেয়। Graphite (#151718) এবং smoked steel (#242728) depth ও hierarchy তৈরি করবে। Text হবে warm white (#F4F2ED), secondary copy হবে muted silver (#A8AAA8)। Ownable accent হবে champagne gold (#C8A56B), যা অতিরিক্ত decoration নয়; এটি precision এবং verified quality-এর ছোট কিন্তু unmistakable signal। WhatsApp-এর জন্য একমাত্র green accent রাখা হবে, যাতে conversion action instant চিনতে পারা যায়।

### Layout Paradigm
একটি single-page cinematic scroll narrative: hero-তে full-bleed visual ও left-offset copy, services-এ staggered editorial cards, portfolio-তে masonry composition, process-এ vertical spine/timeline, quality-তে split panel, CTA-তে high-contrast closing frame। Container সর্বোচ্চ 1280px; ultra-wide screen-এ content stretch হবে না। Arabic mode-এ একই composition logical RTL flow-এ mirror হবে।

### Signature Elements
- **Film-edge rule:** champagne-gold 1px line এবং ছোট section index, যা protection film-এর edge-এর মতো প্রতিটি major chapter চিহ্নিত করবে।
- **Panel crop:** image card-এ deliberate crop এবং slow hover zoom, যেন glossy panel inspect করা হচ্ছে।
- **Oversized chapter numerals:** 01–06 process এবং stats-এ large low-contrast numerals, luxury editorial pacing তৈরি করবে।

### Interaction Philosophy
সব interaction হবে controlled এবং tactile: buttons press করলে 0.97 scale, cards সামান্য lift, image zoom subtle, modal smooth fade/scale, navigation sticky হলে smoked-glass surface। User যেন কখনো motion দ্বারা distracted না হয়; motion কেবল orientation, feedback এবং confidence-এর জন্য।

### Animation
Initial preloader 700–900ms-এর মধ্যে mark reveal করবে। Language modal backdrop fade এবং panel scale-in দিয়ে খুলবে। Hero copy 30–70ms stagger-এ fade-up হবে। Scroll-reveal Intersection Observer-ভিত্তিক, transform/opacity-only, 180–260ms ease-out। Gallery hover 240ms, lightbox 220ms, mobile drawer 260ms। Before/After divider pointer/touch drag-এ direct এবং instant থাকবে। `prefers-reduced-motion` হলে reveal ও pulse বন্ধ থাকবে, কিন্তু essential state transitions বজায় থাকবে।

### Typography System
English display: **DM Serif Display**-এর restrained editorial contrast; English UI/body: **Manrope**। Arabic display/body: **Cairo**, weight 400–800; Arabic text-এর জন্য line-height 1.8–2.0। H1 হবে clamp(2.8rem, 7vw, 6.8rem), compact uppercase English eyebrow এবং Arabic short labels ব্যবহার হবে। Body width 42–58ch; display copy wide হলেও paragraph কখনো dense হবে না। Inter ব্যবহার করা হবে না।

### Brand Essence
**Positioning:** A precision-led automotive protection atelier for owners who treat original paint as part of the vehicle’s value—not an afterthought.  
**Personality:** Exacting, composed, assured.

### Brand Voice
Headlines ছোট, declarative এবং outcome-led হবে; CTA direct কিন্তু salesy নয়; microcopy calm এবং service-minded। Generic filler এড়ানো হবে।

**Example line 1:** “Protection that disappears. Precision that remains.”  
**Example line 2:** “Bring the finish you want to keep.”

### Wordmark & Logo
Brand mark হবে একটি abstract **split-film shield**: দুটি offset rounded blade/film strips একটি negative-space shield তৈরি করবে, সঙ্গে সূক্ষ্ম diagonal cut যা PPF edge-এর ইঙ্গিত দেয়। Wordmark custom extended sans lettering-এ, wide tracking ও clipped terminal সহ; default font text logo হিসেবে ব্যবহার করা হবে না। Generated transparent PNG mark header এবং favicon-এ ব্যবহার হবে।

### Signature Brand Color
**Champagne Gold — #C8A56B.** এটি warm metal, verified craft এবং long-term value-এর ownable signal; interface-এর অধিকাংশ অংশ black/graphite থাকবে, ফলে gold-এর প্রতিটি ব্যবহার deliberate মনে হবে।

### Content and Engineering Decisions
- Website UI-তে কেবল Arabic এবং English থাকবে; source/config comments বা user-facing copy-তে Bengali থাকবে না।
- Translation object centralized থাকবে এবং language switcher `document.documentElement.lang` ও `dir` update করবে।
- WhatsApp number এবং locale-specific pre-filled message এক জায়গায় থাকবে; সব CTA একই helper ব্যবহার করবে।
- Gallery lightbox, video modal, before/after comparison, mobile menu, language persistence এবং sticky navbar বাস্তব interaction হিসেবে তৈরি হবে।
- SEO metadata, hreflang, accessible labels, alt text, reduced-motion support এবং responsive image attributes অন্তর্ভুক্ত হবে।

## Style Decisions

- Gallery imagery must remain in a low-key studio, garage, dusk, or night automotive language; bright outdoor road-stock imagery is not part of the Obsidian Atelier system.
- Proof points use craft standards rather than unverified numeric claims: FILM, EDGE, LIGHT, and CARE.
- The split-film shield mark is treated as a recognizable brand asset in the header, language modal, footer, favicon, and preloader; it is not replaced by a standard text-only logo.
- Fine gold rules, section indices, offset image crops, and cut-line dividers recur across services, portfolio, process, quality, proof, and CTA sections.
