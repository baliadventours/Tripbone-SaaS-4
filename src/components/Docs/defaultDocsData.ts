import { DocArticle, DocCategory } from './DocViewer';

export const DEFAULT_DOC_CATEGORIES: DocCategory[] = [
  { id: 'cat-1', name: 'Getting Started', description: 'Platform introduction, features, AI capabilities, and USP comparison', order: 1 },
  { id: 'cat-2', name: 'Requirement', description: 'System prerequisites: Email, Payment, Gemini, WhatsApp, Domain & Cloudflare', order: 2 },
  { id: 'cat-3', name: 'Installation', description: 'Step-by-step setup and workspace initialization guide', order: 3 },
  { id: 'cat-4', name: 'Website Setting', description: 'Global website configurations: Communication, BYOPG Payments, Branding & SEO', order: 4 },
  { id: 'cat-5', name: 'Website Builder', description: 'Presets, page layouts, header, hero, custom menu, and landing pages', order: 5 },
  { id: 'cat-6', name: 'Manage Website', description: 'Tours CRUD, Step-by-step guides, Locations, Add-Ons, Transport, Destinations, Drivers & Tiered Pricing', order: 6 },
  { id: 'cat-7', name: 'Manage Booking', description: 'Order processing, manual/CSV booking import, and Channel Manager integration', order: 7 },
  { id: 'cat-8', name: 'Inquiry & Sales', description: 'Incoming inquiries, AI Proposal Generator, and discount coupons', order: 8 },
  { id: 'cat-9', name: 'Support & Ticket', description: 'Customer support ticketing system and helpdesk management', order: 9 },
  { id: 'cat-10', name: 'Blog', description: 'Managing blog posts, travel news, SEO articles, and categories', order: 10 },
  { id: 'cat-11', name: 'Pages & Landing Page Generator', description: 'Custom pages creation and AI-powered Landing Page Generator', order: 11 },
  { id: 'cat-12', name: 'Pop Up', description: 'Promotional popups, announcement banners, and exit-intent lead forms', order: 12 },
  { id: 'cat-13', name: 'Reviews', description: 'Customer feedback collection, moderation, and rating badges', order: 13 },
  { id: 'cat-14', name: 'User Management', description: 'Team members, staff roles, vendor access, and permission management', order: 14 },
  { id: 'cat-15', name: 'Finance Report', description: 'Financial analytics, sales breakdown, payouts, and revenue reporting', order: 15 },
];

export const DEFAULT_DOC_ARTICLES: DocArticle[] = [
  // 1. GETTING STARTED
  {
    id: 'getting-started-intro',
    slug: 'getting-started-intro',
    title: 'Introduction to Tripbone Travel SaaS',
    subTitle: 'System Overview',
    subSubTitle: 'Features, AI Power & Unique Selling Points',
    category: 'Getting Started',
    categoryOrder: 1,
    description: 'Discover Tripbone\'s core capabilities, native AI magic, multi-tenant BYOPG architecture, and why it outperforms traditional booking engines.',
    content: `
      <h2>Welcome to Tripbone Travel SaaS</h2>
      <p>Tripbone is an enterprise-grade multi-tenant travel commerce platform purpose-built for tour operators, DMCs (Destination Management Companies), and travel agencies worldwide. Unlike legacy booking engines that lock you into high transaction commission fees and restricted payment providers, Tripbone puts total operational, financial, and creative freedom back in your hands.</p>

      <h3>1. Core Platform Capabilities</h3>
      <ul>
        <li><strong>Multi-Currency & Real-Time FX Conversion:</strong> Process guest payments in 50+ global fiat currencies with dynamic conversion rate updates.</li>
        <li><strong>BYOPG (Bring Your Own Payment Gateway):</strong> Connect Stripe, Midtrans, Xendit, Razorpay, Adyen, PayPal, Bank Transfer, or Pay on Arrival directly to your account with 0% platform transaction fees.</li>
        <li><strong>Isolated Multi-Tenant Architecture:</strong> Every travel merchant receives an isolated workspace with dedicated database records, white-label custom domain mapping, and branded client portals.</li>
        <li><strong>Omnichannel Booking Engine:</strong> Instant availability checks, group pricing tiers, automated deposit collection, and instant PDF voucher generation.</li>
      </ul>

      <h3>2. Native AI-Powered Magic Engine</h3>
      <ul>
        <li><strong>AI Tour Itinerary Generator:</strong> Create full multi-day itineraries with rich descriptions, daily step-by-step highlights, inclusions, exclusions, and suggested pricing in under 10 seconds via Google Gemini.</li>
        <li><strong>AI Proposal Generator:</strong> Instantly draft personalized web and PDF quotation proposals for custom guest inquiry requests.</li>
        <li><strong>AI Translation & SEO Copywriting:</strong> Translate tour products into multiple languages and auto-optimize meta descriptions, titles, and social tags for maximum search engine ranking.</li>
      </ul>

      <h3>3. Competitive Comparison: Tripbone vs. Legacy Booking Engines</h3>
      <div style="overflow-x: auto; margin-top: 1rem;">
        <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; text-align: left; border-color: #334155;">
          <thead>
            <tr style="background-color: #0f172a; color: #38bdf8;">
              <th>Feature Comparison</th>
              <th>Legacy Booking Engines</th>
              <th>Tripbone SaaS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Platform Transaction Fee</strong></td>
              <td>1.5% – 6% per transaction</td>
              <td><strong style="color: #4ade80;">0% Platform Commission</strong> (Direct BYOPG)</td>
            </tr>
            <tr>
              <td><strong>Payment Processing</strong></td>
              <td>Single tied gateway with payout holds</td>
              <td><strong style="color: #38bdf8;">Multi-Gateway Simultaneous Enablement</strong></td>
            </tr>
            <tr>
              <td><strong>AI Capabilities</strong></td>
              <td>Basic search or no AI integration</td>
              <td><strong style="color: #c084fc;">Native Gemini AI Itinerary & Proposal Engine</strong></td>
            </tr>
            <tr>
              <td><strong>Custom Domain & Branding</strong></td>
              <td>iFrame widgets or generic subdomains</td>
              <td><strong style="color: #38bdf8;">100% White-Label CNAME Custom Domains</strong></td>
            </tr>
            <tr>
              <td><strong>Multi-Currency Support</strong></td>
              <td>Fixed currency or high conversion markups</td>
              <td><strong style="color: #4ade80;">Automated Real-Time FX Multi-Currency</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    steps: [
      {
        title: 'Step 1: Admin Console Overview',
        desc: 'Log in to your workspace dashboard using your merchant credentials or superadmin impersonation session. The sidebar contains quick links to all operational modules.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Review Workspace System Architecture',
        desc: 'Understand the multi-tenant isolation model where your settings, bookings, products, and customer databases are stored securely in dedicated Firestore collections.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Fast-Track Setup Roadmap',
        desc: 'Follow the 4-step onboarding wizard: 1) Add API Keys, 2) Configure Payment Gateways, 3) Publish Tours, 4) Map Custom Domain.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 2. REQUIREMENT
  {
    id: 'requirements-prerequisites',
    slug: 'requirements-prerequisites',
    title: 'System Requirements & Third-Party Services',
    subTitle: 'System Prerequisites',
    subSubTitle: 'Email, Payment, Gemini AI, WhatsApp, Domain & Cloudflare',
    category: 'Requirement',
    categoryOrder: 2,
    description: 'Complete list of required third-party service accounts, API keys, and DNS configurations needed to unlock full Tripbone capabilities.',
    content: `
      <h2>System Prerequisites Checklist</h2>
      <p>To operate a fully automated Tripbone travel portal, assemble the following credentials and external service accounts:</p>

      <h3>1. Transactional Email Server</h3>
      <ul>
        <li><strong>Supported Providers:</strong> Resend, Mailjet, SendGrid, or custom SMTP server.</li>
        <li><strong>Purpose:</strong> Instant guest booking confirmations, downloadable PDF vouchers, password reset links, and inquiry notification alerts.</li>
        <li><strong>Required Keys:</strong> API Key / SMTP Host, Port, Username, Password, and Verified Sender Email Address.</li>
      </ul>

      <h3>2. BYOPG Payment Gateways</h3>
      <ul>
        <li><strong>Supported Providers:</strong> Stripe, PayPal, Midtrans, Xendit, Razorpay, Adyen, Manual Bank Transfer, and Pay on Arrival.</li>
        <li><strong>Purpose:</strong> Collecting deposit or full tour payments directly into your merchant bank account without intermediate platform holds.</li>
        <li><strong>Required Keys:</strong> Publishable/Client Key, Secret/Server Key, Merchant ID, and Webhook Signing Secret.</li>
      </ul>

      <h3>3. Google Gemini AI API Key</h3>
      <ul>
        <li><strong>Provider:</strong> Google AI Studio (Gemini 2.5 Flash / Pro).</li>
        <li><strong>Purpose:</strong> Powers the AI Tour Itinerary Generator, AI Proposal Creator, and automated translation tools.</li>
        <li><strong>Required Key:</strong> Gemini API Key (starts with <code>AIzaSy...</code>).</li>
      </ul>

      <h3>4. WhatsApp API Gateway</h3>
      <ul>
        <li><strong>Supported Providers:</strong> Official Meta WhatsApp Business Cloud API, Fonnte, or Wablas.</li>
        <li><strong>Purpose:</strong> Automated instant WhatsApp booking receipts, staff alerts, and departure day reminders.</li>
        <li><strong>Required Keys:</strong> Phone Number ID, WhatsApp Access Token, or Gateway API Key.</li>
      </ul>

      <h3>5. Custom Domain & Cloudflare DNS</h3>
      <ul>
        <li><strong>DNS Provider:</strong> Cloudflare (Recommended for free SSL & global CDN), GoDaddy, Namecheap, etc.</li>
        <li><strong>Purpose:</strong> Mapping your custom domain name (e.g. <code>tours.yourbrand.com</code>) with automated SSL/TLS certificates.</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Obtain Google Gemini API Key',
        desc: 'Visit Google AI Studio (aistudio.google.com), click "Get API key", create a new key, and copy it for use in Tripbone settings.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Setup Transactional Email (Resend / Mailjet)',
        desc: 'Create an account on Resend or Mailjet, verify your domain SPF/DKIM DNS records, and generate an API key.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Collect Payment Gateway Keys',
        desc: 'Log in to your Stripe, Midtrans, or Xendit dashboard under Developer Settings and copy your Live API Keys.',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Configure WhatsApp Gateway Account',
        desc: 'Register a WhatsApp API instance on Fonnte / Wablas or Meta Developer Console and retrieve your device token.',
        image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 5: Add Cloudflare DNS Account',
        desc: 'Add your domain to Cloudflare, change your domain nameservers at your registrar, and navigate to DNS management.',
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 3. INSTALLATION
  {
    id: 'installation-guide',
    slug: 'installation-guide',
    title: 'Step-by-Step Installation & Deployment Guide',
    subTitle: 'System Deployment',
    subSubTitle: 'Workspace Initialization, Database & Custom Domain',
    category: 'Installation',
    categoryOrder: 3,
    description: 'Walk-through for initializing your new travel agency workspace, provisioning databases, and going live.',
    content: `
      <h2>Deployment & Activation Workflow</h2>
      <p>Follow these step-by-step instructions to initialize your Tripbone travel agency workspace from scratch.</p>

      <h3>Phase 1: Tenant Workspace Provisioning</h3>
      <p>When you sign up or are provisioned by the SaaS SuperAdmin, a unique workspace ID and isolated Firestore storage container are generated automatically.</p>

      <h3>Phase 2: Connecting Third-Party Integrations</h3>
      <p>Navigate to <strong>Admin Console &gt; Settings</strong> to enter your API credentials for email, payments, Gemini AI, and WhatsApp.</p>

      <h3>Phase 3: Domain Mapping & SSL Certificate</h3>
      <p>In Cloudflare or your DNS host, create a <code>CNAME</code> record pointing your custom domain or subdomain to <code>tripbone.com</code>.</p>
    `,
    steps: [
      {
        title: 'Step 1: Access Admin Console',
        desc: 'Open your workspace URL (e.g., yourtenant.tripbone.com/admin) and log in with your primary administrator email.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Enter API Keys in Settings',
        desc: 'Go to Settings -> Workspace Credentials. Paste your Gemini API Key, Resend API Key, and WhatsApp Token.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Point CNAME Record in Cloudflare',
        desc: 'In Cloudflare DNS, add a CNAME record: Name = @ or tours, Target = tripbone.com, Proxy Status = Proxied (Orange Cloud).',
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Save & Test Custom Domain',
        desc: 'Enter your custom domain under Settings -> Custom Domain. Click "Verify & Connect". System will issue an SSL certificate.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 4. WEBSITE SETTING
  {
    id: 'website-setting-guide',
    slug: 'website-setting-guide',
    title: 'Comprehensive Website Settings & Configurations',
    subTitle: 'Global Configurations',
    subSubTitle: 'Communication, BYOPG Payments, Branding & SEO',
    category: 'Website Setting',
    categoryOrder: 4,
    description: 'Master every setting option: branding, email templates, multi-gateway payment rules, tax settings, and tracking scripts.',
    content: `
      <h2>Website Settings Breakdown</h2>
      <p>The Website Settings module controls global system behavior, branding, and payment processing rules.</p>

      <h3>1. Communication & Email Settings</h3>
      <ul>
        <li><strong>Provider Selection:</strong> Choose Resend, Mailjet, SendGrid, or Custom SMTP.</li>
        <li><strong>Sender Info:</strong> Set Sender Name (e.g. "Bali Adventours Team") and Reply-To Email.</li>
        <li><strong>Email Templates:</strong> Customize headers, footers, logo images, and voucher colors for automated emails.</li>
      </ul>

      <h3>2. BYOPG Payment Gateway Settings</h3>
      <ul>
        <li><strong>Deposit Configuration:</strong> Enable full payment requirement or partial deposits (e.g. 20% deposit or $50 fixed deposit).</li>
        <li><strong>Active Gateways:</strong> Enable multiple options simultaneously (e.g. Stripe for International Cards + Midtrans for Local QRIS/Bank Transfer + Cash on Arrival).</li>
        <li><strong>Tax & Currencies:</strong> Configure sales tax percentages, default display currency (e.g. USD, EUR, IDR), and auto-FX rates.</li>
      </ul>

      <h3>3. Branding & SEO Settings</h3>
      <ul>
        <li><strong>Brand Identity:</strong> Upload high-res logo, favicon, and set primary accent color.</li>
        <li><strong>SEO Meta & Social Sharing:</strong> Set default meta title, meta description, and OpenGraph preview images.</li>
        <li><strong>Analytics Scripts:</strong> Paste Google Tag Manager (GTM) or Google Analytics (GA4) IDs with automated cross-tenant domain scoping.</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Company Profile & Visual Identity',
        desc: 'Go to Settings -> General. Enter company name, phone, address, and upload your logo and favicon.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Communication & Email Setup',
        desc: 'Navigate to Settings -> Email. Choose provider (Resend/Mailjet), paste API keys, and test email sending.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: BYOPG Payment Methods',
        desc: 'Select Settings -> Payment Manager. Toggle Stripe/Midtrans to Active, input API Keys, and define deposit percentages.',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Analytics & Tracking Scripts',
        desc: 'Under Settings -> SEO & Analytics, paste your GA4 Tracking ID (G-XXXXXXX) or GTM ID (GTM-XXXXXXX).',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 5. WEBSITE BUILDER
  {
    id: 'website-builder-guide',
    slug: 'website-builder-guide',
    title: 'Website Builder: Presets, Header, Hero & Custom Menus',
    subTitle: 'Visual Customization',
    subSubTitle: 'Presets, Custom Header, Hero Slider & Navigation',
    category: 'Website Builder',
    categoryOrder: 5,
    description: 'Customize layout themes, background hero video sliders, navigation menus, and landing page layouts visually.',
    content: `
      <h2>Visual Website Customization</h2>
      <p>Transform the visual design of your client-facing travel website without writing code.</p>

      <h3>1. Preset Themes</h3>
      <p>Select from professionally designed layout presets: <strong>Luxury Escapes</strong> (dark elegant theme), <strong>Adventure Explorer</strong> (vibrant outdoor theme), <strong>Tropical Island</strong> (cyan and white theme), and <strong>Coastal Vibes</strong>.</p>

      <h3>2. Header & Top Navigation Bar</h3>
      <ul>
        <li><strong>Menu Links:</strong> Add custom links to pages, tour categories, blog, or external URLs.</li>
        <li><strong>Header Controls:</strong> Enable/disable currency switcher dropdown, language selector, and WhatsApp quick chat button.</li>
        <li><strong>Sticky Navigation:</strong> Toggle glassmorphism blur effect on scroll.</li>
      </ul>

      <h3>3. Hero Banner & Search Engine Widget</h3>
      <ul>
        <li><strong>Hero Media:</strong> Choose between HD background video loops, image carousel sliders, or static hero graphics.</li>
        <li><strong>Search Bar Fields:</strong> Customize filter parameters (Destination dropdown, Date picker, Duration, Guest count, and Price slider).</li>
        <li><strong>Hero Badges & CTA:</strong> Add urgency badges like "Over 10,000 Happy Travelers" or "Instant Confirmation".</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Choose Design Theme Preset',
        desc: 'Navigate to Website Builder -> Theme Presets. Click preview and select your preferred visual style.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Customize Navigation Header & Menus',
        desc: 'Go to Website Builder -> Navigation Menu. Click "Add Menu Item", reorder items using drag and drop, and save.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Configure Hero Banner & Search Filter',
        desc: 'Under Hero Section, upload background images, set title headline text, and customize search widget input fields.',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Customize Page Footer & Social Links',
        desc: 'Configure footer columns, copyright text, contact phone/email, and social media icons (Instagram, Facebook, YouTube).',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 6. MANAGE WEBSITE (TOURS CRUD, ATTRIBUTES, CLONE, TIERED PRICING)
  {
    id: 'manage-website-tours',
    slug: 'manage-website-tours',
    title: 'Managing Tours, Catalog Attributes, Cloning & Tiered Pricing',
    subTitle: 'Catalog Management',
    subSubTitle: 'Tours CRUD, Attributes, One-Click Clone & Tier Pricing',
    category: 'Manage Website',
    categoryOrder: 6,
    description: 'Detailed step-by-step guide to creating tours, managing destinations, add-ons, drivers, cloning tours, and setting tiered group pricing.',
    content: `
      <h2>Comprehensive Tour Catalog Management</h2>
      <p>The Tour Manager is the heart of your travel business. Manage every aspect of tour products with granular precision.</p>

      <h3>1. Tour CRUD Operations (Create, Read, Update, Delete)</h3>
      <ul>
        <li><strong>Basic Info:</strong> Tour Title, Sub-title, Slug, Overview, Highlights, Duration (Hours/Days).</li>
        <li><strong>Step-by-Step Itinerary:</strong> Add daily or hourly itinerary steps with photos, descriptions, and location markers.</li>
        <li><strong>Inclusions & Exclusions:</strong> List items included (e.g. Lunch, Hotel Pick-up, Entry Tickets) and excluded (e.g. Personal Expenses, Tips).</li>
        <li><strong>Things to Bring & Rules:</strong> Guide guests on clothing, shoes, passport requirements, and age limits.</li>
      </ul>

      <h3>2. Catalog Attributes & Operational Taxonomy</h3>
      <ul>
        <li><strong>Destinations & Locations:</strong> Categorize tours by island, city, or geographical region (e.g., Ubud, Nusa Penida, Seminyak).</li>
        <li><strong>Add-Ons & Extras:</strong> Offer upsells during checkout (e.g., Drone Photography +$30, Airport Transfer +$25, VIP Lunch Upgrade +$15).</li>
        <li><strong>Transport & Vehicles:</strong> Assign vehicle types (SUV, Minibus, Speedboat) and capacities.</li>
        <li><strong>Drivers & Guides:</strong> Assign dedicated team members or tour guides to specific tour schedules.</li>
        <li><strong>Labels & Urgency Points:</strong> Attach visual tags like "Best Seller", "Top Rated", "50% Deposit", or "Limited Spots Left".</li>
      </ul>

      <h3>3. One-Click Tour Cloning</h3>
      <p>Duplicate any existing tour in 1 click. Ideal for creating quick product variations such as "Private Ubud Tour" vs "Group Ubud Sharing Tour".</p>

      <h3>4. Packages & Tiered Group Pricing</h3>
      <p>Set dynamic pricing tiers based on guest group sizes:</p>
      <ul>
        <li>1 – 2 Persons: $85 / person</li>
        <li>3 – 5 Persons: $65 / person</li>
        <li>6+ Persons: $45 / person</li>
        <li>Child Rate (Ages 3-11): 50% discount</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Click "Add New Tour" or Use AI Magic',
        desc: 'Go to Tour Manager -> Click "Add New Tour". You can enter details manually or click "Generate with AI Magic" to auto-fill title, itinerary, and photos.',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Add Detailed Step-by-Step Itinerary',
        desc: 'Scroll to Itinerary Steps. Add Step 1 (Hotel Pickup), Step 2 (Waterfall Visit), Step 3 (Buffet Lunch), uploading high-res photos for each step.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Configure Tiered Group Pricing & Packages',
        desc: 'Under Pricing & Packages, set base adult price, child price, and define Tier Pricing rules for group discounts.',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Attach Add-Ons, Locations & Drivers',
        desc: 'Assign Destination tags, tick applicable Add-Ons (e.g. GoPro Rental), and select default Driver/Guide from the dropdown list.',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 5: Clone Tour for Rapid Product Variants',
        desc: 'On the Tour List, click the "Clone" icon next to any tour. Modify the title and pricing to launch a new variant instantly.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 7. MANAGE BOOKING
  {
    id: 'manage-booking-guide',
    slug: 'manage-booking-guide',
    title: 'Booking Management, CSV Import & Channel Sync',
    subTitle: 'Operations & Fulfillment',
    subSubTitle: 'Order Processing, CSV Imports & OTA iCal Connections',
    category: 'Manage Booking',
    categoryOrder: 7,
    description: 'Process guest reservations, issue e-vouchers, bulk import offline bookings via CSV, and sync calendars with OTAs.',
    content: `
      <h2>Booking Operations & Inventory Management</h2>
      <p>Manage reservations seamlessly from guest booking placement to tour completion and reviews.</p>

      <h3>1. Order Processing & Status Tracking</h3>
      <ul>
        <li><strong>Status Badges:</strong> Confirmed, Pending Deposit, Paid, Cancelled, Completed, Refunded.</li>
        <li><strong>E-Voucher Issuance:</strong> Automatically generate branded PDF vouchers with QR codes for driver scanning at hotel pickup.</li>
        <li><strong>Guest & Internal Notes:</strong> Add dietary restrictions, hotel room numbers, or special request notes.</li>
      </ul>

      <h3>2. Import Booking via CSV</h3>
      <p>Migrate historical bookings or import offline cash bookings from walk-in guests using the built-in CSV bulk import wizard.</p>

      <h3>3. Channel Manager & iCal OTA Sync</h3>
      <p>Connect iCal synchronization feeds to automatically update tour seat availability across Viator, GetYourGuide, TripAdvisor, and Booking.com.</p>
    `,
    steps: [
      {
        title: 'Step 1: View Reservation Dashboard',
        desc: 'Navigate to Bookings -> All Reservations. Filter by tour date, booking status, or payment provider.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Re-issue PDF Vouchers & Update Status',
        desc: 'Click any booking record to view guest details. Click "Download Voucher PDF" or "Resend Confirmation Email/WhatsApp".',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Bulk Import Offline Bookings via CSV',
        desc: 'Go to Bookings -> Import CSV. Download template file, populate guest rows, upload CSV file, and click "Execute Import".',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Connect Channel Manager iCal Feeds',
        desc: 'Under Bookings -> Channel Manager, copy the unique tour iCal URL and paste it into your Viator / GetYourGuide supplier portal.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 8. INQUIRY & SALES
  {
    id: 'inquiry-sales-guide',
    slug: 'inquiry-sales-guide',
    title: 'Inquiry Management, AI Proposal Generator & Coupons',
    subTitle: 'Sales & Conversion',
    subSubTitle: 'Custom Inquiries, Proposal Generator & Discount Engine',
    category: 'Inquiry & Sales',
    categoryOrder: 8,
    description: 'Convert custom travel leads into paid bookings with AI proposal generation and promotional coupon codes.',
    content: `
      <h2>Inquiry Handling & AI Sales Tools</h2>
      <p>Manage custom group inquiries and deliver instant quotation proposals to high-value travel clients.</p>

      <h3>1. Incoming Custom Inquiries</h3>
      <p>Review custom trip requests submitted by visitors via website contact forms, including budget, preferred dates, group size, and special requirements.</p>

      <h3>2. AI Proposal Generator</h3>
      <p>Use Google Gemini AI to transform raw inquiry notes into a tailored web/PDF quotation proposal containing an itemized breakdown, custom itinerary, and direct checkout link.</p>

      <h3>3. Discount Coupon Engine</h3>
      <p>Create promotional coupon codes with flexible rules (e.g., 10% Off, $50 Discount, Expiration Date, Minimum Spend, Max Redemptions).</p>
    `,
    steps: [
      {
        title: 'Step 1: Review Incoming Inquiries',
        desc: 'Go to Inquiries -> Incoming Leads. Click on a lead to view guest details, preferred dates, and notes.',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Generate AI Proposal with 1 Click',
        desc: 'Click "Generate AI Proposal". Gemini AI analyzes the guest request and generates a complete multi-day proposal page.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Send Proposal Link to Guest',
        desc: 'Review pricing and click "Send Proposal via Email/WhatsApp". Guest receives an interactive web proposal with a "Book Now" button.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 4: Create Promotional Coupon Code',
        desc: 'Go to Sales -> Coupons -> Click "New Coupon". Code = SUMMER2026, Discount = 15%, Expiration = 31 Dec 2026.',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 9. SUPPORT & TICKET
  {
    id: 'support-ticket-guide',
    slug: 'support-ticket-guide',
    title: 'Customer Support & Helpdesk Ticket Management',
    subTitle: 'Customer Care',
    subSubTitle: 'Helpdesk Tickets, Priority Levels & Staff Assignment',
    category: 'Support & Ticket',
    categoryOrder: 9,
    description: 'Provide guest customer support with an integrated ticketing system and staff assignment workflow.',
    content: `
      <h2>Support Ticket Management</h2>
      <p>Streamline guest inquiries, booking amendments, and post-tour feedback with a centralized helpdesk dashboard.</p>

      <h3>1. Ticket Dashboard</h3>
      <p>Track open tickets, waiting response status, and closed tickets. Filter by category (Booking Change, Payment Inquiry, General Question, Special Assistance).</p>

      <h3>2. Ticket Assignments & Internal Notes</h3>
      <p>Assign tickets to specific staff members or reservation agents, setting priority levels (Low, Normal, High, Urgent).</p>
    `,
    steps: [
      {
        title: 'Step 1: Open Support Ticket Console',
        desc: 'Navigate to Support -> Tickets. View list of open tickets submitted by guests from the help portal.',
        image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Assign Ticket & Set Priority',
        desc: 'Select a ticket, assign to a staff agent from the dropdown, and set priority to "High" for urgent tour updates.',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Reply to Guest & Close Ticket',
        desc: 'Type response or select a macro template answer. Click "Send & Mark Resolved". Guest receives email notification.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 10. BLOG
  {
    id: 'blog-content-guide',
    slug: 'blog-content-guide',
    title: 'Blog & Travel Content Marketing',
    subTitle: 'Content & SEO',
    subSubTitle: 'Articles, Destination Spotlights & Embedded Tour Widgets',
    category: 'Blog',
    categoryOrder: 10,
    description: 'Publish engaging travel blogs, SEO destination guides, and embed tour products inside article bodies.',
    content: `
      <h2>Travel Content & Blogging Engine</h2>
      <p>Drive organic traffic from Google search by publishing high-quality travel guides and news articles.</p>

      <h3>1. Creating & Formatting Blog Posts</h3>
      <p>Use the WYSIWYG editor to write articles, format headings, add high-resolution photo galleries, and embed tour booking cards directly into the post.</p>

      <h3>2. Categories & Tags</h3>
      <p>Organize posts into categories (e.g. Travel Tips, Culture, Food Guides, Top Destinations) with custom tags for SEO indexing.</p>
    `,
    steps: [
      {
        title: 'Step 1: Navigate to Blog Manager',
        desc: 'Go to Blog -> Add New Article. Enter headline title, article summary, and select category.',
        image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Add Content & Embed Tour Cards',
        desc: 'Write body text, add images, and click "Embed Tour Widget" to insert a bookable tour card inside the article.',
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Configure SEO Meta & Publish',
        desc: 'Enter custom meta title, meta description, featured hero image, and click "Publish Article".',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 11. PAGES & LANDING PAGE GENERATOR
  {
    id: 'pages-landing-generator',
    slug: 'pages-landing-generator',
    title: 'Custom Pages & AI Landing Page Generator',
    subTitle: 'Page Publishing',
    subSubTitle: 'Static Pages & AI-Powered Campaign Landing Pages',
    category: 'Pages & Landing Page Generator',
    categoryOrder: 11,
    description: 'Create static company pages (About Us, Terms) and generate high-converting promotional landing pages using AI.',
    content: `
      <h2>Page Publishing & Campaign Generator</h2>
      <p>Manage all website pages and generate specialized campaign landing pages for seasonal marketing promotions.</p>

      <h3>1. Standard Static Pages</h3>
      <p>Manage core informational pages: About Us, Contact Us, Terms & Conditions, Privacy Policy, and Frequently Asked Questions (FAQ).</p>

      <h3>2. AI Campaign Landing Page Generator</h3>
      <p>Input a prompt (e.g. "Create a high-converting Summer Special 2026 landing page for Bali Diving Tours with countdown timer and reviews"). Gemini AI builds a complete custom landing page layout instantly.</p>
    `,
    steps: [
      {
        title: 'Step 1: Create Static Pages',
        desc: 'Go to Pages -> Add Page. Create pages like "About Us" or "Terms of Service" with full HTML formatting.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Launch AI Landing Page Generator',
        desc: 'Click "AI Landing Page Generator", type your campaign target audience and deal parameters, and click "Generate".',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Review & Publish Landing Page',
        desc: 'Preview the generated campaign page, adjust call-to-action buttons or colors, and click "Publish Page".',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 12. POP UP
  {
    id: 'popup-announcements',
    slug: 'popup-announcements',
    title: 'Promotional Popups & Lead Banners',
    subTitle: 'Conversion Optimization',
    subSubTitle: 'Exit-Intent Banners, Coupon Modals & Announcement Bars',
    category: 'Pop Up',
    categoryOrder: 12,
    description: 'Drive conversions with promotional popups, discount notification bars, and exit-intent lead forms.',
    content: `
      <h2>Popup & Lead Capture Engine</h2>
      <p>Capture visitor emails and boost booking conversions with smart popup triggers.</p>

      <h3>1. Popup Customization</h3>
      <p>Configure popup title, promo image, discount code offer, countdown timer, and newsletter email submission form.</p>

      <h3>2. Trigger Rules & Conditions</h3>
      <ul>
        <li><strong>Exit Intent:</strong> Triggers when guest moves cursor towards browser tab close button.</li>
        <li><strong>Time Delay:</strong> Triggers after visitor spends X seconds on page (e.g. 5 seconds).</li>
        <li><strong>Scroll Percentage:</strong> Triggers when visitor scrolls down 50% of tour page.</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Create New Popup Campaign',
        desc: 'Navigate to Popups -> Add Popup. Enter title (e.g. "Get $20 Off Your First Tour"), upload promo banner image.',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Select Trigger Condition',
        desc: 'Choose trigger: Exit-Intent, 5-Second Delay, or 50% Scroll. Set frequency rule (e.g. Show once per guest session).',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Activate Popup & Track Conversions',
        desc: 'Toggle status to "Active". Monitor total popup views, email signups, and coupon redemptions from the analytics widget.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 13. REVIEWS
  {
    id: 'reviews-management',
    slug: 'reviews-management',
    title: 'Customer Reviews & Feedback Moderation',
    subTitle: 'Social Proof',
    subSubTitle: 'Review Submissions, Moderation & Rating Badges',
    category: 'Reviews',
    categoryOrder: 13,
    description: 'Collect, moderate, and display real customer reviews and rating badges across tour pages.',
    content: `
      <h2>Reviews & Testimonials System</h2>
      <p>Build trust with prospective travelers by displaying verified guest reviews and star ratings.</p>

      <h3>1. Automated Feedback Invitations</h3>
      <p>After a booking is completed, the system automatically emails or WhatsApps the guest a post-tour review submission link.</p>

      <h3>2. Moderation & Display Controls</h3>
      <p>Approve, edit, or respond to guest reviews before they appear publicly on tour detail pages.</p>
    `,
    steps: [
      {
        title: 'Step 1: Access Review Moderation Dashboard',
        desc: 'Go to Reviews -> All Submissions. View guest ratings (1-5 stars), review comments, and attached photos.',
        image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Approve & Reply to Reviews',
        desc: 'Click "Approve" to publish on the website. Type an official merchant response (e.g. "Thank you Sarah!").',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Embed Review Widgets & Ratings',
        desc: 'Enable star rating badges on website header, tour cards, and checkout pages under Reviews -> Widget Settings.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 14. USER MANAGEMENT
  {
    id: 'user-management-roles',
    slug: 'user-management-roles',
    title: 'User Management, Staff Roles & Permissions',
    subTitle: 'Access Control',
    subSubTitle: 'Team Accounts, Role Permissions & Vendor Portals',
    category: 'User Management',
    categoryOrder: 14,
    description: 'Manage staff accounts, set granular module permissions, and manage vendor/driver access.',
    content: `
      <h2>Team Access & Role Permissions</h2>
      <p>Manage team members and grant precise administrative rights based on staff duties.</p>

      <h3>1. Pre-defined Staff Roles</h3>
      <ul>
        <li><strong>Administrator:</strong> Full access to all settings, financial reports, and tour management.</li>
        <li><strong>Operations Manager:</strong> Access to tours, bookings, drivers, and support tickets.</li>
        <li><strong>Reservation Agent:</strong> Access to bookings, inquiries, and guest communication.</li>
        <li><strong>Driver & Tour Guide:</strong> View-only access to assigned daily passenger manifests.</li>
        <li><strong>Finance Accountant:</strong> Access to financial reports, payment settings, and payout records.</li>
      </ul>
    `,
    steps: [
      {
        title: 'Step 1: Invite New Staff Member',
        desc: 'Go to Team -> Add Member. Enter name, email address, phone number, and assign role.',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Configure Module Permissions',
        desc: 'Toggle granular permissions (e.g. Can Edit Pricing = Disabled, Can View Bookings = Enabled).',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Manage Drivers & Guide Accounts',
        desc: 'Add drivers under Team -> Drivers & Guides. Assign phone numbers so drivers receive daily automated trip manifests via WhatsApp.',
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  },

  // 15. FINANCE REPORT
  {
    id: 'finance-report-analytics',
    slug: 'finance-report-analytics',
    title: 'Financial Reporting & Revenue Analytics',
    subTitle: 'Financial Intelligence',
    subSubTitle: 'Sales Reports, Gateway Revenue & Accounting Exports',
    category: 'Finance Report',
    categoryOrder: 15,
    description: 'Analyze total revenue growth, gateway transaction breakdowns, pending balances, and export CSV tax statements.',
    content: `
      <h2>Financial Intelligence & Reporting</h2>
      <p>Real-time accounting dashboard designed to give you complete financial visibility into your travel business.</p>

      <h3>1. Key Financial Indicators</h3>
      <ul>
        <li><strong>Gross Sales Revenue:</strong> Total monetary value of all booked tours.</li>
        <li><strong>Net Cash Collected:</strong> Total deposit and full payments processed through gateways.</li>
        <li><strong>Pending Accounts Receivable:</strong> Total outstanding balance due upon tour arrival.</li>
        <li><strong>Gateway Revenue Split:</strong> Breakdown of sales processed via Stripe vs Midtrans vs PayPal vs Cash.</li>
      </ul>

      <h3>2. Export Accounting Statements</h3>
      <p>Export itemized financial statements in CSV or Excel format for easy tax compliance and bookkeeping import.</p>
    `,
    steps: [
      {
        title: 'Step 1: Open Finance Analytics Console',
        desc: 'Navigate to Reports -> Financial Intelligence. View real-time revenue charts and key performance metrics.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 2: Filter Revenue by Date & Payment Gateway',
        desc: 'Select date ranges (e.g. This Month, Year-to-Date) and filter sales by gateway processor or tour category.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      },
      {
        title: 'Step 3: Export Financial CSV Statements',
        desc: 'Click "Export Financial Report (CSV)". The system generates an itemized spreadsheet with tax, gateway fees, and net payouts.',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    order: 1,
    status: 'published'
  }
];
