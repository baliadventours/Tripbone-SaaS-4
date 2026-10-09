import { GoogleGenAI, Type } from "@google/genai";
import { getAdminDb } from "./firebaseAdmin.js";
import { moderateCreemContent } from "./creemService.js";
import { fetchFromREST } from "./apiHelpers.js";

let genAI: any = null;
let db: any = null;

function getChatbotDb() {
  if (!db) {
    db = getAdminDb();
  }
  return db;
}

// Tool Definitions for Google SDK
export const chatbotTools = [
  {
    functionDeclarations: [
      {
        name: "search_tours",
        description: "Search for tours by keyword or category. Use this to find tours the user might be interested in.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            searchTerm: {
              type: Type.STRING,
              description: "The term to search for (e.g. 'volcano', 'beach', 'ubud')",
            },
          },
          required: ["searchTerm"],
        },
      },
      {
        name: "get_tour_details",
        description: "Get full details for a specific tour including price, description, multiple packages with tiered pricing (prices that change based on number of participants), and direct link.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            tourId: {
              type: Type.STRING,
              description: "The ID of the tour to fetch details for.",
            },
          },
          required: ["tourId"],
        },
      },
      {
        name: "check_availability",
        description: "Check if a tour is available on a specific date.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            tourId: {
              type: Type.STRING,
              description: "The ID of the tour.",
            },
            date: {
              type: Type.STRING,
              description: "The date in YYYY-MM-DD format.",
            },
          },
          required: ["tourId", "date"],
        },
      },
      {
        name: "check_booking_status",
        description: "Check the current status and details of a tour booking.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            bookingId: {
              type: Type.STRING,
              description: "The unique booking reference ID (e.g. #ABC12345).",
            },
            email: {
              type: Type.STRING,
              description: "The email address used for the booking.",
            },
          },
          required: ["bookingId", "email"],
        },
      },
    ],
  },
];

const getToolImplementations = (tenantId?: string | null, origin: string = '') => {
  const adminDb = getChatbotDb();
  return {
    search_tours: async ({ searchTerm }: { searchTerm: string }) => {
      let tours: any[] = [];
      try {
        let q = adminDb.collection('tours').where('status', 'in', ['published', 'active']);
        if (tenantId) {
          q = q.where('tenantId', '==', tenantId);
        }
        const snap = await q.limit(40).get();
        if (!snap.empty) {
          tours = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {}

      // If tenant has fewer than 3 tours, augment with live catalog tours from all tenants
      if (tours.length < 3) {
        try {
          const allRest = await fetchFromREST('tours', undefined, { limit: 100 });
          if (Array.isArray(allRest)) {
            const liveTours = allRest.filter((t: any) => t.status === 'published' || t.status === 'active');
            for (const lt of liveTours) {
              if (!tours.some(existing => existing.id === lt.id)) {
                tours.push(lt);
              }
            }
          }
        } catch (e) {}
      }

      // Filter out invalid/empty tours
      tours = tours.filter((t: any) => t && t.title && t.title.trim().length > 2);

      const term = (searchTerm || '').toLowerCase().trim();
      let filtered = tours;
      if (term && !['tour', 'tours', 'all', 'bali', 'book', 'trip', 'package'].includes(term)) {
        const words = term.split(/\s+/).filter(w => w.length > 2);
        filtered = tours.filter((t: any) => {
          const title = (t.title || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();
          const cat = (t.category || '').toLowerCase();
          const loc = (t.location || '').toLowerCase();
          return words.some(w => title.includes(w) || desc.includes(w) || cat.includes(w) || loc.includes(w)) ||
                 title.includes(term) || desc.includes(term);
        });
        if (filtered.length === 0) filtered = tours;
      }

      return filtered.slice(0, 6).map((t: any) => {
        const safeSlug = (t.slug && t.slug !== 'undefined' && t.slug.trim())
          ? t.slug.trim()
          : (t.title ? t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : t.id);

        return {
          tourId: t.id,
          title: t.title,
          price: t.discountPrice || t.regularPrice || 0,
          duration: t.duration ? `${t.duration} ${t.durationUnit || 'Day'}` : 'Full Day',
          slug: safeSlug,
          bookingUrl: `/tours/${encodeURIComponent(safeSlug)}`
        };
      });
    },
    get_tour_details: async ({ tourId }: { tourId: string }) => {
      let t: any = null;
      try {
        const snap = await adminDb.collection('tours').doc(tourId).get();
        if (snap.exists) t = { id: snap.id, ...snap.data() };
      } catch (e) {}

      if (!t) {
        try {
          t = await fetchFromREST('tours', tourId);
        } catch (e) {}
      }

      // Fallback: search by slug or ID across live catalog
      if (!t) {
        try {
          const allRest = await fetchFromREST('tours', undefined, { limit: 100 });
          if (Array.isArray(allRest)) {
            t = allRest.find((x: any) => x.slug === tourId || x.id === tourId || (x.title && x.title.toLowerCase() === tourId.toLowerCase()));
          }
        } catch (e) {}
      }

      if (!t) return { error: "Tour not found in live catalog" };

      const safeSlug = (t.slug && t.slug !== 'undefined' && t.slug.trim())
        ? t.slug.trim()
        : (t.title ? t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : t.id);

      return {
        tourId: t.id,
        title: t.title,
        description: t.description,
        price: t.discountPrice || t.regularPrice,
        packages: t.packages?.map((p: any) => ({
          name: p.name,
          tiers: p.tiers
        })),
        bookingUrl: `/tours/${encodeURIComponent(safeSlug)}`,
        slug: safeSlug,
        highlights: t.highlights,
        itinerary: t.itinerary?.map((i: any) => ({ day: i.day, title: i.title }))
      };
    },
    check_availability: async ({ tourId, date }: { tourId: string, date: string }) => {
      const tourSnap = await adminDb.collection('tours').doc(tourId).get();
      if (!tourSnap.exists) return { error: "Tour not found" };
      const tour = tourSnap.data();
      if (tenantId && tour.tenantId !== tenantId) {
        return { error: "Tour not found in this workspace" };
      }

      const inventoryId = `${tourId}_${date}_daily`;
      const invSnap = await adminDb.collection('inventory').doc(inventoryId).get();
      
      if (invSnap.exists) {
        const data = invSnap.data();
        const left = data.maxCapacity - data.bookedCount;
        return {
          available: left > 0,
          remainingSlots: left,
          maxCapacity: data.maxCapacity
        };
      }
      
      return {
        available: true,
        message: "Likely available, please check selection on tour page.",
        maxCapacity: tour.maxCapacity || 20
      };
    },
    check_booking_status: async ({ bookingId, email }: { bookingId: string, email: string }) => {
      const cleanId = bookingId.replace(/^#/, '').trim();
      const snap = await adminDb.collection('bookings').doc(cleanId).get();
      
      if (!snap.exists) {
        return { error: "Booking not found with this ID. Please double check your booking reference." };
      }
      
      const b = snap.data();
      if (tenantId && b.tenantId !== tenantId) {
        return { error: "Booking not found in this workspace" };
      }
      if (!b.customerData || (b.customerData?.email || '').toLowerCase() !== email.toLowerCase()) {
        return { error: "The provided email does not match the record for this booking ID." };
      }
      
      return {
        id: snap.id,
        status: b.status,
        tourTitle: b.tourTitle,
        date: b.date,
        totalAmount: b.totalAmount,
        customerName: b.customerData?.fullName || 'Guest',
        paymentStatus: b.paymentStatus || 'pending'
      };
    }
  };
};

export async function handleChatbotRequest(messages: any[], origin: string, tenantId?: string | null) {
  const adminDb = getChatbotDb();
  let brandName = "Bali Adventours";
  let whatsappLink = 'https://wa.me/6281246502939'; // fallback
  let tenantApiKey: string | undefined;
  try {
    let tenantPhone: string | undefined;
    try {
      const settingsDoc = await adminDb.collection('settings').doc(tenantId || 'general').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        if (data?.siteName) brandName = data.siteName;
        if (data?.whatsappNumber || data?.supportPhone || data?.phone) {
          tenantPhone = data.whatsappNumber || data.supportPhone || data.phone;
        }
      }
    } catch (dbErr) {
      // Fallback via REST
      try {
        const data = await fetchFromREST('settings', tenantId || 'general');
        if (data?.siteName) brandName = data.siteName;
        if (data?.whatsappNumber || data?.supportPhone || data?.phone) {
          tenantPhone = data.whatsappNumber || data.supportPhone || data.phone;
        }
      } catch (e) {}
    }

    let commSettingsData: any = null;
    try {
      const commSettingsDoc = await adminDb.collection('communicationSettings').doc(tenantId || 'global').get();
      if (commSettingsDoc.exists) {
        commSettingsData = commSettingsDoc.data();
      }
    } catch (commErr) {
      try {
        commSettingsData = await fetchFromREST('communicationSettings', tenantId || 'global');
      } catch (e) {}
    }

    let num = '6281246502939'; // default fallback
    if (commSettingsData) {
      const s = commSettingsData;
      const communicationPhone = s.whatsappNumber || s.supportPhone;
      if (communicationPhone) {
        num = communicationPhone.replace(/\D/g, '');
      } else if (tenantPhone) {
        num = tenantPhone.replace(/\D/g, '');
      }
      if (s?.geminiApiKey && typeof s.geminiApiKey === 'string' && s.geminiApiKey.trim().length > 15) {
        tenantApiKey = s.geminiApiKey.trim();
      }
    } else if (tenantPhone) {
      num = tenantPhone.replace(/\D/g, '');
    }
    whatsappLink = `https://wa.me/${num}`;
  } catch (e) {
    console.error("Failed to fetch settings for chatbot:", e);
  }

  const apiKey = (tenantApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a friendly and helpful assistant for "${brandName}".
Your goal is to help customers find the perfect tour, answer questions, and provide info about our adventures.

CAPABILITIES:
- You can SEARCH for tours in our live database.
- You can GET LIVE DETAILS (price, description, packages, and tiered pricing) for any specific tour.
- You can SUGGEST THE PRICE LIST: If a customer wants to see all prices at once or compare multiple tours, you can suggest they visit the "/price-list" page for a complete directory.
- You can EXPLAIN TIERED PRICING: Most tours have different prices depending on how many people are booking.
- You can MENTION MULTI-CURRENCY: Inform users they can switch their preferred currency (USD, EUR, GBP, AUD, JPY, etc.) at the top of the page (in the header) to see prices in their local currency.

CONVENTIONS:
- Be warm and welcoming.
- Keep responses concise. Use double line breaks between paragraphs for readability.
- When recommending any tour, search our real catalog using search_tours. Always provide direct relative internal links using the tour's real slug or id from the tool result: [Tour Title](/tours/<slug>).
- ALWAYS format tour links as relative internal paths starting with "/tours/" (e.g. [Tour Title](/tours/tour-slug-or-id)). NEVER write absolute URLs with https:// or http:// or localhost.
- NEVER write literal placeholder text like "/tours/[slug]" or fake tour URLs. Only link to real tours found in the database.
- Use English as your primary language for communication.
- If you cannot solve a problem or if the user asks for a real person, suggest they chat with us on WhatsApp for human assistance: [Chat on WhatsApp](${whatsappLink})
- If a technical error occurs during your tool usage, politely inform the user and share the WhatsApp link.`;
  
  // Format history safely: Gemini API requires chat history to alternate user/model starting with user
  let history = messages.slice(0, -1).map((m: any) => ({
    role: m.role,
    parts: [{ text: typeof m.parts === 'string' ? m.parts : JSON.stringify(m.parts) }]
  }));

  // If initial welcome greeting was role: 'model', drop it so history begins with user
  if (history.length > 0 && history[0].role === 'model') {
    history = history.slice(1);
  }

  const lastMessage = messages[messages.length - 1];
  const userMessageText = typeof lastMessage?.parts === 'string' ? lastMessage.parts : JSON.stringify(lastMessage?.parts || '');

  if (userMessageText) {
    try {
      await moderateCreemContent(userMessageText);
    } catch (modErr: any) {
      if (modErr.message?.includes('violates') || modErr.message?.includes('safety guidelines')) {
        console.warn("[Chatbot Moderation Blocked]:", modErr.message);
        return { text: "I'm sorry, but your message violates our content safety policy and cannot be processed." };
      }
      console.warn("[Chatbot Moderation Note]:", modErr.message);
    }
  }

  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
  const keysToTry = [apiKey, process.env.GEMINI_API_KEY].filter(Boolean) as string[];
  const uniqueKeys = Array.from(new Set(keysToTry));

  let activeChat: any = null;
  let result: any = null;

  // 1. Try with tools across candidate keys and models
  for (const currentKey of uniqueKeys) {
    const clientAi = new GoogleGenAI({ apiKey: currentKey });
    for (const model of modelsToTry) {
      try {
        const candidateChat = clientAi.chats.create({
          model,
          history,
          config: {
            systemInstruction,
            tools: chatbotTools,
          }
        });
        result = await candidateChat.sendMessage({ message: userMessageText });
        activeChat = candidateChat;
        break;
      } catch (err: any) {
        console.warn(`[Chatbot] Model ${model} with key ${currentKey.substring(0, 8)} failed:`, err?.message || err);
      }
    }
    if (result) break;
  }

  // 2. If tools failed (e.g. 503 or tool schema issue), try without tools across keys and models
  if (!result) {
    for (const currentKey of uniqueKeys) {
      const clientAi = new GoogleGenAI({ apiKey: currentKey });
      for (const model of modelsToTry) {
        try {
          const candidateChat = clientAi.chats.create({
            model,
            history,
            config: { systemInstruction }
          });
          result = await candidateChat.sendMessage({ message: userMessageText });
          activeChat = candidateChat;
          break;
        } catch (err: any) {
          console.warn(`[Chatbot] Model ${model} sans-tools failed:`, err?.message || err);
        }
      }
      if (result) break;
    }
  }

  if (!result || !activeChat) {
    return { 
      text: `Halo! I'm here to help you. How can I assist you with booking or tour information for ${brandName}? You can also [chat with us on WhatsApp](${whatsappLink}) anytime!` 
    };
  }
  
  const handleFunctionCalls = async (response: any): Promise<any> => {
    const functionCalls = response.functionCalls;
    const toolImplementations = getToolImplementations(tenantId, origin);

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses = await Promise.all(
        functionCalls.map(async (call: any) => {
          const name = call.name as keyof typeof toolImplementations;
          const args = call.args;
          try {
            const toolResult = await toolImplementations[name](args as any);
            return {
              functionResponse: {
                name,
                response: { result: toolResult }
              }
            };
          } catch (error) {
            return {
              functionResponse: {
                name,
                response: { error: "Failed to fetch live data." }
              }
            };
          }
        })
      );
      
      try {
        const nextResult = await activeChat.sendMessage({ message: functionResponses });
        return handleFunctionCalls(nextResult);
      } catch (fnErr) {
        console.warn("[Chatbot] Error sending function responses:", fnErr);
        return response;
      }
    }
    return response;
  };

  const finalResponse = await handleFunctionCalls(result);
  return { text: finalResponse.text || "I'm sorry, I couldn't quite get that." };
}
