import axios from 'axios';
import { generateContentWithFallback } from './apiHelpers.js';
import { Tour } from '../types.js';

interface TinyFishExtractResult {
  success: boolean;
  tour?: Partial<Tour>;
  rawMarkdown?: string;
  source: 'tinyfish' | 'fallback_crawler';
  error?: string;
}

interface CompetitorRateResult {
  success: boolean;
  title?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  operatorName?: string;
  url: string;
  lastChecked: string;
  error?: string;
}

/**
 * Normalizes and sanitizes extracted tour data to ensure strict compliance
 * with Tripbone Tour schema and Firestore guidelines (no undefined fields).
 */
function sanitizeTourData(extracted: any, originalUrl: string): Partial<Tour> {
  const safeTitle = String(extracted.title || 'Imported Adventure Experience').trim();
  const safeSlug = String(extracted.slug || safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  
  const regularPrice = typeof extracted.regularPrice === 'number' && !isNaN(extracted.regularPrice) && extracted.regularPrice > 0
    ? extracted.regularPrice 
    : 50;
    
  const discountPrice = typeof extracted.discountPrice === 'number' && !isNaN(extracted.discountPrice) && extracted.discountPrice > 0
    ? extracted.discountPrice
    : undefined;

  const highlights = Array.isArray(extracted.highlights) 
    ? extracted.highlights.map((h: any) => String(h).trim()).filter(Boolean)
    : [];

  const inclusions = Array.isArray(extracted.inclusions)
    ? extracted.inclusions.map((i: any) => String(i).trim()).filter(Boolean)
    : ["English-speaking local guide", "Hotel pickup & drop-off", "Bottled mineral water"];

  const exclusions = Array.isArray(extracted.exclusions)
    ? extracted.exclusions.map((e: any) => String(e).trim()).filter(Boolean)
    : ["Personal expenses", "Gratuities & tips", "Optional activity add-ons"];

  const languages = Array.isArray(extracted.languages) && extracted.languages.length > 0
    ? extracted.languages.map((l: any) => String(l).trim()).filter(Boolean)
    : ["English"];

  const gallery = Array.isArray(extracted.gallery) && extracted.gallery.length > 0
    ? extracted.gallery.map((img: any) => String(img).trim()).filter((img: string) => img.startsWith('http'))
    : ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"];

  const itinerary = Array.isArray(extracted.itinerary) && extracted.itinerary.length > 0
    ? extracted.itinerary.map((item: any, idx: number) => ({
        day: typeof item.day === 'number' ? item.day : idx + 1,
        title: String(item.title || `Stop ${idx + 1}`).trim(),
        description: String(item.description || '').trim(),
        image: typeof item.image === 'string' && item.image.startsWith('http') ? item.image : undefined
      }))
    : [
        {
          day: 1,
          title: "Pickup & Scenic Journey",
          description: "Meet your driver at the accommodation lobby and start the excursion."
        },
        {
          day: 1,
          title: "Main Tour Activity",
          description: "Experience the curated highlights with our professional local guide."
        },
        {
          day: 1,
          title: "Return Transfer",
          description: "Conclude the tour and safely transfer back to your hotel."
        }
      ];

  const faqs = Array.isArray(extracted.faqs) && extracted.faqs.length > 0
    ? extracted.faqs.map((f: any) => ({
        question: String(f.question || '').trim(),
        answer: String(f.answer || '').trim()
      })).filter((f: any) => f.question && f.answer)
    : [
        {
          question: "What should I bring on this tour?",
          answer: "Comfortable walking shoes, sunscreen, a hat, camera, and personal medications."
        },
        {
          question: "What is the cancellation policy?",
          answer: "Full refund up to 24 hours before the experience start time."
        }
      ];

  const packages = Array.isArray(extracted.packages) && extracted.packages.length > 0
    ? extracted.packages.map((pkg: any) => ({
        name: String(pkg.name || 'Standard Package').trim(),
        details: String(pkg.details || 'Includes all standard activities and transfers').trim(),
        inclusions: Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? pkg.inclusions : inclusions,
        exclusions: Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 ? pkg.exclusions : exclusions,
        tiers: Array.isArray(pkg.tiers) && pkg.tiers.length > 0
          ? pkg.tiers.map((t: any) => ({
              minParticipants: typeof t.minParticipants === 'number' ? t.minParticipants : 1,
              maxParticipants: typeof t.maxParticipants === 'number' ? t.maxParticipants : 15,
              adultPrice: typeof t.adultPrice === 'number' ? t.adultPrice : regularPrice,
              childPrice: typeof t.childPrice === 'number' ? t.childPrice : Math.round(regularPrice * 0.7)
            }))
          : [
              {
                minParticipants: 1,
                maxParticipants: 15,
                adultPrice: regularPrice,
                childPrice: Math.round(regularPrice * 0.7)
              }
            ]
      }))
    : [
        {
          name: "Standard Package",
          details: "Standard experience with full itinerary inclusions.",
          inclusions,
          exclusions,
          tiers: [
            {
              minParticipants: 1,
              maxParticipants: 15,
              adultPrice: regularPrice,
              childPrice: Math.round(regularPrice * 0.7)
            }
          ]
        }
      ];

  const sanitized: Partial<Tour> = {
    title: safeTitle,
    slug: safeSlug,
    description: String(extracted.description || safeTitle).trim(),
    duration: String(extracted.duration || '6 - 8 Hours').trim(),
    location: String(extracted.location || 'Bali, Indonesia').trim(),
    locationMapUrl: String(extracted.locationMapUrl || 'https://maps.google.com'),
    regularPrice,
    ...(discountPrice ? { discountPrice } : {}),
    highlights,
    inclusions,
    exclusions,
    itinerary,
    faqs,
    languages,
    gallery,
    featuredImage: gallery[0] || undefined,
    packages,
    status: 'draft',
    rating: typeof extracted.rating === 'number' ? extracted.rating : 4.9,
    reviewsCount: typeof extracted.reviewsCount === 'number' ? extracted.reviewsCount : 124,
    importantInfo: String(extracted.importantInfo || 'Please arrive 15 minutes before the scheduled pickup time.').trim(),
    seo: {
      title: safeTitle,
      description: String(extracted.description || safeTitle).slice(0, 155),
      keywords: `${safeTitle}, tour, excursion, holiday, travel booking`
    }
  };

  return sanitized;
}

/**
 * Extracts tour details from any public travel URL (Viator, GetYourGuide, TripAdvisor, Airbnb, etc.)
 * utilizing TinyFish.ai Web Agent/Fetch infrastructure with fallback grounding.
 */
export async function extractTourFromUrl(
  url: string,
  customApiKey?: string
): Promise<TinyFishExtractResult> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { success: false, error: 'A valid HTTP or HTTPS tour URL is required.', source: 'tinyfish' };
  }

  const apiKey = (customApiKey || process.env.TINYFISH_API_KEY || '').trim();
  let pageMarkdown = '';
  let source: 'tinyfish' | 'fallback_crawler' = 'tinyfish';

  // Step 1: Call TinyFish Fetch / Agent API if API key is present
  if (apiKey) {
    try {
      console.log(`[TinyFish] Fetching web content via TinyFish API for: ${url}`);
      const tinyFishResponse = await axios.post(
        'https://api.fetch.tinyfish.ai',
        {
          url,
          format: 'markdown',
          include_links: false,
          include_images: true
        },
        {
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 35000
        }
      );

      if (tinyFishResponse.data && (tinyFishResponse.data.content || tinyFishResponse.data.markdown)) {
        pageMarkdown = tinyFishResponse.data.content || tinyFishResponse.data.markdown;
        source = 'tinyfish';
        console.log(`[TinyFish] Successfully extracted ${pageMarkdown.length} characters of markdown.`);
      }
    } catch (tinyFishErr: any) {
      console.warn(`[TinyFish] Primary API error (${tinyFishErr.message}), falling back to direct web fetch.`);
    }
  }

  // Step 2: Fallback direct fetch if TinyFish key is pending or failed
  if (!pageMarkdown) {
    try {
      source = 'fallback_crawler';
      console.log(`[TinyFish] Attempting direct fetch fallback for: ${url}`);
      const directResponse = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 20000,
        maxRedirects: 5
      });
      // Strip script/style tags for concise extraction
      const rawHtml = String(directResponse.data || '');
      pageMarkdown = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 25000);
    } catch (directErr: any) {
      console.warn(`[TinyFish] Direct fetch warning: ${directErr.message}`);
    }
  }

  // Step 3: Parse extracted web contents into Tripbone Tour schema via Gemini
  try {
    const prompt = `You are Tripbone's Tour Extraction Engine. 
The user provided a live travel/tour URL: "${url}".
Here is the extracted content from the webpage:
"""
${pageMarkdown.slice(0, 18000)}
"""

Extract and normalize this into a JSON object matching this schema EXACTLY:
{
  "title": "Clear tour title",
  "description": "Comprehensive compelling 2-3 paragraph tour description",
  "duration": "e.g. 8 Hours, Full Day, or 3 Days",
  "location": "e.g. Ubud, Bali, Indonesia",
  "regularPrice": 75, // numeric estimated adult price in USD or local currency
  "discountPrice": 65, // optional promo price if present
  "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"],
  "inclusions": ["Pickup and drop-off", "Bottled water", "English speaking guide", "Entry tickets"],
  "exclusions": ["Lunch and drinks", "Personal expenses", "Gratuities"],
  "languages": ["English"],
  "gallery": ["https://... (valid high quality image URLs found in the content)"],
  "itinerary": [
    { "day": 1, "title": "Stop 1 Name", "description": "What happens here" },
    { "day": 1, "title": "Stop 2 Name", "description": "What happens here" }
  ],
  "faqs": [
    { "question": "Question 1", "answer": "Answer 1" }
  ],
  "packages": [
    {
      "name": "Standard Option",
      "details": "All inclusions mentioned above",
      "inclusions": ["Pickup", "Guide"],
      "exclusions": ["Gratuities"],
      "tiers": [
        { "minParticipants": 1, "maxParticipants": 15, "adultPrice": 75, "childPrice": 50 }
      ]
    }
  ]
}

Respond ONLY with valid JSON. Do not wrap in markdown quotes if possible or use clean JSON.`;

    const aiResponse = await generateContentWithFallback(prompt, {
      temperature: 0.2
    });

    const cleanedText = aiResponse.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsedData = JSON.parse(cleanedText);
    const sanitizedTour = sanitizeTourData(parsedData, url);

    return {
      success: true,
      tour: sanitizedTour,
      rawMarkdown: pageMarkdown.slice(0, 500),
      source
    };
  } catch (parseErr: any) {
    console.error('[TinyFish] Failed to parse tour data:', parseErr);
    return {
      success: false,
      error: `Could not parse structured tour data from link: ${parseErr.message}`,
      source
    };
  }
}

/**
 * Extracts live competitor pricing and review ratings for market intelligence in ChannelManager.
 */
export async function extractCompetitorPrice(
  url: string,
  customApiKey?: string
): Promise<CompetitorRateResult> {
  const result: CompetitorRateResult = {
    success: false,
    url,
    lastChecked: new Date().toISOString()
  };

  try {
    const extracted = await extractTourFromUrl(url, customApiKey);
    if (extracted.success && extracted.tour) {
      result.success = true;
      result.title = extracted.tour.title;
      result.price = extracted.tour.regularPrice;
      result.currency = 'USD';
      result.rating = extracted.tour.rating || 4.8;
      result.reviewCount = extracted.tour.reviewsCount || 50;
      result.operatorName = extracted.tour.location || 'Competitor';
    } else {
      result.error = extracted.error || 'Failed to extract competitor pricing';
    }
  } catch (err: any) {
    result.error = err.message;
  }

  return result;
}
