import React, { useState, useMemo, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, serverTimestamp } from '../../lib/firebase';
import { 
  Search, BookOpen, CreditCard, Mail, MessageSquare, Settings, 
  Globe, Sliders, Check, Copy, ExternalLink, AlertCircle, 
  Calendar, Ticket, Percent, Image, FileCode, ChevronRight, HelpCircle,
  Plus, Edit3, Trash2, X, Save, Loader2, Sparkles
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: any;
  iconName?: string;
  content: any; // React.ReactNode or HTML string
}

interface SaaSKnowledgeBaseProps {
  isDarkMode: boolean;
  isSuperAdmin?: boolean;
}

export default function SaaSKnowledgeBase({ isDarkMode, isSuperAdmin = false }: SaaSKnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticleId, setActiveArticleId] = useState<string>('site-management');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Firestore articles state
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'site', name: 'Site Management' },
    { id: 'payment', name: 'Payment Gateways' },
    { id: 'emails', name: 'Email Automation' },
    { id: 'whatsapp', name: 'WhatsApp Automations' },
    { id: 'domain', name: 'Custom Domains & SEO' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Real-time listener for Firestore `knowledge_base`
  useEffect(() => {
    const kbRef = collection(db, 'knowledge_base');
    const unsubscribe = onSnapshot(kbRef, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default guides into Firestore knowledge_base
        console.log("[KnowledgeBase]: Seeding initial guides into knowledge_base...");
        const defaultGuides = [
          {
            docId: 'site-management',
            title: 'Site Management & Backoffice Operations',
            description: 'Step-by-step guide on creating tours, managing pricing packages, discount coupons, and handling customer bookings.',
            category: 'site',
            iconName: 'Sliders',
            content: `
              <div class="space-y-6 text-sm leading-relaxed">
                <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 class="font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Accessing Your Backoffice</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-300 mt-1">To manage your operational website, go to your <strong>My Site</strong> menu in this console and click the <strong>Admin Console ↗</strong> button to log in securely.</p>
                </div>
                <h3>1. Creating & Editing Tours</h3>
                <p>Navigate to <strong>Tour Manager</strong> inside your tenant dashboard. Click <strong>Add New Tour</strong> to set up tour titles, galleries, itineraries, and rates.</p>
                <h3>2. Handling Customer Bookings</h3>
                <p>Track all guest reservations under your <strong>Bookings Queue</strong>. View guest manifests, issue instant PDF vouchers, and confirm payments.</p>
              </div>
            `
          },
          {
            docId: 'payment-gateways',
            title: 'Payment Integration Setup Guide',
            description: 'Configure automated payment processors like Stripe, PayPal, Midtrans, or set up manual Bank Transfer guides.',
            category: 'payment',
            iconName: 'CreditCard',
            content: `
              <div class="space-y-6 text-sm leading-relaxed">
                <p class="text-gray-600 dark:text-gray-300 font-medium">Tripbone supports multiple payment integrations to collect automated bookings instantly.</p>
                <div class="border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-6 space-y-3">
                  <h3 class="text-base font-black text-indigo-600 dark:text-indigo-400">Stripe Integration</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-300">Retrieve Publishable Key and Secret Key from Stripe Dashboard. Enter them in Payment Settings to enable credit card payments.</p>
                </div>
              </div>
            `
          },
          {
            docId: 'domain-seo',
            title: 'Custom Domain Setup & SEO Guidelines',
            description: 'Connect your own domain name (e.g. youragency.com) and optimize tour pages for Google search visibility.',
            category: 'domain',
            iconName: 'Globe',
            content: `
              <div class="space-y-6 text-sm leading-relaxed">
                <h3>Connecting Your Custom Domain</h3>
                <p>Go to <strong>Settings &rarr; Domain Setup</strong>. Point your CNAME record to <code>cname.tripbone.com</code>. SSL certificates will be auto-provisioned!</p>
              </div>
            `
          }
        ];

        for (const guide of defaultGuides) {
          await addDoc(collection(db, 'knowledge_base'), {
            title: guide.title,
            description: guide.description,
            category: guide.category,
            iconName: guide.iconName,
            content: guide.content,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        return;
      }

      const loaded = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'Untitled Article',
          description: data.description || '',
          category: data.category || 'site',
          iconName: data.iconName || 'BookOpen',
          content: data.content || ''
        } as Article;
      });

      setDbArticles(loaded);
      setLoading(false);
      if (loaded.length > 0 && !activeArticleId) {
        setActiveArticleId(loaded[0].id);
      }
    }, (err) => {
      console.error("[KB Listener Error]:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const articles: Article[] = useMemo(() => [
    {
      id: 'site-management',
      title: 'Site Management & Backoffice Operations',
      description: 'Step-by-step guide on creating tours, managing pricing packages, discount coupons, and handling customer bookings.',
      category: 'site',
      icon: Sliders,
      content: (
        <div className="space-y-6 text-sm leading-relaxed">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
            <Sliders className="w-5 h-5 text-[#005ea6] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Accessing Your Backoffice</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                To manage your operational website, go to your <strong>My Site</strong> menu in this console and click the <strong>Admin Console ↗</strong> button. This will log you in securely via single-sign-on (SSO) to your personal administration panel in a new browser tab.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00b272]/10 text-[#00b272] flex items-center justify-center text-xs font-bold">1</span>
              Creating & Editing Tours
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The core of your website consists of your tours and experiences. To publish a new tour:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>Navigate to <strong>Tour Manager</strong> inside your tenant dashboard.</li>
              <li>Click <strong>Add New Tour</strong>.</li>
              <li>Provide an elegant Title, a comprehensive Description, duration (e.g., 8 hours), and the precise location.</li>
              <li>Upload a <strong>Primary Featured Image</strong> and supplementary gallery photos. High-resolution horizontal landscape images look best on the storefront!</li>
              <li>Set the default status to <strong>Draft</strong> or <strong>Published</strong>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00b272]/10 text-[#00b272] flex items-center justify-center text-xs font-bold">2</span>
              Packages, Capacities & Pricing Models
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Each tour can have multiple options or packages (e.g., "Standard Package", "Private Full-Day Tour", "VIP Luxury Option"):
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>Under the <strong>Packages & Pricing</strong> tab in your tour editor, define your package tiers.</li>
              <li><strong>Pricing Strategy:</strong> Choose between a per-person flat fee, tiered pricing, or group rates. You can also define special rates for adults vs. children.</li>
              <li><strong>Capacity Management:</strong> Specify the maximum capacity per package (e.g., maximum 12 people per slot) to prevent overbookings.</li>
              <li><strong>Availability Schedules:</strong> Bind the package to specific active days or seasonal dates.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00b272]/10 text-[#00b272] flex items-center justify-center text-xs font-bold">3</span>
              Handling Customer Bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              When a traveler places an order on your storefront, the system automatically registers the transaction under your <strong>Bookings Queue</strong>:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li><strong>Instant Notifications:</strong> When a reservation is created, you receive an automated alert (via email or WhatsApp if active), and the customer receives an invoice PDF.</li>
              <li><strong>Status Tracking:</strong> Bookings have transition states: <code>Pending</code> (awaiting payment), <code>Paid</code> (successfully processed), <code>Confirmed</code> (scheduled and verified), <code>Completed</code>, or <code>Cancelled</code>.</li>
              <li><strong>Vouchers & Tickets:</strong> Once confirmed, the platform automatically generates premium printable voucher files and unique QR codes for easy check-in verification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00b272]/10 text-[#00b272] flex items-center justify-center text-xs font-bold">4</span>
              Promo Codes & Discount Coupons
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              To boost sales, you can build promotional campaign codes:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>Go to <strong>Coupons & Discounts</strong> and click <strong>Create Coupon</strong>.</li>
              <li>Set the code (e.g., <code>SUMMER20</code>).</li>
              <li>Select the discount type: **Percentage** (e.g., 20% off) or **Fixed Amount** (e.g., $15.00 off).</li>
              <li>Set validation parameters including <strong>Minimum Purchase Amount</strong>, <strong>Expiration Date</strong>, and **Maximum Total Uses**.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#00b272]/10 text-[#00b272] flex items-center justify-center text-xs font-bold">5</span>
              Customizing Identity & Assets
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your visual appearance:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>Go to <strong>Settings &rarr; Brand Setup</strong> to upload your company Logo (PNG format) and custom Favicon (16x16 or 32x32px).</li>
              <li>Verify that your Contact details, social profiles (Instagram, Facebook), and default currency (e.g. USD, IDR, EUR) are accurately configured to ensure consistency across emails, PDFs, and checkout routes.</li>
            </ul>
          </section>
        </div>
      )
    },
    {
      id: 'payment-gateways',
      title: 'Payment Integration Setup Guide',
      description: 'Configure automated payment processors like Stripe, PayPal, Midtrans, or set up manual Bank Transfer guides.',
      category: 'payment',
      icon: CreditCard,
      content: (
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Tripbone supports multiple payment integrations to collect automated bookings instantly. Ensure you retrieve correct keys from your respective merchant accounts.
          </p>

          {/* Stripe */}
          <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-indigo-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Stripe</span>
                Automated Stripe Processing
              </h3>
              <ExternalLink className="w-4 h-4 text-indigo-400 cursor-pointer" onClick={() => window.open('https://dashboard.stripe.com', '_blank')} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Accept international credit cards and localized debit methods seamlessly.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">Step 1:</span>
                <span>Log in to your <strong>Stripe Dashboard</strong> and switch to the Developer Panel &rarr; API Keys.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">Step 2:</span>
                <span>Retrieve your <strong>Publishable Key</strong> (e.g., <code>pk_live_...</code>) and <strong>Secret Key</strong> (e.g., <code>sk_live_...</code>).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">Step 3:</span>
                <span>Enter these keys in the **Payment Settings** panel under your Tenant Settings.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">Step 4 (Webhook):</span>
                <span>Create a Stripe Webhook pointing to:</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/95 text-slate-200 p-2 rounded-lg font-mono text-[10px] overflow-x-auto relative">
                <span>https://yourdomain.com/api/payment/stripe-webhook</span>
                <button 
                  onClick={() => handleCopy('https://yourdomain.com/api/payment/stripe-webhook', 'stripe-url')}
                  className="absolute right-2 text-slate-400 hover:text-white text-xs bg-slate-800 p-1 rounded"
                >
                  {copiedText === 'stripe-url' ? 'Copied' : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span className="text-[10px] text-amber-500 dark:text-amber-400 block font-semibold">
                ⚠️ Make sure to listen for the checkout.session.completed event! Copy the Webhook Secret key (whsec_...) and paste it in the webhook field in settings.
              </span>
            </div>
          </div>

          {/* PayPal */}
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-yellow-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">PayPal</span>
              PayPal Express Integration
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Perfect for global leisure booking flows. Supports instant checkout buttons.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-600 font-bold">Step 1:</span>
                <span>Log in to the <strong>PayPal Developer Portal</strong> (developer.paypal.com).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-600 font-bold">Step 2:</span>
                <span>Under "Apps & Credentials", create a new App (Sandbox for testing, Live for real money).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-yellow-600 font-bold">Step 3:</span>
                <span>Copy the **Client ID** and **Secret Key**, and paste them under PayPal settings in your console.</span>
              </div>
            </div>
          </div>

          {/* Midtrans */}
          <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-cyan-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Midtrans</span>
              Midtrans Payment Gateway (SE Asia)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Highly recommended for Southeast Asian markets. Supports Bank Virtual Accounts, QRIS, GoPay, and ShopeePay.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-600 font-bold">1. Retrieve Credentials:</span>
                <span>Access your Midtrans MAP Dashboard &rarr; Settings &rarr; Access Keys.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-600 font-bold">2. Keys:</span>
                <span>Copy the **Client Key** and **Server Key**. Determine if you are using <strong>Sandbox</strong> or <strong>Production</strong> mode.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-600 font-bold">3. Set Up Notification URL:</span>
                <span>In Midtrans MAP &rarr; Settings &rarr; Configuration, set the **Notification URL** to:</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/95 text-slate-200 p-2 rounded-lg font-mono text-[10px] overflow-x-auto relative">
                <span>https://yourdomain.com/api/payment/midtrans-notification</span>
                <button 
                  onClick={() => handleCopy('https://yourdomain.com/api/payment/midtrans-notification', 'midtrans-url')}
                  className="absolute right-2 text-slate-400 hover:text-white text-xs bg-slate-800 p-1 rounded"
                >
                  {copiedText === 'midtrans-url' ? 'Copied' : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Manual Bank Account */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Manual</span>
              Manual Bank Transfer Configuration
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              For operators who prefer direct bank transfers. Ideal for avoiding gateway percentage cuts on big-ticket group trips.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">Set Instructions:</span>
                <span>Enter bank detail coordinates in settings (e.g. Bank Name, Account Number, SWIFT, Account Holder Name).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">Customer Flow:</span>
                <span>During checkout, travelers select 'Bank Transfer'. They are shown your payment coordinates. They are prompted to upload their payment receipt image directly on their personalized Booking portal link.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">Verification:</span>
                <span>Check your business bank ledger. Once funds clear, mark the booking as <strong>Paid & Confirmed</strong> inside your booking dashboard to automatically trigger voucher delivery.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'email-automation',
      title: 'Email Automation Setup Guide',
      description: 'Verify domain and configure Resend or Mailjet credentials to dispatch booking receipts, invoices, and vouchers.',
      category: 'emails',
      icon: Mail,
      content: (
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-gray-600 dark:text-gray-400">
            Automated transactional emails ensure customers receive their booking receipts, tickets, and vouchers immediately. Select your preferred provider below.
          </p>

          {/* Resend */}
          <div className="border border-slate-700/20 bg-slate-800/5 dark:bg-slate-800/20 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Resend</span>
              Resend.com Email Delivery
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Modern, high-reputation transactional API for developer-friendly email automation. Highly recommended for superb deliverability.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">1. Account Setup:</span>
                <span>Register at <strong>resend.com</strong> and go to the API Keys section to generate a token (e.g. <code>re_abc123...</code>).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">2. Verify Custom Domain:</span>
                <span>Go to Domains &rarr; Add Domain. Add the designated MX and TXT/SPF records to your DNS provider (Cloudflare, GoDaddy, Namecheap) to allow Resend to sign emails on behalf of your domain name.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">3. Console Fields:</span>
                <span>In your Central Admin Panel &rarr; Mail settings, select <strong>Resend</strong>, insert the API token, and set your verified sender address (e.g. <code>booking@yourdomain.com</code>).</span>
              </div>
            </div>
          </div>

          {/* Mailjet */}
          <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-[#005ea6] text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Mailjet</span>
              Mailjet SMTP / API Integration
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              An enterprise-tier, high-volume automation suite.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">1. Key Retrieval:</span>
                <span>Log in to your <strong>Mailjet Dashboard</strong>, navigate to Account Settings &rarr; API Key Management.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">2. Keys:</span>
                <span>Retrieve the **API Key** (e.g., 32-character hex) and the **Secret Key**.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">3. Sender Verification:</span>
                <span>Make sure your sending email is validated under "Sender Addresses" in your Mailjet account.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005ea6]">4. Save Settings:</span>
                <span>Paste credentials in the console, select Mailjet, and click Save. Run a connection test to verify.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'whatsapp-automation',
      title: 'WhatsApp Automation Setup Guide',
      description: 'Integrate OpenWA (self-hosted automated engine) or Meta Cloud API for official business templates and updates.',
      category: 'whatsapp',
      icon: MessageSquare,
      content: (
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-gray-600 dark:text-gray-400">
            Keep your travelers updated instantly via WhatsApp. Travelers prefer WhatsApp updates over traditional email. Choose between standalone automated WhatsApp bridges (OpenWA) or the official Business API.
          </p>

          {/* OpenWA Standalone */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">OpenWA</span>
                OpenWA (Standalone Self-Hosted Whatsapp API)
              </h3>
              <ExternalLink className="w-4 h-4 text-emerald-500 cursor-pointer" onClick={() => window.open('https://openwa.dev/', '_blank')} />
            </div>
            
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-xs text-amber-700 dark:text-amber-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> OpenWA is a self-hosted third-party automation tool utilizing browser automation (Puppeteer). Deploying, maintaining, and licensing OpenWA is <strong>entirely separate</strong> from Tripbone's SaaS platform scope. Installation is the sole responsibility of the tenant.
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              OpenWA allows you to connect a standard, personal, or business WhatsApp number without going through Meta's rigorous review template protocols.
            </p>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-white">Quick Deployment Guide:</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can host OpenWA on a separate VPS (Virtual Private Server), Docker container, or local machine. Launch the OpenWA docker instance:
              </p>
              <div className="flex items-center gap-2 bg-slate-900/95 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto relative">
                <span>docker run -d -p 8080:8080 open-wa/wa-automate</span>
                <button 
                  onClick={() => handleCopy('docker run -d -p 8080:8080 open-wa/wa-automate', 'docker-cmd')}
                  className="absolute right-2 text-slate-400 hover:text-white text-xs bg-slate-800 p-1 rounded"
                >
                  {copiedText === 'docker-cmd' ? 'Copied' : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-start gap-1.5 mt-2">
                <span className="font-bold text-emerald-600">Step 2:</span>
                <span>Open the OpenWA administrative UI port on your server (e.g. <code>http://[vps-ip]:8888</code>).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-600">Step 3:</span>
                <span>Scan the displayed QR code with your dedicated automation WhatsApp phone number (Settings &rarr; Linked Devices).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-600">Step 4:</span>
                <span>In Tripbone Central Console &rarr; Integrations, insert your self-hosted API endpoint URL (e.g., <code>http://[vps-ip]:8080</code>) and authentication security key.</span>
              </div>
            </div>
          </div>

          {/* Meta Cloud API */}
          <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Meta</span>
                Meta Business Cloud API (Official Integration)
              </h3>
              <ExternalLink className="w-4 h-4 text-blue-500 cursor-pointer" onClick={() => window.open('https://developers.facebook.com', '_blank')} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Official API endorsed by Meta. Extremely reliable and compliant. Highly recommended for high-volume corporate travel operators.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">Step 1:</span>
                <span>Register a developer app at <strong>developers.facebook.com</strong> and link it to your Facebook Business Manager profile.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">Step 2:</span>
                <span>Add the "WhatsApp" product. Copy your **Phone Number ID**, **WhatsApp Business Account ID (WABA)**, and generate a **Permanent System Token**.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">Step 3:</span>
                <span>Draft and register message templates in the WhatsApp Manager interface (e.g. template for booking updates, ticket confirmations). Meta usually approves these within 30 minutes.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600">Step 4:</span>
                <span>Fill in your Phone Number ID, WABA ID, Permanent Token, and exact template name parameters in the console settings.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'custom-domains',
      title: 'Custom Domains, DNS Records & SEO Analytics',
      description: 'Point CNAME records to our central proxy, configure custom domain routing, and set up Google Analytics & Meta Pixels.',
      category: 'domain',
      icon: Globe,
      content: (
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Learn how to remove the default <code>*.tripbone.com</code> subdomain and publish your storefront on your personal custom domain.
          </p>

          {/* CNAME setup */}
          <div className="border border-purple-500/20 bg-purple-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-purple-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">DNS</span>
              Mapping Custom Domains (CNAME Setup)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Map domains bought from GoDaddy, Namecheap, Google Domains, Cloudflare, or other registrars.
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/95 text-slate-300 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="text-slate-400 font-sans font-bold uppercase tracking-wider text-[9px] mb-1">Required DNS Record Configuration:</div>
                <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-1 text-white">
                  <span>Type</span>
                  <span>Host/Name</span>
                  <span>Value/Target</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-emerald-400 font-bold">CNAME</span>
                  <span>tours</span>
                  <span>cname.tripbone.com</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-emerald-400 font-bold">CNAME</span>
                  <span>www</span>
                  <span>cname.tripbone.com</span>
                </div>
              </div>

              <div className="space-y-2 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="text-purple-600 font-bold">Step 1:</span>
                  <span>Log in to your DNS provider dashboard. Add a new record using the parameters above. Set TTL to automatic/default.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-purple-600 font-bold">Step 2:</span>
                  <span>In your Central Portal &rarr; **My Site** menu &rarr; Custom Domain, type in your full domain (e.g. <code>tours.yourcompany.com</code>).</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-purple-600 font-bold">Step 3:</span>
                  <span>Click <strong>Verify & Update Domain</strong>. The system will issue a query to DNS resolvers, mapping your domain immediately. An SSL certificate will automatically provision within 2-5 minutes.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEO & Tracking */}
          <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded">Analytics</span>
              SEO Settings & Analytics Setup
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Inject analytic scripts and optimize SEO indexing parameters for your tour pages.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">Google Analytics:</span>
                <span>Under Website Settings &rarr; Analytics, enter your **Google Tag Measurement ID** (e.g. <code>G-XXXXXX</code>) or paste the complete global site tag code block.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">Meta Business Pixel:</span>
                <span>Paste your **Pixel Tracking ID** to track customer checkout completions, cart additions, and organic clicks.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">SEO Optimization:</span>
                <span>Provide a high-quality Meta Description containing crucial keywords (e.g., "Best tours in Bali, luxury rafting, private transport"). This is automatically compiled into search crawler headers!</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ], [copiedText]);

  // Merged articles combining default static ones and Firestore dbArticles
  const allArticles: Article[] = useMemo(() => {
    const formattedDb = dbArticles.map(a => {
      let IconComponent = BookOpen;
      if (a.iconName === 'Sliders') IconComponent = Sliders;
      if (a.iconName === 'CreditCard') IconComponent = CreditCard;
      if (a.iconName === 'Mail') IconComponent = Mail;
      if (a.iconName === 'MessageSquare') IconComponent = MessageSquare;
      if (a.iconName === 'Globe') IconComponent = Globe;
      if (a.iconName === 'Settings') IconComponent = Settings;

      return {
        ...a,
        icon: IconComponent,
        content: typeof a.content === 'string' ? (
          <div className="space-y-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: a.content }} />
        ) : a.content
      };
    });

    const defaultFiltered = articles.filter(def => !formattedDb.some(d => d.id === def.id));
    return [...formattedDb, ...defaultFiltered];
  }, [dbArticles, articles]);

  const filteredArticles = useMemo(() => {
    return allArticles.filter(art => {
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allArticles, selectedCategory, searchQuery]);

  const activeArticle = useMemo(() => {
    return allArticles.find(art => art.id === activeArticleId) || allArticles[0] || articles[0];
  }, [allArticles, activeArticleId]);

  // CRUD Functions for SuperAdmin
  const handleOpenCreateModal = () => {
    setEditingArticle({
      title: '',
      description: '',
      category: 'site',
      iconName: 'BookOpen',
      content: '<h3>Article Header</h3>\n<p>Enter comprehensive instructions and steps here...</p>'
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (art: Article) => {
    const dbMatch = dbArticles.find(d => d.id === art.id);
    let rawContent = '';
    if (dbMatch && typeof dbMatch.content === 'string') {
      rawContent = dbMatch.content;
    } else if (typeof art.content === 'string') {
      rawContent = art.content;
    } else {
      rawContent = `<h3>${art.title}</h3>\n<p>${art.description}</p>`;
    }

    setEditingArticle({
      id: art.id,
      title: art.title,
      description: art.description,
      category: art.category,
      iconName: art.iconName || 'BookOpen',
      content: rawContent
    });
    setIsEditingModalOpen(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Knowledge Base article?")) return;
    try {
      await deleteDoc(doc(db, 'knowledge_base', id));
      alert("Article deleted from Knowledge Base.");
    } catch (err: any) {
      alert("Error deleting article: " + (err.message || 'Unknown error'));
    }
  };

  const handleSaveArticle = async () => {
    if (!editingArticle?.title?.trim()) {
      alert("Article title is required.");
      return;
    }

    setIsSaving(true);
    try {
      const artData = {
        title: editingArticle.title.trim(),
        description: editingArticle.description || '',
        category: editingArticle.category || 'site',
        iconName: editingArticle.iconName || 'BookOpen',
        content: editingArticle.content || '',
        updatedAt: serverTimestamp()
      };

      if (editingArticle.id && dbArticles.some(d => d.id === editingArticle.id)) {
        await updateDoc(doc(db, 'knowledge_base', editingArticle.id), artData);
      } else {
        await addDoc(collection(db, 'knowledge_base'), {
          ...artData,
          createdAt: serverTimestamp()
        });
      }

      setIsEditingModalOpen(false);
      setEditingArticle(null);
    } catch (err: any) {
      console.error("[Save KB Error]:", err);
      alert("Failed to save KB article: " + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KB Top Header Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-150 shadow-xs'
      }`}>
        <div className="space-y-2 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#005ea6]/10 text-[#005ea6] text-[10px] font-black uppercase tracking-wider rounded-md">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Guide</span>
          </div>
          <h2 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Tenant Knowledge Base
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Configure integrations, manage products, connect payment providers, and automate communications for a fully operational tour business.
          </p>
        </div>
        
        {/* Controls Bar: Search & SuperAdmin Add Article Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search guides, tools, keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl focus:outline-none border transition-colors shadow-sm ${
                isDarkMode 
                  ? 'bg-[#0b101b] border-slate-800 text-white focus:border-[#00b272]' 
                  : 'bg-slate-50 border-gray-200 text-gray-800 focus:border-[#005ea6]'
              }`}
            />
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-[#00b272] hover:bg-[#009e64] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add KB Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Navigation Links & Categories */}
        <div className="space-y-6 lg:col-span-1">
          {/* Category Badges */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-150'
          }`}>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pl-1 block mb-2">Categories</span>
            <div className="flex flex-wrap lg:flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-[#005ea6] text-white' 
                      : isDarkMode 
                        ? 'hover:bg-slate-800 text-slate-300' 
                        : 'hover:bg-slate-50 text-gray-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* List of Filtered Articles */}
          <div className={`border rounded-2xl p-4 space-y-3 ${
            isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-150'
          }`}>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pl-1 block">Helpful Articles</span>
            
            {filteredArticles.length === 0 ? (
              <p className="text-xs text-gray-400 italic p-1">No articles found.</p>
            ) : (
              <div className="space-y-1">
                {filteredArticles.map((art) => {
                  const ArtIcon = art.icon;
                  return (
                    <button
                      key={art.id}
                      onClick={() => setActiveArticleId(art.id)}
                      className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all group ${
                        activeArticleId === art.id 
                          ? 'bg-[#00b272]/10 border border-[#00b272]/20' 
                          : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        activeArticleId === art.id 
                          ? 'bg-[#00b272] text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-gray-500'
                      }`}>
                        <ArtIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate pr-1">
                        <h4 className={`text-xs font-bold leading-tight truncate ${
                          activeArticleId === art.id 
                            ? 'text-slate-900 dark:text-white' 
                            : 'text-gray-700 dark:text-slate-300'
                        }`}>
                          {art.title}
                        </h4>
                        <span className="text-[9px] text-gray-400 block capitalize mt-0.5">{art.category} guide</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Article Content Window */}
        <div className="lg:col-span-3">
          <div className={`border rounded-3xl p-6 md:p-8 space-y-6 ${
            isDarkMode ? 'bg-[#111928] border-slate-800' : 'bg-white border-gray-150 shadow-sm'
          }`}>
            <div className="border-b border-gray-200/20 pb-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span className="capitalize">{activeArticle.category} Integration</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-[#005ea6]">Setup Guide</span>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(activeArticle)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Guide</span>
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(activeArticle.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <h1 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeArticle.title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {activeArticle.description}
              </p>
            </div>

            {/* Rendered content */}
            <div className={`prose max-w-none ${isDarkMode ? 'prose-invert text-slate-300' : 'text-gray-700'}`}>
              {activeArticle.content}
            </div>

            {/* Quick QA summary box */}
            <div className={`mt-8 pt-6 border-t border-gray-200/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs`}>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b101b] border border-gray-150 dark:border-slate-800 space-y-1">
                <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#005ea6]" />
                  Need more developer keys?
                </span>
                <p className="text-gray-500 dark:text-gray-400">
                  Access your developer portals in <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#005ea6] underline font-bold">Stripe</a>, <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-[#005ea6] underline font-bold">PayPal</a>, or <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener noreferrer" className="text-[#005ea6] underline font-bold">Midtrans</a> settings tabs to create staging and sandbox keys first before going live.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b101b] border border-gray-150 dark:border-slate-800 space-y-1">
                <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-[#00b272]" />
                  What about testing offline?
                </span>
                <p className="text-gray-500 dark:text-gray-400">
                  All subdomains automatically bind to offline ports during container staging and development loops. This ensures you can dry-run payment webhooks seamlessly!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal for SuperAdmin */}
      {isEditingModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsEditingModalOpen(false)} />
          <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl p-6 md:p-8 space-y-6 overflow-hidden my-8 ${
            isDarkMode ? 'bg-[#111928] border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-200/20 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#00b272]/20 text-[#00b272] rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">
                  {editingArticle.id ? 'Edit Knowledge Base Guide' : 'Create Knowledge Base Guide'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Guide Title</label>
                <input
                  type="text"
                  placeholder="e.g. Setting Up Automated WhatsApp Reminders"
                  value={editingArticle.title || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-[#0b101b] border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={editingArticle.category || 'site'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border focus:outline-none cursor-pointer ${
                      isDarkMode ? 'bg-[#0b101b] border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="site">Site Management</option>
                    <option value="payment">Payment Gateways</option>
                    <option value="emails">Email Automation</option>
                    <option value="whatsapp">WhatsApp Automations</option>
                    <option value="domain">Custom Domains & SEO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Icon Representation</label>
                  <select
                    value={editingArticle.iconName || 'BookOpen'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, iconName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border focus:outline-none cursor-pointer ${
                      isDarkMode ? 'bg-[#0b101b] border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="BookOpen">Book Open (Default)</option>
                    <option value="Sliders">Sliders (Site Controls)</option>
                    <option value="CreditCard">Credit Card (Payments)</option>
                    <option value="Mail">Mail (Email Setup)</option>
                    <option value="MessageSquare">Message Square (WhatsApp)</option>
                    <option value="Globe">Globe (Domain & Web)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Summarize what users will learn in this guide..."
                  value={editingArticle.description || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-[#0b101b] border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Guide Content (HTML / Rich Text)</label>
                <textarea
                  rows={10}
                  placeholder="<h3>Header</h3><p>Step-by-step instructions...</p>"
                  value={editingArticle.content || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className={`w-full px-3.5 py-3 text-xs font-mono rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-100 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-gray-200/20 pt-4">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveArticle}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#00b272] hover:bg-[#009e64] text-white shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Guide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
