import { GoogleGenAI, Type } from "@google/genai";
import { getAdminDb } from "./firebaseAdmin.js";
import { moderateCreemContent } from "./creemService.js";

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

const getToolImplementations = (tenantId?: string | null) => {
  const adminDb = getChatbotDb();
  return {
    search_tours: async ({ searchTerm }: { searchTerm: string }) => {
      let q = adminDb.collection('tours').where('status', '==', 'active');
      if (tenantId) {
        q = q.where('tenantId', '==', tenantId);
      }
      const snap = await q.limit(20).get();
      
      const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const filtered = all.filter((t: any) => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filtered.map((t: any) => ({
        id: t.id,
        title: t.title,
        price: t.regularPrice,
        duration: t.duration,
        slug: t.slug
      }));
    },
    get_tour_details: async ({ tourId }: { tourId: string }) => {
      const snap = await adminDb.collection('tours').doc(tourId).get();
      if (!snap.exists) return { error: "Tour not found" };
      
      const t = { id: snap.id, ...snap.data() };
      if (tenantId && t.tenantId !== tenantId) {
        return { error: "Tour not found in this workspace" };
      }
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        price: t.regularPrice,
        packages: t.packages?.map((p: any) => ({
          name: p.name,
          tiers: p.tiers
        })),
        bookingLink: `/tours/${t.slug}`,
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
    const settingsDoc = await adminDb.collection('settings').doc(tenantId || 'general').get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data?.siteName) brandName = data.siteName;
      if (data?.whatsappNumber || data?.supportPhone || data?.phone) {
        tenantPhone = data.whatsappNumber || data.supportPhone || data.phone;
      }
    }

    const commSettingsDoc = await adminDb.collection('communicationSettings').doc(tenantId || 'global').get();
    let num = '6281246502939'; // default fallback
    if (commSettingsDoc.exists) {
      const s = commSettingsDoc.data();
      const communicationPhone = s.whatsappNumber || s.supportPhone;
      if (communicationPhone) {
        num = communicationPhone.replace(/\D/g, '');
      } else if (tenantPhone) {
        num = tenantPhone.replace(/\D/g, '');
      }
      if (s?.geminiApiKey) {
        tenantApiKey = s.geminiApiKey;
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
- ALWAYS provide the direct booking link: [Tour Title](${origin}/tours/[slug])
- Use English as your primary language for communication.
- If you cannot solve a problem or if the user asks for a real person, suggest they chat with us on WhatsApp for human assistance: [Chat on WhatsApp](${whatsappLink})
- If a technical error occurs during your tool usage, politely inform the user and share the WhatsApp link.`;
  
  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role,
    parts: [{ text: m.parts }]
  }));

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history,
    config: {
      systemInstruction,
      tools: chatbotTools,
    }
  });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.parts) {
    try {
      await moderateCreemContent(typeof lastMessage.parts === 'string' ? lastMessage.parts : JSON.stringify(lastMessage.parts));
    } catch (modErr: any) {
      if (modErr.message?.includes('violates') || modErr.message?.includes('safety guidelines')) {
        console.warn("[Chatbot Moderation Blocked]:", modErr.message);
        return { text: "I'm sorry, but your message violates our content safety policy and cannot be processed." };
      }
      console.warn("[Chatbot Moderation Note]:", modErr.message);
    }
  }

  let result;
  try {
    result = await chat.sendMessage({ message: lastMessage.parts });
  } catch (chatErr: any) {
    console.error("[Chatbot Gemini API Error]:", chatErr);
    return { 
      text: `Halo! I'm here to help you. How can I assist you with booking or tour information for ${brandName}? You can also [chat with us on WhatsApp](${whatsappLink}) anytime!` 
    };
  }
  
  const handleFunctionCalls = async (response: any): Promise<any> => {
    const functionCalls = response.functionCalls;
    const toolImplementations = getToolImplementations(tenantId);

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
      
      const nextResult = await chat.sendMessage({ message: functionResponses });
      return handleFunctionCalls(nextResult);
    }
    return response;
  };

  const finalResponse = await handleFunctionCalls(result);
  return { text: finalResponse.text || "I'm sorry, I couldn't quite get that." };
}
