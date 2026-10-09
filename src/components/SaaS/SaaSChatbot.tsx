import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, MessageSquare, Send, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { handleChatbotRequest } from '../../services/chatbotService';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

export default function SaaSChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: `Hi there! 👋 Welcome to **Tripbone SaaS**.\n\nI'm your Tripbone AI Advisor. I can help you explore:\n- **0% Commission Direct Booking Websites**\n- **AI Tour Studio & Itinerary Builder**\n- **BYOPG Payment Gateways** (Stripe, Midtrans, PayPal, etc.)\n- **Pricing Plans & 14-Day Free Trial**\n\nHow can I help you grow your tour business today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const suggestedActions = [
    { label: "How does it work?", icon: "🚀", prompt: "How does Tripbone work for tour operators?" },
    { label: "Pricing & Plans", icon: "💳", prompt: "What are the pricing plans and features for Tripbone?" },
    { label: "Payment Gateways (BYOPG)", icon: "⚡", prompt: "How do payment gateways work? Can I use my own Stripe or PayPal?" },
    { label: "AI Tour Creator", icon: "✨", prompt: "Tell me about the AI tour generator and importing from Viator." },
    { label: "Talk with Sales / WhatsApp", icon: "💬", prompt: "whatsapp" }
  ];

  // Hide on superadmin or backend administration areas
  const isHidden = location.pathname.startsWith('/superadmin') || 
                   location.pathname.startsWith('/admin') ||
                   location.pathname.startsWith('/verify-email');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
    if (!textToSend.trim() || isLoading) return;

    if (textToSend === 'whatsapp') {
      const waNumber = '6281246502939';
      const waText = encodeURIComponent("Hi Tripbone Team! I'm interested in Tripbone SaaS for my tour business. Can we talk?");
      window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
      return;
    }

    const userMessage: Message = { role: 'user', parts: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (typeof overrideInput !== 'string') setInput('');
    setIsLoading(true);

    try {
      const origin = window.location.origin;
      // Pass 'master' so the server routes to Tripbone Platform Advisor persona
      const data = await handleChatbotRequest([...messages, userMessage], origin, 'master');
      setMessages(prev => [...prev, { role: 'model', parts: data.text }]);
    } catch (error: any) {
      console.error('SaaS Chatbot Error:', error);
      const waLink = `https://wa.me/6281246502939?text=${encodeURIComponent("Hi Tripbone! I had a question about the platform.")}`;
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          parts: `I'm currently unable to retrieve that information. Feel free to [chat directly with our team on WhatsApp](${waLink}) or explore our [Pricing & Features](/pricing)!`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isHidden) return null;

  return (
    <div className={cn(
      "fixed z-50 flex flex-col items-end transition-all duration-300",
      "bottom-5 right-5 sm:bottom-6 sm:right-6"
    )}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] sm:w-[420px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm tracking-tight text-white">Tripbone AI Advisor</h3>
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider border border-cyan-500/30">SaaS</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">Tour Operator Software & Growth Guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[88%]",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm",
                    m.role === 'user'
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none font-medium"
                      : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none shadow-slate-100"
                  )}>
                    <div className="markdown-content prose prose-sm max-w-none text-inherit">
                      <Markdown
                        components={{
                          a: ({ node, href, children, ...props }) => {
                            const linkHref = href || '#';
                            const isInternal = linkHref.startsWith('/') && !linkHref.startsWith('//');
                            return (
                              <a
                                {...props}
                                href={linkHref}
                                target={isInternal ? '_self' : '_blank'}
                                rel="noreferrer"
                                className="font-bold text-cyan-600 hover:text-cyan-700 underline inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  if (isInternal) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(linkHref);
                                  }
                                }}
                              >
                                {children}
                                {!isInternal && <ExternalLink className="w-3 h-3 inline-block ml-0.5" />}
                              </a>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="my-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>
                        }}
                      >
                        {m.parts}
                      </Markdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200/80 w-fit shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium pl-1">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Chips */}
            {messages.length <= 2 && (
              <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
                {suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action.prompt)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100/80 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200/60 transition-colors"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about Tripbone SaaS..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 placeholder:text-slate-400 transition"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl hover:from-cyan-500 hover:to-blue-500 transition shadow-sm disabled:opacity-40 flex items-center justify-center cursor-pointer"
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Tripbone AI Advisor</span>
                <a
                  href="https://tripbone.com/signup"
                  className="font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-0.5"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signup');
                  }}
                >
                  <span>14-day free trial</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 px-4 rounded-full shadow-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-105 group border cursor-pointer",
          isOpen
            ? "bg-slate-900 text-white border-slate-800"
            : "bg-slate-950 text-white border-cyan-500/30 hover:border-cyan-400 shadow-cyan-950/20"
        )}
        aria-label="Toggle Tripbone AI Advisor"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
            {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
          </div>
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          )}
        </div>
        <div className="text-left hidden sm:flex flex-col pr-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 leading-none">Tripbone AI</span>
          <span className="text-[10px] text-slate-300 font-medium leading-tight">Ask Advisor</span>
        </div>
      </button>
    </div>
  );
}
