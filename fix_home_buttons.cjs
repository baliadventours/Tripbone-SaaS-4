const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Add getHeroBadge, getPrimaryButtonText, getPrimaryButtonLink, getSecondaryButtonText, getSecondaryButtonLink
const helpers = `
  const getHeroBadge = () => {
    const val = heroBlock?.badge;
    return typeof val === 'string' && val.trim() !== '' ? val : null;
  };
  const getPrimaryButtonText = (fallback) => {
    const val = heroBlock?.primaryButtonText;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getPrimaryButtonLink = (fallback) => {
    const val = heroBlock?.primaryButtonLink;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getSecondaryButtonText = (fallback) => {
    const val = heroBlock?.secondaryButtonText;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
  const getSecondaryButtonLink = (fallback) => {
    const val = heroBlock?.secondaryButtonLink;
    return typeof val === 'string' && val.trim() !== '' ? val : fallback;
  };
`;
content = content.replace(/const getHeroDescription = \(\) => \{[\s\S]*?\};\n/, match => match + helpers);

// 2. Fix badge in slideshow-atv
content = content.replace(/badge: slide\.badge/, 'badge: getHeroBadge() || slide.badge');
// Wait, `slidesToUse` maps `SLIDES` badge:
// Let's replace the `result.map(slide => ({` to also include badge:
const slidesMapRegex = /return result\.map\(slide => \(\{\n\s*\.\.\.slide,\n\s*title: hasCustomTitle \? baseTitle : slide\.title,\n\s*subtitle: hasCustomSubtitle \? baseSubtitle : \(slide\.subtitle\.includes\('GORILLA'\) \? baseSubtitle : slide\.subtitle\),\n\s*description: hasCustomDesc \? baseDesc : slide\.description\.replace\(\/Gorilla ATV Adventure\/ig, settings\?\.siteName \|\| 'Tripbone'\),\n\s*\}\)\);/g;
const newSlidesMap = `return result.map(slide => ({
      ...slide,
      badge: getHeroBadge() || slide.badge,
      title: hasCustomTitle ? baseTitle : slide.title,
      subtitle: hasCustomSubtitle ? baseSubtitle : (slide.subtitle.includes('GORILLA') ? baseSubtitle : slide.subtitle),
      description: hasCustomDesc ? baseDesc : slide.description.replace(/Gorilla ATV Adventure/ig, settings?.siteName || 'Tripbone'),
    }));`;
content = content.replace(slidesMapRegex, newSlidesMap);

// Replace button texts in slideshow-atv
content = content.replace(/<span>Book ATV Tour Now<\/span>/g, '<span>{getPrimaryButtonText("Book ATV Tour Now")}</span>');
content = content.replace(/to="\/tours\?search=atv"/g, 'to={getPrimaryButtonLink("/tours?search=atv")}');
content = content.replace(/<span>Inquire \/ Contact<\/span>/g, '<span>{getSecondaryButtonText("Inquire / Contact")}</span>');
content = content.replace(/to="\/contact"/g, 'to={getSecondaryButtonLink("/contact")}');
content = content.replace(/to="\/tours"/g, 'to={getPrimaryButtonLink("/tours")}');

// Replace button texts in other styles
content = content.replace(/>Explore Expedition</g, '>{getPrimaryButtonText("Explore Expedition")}<');
content = content.replace(/>Book Now</g, '>{getPrimaryButtonText("Book Now")}<');
content = content.replace(/>Contact Us</g, '>{getSecondaryButtonText("Contact Us")}<');

content = content.replace(/<span>Explore Tours<\/span>/g, '<span>{getPrimaryButtonText("Explore Tours")}</span>');
content = content.replace(/<span>Destinations<\/span>/g, '<span>{getSecondaryButtonText("Destinations")}</span>');

// For modern-dark
content = content.replace(/>View All Expeditions</g, '>{getPrimaryButtonText("View All Expeditions")}<');
content = content.replace(/>Private Charter</g, '>{getSecondaryButtonText("Private Charter")}<');

// For saas-clean
content = content.replace(/>Start Exploring</g, '>{getPrimaryButtonText("Start Exploring")}<');
content = content.replace(/>Developer API</g, '>{getSecondaryButtonText("Developer API")}<');

// Make sure `to` attributes use the dynamic links.
// Let's manually replace specific hardcoded links if they match the button contexts.
// The easiest is just doing a regex for `<Link to="/tours"` and replacing it where appropriate.
// But we already replaced `/tours?search=atv`, `/tours`, and `/contact`.

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Fixed Home.tsx buttons and badge');
