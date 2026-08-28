import { db, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, getDoc, query, where, orderBy, setDoc } from './firebase';
import { getActiveTenantId } from './firebase';
import { WaiverTemplate, SignedWaiver, ActivityWaiverType, Booking } from '../types';
import { sanitizeFirestoreData } from './invoiceService';

export const PRESET_WAIVER_TEMPLATES: Omit<WaiverTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'General Activity & Liability Release Waiver',
    activityType: 'sightseeing',
    description: 'Standard liability release, health acknowledgment, and photo/video consent for day tours and cultural excursions.',
    isDefault: true,
    active: true,
    requirePassportId: true,
    requireEmergencyContact: true,
    requireMedicalChecklist: true,
    requireMinorParentSignature: true,
    requirePhotoVideoConsent: true,
    medicalQuestions: [
      'Do you have any severe heart conditions or hypertension?',
      'Are you currently pregnant or recovering from recent major surgery?',
      'Do you have any severe allergies or respiratory issues?'
    ],
    termsContent: `1. ASSUMPTION OF RISK
I understand and acknowledge that participating in guided tours and recreational travel activities involves inherent risks, including but not limited to travel over rough terrain, weather variations, interactions with wildlife, and physical exertion. I voluntarily assume full responsibility for any risks of loss, property damage, or personal injury that may be sustained by me or participants under my guardianship.

2. RELEASE OF LIABILITY
I hereby release, waive, and forever discharge the tour operator, its directors, officers, employees, guides, and agents from any and all liability, claims, demands, or causes of action arising out of negligence, property damage, or injury incurred during the tour.

3. MEDICAL & HEALTH DECLARATION
I certify that I and all registered participants are physically and mentally fit to participate in this activity. I agree to notify tour guides of any medical conditions, dietary allergies, or physical limitations prior to departure.

4. SAFETY COMPLIANCE & RULES
I agree to abide by all safety guidelines, local laws, environmental protection rules, and instructions provided by the tour guide at all times.

5. MEDIA & PHOTO CONSENT
I grant permission to the tour operator to capture photographs and video recordings during the activity for promotional, social media, and marketing purposes, unless explicitly revoked in writing prior to tour start.`
  },
  {
    title: 'Adventure & ATV / Quad Bike / Canyoning Liability Waiver',
    activityType: 'adventure',
    description: 'High-risk adventure release for ATV/UTV, quad biking, rafting, canyoning, and jungle buggy activities.',
    isDefault: false,
    active: true,
    requirePassportId: true,
    requireEmergencyContact: true,
    requireMedicalChecklist: true,
    requireMinorParentSignature: true,
    requirePhotoVideoConsent: true,
    medicalQuestions: [
      'Do you have any back, neck, spinal, or joint injuries?',
      'Do you suffer from epilepsy, dizziness, or fainting spells?',
      'Are you under the influence of alcohol, drugs, or impairing medication?'
    ],
    termsContent: `1. HIGH-RISK ACTIVITY ACKNOWLEDGMENT
I expressly acknowledge that operating or riding as a passenger on All-Terrain Vehicles (ATVs), buggies, or participating in river rafting and canyoning involves significant risk of rollover, collision, physical trauma, and equipment damage.

2. OPERATING RULES & VEHICLE CARE
I agree to wear the provided protective gear (helmet, boots, life vest) at all times. I agree to follow the designated guide tracks and maintain safe distances. Reckless driving, intentional drifting, or overtaking the guide is strictly prohibited and constitutes grounds for immediate termination without refund. I accept financial liability for intentional or negligent equipment damage.

3. AGE & MINOR PARTICIPATION
Minors under 16 years must ride as tandem passengers with an adult or guide. The signing parent/guardian accepts full legal and financial responsibility for the minor.

4. ALCOHOL & SUBSTANCE BAN
I certify that I am not under the influence of alcohol or non-prescribed narcotics. The operator reserves the right to refuse service to any individual exhibiting signs of intoxication.

5. COMPREHENSIVE INDEMNITY
I release and hold harmless the operator and guides from any claims resulting from accidents, trail hazards, unforeseen vehicle malfunctions, or personal misjudgment.`
  },
  {
    title: 'Water Sports, Snorkeling & Scuba Diving Safety Waiver',
    activityType: 'water_sports',
    description: 'Aquatic liability agreement, swimming capability declaration, and pressure equalization awareness.',
    isDefault: false,
    active: true,
    requirePassportId: true,
    requireEmergencyContact: true,
    requireMedicalChecklist: true,
    requireMinorParentSignature: true,
    requirePhotoVideoConsent: true,
    medicalQuestions: [
      'Do you have any asthma, respiratory conditions, or sinus equalization difficulties?',
      'Can you comfortably tread water or swim in open ocean conditions?',
      'Have you had any ear surgery or perforated eardrums?'
    ],
    termsContent: `1. OPEN WATER RISKS & CURRENTS
I acknowledge that swimming, snorkeling, and diving in open marine environments involves exposure to currents, tides, changing ocean conditions, and marine life.

2. LIFE JACKET & GEAR USAGE
I agree to wear the approved buoyancy aids/life vests provided by the crew unless certified as an advanced swimmer under guide supervision.

3. CORAL REEF & MARINE CONSERVATION
I agree not to touch, stand on, or break living coral reefs, nor to disturb or feed marine organisms. I accept responsibility for preserving the marine ecosystem.

4. HEALTH & PRESSURE EQUALIZATION
I confirm that I am fit for aquatic activities and understand the dangers of rapid ascents or holding breath while diving. I agree to abort the activity immediately if I experience pain, disorientation, or breathing distress.`
  },
  {
    title: 'Mount Batur / Agung Sunrise Volcano Trekking Waiver',
    activityType: 'trekking',
    description: 'Mountain trekking waiver covering steep volcanic terrain, dark morning ascents, and high altitude conditions.',
    isDefault: false,
    active: true,
    requirePassportId: true,
    requireEmergencyContact: true,
    requireMedicalChecklist: true,
    requireMinorParentSignature: true,
    requirePhotoVideoConsent: true,
    medicalQuestions: [
      'Do you have any cardiovascular, respiratory, or severe knee/joint issues?',
      'Are you comfortable trekking for 3-5 hours on steep loose gravel slopes?',
      'Do you carry personal inhalers or prescribed emergency medicine?'
    ],
    termsContent: `1. MOUNTAIN TERRAIN & NIGHT TREKKING RISKS
I understand that volcano trekking involves ascending in pre-dawn darkness on steep, slippery volcanic scree, gravel, and unpaved trails with variable temperatures and weather.

2. GUIDE LEADERSHIP & TRAIL DISCIPLINE
I agree to remain with my assigned guide and group, carry the provided headlamp, wear appropriate trekking footwear, and refrain from venturing onto unauthorized crater rims or active steam vents.

3. MEDICAL FITNESS & ASSUMPTION
I confirm that I possess the physical endurance required for sustained mountain hiking and accept full responsibility for my personal stamina and safety.`
  }
];

/**
 * Saves or updates a waiver template
 */
export async function saveWaiverTemplate(template: Partial<WaiverTemplate>): Promise<string> {
  const tenantId = template.tenantId || getActiveTenantId() || 'global';
  const now = new Date().toISOString();
  const id = template.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const cleanData = sanitizeFirestoreData({
    ...template,
    id,
    tenantId,
    updatedAt: now,
    createdAt: template.createdAt || now
  });

  await setDoc(doc(db, 'waiver_templates', id), cleanData, { merge: true });
  return id;
}

/**
 * Loads waiver templates for current tenant, auto-seeding presets if empty
 */
export async function getWaiverTemplates(tenantId: string): Promise<WaiverTemplate[]> {
  try {
    const q = query(collection(db, 'waiver_templates'));
    const snapshot = await getDocs(q);
    const list: WaiverTemplate[] = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as WaiverTemplate;
      if (!data.tenantId || data.tenantId === tenantId || tenantId === 'global') {
        list.push({ ...data, id: docSnap.id });
      }
    });

    // If no templates found, auto seed presets
    if (list.length === 0) {
      const seeded: WaiverTemplate[] = [];
      for (const preset of PRESET_WAIVER_TEMPLATES) {
        const id = `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const item: WaiverTemplate = {
          ...preset,
          id,
          tenantId: tenantId || 'global',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'waiver_templates', id), sanitizeFirestoreData(item), { merge: true });
        seeded.push(item);
      }
      return seeded;
    }

    return list;
  } catch (error) {
    console.error('Error fetching waiver templates:', error);
    return [];
  }
}

/**
 * Deletes a waiver template
 */
export async function deleteWaiverTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, 'waiver_templates', templateId));
}

/**
 * Saves a signed waiver submission and links it with the booking if available
 */
export async function saveSignedWaiver(waiver: Partial<SignedWaiver>): Promise<string> {
  const tenantId = waiver.tenantId || getActiveTenantId() || 'global';
  const now = new Date().toISOString();
  const id = waiver.id || `wv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const cleanData = sanitizeFirestoreData({
    ...waiver,
    id,
    tenantId,
    signedAt: waiver.signedAt || now,
    status: waiver.status || 'valid',
    createdAt: waiver.createdAt || now,
    updatedAt: now
  });

  await setDoc(doc(db, 'signed_waivers', id), cleanData, { merge: true });

  // If linked to a booking, update the booking document with waiver status
  if (waiver.bookingId) {
    try {
      const bookingRef = doc(db, 'bookings', waiver.bookingId);
      await updateDoc(bookingRef, {
        waiverStatus: 'signed',
        signedWaiverId: id,
        waiverSignedAt: now,
        waiverSignedCount: waiver.participants?.length || 1
      });
    } catch (bookingErr) {
      console.warn('Could not auto-update booking waiver status:', bookingErr);
    }
  }

  return id;
}

/**
 * Deletes a signed waiver record
 */
export async function deleteSignedWaiver(waiverId: string): Promise<void> {
  await deleteDoc(doc(db, 'signed_waivers', waiverId));
}

/**
 * Fetches signed waiver by ID
 */
export async function getSignedWaiverById(waiverId: string): Promise<SignedWaiver | null> {
  try {
    const snap = await getDoc(doc(db, 'signed_waivers', waiverId));
    if (snap.exists()) {
      return { ...snap.data(), id: snap.id } as SignedWaiver;
    }
    return null;
  } catch (error) {
    console.error('Error loading signed waiver:', error);
    return null;
  }
}

/**
 * Generates WhatsApp dispatch URL with pre-written signing instructions
 */
export function openWaiverWhatsApp(booking: Booking, customUrl?: string): void {
  const guestPhone = booking.customerData.phone?.replace(/[^0-9]/g, '') || '';
  const guestName = booking.customerData.fullName || 'Guest';
  const tourName = booking.tourTitle || 'Tour Activity';
  const bookingId = booking.id;

  const url = customUrl || `${window.location.origin}/waiver/${bookingId}`;

  const message = `Hello ${guestName}! 👋\n\nThank you for booking *${tourName}* (Booking #${bookingId.substring(0, 8)}).\n\nTo ensure a seamless and safe pickup experience, please take 1 minute to complete and sign your digital liability & activity waiver here:\n👉 ${url}\n\nAll participants must sign before tour departure. Please contact us if you have any questions!\n\nBest regards,\n*${booking.supplierName || 'Tour Team'}*`;

  const waUrl = `https://wa.me/${guestPhone}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}
