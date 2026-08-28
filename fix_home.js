const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Inject helpers right after `const heroBlock = ...`
const helpers = `
  const getHeroTitle = () => {
    const val = heroBlock?.headline || settings?.heroTitle;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getHeroSubtitle = () => {
    const val = heroBlock?.subheadline || settings?.heroSubtitle;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getHeroDescription = () => {
    const val = settings?.heroDescription;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
`;
content = content.replace(/const heroBlock = builderSettings\?\.blocks\.find\(b => b\.id === 'hero'\);/, `const heroBlock = builderSettings?.blocks.find(b => b.id === 'hero');\n${helpers}`);

// 2. Fix slidesToUse
const oldSlidesToUseRegex = /const slidesToUse = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/;
const newSlidesToUse = `const slidesToUse = useMemo(() => {
    const imagesToUse = heroBlock?.heroImages?.length ? heroBlock.heroImages : settings?.heroImages;
    const singleImageToUse = heroBlock?.image || settings?.heroImage;

    const baseTitle = getHeroTitle() || "Where Adrenaline Meets Natural Beauty";
    const baseSubtitle = getHeroSubtitle() || (settings?.siteName ? \`WELCOME TO \${settings.siteName.toUpperCase()}\` : "WELCOME TO TRIPBONE");
    const baseDesc = getHeroDescription() || "Experience an unforgettable off-road journey through lush jungles, scenic rice fields, muddy trails, rivers, and exciting jungle tracks designed for riders of all skill levels.";

    const hasCustomTitle = !!getHeroTitle();
    const hasCustomSubtitle = !!getHeroSubtitle();
    const hasCustomDesc = !!getHeroDescription();

    let result = [...SLIDES];

    if (imagesToUse && Array.isArray(imagesToUse) && imagesToUse.length > 0) {
      result = imagesToUse.map((image, idx) => {
        const baseSlide = SLIDES[idx % SLIDES.length] || SLIDES[0];
        return { ...baseSlide, image };
      });
    } else if (singleImageToUse) {
      result = SLIDES.map((slide, idx) => {
        if (idx === 0) return { ...slide, image: singleImageToUse };
        return slide;
      });
    }

    return result.map(slide => ({
      ...slide,
      title: hasCustomTitle ? baseTitle : slide.title,
      subtitle: hasCustomSubtitle ? baseSubtitle : (slide.subtitle.includes('GORILLA') ? baseSubtitle : slide.subtitle),
      description: hasCustomDesc ? baseDesc : slide.description.replace(/Gorilla ATV Adventure/ig, settings?.siteName || 'Tripbone'),
    }));
  }, [heroBlock?.heroImages, heroBlock?.image, heroBlock?.headline, heroBlock?.subheadline, settings?.heroImages, settings?.heroImage, settings?.heroTitle, settings?.heroSubtitle, settings?.heroDescription, settings?.siteName]);`;

content = content.replace(oldSlidesToUseRegex, newSlidesToUse);

// 3. Fix youtube-video case
content = content.replace(/const headline = settings\?\.heroTitle \|\| heroBlock\?\.headline \|\| settings\?\.siteName \|\| "Adventure Awaits";/, 'const headline = getHeroTitle() || settings?.siteName || "Adventure Awaits";');
content = content.replace(/const subheadline = settings\?\.heroSubtitle \|\| heroBlock\?\.subheadline \|\| settings\?\.siteDescription \|\| "Explore the best tours with us.";/, 'const subheadline = getHeroSubtitle() || settings?.siteDescription || "Explore the best tours with us.";');
content = content.replace(/\{settings\?\.heroSubtitle \|\| "Welcome"\}/, '{getHeroSubtitle() || "Welcome"}');
content = content.replace(/\{settings\?\.heroDescription \|\| subheadline\}/, '{getHeroDescription() || subheadline}');

// 4. Fix airbnb-classic case
content = content.replace(/\{settings\?\.heroTitle \|\| \(/, '{getHeroTitle() || (');
content = content.replace(/\{settings\?\.heroDescription \|\| "Curated/, '{getHeroDescription() || "Curated');

// 5. Fix modern-dark case
content = content.replace(/\{settings\?\.heroSubtitle \|\| "Expedition Engine Active"\}/, '{getHeroSubtitle() || "Expedition Engine Active"}');
content = content.replace(/\{settings\?\.heroTitle \? \(/, '{getHeroTitle() ? (');
content = content.replace(/__html: settings\.heroTitle\.replace/, '__html: getHeroTitle()!.replace');
content = content.replace(/\{settings\?\.heroDescription \|\| "High-performance/, '{getHeroDescription() || "High-performance');

// 6. Fix minimal-type case
content = content.replace(/\{settings\?\.heroSubtitle \|\| "Vol\. 01 — The Expedition"\}/, '{getHeroSubtitle() || "Vol. 01 — The Expedition"}');
content = content.replace(/\{settings\?\.heroTitle \? \(/, '{getHeroTitle() ? (');
content = content.replace(/__html: settings\.heroTitle\.replace/, '__html: getHeroTitle()!.replace');
content = content.replace(/\{settings\?\.heroDescription \|\| "A curated study/, '{getHeroDescription() || "A curated study');

// 7. Fix premium-serif case
content = content.replace(/\{settings\?\.heroSubtitle \|\| "The Signature Collection"\}/, '{getHeroSubtitle() || "The Signature Collection"}');
content = content.replace(/\{settings\?\.heroTitle \? \(/, '{getHeroTitle() ? (');
content = content.replace(/__html: settings\.heroTitle\.replace/, '__html: getHeroTitle()!.replace');
content = content.replace(/\{settings\?\.heroDescription \|\| "Where high luxury/, '{getHeroDescription() || "Where high luxury');

// 8. Fix saas-clean case
content = content.replace(/\{settings\?\.heroTitle \? \(/, '{getHeroTitle() ? (');
content = content.replace(/__html: settings\.heroTitle\.replace/, '__html: getHeroTitle()!.replace');
content = content.replace(/\{settings\?\.heroDescription \|\| "Unified infrastructure/, '{getHeroDescription() || "Unified infrastructure');

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Fixed Home.tsx');
