import { getDocs, collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "./firebase";

export async function checkQuota(tenantData: any, type: 'tours' | 'bookings', currentCount?: number): Promise<{ allowed: boolean, maxLimit: number, current: number }> {
  try {
    const plansSnap = await getDocs(collection(db, 'billingPlans'));
    const plansData = plansSnap.docs.map(doc => doc.data());
    
    const planName = (tenantData?.plan || 'starter').split('-')[0].toLowerCase();
    const billingInterval = (tenantData?.billingInterval || 'monthly').toLowerCase();
    
    let currentPlanObj = plansData.find((p: any) => p.slug?.toLowerCase().split('-')[0] === planName && (p.interval || 'monthly').toLowerCase() === billingInterval);
    
    if (!currentPlanObj) {
      currentPlanObj = plansData.find((p: any) => p.slug?.toLowerCase().split('-')[0] === planName);
    }

    let maxLimit = type === 'tours' ? 10 : 25; // Starter defaults
    
    if (currentPlanObj) {
      if (type === 'tours' && typeof currentPlanObj.maxTours === 'number') {
        maxLimit = currentPlanObj.maxTours;
      } else if (type === 'bookings' && typeof currentPlanObj.maxBookings === 'number') {
        maxLimit = currentPlanObj.maxBookings;
      } else if (currentPlanObj.features) {
        const featureStr = currentPlanObj.features.find((f: any) => typeof f === 'string' && f.toLowerCase().includes(type));
        if (featureStr) {
          const maxMatch = featureStr.match(/\d+/);
          if (maxMatch) {
            maxLimit = parseInt(maxMatch[0]);
          } else if (featureStr.toLowerCase().includes('unlimited')) {
            maxLimit = 999999;
          }
        } else {
          // Fallbacks if features string is missing
          if (type === 'tours') {
            if (planName === 'professional') maxLimit = 50;
            else if (planName === 'business') maxLimit = 100;
            else if (planName === 'enterprise') maxLimit = 999999;
          } else if (type === 'bookings') {
            if (planName === 'professional') maxLimit = 500;
            else if (planName === 'business') maxLimit = 2000;
            else if (planName === 'enterprise') maxLimit = 999999;
          }
        }
      } else {
        if (type === 'tours') {
          if (planName === 'professional') maxLimit = 50;
          else if (planName === 'business') maxLimit = 100;
          else if (planName === 'enterprise') maxLimit = 999999;
        } else if (type === 'bookings') {
          if (planName === 'professional') maxLimit = 500;
          else if (planName === 'business') maxLimit = 2000;
          else if (planName === 'enterprise') maxLimit = 999999;
        }
      }
    } else {
      if (type === 'tours') {
        if (planName === 'professional') maxLimit = 50;
        else if (planName === 'business') maxLimit = 100;
        else if (planName === 'enterprise') maxLimit = 999999;
      } else if (type === 'bookings') {
        if (planName === 'professional') maxLimit = 500;
        else if (planName === 'business') maxLimit = 2000;
        else if (planName === 'enterprise') maxLimit = 999999;
      }
    }

    let count = currentCount ?? 0;
    
    if (currentCount === undefined && tenantData?.uid) {
      if (type === 'tours') {
        const q = query(collection(db, 'tours'), where('supplierId', '==', tenantData.uid));
        const snap = await getCountFromServer(q);
        count = snap.data().count;
      } else if (type === 'bookings') {
        // Bookings can be counted by supplierId
        const q = query(collection(db, 'bookings'), where('supplierId', '==', tenantData.uid));
        const snap = await getCountFromServer(q);
        count = snap.data().count;
      }
    }

    return {
      allowed: count < maxLimit,
      maxLimit,
      current: count
    };
  } catch (error) {
    console.error("Quota check error:", error);
    // Allow if quota check fails unexpectedly
    return { allowed: true, maxLimit: 999999, current: 0 };
  }
}
