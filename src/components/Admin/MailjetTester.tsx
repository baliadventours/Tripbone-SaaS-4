import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, Mail, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MailjetTesterProps {
  isDarkMode?: boolean;
}

export const MailjetTester: React.FC<MailjetTesterProps> = ({ isDarkMode = false }) => {
  const [toEmail, setToEmail] = useState('');
  const [template, setTemplate] = useState('welcome');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Config States
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [emailProvider, setEmailProvider] = useState('mailjet');
  const [apiKeyPublic, setApiKeyPublic] = useState('');
  const [apiKeyPrivate, setApiKeyPrivate] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'communicationSettings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.emailProvider) setEmailProvider(data.emailProvider);
          setSenderEmail(data.senderEmail || '');
          setSenderName(data.senderName || '');
          if (data.emailApiKey) {
            if (data.emailApiKey.includes(':')) {
              const parts = data.emailApiKey.split(':');
              setApiKeyPublic(parts[0]);
              setApiKeyPrivate(parts[1]);
            } else {
              setApiKeyPublic(data.emailApiKey);
              setApiKeyPrivate('');
            }
          }
        }
      } catch (e) {
        console.error("Failed to load global email config", e);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const docRef = doc(db, 'communicationSettings', 'global');
      let finalKey = apiKeyPublic.trim();
      if (emailProvider === 'mailjet' && apiKeyPrivate.trim()) {
        finalKey = `${apiKeyPublic.trim()}:${apiKeyPrivate.trim()}`;
      }
      
      await setDoc(docRef, {
        emailProvider: emailProvider,
        emailApiKey: finalKey,
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
      }, { merge: true });
      setStatus('success');
      setMessage('Global Email Configuration Saved Successfully!');
    } catch (e: any) {
      setStatus('error');
      setMessage('Failed to save configuration: ' + e.message);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) return;

    setStatus('loading');
    setMessage('');

    try {
      let endpoint = '/api/mail/test';
      let payload: any = { toEmail, subject: 'Test Email from SaaS', htmlPart: '<p>This is a test from your Global Settings</p>' };

      if (template === 'welcome') {
        endpoint = '/api/mail/welcome';
        payload = { email: toEmail, name: 'Test User' };
      } else if (template === 'verify') {
        endpoint = '/api/mail/verify';
        payload = { email: toEmail, link: 'https://app.tripbone.com/verify?token=123' };
      } else if (template === 'invoice') {
        endpoint = '/api/mail/invoice';
        payload = { email: toEmail, plan: 'Professional', amount: '$99.00', invoiceId: 'INV-TEST', type: 'success' };
      } else if (template === 'due') {
        endpoint = '/api/mail/invoice';
        payload = { email: toEmail, plan: 'Professional', amount: '$99.00', dueDate: new Date().toLocaleDateString(), type: 'due' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');

      setStatus('success');
      setMessage(data.simulated ? 'Simulated success (API keys missing)' : `Email sent successfully via ${emailProvider}!`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  if (configLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Email Config...</div>;
  }

  return (
    <div className={cn("border rounded-2xl p-6 md:p-8 shadow-xs", isDarkMode ? "bg-[#111928] border-slate-800" : "bg-white border-gray-200")}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-xl">
          <Mail className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>Global Email Settings & Tester</h2>
          <p className={cn("text-xs mt-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>Configure your main SaaS email provider (Mailjet, Resend, etc) and test.</p>
        </div>
      </div>

      <div className={cn("p-5 rounded-xl border mb-8", isDarkMode ? "bg-[#1f2937] border-slate-700" : "bg-gray-50 border-gray-200")}>
        <h3 className={cn("text-sm font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>1. Configuration</h3>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="mb-4">
             <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>Email Provider</label>
             <select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value)}
                className={cn("w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none", isDarkMode ? "bg-[#111928] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900")}
             >
                <option value="mailjet">Mailjet</option>
                <option value="resend">Resend</option>
                <option value="sendgrid">SendGrid</option>
                <option value="brevo">Brevo (Sendinblue)</option>
                <option value="enginemailer">Enginemailer</option>
             </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>{emailProvider === 'mailjet' ? 'Mailjet API Key (Public)' : 'API Key'}</label>
              <input
                type="text"
                required
                value={apiKeyPublic}
                onChange={(e) => setApiKeyPublic(e.target.value)}
                className={cn("w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none", isDarkMode ? "bg-[#111928] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900")}
              />
            </div>
            {emailProvider === 'mailjet' && (
              <div>
                <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>Mailjet Secret (Private)</label>
                <input
                  type="password"
                  required
                  value={apiKeyPrivate}
                  onChange={(e) => setApiKeyPrivate(e.target.value)}
                  className={cn("w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none", isDarkMode ? "bg-[#111928] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900")}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>Sender Email</label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className={cn("w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none", isDarkMode ? "bg-[#111928] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900")}
              />
            </div>
            <div>
              <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>Sender Name</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className={cn("w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none", isDarkMode ? "bg-[#111928] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900")}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={configSaving} className="flex items-center px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {configSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      <h3 className={cn("text-sm font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>2. Test Integration</h3>
      <form onSubmit={handleTestEmail} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>
              Recipient Email
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none",
                isDarkMode 
                  ? "bg-[#1f2937] border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  : "bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              )}
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className={cn("block text-xs font-bold mb-2 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-gray-500")}>
              Email Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none",
                isDarkMode 
                  ? "bg-[#1f2937] border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  : "bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              )}
            >
              <option value="welcome">Welcome to Tripbone</option>
              <option value="verify">Registration Confirmation</option>
              <option value="invoice">Payment Success (Invoice)</option>
              <option value="due">Payment Due Reminder</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || !toEmail}
          className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
          <span>Send Test Email</span>
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">{message}</div>
        </div>
      )}
    </div>
  );
};
