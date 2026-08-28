import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useTenant } from '../lib/TenantContext';

export interface DynamicPageData {
  id?: string;
  title?: string;
  subtitle?: string;
  heroImage?: string;
  content?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  layout?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  mapsEmbed?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  featuredImages?: string[];
  showContactForm?: boolean;
  pillTitle?: string;
  storyTitle?: string;
  storyBody?: string;
  missionText?: string;
  visionText?: string;
  experienceBadgeNumber?: string;
  experienceBadgeTitle?: string;
  experienceBadgeDesc?: string;
  coreValuesTitle?: string;
  coreValuesSubtitle?: string;
  coreValues?: { title: string; desc: string; icon?: string }[];
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  verifiedBadgeTitle?: string;
  verifiedBadgeDesc?: string;
}

export function useDynamicPage(slug: string) {
  const { tenantId } = useTenant();
  const [pageData, setPageData] = useState<DynamicPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'pages'),
          where('slug', '==', slug),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setPageData({ id: doc.id, ...doc.data() } as DynamicPageData);
        } else {
          setPageData(null);
        }
      } catch (err) {
        console.error(`Error loading dynamic page for slug ${slug}:`, err);
        setPageData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [slug, tenantId]);

  return { pageData, loading };
}
