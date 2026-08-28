import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MessageCircle, MapPin, Phone, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SaaSContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: 'global', // Sending to general settings support email
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || 'General Tripbone Inquiry',
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('🎉 Thank you! Your message has been sent successfully to support@tripbone.com. We will get back to you shortly.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(data.error || 'Failed to submit form. Please try again.');
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError(err.message || 'There was an issue sending your message. Please try again or contact us directly via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Tripbone - Premium Travel Booking System</title>
        <meta name="description" content="Get in touch with Tripbone support. Connect with us via WhatsApp, phone, or submit our contact form for quick assistance." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 pt-32 pb-24 relative overflow-hidden">
        {/* Background Decorative Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1db3cd]/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1db3cd]/10 border border-[#1db3cd]/20 mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1db3cd]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1db3cd] font-mono">We are here to support you</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight"
            >
              Let's Connect
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 mt-4"
            >
              Have a question about Tripbone or need help configuring your tour storefront? Our specialized team is on standby to help you scale your business.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Contact Details & Cards */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 font-sans">Contact Information</h2>
              
              {/* WhatsApp Card */}
              <motion.a 
                href="https://wa.me/6281246502939"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 hover:border-emerald-500/30 shadow-xs hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                  <MessageCircle className="w-6 h-6 text-emerald-500 fill-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-none mb-1.5 group-hover:text-emerald-600 transition">WhatsApp Chat</h3>
                  <p className="text-sm text-emerald-500 font-mono font-bold">+62 812 4650 2939</p>
                  <p className="text-xs text-slate-400 mt-2">Chat directly with a real tour operations engineer. Live support in seconds.</p>
                </div>
              </motion.a>

              {/* Phone Card */}
              <motion.a 
                href="tel:+6281246502939"
                whileHover={{ y: -3 }}
                className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 hover:border-[#1db3cd]/30 shadow-xs hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100 shrink-0">
                  <Phone className="w-5 h-5 text-[#1db3cd]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-none mb-1.5 group-hover:text-[#1db3cd] transition">Phone Support</h3>
                  <p className="text-sm text-slate-600 font-mono font-semibold">+62 812 4650 2939</p>
                  <p className="text-xs text-slate-400 mt-2">Speak directly with our team during operating hours (GMT+8).</p>
                </div>
              </motion.a>

              {/* Email Card */}
              <motion.a 
                href="mailto:support@tripbone.com"
                whileHover={{ y: -3 }}
                className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-500/30 shadow-xs hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-none mb-1.5 group-hover:text-indigo-600 transition">Email Helpdesk</h3>
                  <p className="text-sm text-indigo-500 font-mono font-bold">support@tripbone.com</p>
                  <p className="text-xs text-slate-400 mt-2">For structured ticket inquiries, system setups, and partnership opportunities.</p>
                </div>
              </motion.a>

              {/* Address Card */}
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                  <MapPin className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-none mb-1.5">Our Headquarters</h3>
                  <p className="text-sm text-slate-600 font-sans">
                    Krisna Loka Residence,<br />Denpasar - Bali, Indonesia
                  </p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded font-mono">Operations HQ</span>
                </div>
              </div>

            </div>

            {/* Interactive Contact Form Card */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 font-sans">Send us a Message</h2>
              <p className="text-slate-400 text-sm mb-8">We route and coordinate messages automatically to resolve issues faster.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Alert Banners */}
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                    <div>{error}</div>
                  </div>
                )}

                {success && (
                  <div className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                    <div className="font-medium leading-relaxed">{success}</div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Your Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe" 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1db3cd]/20 focus:border-[#1db3cd] text-slate-800 transition" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Email Address <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@domain.com" 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1db3cd]/20 focus:border-[#1db3cd] text-slate-800 transition" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Phone / WhatsApp</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +62..." 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1db3cd]/20 focus:border-[#1db3cd] text-slate-800 transition" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Subject</label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help you?" 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1db3cd]/20 focus:border-[#1db3cd] text-slate-800 transition" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">Your Message <span className="text-rose-500">*</span></label>
                  <textarea 
                    name="message"
                    required
                    rows={5} 
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your tour business, website plans, or how we can assist..." 
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1db3cd]/20 focus:border-[#1db3cd] text-slate-800 transition" 
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-[#1db3cd] hover:bg-[#189bb3] text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message to Tripbone</span>
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
