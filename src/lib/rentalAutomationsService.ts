import { Booking, RentalAutomationsConfig, SiteSettings } from '../types';
import { sendCustomWhatsApp, getWhatsAppLink } from './whatsappService';
import { getDoc, doc, updateDoc, db, serverTimestamp, getActiveTenantId } from './firebase';

export const DEFAULT_RENTAL_AUTOMATIONS: RentalAutomationsConfig = {
  enabled: true,
  bookingConfirmationWhatsApp: {
    enabled: true,
    template: `🚗 *RENTAL RESERVATION CONFIRMED* 🚗

Dear *{customer_name}*,

Thank you for choosing *{company_name}*! Your vehicle reservation has been successfully received and scheduled.

📋 *Booking Details:*
• *Booking Ref:* #{booking_id}
• *Vehicle:* {vehicle_name}
• *Service Mode:* {service_mode}
• *Pickup Date & Time:* {pickup_date} at {pickup_time}
• *Pickup Location:* {pickup_location}
• *Coverage Zone:* {zone_name}
• *Duration:* {duration_summary}

💰 *Payment Summary:*
• *Total Amount:* {currency} {total_amount}
• *Deposit Paid:* {currency} {deposit_amount}
• *Balance Due:* {currency} {balance_due}

{service_instructions}

Need immediate assistance? Chat with us at {support_phone}. Have a fantastic journey!

— *{company_name} Concierge Team*`,
  },
  driverDispatchWhatsApp: {
    enabled: true,
    template: `🚘 *DRIVER & VEHICLE DISPATCH NOTICE* 🚘

Dear *{customer_name}*,

Your private chauffeur and vehicle details for your trip on *{pickup_date}* have been assigned:

👤 *Chauffeur:* {driver_name}
📞 *Driver Contact:* {driver_phone}
🚗 *Vehicle:* {vehicle_name}
🔢 *License Plate:* *{license_plate}*
📍 *Pickup Location:* {pickup_location}
⏰ *Scheduled Pickup:* {pickup_time}

Your driver will meet you directly at your hotel lobby / arrival gate. Please keep your phone reachable.

— *{company_name} Transport Operations*`,
  },
  preTripReminderWhatsApp: {
    enabled: true,
    sendHoursBefore: 24,
    template: `⏰ *UPCOMING TRIP REMINDER* ⏰

Hi *{customer_name}*,

This is a friendly reminder that your car rental booking with *{company_name}* is scheduled for *tomorrow*:

🗓️ *Date & Time:* {pickup_date} @ {pickup_time}
🚘 *Vehicle:* {vehicle_name}
📍 *Pickup Address:* {pickup_location}

{reminder_checklist}

If you need any adjustments or timing changes, please notify our team as soon as possible. Safe travels!`,
  },
  postTripReviewWhatsApp: {
    enabled: true,
    template: `⭐ *THANK YOU FOR TRAVELING WITH US* ⭐

Dear *{customer_name}*,

We hope you enjoyed exploring Bali with *{company_name}* and your *{vehicle_name}*!

{deposit_return_note}

Your feedback means the world to us! If you had a great experience, could you take 30 seconds to leave us a quick review?

🌐 *Leave a Review:* {review_link}

We look forward to welcoming you back on your next island adventure!`,
  },
  emailConfirmation: {
    enabled: true,
    subject: 'Your Car Rental Confirmation - #{booking_id} | {company_name}',
    template: `Dear {customer_name},

Thank you for your vehicle reservation with {company_name}.

Booking Reference: #{booking_id}
Vehicle: {vehicle_name} ({service_mode})
Pickup: {pickup_date} at {pickup_time} ({pickup_location})
Total: {currency} {total_amount}

Our team will coordinate the vehicle handover with you. Have a wonderful trip!`,
  },
};

/**
 * Format and interpolate placeholders inside a template
 */
export function formatRentalTemplate(
  template: string,
  booking: Booking,
  settings?: SiteSettings | null,
  additionalData?: {
    driverName?: string;
    driverPhone?: string;
    licensePlate?: string;
    reviewLink?: string;
    depositReturned?: boolean;
  }
): string {
  const rental = booking.rentalDetails;
  const isSelfDrive = rental?.serviceMode === 'self_drive';
  const currency = settings?.currency || 'USD';
  const companyName = settings?.siteName || 'Tripbone Rental';
  const supportPhone = settings?.whatsappNumber || settings?.supportPhone || '+6281234567890';
  const totalAmount = booking.totalAmount || 0;
  const depositAmount = rental?.depositPaidAmount || (rental?.securityDeposit ? rental.securityDeposit : 0);
  const balanceDue = rental?.balanceDue !== undefined ? rental.balanceDue : Math.max(0, totalAmount - depositAmount);

  const durationSummary = isSelfDrive
    ? `${rental?.durationDays || 1} Day(s) (24h blocks)`
    : rental?.durationType === 'half_day'
    ? 'Half-Day Charter (4-6 Hours)'
    : rental?.durationType === 'full_day'
    ? 'Full-Day Charter (10-12 Hours)'
    : `${rental?.durationHours || 10} Hours Hourly Charter`;

  const serviceInstructions = isSelfDrive
    ? `🔑 *Self-Drive Checklist:* Please prepare your Physical Passport, Valid Home Country / International Driving Permit (IDP), and Refundable Security Deposit upon vehicle handover.`
    : `🚗 *Chauffeur Charter:* Your professional private driver, fuel, and passenger insurance are all included. Parking and road tolls can be settled directly during the day.`;

  const reminderChecklist = isSelfDrive
    ? `📌 *Self-Drive Checklist:* Please ensure your Passport & International Driving Permit (IDP) are ready for vehicle handover.`
    : `📌 *Chauffeur Charter:* Your private driver will wait at the lobby/pickup point 10 minutes prior to departure.`;

  const depositReturnNote = rental?.depositStatus === 'refunded'
    ? `✅ *Deposit Refund:* Your security deposit of ${currency} ${depositAmount} has been processed and refunded.`
    : isSelfDrive
    ? `✅ *Deposit Status:* Vehicle check-in completed. Any remaining deposit balance is processed as per handover policy.`
    : `We truly appreciate your patronage and hope your journey was smooth and memorable.`;

  const reviewLink = additionalData?.reviewLink || settings?.googleReviewUrl || settings?.tripadvisorUrl || `https://${settings?.customDomain || 'tripbone.com'}/reviews`;

  const placeholders: Record<string, string> = {
    '{customer_name}': booking.customerData?.fullName || 'Valued Guest',
    '{booking_id}': booking.id ? booking.id.slice(-6).toUpperCase() : 'RENTAL',
    '{full_booking_id}': booking.id || '',
    '{vehicle_name}': rental?.vehicleName || booking.tourTitle || 'Vehicle',
    '{vehicle_category}': rental?.vehicleCategory ? rental.vehicleCategory.toUpperCase() : 'STANDARD',
    '{service_mode}': isSelfDrive ? 'Self-Drive (Car Only)' : 'With Private Driver & Fuel',
    '{pickup_date}': rental?.pickupDate || booking.date || '',
    '{pickup_time}': rental?.pickupTime || booking.timeSlot || '09:00',
    '{dropoff_date}': rental?.dropoffDate || rental?.pickupDate || booking.date || '',
    '{dropoff_time}': rental?.dropoffTime || '19:00',
    '{pickup_location}': rental?.pickupLocation || booking.customerData?.pickupAddress || 'Bali Hotel / Airport',
    '{dropoff_location}': rental?.dropoffLocation || rental?.pickupLocation || 'Bali Hotel / Airport',
    '{zone_name}': rental?.zoneName || 'Standard Island Hub',
    '{duration_summary}': durationSummary,
    '{currency}': currency,
    '{total_amount}': totalAmount.toLocaleString(),
    '{deposit_amount}': depositAmount.toLocaleString(),
    '{balance_due}': balanceDue.toLocaleString(),
    '{driver_name}': additionalData?.driverName || rental?.assignedDriverName || 'Assigned Driver',
    '{driver_phone}': additionalData?.driverPhone || rental?.assignedDriverPhone || supportPhone,
    '{license_plate}': additionalData?.licensePlate || rental?.assignedVehiclePlate || 'DK Plate',
    '{service_instructions}': serviceInstructions,
    '{reminder_checklist}': reminderChecklist,
    '{deposit_return_note}': depositReturnNote,
    '{company_name}': companyName,
    '{support_phone}': supportPhone,
    '{review_link}': reviewLink,
  };

  let output = template;
  Object.entries(placeholders).forEach(([key, val]) => {
    output = output.replaceAll(key, val);
  });

  return output;
}

/**
 * Trigger 1: Send Automated Rental Booking Confirmation
 */
export async function triggerRentalBookingConfirmation(
  booking: Booking,
  settings?: SiteSettings | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const config = settings?.carRentalModule?.automations || DEFAULT_RENTAL_AUTOMATIONS;
    if (!config.enabled || !config.bookingConfirmationWhatsApp.enabled) {
      return { success: false, message: 'Automation disabled in settings' };
    }

    const phone = booking.customerData?.phone;
    if (!phone) {
      return { success: false, message: 'Customer phone number missing' };
    }

    const message = formatRentalTemplate(config.bookingConfirmationWhatsApp.template, booking, settings);
    const result = await sendCustomWhatsApp(phone, message, booking);
    return result;
  } catch (error) {
    console.error('Failed to trigger rental booking confirmation automation:', error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Trigger 2: Send Chauffeur & Vehicle Dispatch Alert
 */
export async function triggerRentalDriverDispatch(
  booking: Booking,
  settings: SiteSettings | null,
  driverData: {
    driverName: string;
    driverPhone: string;
    licensePlate: string;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const config = settings?.carRentalModule?.automations || DEFAULT_RENTAL_AUTOMATIONS;
    const phone = booking.customerData?.phone;
    if (!phone) {
      return { success: false, message: 'Customer phone number missing' };
    }

    const message = formatRentalTemplate(
      config.driverDispatchWhatsApp.template,
      booking,
      settings,
      driverData
    );

    const result = await sendCustomWhatsApp(phone, message, booking);

    // Update dispatch timestamp in booking
    if (booking.id) {
      const docRef = doc(db, 'bookings', booking.id);
      await updateDoc(docRef, {
        'rentalDetails.assignedDriverName': driverData.driverName,
        'rentalDetails.assignedDriverPhone': driverData.driverPhone,
        'rentalDetails.assignedVehiclePlate': driverData.licensePlate,
        'rentalDetails.dispatchNotifiedAt': new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to trigger driver dispatch automation:', error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Trigger 3: Send Pre-Trip Reminder
 */
export async function triggerRentalPreTripReminder(
  booking: Booking,
  settings?: SiteSettings | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const config = settings?.carRentalModule?.automations || DEFAULT_RENTAL_AUTOMATIONS;
    const phone = booking.customerData?.phone;
    if (!phone) return { success: false, message: 'Customer phone missing' };

    const message = formatRentalTemplate(config.preTripReminderWhatsApp.template, booking, settings);
    return await sendCustomWhatsApp(phone, message, booking);
  } catch (error) {
    console.error('Failed to trigger pre-trip reminder automation:', error);
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Trigger 4: Send Post-Trip Review & Deposit Clear Notice
 */
export async function triggerRentalPostTripReview(
  booking: Booking,
  settings?: SiteSettings | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const config = settings?.carRentalModule?.automations || DEFAULT_RENTAL_AUTOMATIONS;
    const phone = booking.customerData?.phone;
    if (!phone) return { success: false, message: 'Customer phone missing' };

    const message = formatRentalTemplate(config.postTripReviewWhatsApp.template, booking, settings);
    return await sendCustomWhatsApp(phone, message, booking);
  } catch (error) {
    console.error('Failed to trigger post-trip review automation:', error);
    return { success: false, message: (error as Error).message };
  }
}
