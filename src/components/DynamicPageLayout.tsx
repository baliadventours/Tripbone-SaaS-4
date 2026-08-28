import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { 
  Sparkles, Calendar, BookOpen, Mail, Phone, MapPin, Send, 
  MessageSquare, Globe, Loader2, Check, ExternalLink,
  Facebook, Instagram, Youtube, Twitter
} from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';
import { formatPageTitle } from '../lib/seoUtils';
import { useTenant } from '../lib/TenantContext';

interface DynamicPageLayoutProps {
  title?: string;
  subtitle?: string;
  heroImage?: string;
  content?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  fallbackTitle: string;
  layout?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  mapsEmbed?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  featuredImages?: string[];
  showContactForm?: boolean;
}

export default function DynamicPageLayout({
  title,
  subtitle,
  heroImage,
  content,
  seo,
  fallbackTitle,
  layout = 'standard',
  phone,
  whatsapp,
  email,
  address,
  mapsEmbed,
  socialMedia,
  featuredImages = [],
  showContactForm = true
}: DynamicPageLayoutProps) {
  const { settings } = useSettings();
  const { tenantId } = useTenant();
  
  const pageTitle = formatPageTitle(
    seo?.title || title || fallbackTitle,
    settings?.siteName || 'Bali Adventours',
    settings?.pageTitleFormat
  );

  const bannerImg = heroImage || "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1600";

  // Contact Form State
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          subject: formState.subject || 'Website Contact Form',
          message: formState.message
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitSuccess("Thank you! Your message has been sent successfully. Our concierge will contact you shortly.");
        setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmitError(data.error || "Failed to deliver message. Please verify your settings and try again.");
      }
    } catch (err) {
      console.error("Form submit error:", err);
      setSubmitError("Network error: Failed to connect to email gateway.");
    } finally {
      setSubmitting(false);
    }
  };

  const getWaNumber = () => {
    const rawNum = whatsapp || phone || settings?.whatsappNumber || settings?.supportPhone || '';
    return rawNum.replace(/\D/g, '');
  };

  const getWaLink = () => {
    const waNumber = getWaNumber();
    if (!waNumber) return '';
    const waText = encodeURIComponent(`Hi! I'm on your website and would like to ask a question.`);
    return `https://wa.me/${waNumber}?text=${waText}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Helmet>
        <title>{pageTitle}</title>
        {seo?.description && <meta name="description" content={seo.description} />}
      </Helmet>

      {/* Majestic Hero Banner */}
      <div className="relative h-[45vh] min-h-[350px] w-full flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImg} 
            alt={title} 
            className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-10000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">Custom Page</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-md">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-200/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Dynamic Layout Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-7xl">
        
        {/* STANDARD LAYOUT */}
        {layout === 'standard' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 sm:p-12 shadow-sm">
            <div className="prose prose-slate prose-orange lg:prose-lg max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* ABOUT BENTO LAYOUT */}
        {layout === 'about-grid' && (
          <div className="space-y-12">
            
            {/* Top Narrative and Gallery Block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Text Narrative */}
              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm min-h-[400px]">
                <div className="prose prose-slate prose-orange lg:prose-lg max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>

              {/* Gallery showcase */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Showcase Gallery
                  </h3>
                  {featuredImages && featuredImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {featuredImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:scale-[1.03] transition-all duration-300">
                          <img src={img} className="w-full h-full object-cover" alt="Gallery item" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Sparkles className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-wider">Local Experience Showcase</p>
                      <p className="text-[10px] mt-1">Explore authentic Bali with custom journeys.</p>
                    </div>
                  )}
                </div>

                {/* Social media card */}
                {socialMedia && (socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter) && (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Connect on Social Channels</h4>
                    <div className="flex justify-center gap-4">
                      {socialMedia.instagram && (
                        <a href={socialMedia.instagram} target="_blank" rel="noreferrer" className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 hover:scale-105 transition">
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {socialMedia.facebook && (
                        <a href={socialMedia.facebook} target="_blank" rel="noreferrer" className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 hover:scale-105 transition">
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {socialMedia.youtube && (
                        <a href={socialMedia.youtube} target="_blank" rel="noreferrer" className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 hover:scale-105 transition">
                          <Youtube className="h-5 w-5" />
                        </a>
                      )}
                      {socialMedia.twitter && (
                        <a href={socialMedia.twitter} target="_blank" rel="noreferrer" className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 hover:scale-105 transition">
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Grid Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Office Address Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Office Headquarters</h4>
                  <p className="text-slate-500 font-medium text-xs mt-2 leading-relaxed">{address || settings?.officeAddress || "Ubud, Bali, Indonesia"}</p>
                </div>
                {address && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:brightness-95 transition-all"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Direct Touchpoints Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col gap-4">
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Direct Hotline</h4>
                  <p className="text-slate-500 font-medium text-xs mt-2">Speak to our Bali travel desk coordinates immediately.</p>
                  <div className="mt-4 space-y-1.5 text-xs font-bold text-slate-800">
                    {phone && <p>Phone: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-primary transition">{phone}</a></p>}
                    {email && <p>Email: <a href={`mailto:${email}`} className="hover:text-primary transition">{email}</a></p>}
                  </div>
                </div>
                {getWaNumber() && (
                  <a 
                    href={getWaLink()} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-auto inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    <MessageSquare className="h-4 w-4" /> Live WhatsApp Chat
                  </a>
                )}
              </div>

              {/* Maps Embed Card */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[250px] relative">
                {mapsEmbed ? (
                  <iframe 
                    src={mapsEmbed} 
                    className="absolute inset-0 w-full h-full border-0" 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-50 text-slate-400">
                    <Globe className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs font-bold uppercase">Ubud Office Coordinates</p>
                    <p className="text-[10px] mt-1 leading-relaxed">Map embed not configured. Visit us at our physical office address in beautiful Gianyar Bali.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* CONTACT GRID LAYOUT */}
        {layout === 'contact-grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Send a Message</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                {content || "Fill out the dynamic inquiry form below to route your travel query directly to our local concierge team."}
              </p>

              {showContactForm ? (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {submitSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                      {submitError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formState.name}
                        onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Ketut Wijaya" 
                        className="w-full p-4 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-xs font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={formState.email}
                        onChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. customer@domain.com" 
                        className="w-full p-4 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-xs font-bold" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone / WhatsApp</label>
                      <input 
                        type="text" 
                        value={formState.phone}
                        onChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +61 400 000 000" 
                        className="w-full p-4 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-xs font-bold" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                      <input 
                        type="text" 
                        value={formState.subject}
                        onChange={e => setFormState(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g. Custom 5-Day Bali Itinerary" 
                        className="w-full p-4 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-xs font-bold" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">How can we assist you?</label>
                    <textarea 
                      required
                      value={formState.message}
                      onChange={e => setFormState(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Share your travel details, guest counts, requested dates, or questions here..." 
                      rows={6} 
                      className="w-full p-4 border border-slate-200 rounded-xl focus:border-primary focus:outline-none text-xs font-medium resize-none leading-relaxed" 
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-white rounded-xl font-extrabold uppercase tracking-widest text-xs hover:brightness-95 hover:shadow-xl transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" /> Routing Inquiry...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Dispatch Inquiry
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase">Form Offline</p>
                  <p className="text-[10px] mt-1">Please use the quick touchpoints listed to reach out directly.</p>
                </div>
              )}
            </div>

            {/* Right Column: Quick Touchpoints */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Info grid card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Immediate Coordinates</h4>
                
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mail Inquiries</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        <a href={`mailto:${email || settings?.supportEmail || 'support@tripbone.com'}`} className="hover:text-primary transition underline decoration-orange-100 underline-offset-4">
                          {email || settings?.supportEmail || 'support@tripbone.com'}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hotline Help Desk</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        <a href={`tel:${(phone || settings?.supportPhone || '').replace(/\s+/g, '')}`} className="hover:text-primary transition">
                          {phone || settings?.supportPhone || '+62 812 4650 2939'}
                        </a>
                      </p>
                    </div>
                  </div>

                  {getWaNumber() && (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Concierge</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
                          <a href={getWaLink()} target="_blank" rel="noreferrer" className="hover:text-primary transition underline decoration-orange-100 underline-offset-4">
                            +{getWaNumber()}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HQ Address</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed">
                        {address || settings?.officeAddress || 'Bali, Indonesia'}
                      </p>
                    </div>
                  </div>
                </div>

                {socialMedia && (socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter) && (
                  <div className="pt-6 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Connect on Social Channels</span>
                    <div className="flex gap-3">
                      {socialMedia.instagram && (
                        <a href={socialMedia.instagram} target="_blank" rel="noreferrer" className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 transition">
                          <Instagram className="h-4.5 w-4.5" />
                        </a>
                      )}
                      {socialMedia.facebook && (
                        <a href={socialMedia.facebook} target="_blank" rel="noreferrer" className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 transition">
                          <Facebook className="h-4.5 w-4.5" />
                        </a>
                      )}
                      {socialMedia.youtube && (
                        <a href={socialMedia.youtube} target="_blank" rel="noreferrer" className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 transition">
                          <Youtube className="h-4.5 w-4.5" />
                        </a>
                      )}
                      {socialMedia.twitter && (
                        <a href={socialMedia.twitter} target="_blank" rel="noreferrer" className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-orange-50 transition">
                          <Twitter className="h-4.5 w-4.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Maps widget card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm h-[200px] overflow-hidden relative">
                {mapsEmbed ? (
                  <iframe 
                    src={mapsEmbed} 
                    className="absolute inset-0 w-full h-full border-0" 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-50 text-slate-400">
                    <Globe className="h-8 w-8 text-slate-300 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Location Map</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
