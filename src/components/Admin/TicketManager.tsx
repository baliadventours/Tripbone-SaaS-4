import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs, where, addDoc
} from '@/src/lib/firebase';
import { db, auth } from '../../lib/firebase';
import { SupportTicket, TicketMessage } from '../../types';
import { 
  LifeBuoy, MessageSquare, Phone, Send, CheckSquare, Clock, AlertCircle, X, RefreshCw, 
  User, CheckCircle2, ChevronRight, CheckCheck, Loader2, ClipboardCheck, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../../lib/SettingsContext';

interface OpenWaMessage {
  id: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
  createdAt: string;
}

interface WhatsAppChat {
  chatId: string;
  name?: string;
  lastMessage: OpenWaMessage;
  messages: OpenWaMessage[];
}

const getJidString = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val._serialized || val.id || val.jid || val.user || '';
  }
  return String(val);
};

export default function TicketManager({ isTenantPortal = false }: { isTenantPortal?: boolean }) {
  const { settings, globalBrand } = useSettings();
  const brandColor = settings?.primaryColor || globalBrand?.brandColor || '#1db3cd';

  const [activeTab, setActiveTab] = useState<'web' | 'whatsapp'>('web');
  
  // Web dynamic tickets
  const [webTickets, setWebTickets] = useState<SupportTicket[]>([]);
  const [webLoading, setWebLoading] = useState(true);
  const [activeWebTicketId, setActiveWebTicketId] = useState<string | null>(null);
  const [webReply, setWebReply] = useState('');
  const [webSubmitting, setWebSubmitting] = useState(false);

  // Tenant Ticket Creation Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicket['category']>('General Inquiry');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketSubmitting, setNewTicketSubmitting] = useState(false);

  // WhatsApp state
  const [waChats, setWaChats] = useState<WhatsAppChat[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [activeWaChatId, setActiveWaChatId] = useState<string | null>(null);
  const [waReply, setWaReply] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [syncReport, setSyncReport] = useState<{ chats: number; messages: number } | null>(null);

  const syncWhatsAppInbox = async () => {
    setSyncingInbox(true);
    setWaError(null);
    setSyncReport(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated.');
      }
      const res = await fetch('/api/whatsapp-sync', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setSyncReport({ chats: data.chatsSynced || 0, messages: data.messagesSynced || 0 });
        // Refresh contacts/chats immediately
        await fetchWhatsAppMessages(false);
      } else {
        throw new Error(data.error || 'Failed to sync inbox with WhatsApp Gateway.');
      }
    } catch (err: any) {
      console.error('[syncWhatsAppInbox Error]:', err);
      setWaError(err.message || 'Error occurred while running Deep Inbox Sync.');
    } finally {
      setSyncingInbox(false);
    }
  };

  const activeWebTicket = webTickets.find(t => t.id === activeWebTicketId);
  const activeWaChat = waChats.find(c => c.chatId === activeWaChatId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of active messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeWebTicketId, activeWaChatId, activeWebTicket?.messages, activeWaChat?.messages]);

  // 1. Listen to Web helpdesk tickets in Firestore
  useEffect(() => {
    const baseQuery = collection(db, 'supportTickets');
    const q = isTenantPortal && auth.currentUser?.email
      ? query(
          baseQuery,
          where('userEmail', '==', auth.currentUser.email)
        )
      : query(
          baseQuery
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: SupportTicket[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : m.timestamp
          }))
        } as SupportTicket);
      });

      // Sort client-side by updatedAt desc to bypass index requirement errors
      fetched.sort((a, b) => {
        const getTimestampMillis = (val: any): number => {
          if (!val) return 0;
          if (val instanceof Date) return val.getTime();
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (typeof val.seconds === 'number') return val.seconds * 1000;
          if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime() || 0;
          return 0;
        };
        return getTimestampMillis(b.updatedAt) - getTimestampMillis(a.updatedAt);
      });

      setWebTickets(fetched);
      setWebLoading(false);
    }, (error) => {
      console.error('[Admin Support Tickets Fetch Error]:', error);
      setWebLoading(false);
    });

    return unsubscribe;
  }, [isTenantPortal]);

  // 2. Fetch WhatsApp conversations from backend proxy
  const fetchWhatsAppMessages = async (silent = false) => {
    if (!silent) setWaLoading(true);
    setRefreshing(true);
    setWaError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated.');
      }

      let chatsList: WhatsAppChat[] = [];
      let successWithChats = false;

      try {
        // Tries to fetch live chats list from backend proxy
        const resChats = await fetch('/api/whatsapp-chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const jsonChats = await resChats.json();

        if (jsonChats.success && (Array.isArray(jsonChats.data) || (jsonChats.data && Array.isArray(jsonChats.data.chats)))) {
          const rawChats = Array.isArray(jsonChats.data) ? jsonChats.data : (jsonChats.data.chats || []);
          
          chatsList = rawChats.map((chat: any) => {
            const chatId = getJidString(chat.id || chat.chatId || chat.jid || 'unknown');
            
            // Exclude group chats, status/broadcast streams, and the Belgium spam number
            const jidLower = chatId.toLowerCase();
            const isGroup = jidLower.endsWith('@g.us') || jidLower.endsWith('@g.id') || jidLower.endsWith('@temp');
            const isBroadcast = jidLower.includes('broadcast') || jidLower.includes('status');
            const isBelgiumSpam = jidLower.includes('32246832590961');
            if (isGroup || isBroadcast || isBelgiumSpam) {
              return null;
            }

            // Parse lastMessage if available
            let lastMsg = chat.lastMessage || chat.last_message;
            if (!lastMsg && chat.messages && chat.messages.length > 0) {
              lastMsg = chat.messages[chat.messages.length - 1];
            }

            // Fallback if no last message
            if (!lastMsg) {
              lastMsg = {
                id: String(Math.random()),
                body: chat.lastMessageBody || 'No text history',
                fromMe: chat.lastMessageFromMe === true,
                timestamp: Date.now() / 1000
              };
            }

            const fromStr = getJidString(lastMsg.from);
            const toStr = getJidString(lastMsg.to);

            let isSelf = lastMsg.fromMe === true || 
                         String(lastMsg.fromMe) === 'true' || 
                         lastMsg.from_me === true || 
                         String(lastMsg.from_me) === 'true' || 
                         lastMsg.direction === 'outgoing' ||
                         lastMsg.isSelf === true ||
                         String(lastMsg.isSelf) === 'true' ||
                         lastMsg.sender?.isMe === true ||
                         String(lastMsg.sender?.isMe) === 'true';

            if (!isSelf && chatId && chatId !== 'unknown') {
              const cleanChat = chatId.split('@')[0];
              const cleanFrom = fromStr.split('@')[0];
              const cleanTo = toStr.split('@')[0];
              
              if (cleanFrom && cleanFrom === cleanChat) {
                isSelf = false;
              } else if (cleanTo && cleanTo === cleanChat) {
                isSelf = true;
              }
            }

            const direction = isSelf ? 'outgoing' : 'incoming';
            const body = lastMsg.body || lastMsg.text || 'Media / Info message';
            let created = lastMsg.createdAt || lastMsg.timestamp || lastMsg.time;
            if (typeof created === 'number') {
              created = created < 10000000000 ? new Date(created * 1000).toISOString() : new Date(created).toISOString();
            } else {
              created = created ? new Date(created).toISOString() : new Date().toISOString();
            }

            const normalizedLastMsg: OpenWaMessage = {
              id: lastMsg.id || lastMsg.messageId || String(Math.random()),
              chatId,
              from: fromStr || (isSelf ? 'user' : chatId),
              to: toStr || (isSelf ? chatId : 'user'),
              body,
              direction,
              timestamp: String(created),
              status: lastMsg.status || 'read',
              createdAt: created
            };

            const chatName = chat.name || chat.formattedTitle || chat.contact?.name || chat.contact?.formattedName || chatId.split('@')[0];

            return {
              chatId,
              name: chatName,
              lastMessage: normalizedLastMsg,
              messages: chat.messages ? chat.messages.map((m: any) => {
                const innerFrom = getJidString(m.from);
                const innerTo = getJidString(m.to);

                let mSelf = m.fromMe === true || 
                            String(m.fromMe) === 'true' || 
                            m.from_me === true || 
                            String(m.from_me) === 'true' || 
                            m.direction === 'outgoing' || 
                            m.isSelf === true ||
                            String(m.isSelf) === 'true' ||
                            m.sender?.isMe === true ||
                            String(m.sender?.isMe) === 'true';

                if (!mSelf && chatId && chatId !== 'unknown') {
                  const cleanChat = chatId.split('@')[0];
                  const cleanFrom = innerFrom.split('@')[0];
                  const cleanTo = innerTo.split('@')[0];
                  
                  if (cleanFrom && cleanFrom === cleanChat) {
                    mSelf = false;
                  } else if (cleanTo && cleanTo === cleanChat) {
                    mSelf = true;
                  }
                }

                const mDir = mSelf ? 'outgoing' : 'incoming';
                let mCreated = m.createdAt || m.timestamp || m.time;
                if (typeof mCreated === 'number') {
                  mCreated = mCreated < 10000000000 ? new Date(mCreated * 1000).toISOString() : new Date(mCreated).toISOString();
                } else {
                  mCreated = mCreated ? new Date(mCreated).toISOString() : new Date().toISOString();
                }
                return {
                  id: m.id || String(Math.random()),
                  chatId,
                  from: innerFrom || (mSelf ? 'me' : chatId),
                  to: innerTo || (mSelf ? chatId : 'me'),
                  body: m.body || m.text || '',
                  direction: mDir,
                  timestamp: String(mCreated),
                  status: m.status || 'read',
                  createdAt: mCreated
                };
              }) : [normalizedLastMsg]
            };
          }).filter(Boolean) as WhatsAppChat[];

          successWithChats = chatsList.length > 0;
        }
      } catch (errChats) {
        console.warn('[WhatsApp Chats Fetch Error, continuing to fallback]:', errChats);
      }

      // If we couldn't load chats via /api/whatsapp-chats, we fall back to general messages history endpoint
      if (!successWithChats) {
        // Fetch latest 100 messages to build conversation history
        const res = await fetch('/api/whatsapp-messages?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to retrieve WhatsApp history.');
        }

        let rawMessages: any[] = [];
        if (Array.isArray(json.data)) {
          rawMessages = json.data;
        } else if (Array.isArray(json.data?.messages)) {
          rawMessages = json.data.messages;
        } else if (Array.isArray(json.data?.data)) {
          rawMessages = json.data.data;
        }

        // Group them by chatId
        const grouped: { [key: string]: OpenWaMessage[] } = {};
        rawMessages.forEach((msg: any) => {
          let chatId = getJidString(msg.chatId || msg.chat?.id || msg.chat_id);
          const innerFrom = getJidString(msg.from);
          const innerTo = getJidString(msg.to);

          let isSelf = msg.fromMe === true || 
                       String(msg.fromMe) === 'true' || 
                       msg.from_me === true || 
                       String(msg.from_me) === 'true' || 
                       msg.direction === 'outgoing' || 
                       msg.isSelf === true ||
                       String(msg.isSelf) === 'true' ||
                       msg.sender?.isMe === true ||
                       String(msg.sender?.isMe) === 'true';

          if (!chatId) {
            chatId = isSelf ? innerTo : innerFrom;
          }
          if (!chatId) chatId = 'unknown';

          const jidLower = chatId.toLowerCase();
          const isGroup = jidLower.endsWith('@g.us') || jidLower.endsWith('@g.id') || jidLower.endsWith('@temp');
          const isBroadcast = jidLower.includes('broadcast') || jidLower.includes('status');
          const isBelgiumSpam = jidLower.includes('32246832590961');
          if (isGroup || isBroadcast || isBelgiumSpam) {
            return; // skip group chats, status/broadcasts and spam JIDs
          }

          if (!isSelf && chatId !== 'unknown') {
            const cleanChat = chatId.split('@')[0];
            const cleanFrom = innerFrom.split('@')[0];
            const cleanTo = innerTo.split('@')[0];

            if (cleanFrom && cleanFrom === cleanChat) {
              isSelf = false;
            } else if (cleanTo && cleanTo === cleanChat) {
              isSelf = true;
            }
          }

          const direction = isSelf ? 'outgoing' : 'incoming';
          const body = msg.body || msg.text || msg.message || '';
          let createdAt = msg.createdAt || msg.timestamp || msg.time;
          if (typeof createdAt === 'number') {
            createdAt = createdAt < 10000000000 ? new Date(createdAt * 1000).toISOString() : new Date(createdAt).toISOString();
          } else if (!createdAt) {
            createdAt = new Date().toISOString();
          } else {
            createdAt = new Date(createdAt).toISOString();
          }

          const normalizedMsg: OpenWaMessage = {
            id: msg.id || msg.messageId || String(Math.random()),
            chatId,
            from: innerFrom || (isSelf ? 'user' : chatId),
            to: innerTo || (isSelf ? chatId : 'user'),
            body,
            direction,
            timestamp: String(createdAt),
            status: msg.status || 'delivered',
            createdAt
          };

          if (!grouped[chatId]) {
            grouped[chatId] = [];
          }
          grouped[chatId].push(normalizedMsg);
        });

        // Construct unique chats sorted by their ultimate last message
        chatsList = Object.keys(grouped).map((chatId) => {
          // Sort individual chat messages ascending for history log
          const msgs = grouped[chatId].sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
          return {
            chatId,
            name: chatId.split('@')[0],
            lastMessage: msgs[msgs.length - 1],
            messages: msgs
          };
        });
      }

      // Sort entire chats list descending by last message timestamp
      chatsList.sort((a, b) => {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setWaChats(chatsList);
    } catch (err: any) {
      console.error('[Admin WhatsApp CRM Fetch Error]:', err);
      setWaError(err.message || 'Error occurred while loading messaging stream.');
    } finally {
      setWaLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch detailed messages for selected chat
  const fetchChatMessages = async (chatId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/whatsapp-messages?chatId=${chatId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to retrieve chat messages.');
      }

      let rawMessages: any[] = [];
      if (Array.isArray(json.data)) {
        rawMessages = json.data;
      } else if (Array.isArray(json.data?.messages)) {
        rawMessages = json.data.messages;
      } else if (Array.isArray(json.data?.data)) {
        rawMessages = json.data.data;
      } else if (json.data && typeof json.data === 'object') {
        const arrayProp = Object.values(json.data).find(Array.isArray);
        if (arrayProp) {
          rawMessages = arrayProp as any[];
        }
      }

      const normalized: OpenWaMessage[] = rawMessages.map((msg: any) => {
        const innerFrom = getJidString(msg.from);
        const innerTo = getJidString(msg.to);

        let isSelf = msg.fromMe === true || 
                     String(msg.fromMe) === 'true' || 
                     msg.from_me === true || 
                     String(msg.from_me) === 'true' || 
                     msg.direction === 'outgoing' || 
                     msg.isSelf === true ||
                     String(msg.isSelf) === 'true' ||
                     msg.sender?.isMe === true ||
                     String(msg.sender?.isMe) === 'true';

        if (!isSelf && chatId && chatId !== 'unknown') {
          const cleanChat = chatId.split('@')[0];
          const cleanFrom = innerFrom.split('@')[0];
          const cleanTo = innerTo.split('@')[0];
          
          if (cleanFrom && cleanFrom === cleanChat) {
            isSelf = false;
          } else if (cleanTo && cleanTo === cleanChat) {
            isSelf = true;
          }
        }

        const direction = isSelf ? 'outgoing' : 'incoming';
        const body = msg.body || msg.text || msg.message || '';
        
        let createdAt = msg.createdAt || msg.timestamp || msg.time;
        if (typeof createdAt === 'number') {
          createdAt = createdAt < 10000000000 ? new Date(createdAt * 1000).toISOString() : new Date(createdAt).toISOString();
        } else if (!createdAt) {
          createdAt = new Date().toISOString();
        } else {
          createdAt = new Date(createdAt).toISOString();
        }

        return {
          id: msg.id || msg.messageId || String(Math.random()),
          chatId,
          from: innerFrom || (isSelf ? 'user' : chatId),
          to: innerTo || (isSelf ? chatId : 'user'),
          body,
          direction,
          timestamp: String(createdAt),
          status: msg.status || 'delivered',
          createdAt
        };
      });

      // Sort messages ascending
      normalized.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Update in our waChats list
      setWaChats(prevChats => prevChats.map(chat => {
        if (chat.chatId === chatId) {
          return {
            ...chat,
            messages: normalized,
            lastMessage: normalized.length > 0 ? normalized[normalized.length - 1] : chat.lastMessage
          };
        }
        return chat;
      }));

    } catch (err: any) {
      console.error('[Admin WhatsApp Detail Fetch Error]:', err);
    }
  };

  // 1. Real-time Firestore subscription for WhatsApp chats
  useEffect(() => {
    if (activeTab !== 'whatsapp') return;

    setWaLoading(prev => waChats.length === 0 ? true : prev);
    const q = query(
      collection(db, 'whatsapp_chats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsList: WhatsAppChat[] = [];
      snapshot.forEach((docSnap) => {
        const chatData = docSnap.data();
        const chatId = chatData.chatId || docSnap.id;

        // Exclude foreign Belgium spam and group/broadcast/status chats
        const jidLower = String(chatId).toLowerCase();
        if (jidLower.includes('32246832590961') || jidLower.endsWith('@g.us') || jidLower.endsWith('@g.id') || jidLower.includes('broadcast')) {
          return;
        }

        const rawLastMsg = chatData.lastMessage || {};
        const direction = rawLastMsg.direction || (rawLastMsg.fromMe ? 'outgoing' : 'incoming');
        const isSelf = rawLastMsg.fromMe === true || direction === 'outgoing';

        let createdTime = rawLastMsg.createdAt || rawLastMsg.timestamp;
        if (typeof createdTime === 'number') {
          createdTime = createdTime < 10000000000 ? new Date(createdTime * 1000).toISOString() : new Date(createdTime).toISOString();
        } else if (!createdTime) {
          createdTime = chatData.updatedAt || new Date().toISOString();
        }

        const normalizedLastMsg: OpenWaMessage = {
          id: rawLastMsg.id || String(Math.random()),
          chatId,
          from: rawLastMsg.from || (isSelf ? 'user' : chatId),
          to: rawLastMsg.to || (isSelf ? chatId : 'user'),
          body: rawLastMsg.body || 'Media / Info message',
          direction,
          timestamp: String(createdTime),
          status: rawLastMsg.status || 'read',
          createdAt: String(createdTime)
        };

        chatsList.push({
          chatId,
          name: chatData.name || chatId.split('@')[0],
          lastMessage: normalizedLastMsg,
          messages: [] // Loaded dynamically in separate effect
        });
      });

      setWaChats(prev => {
        // Carry forward already loaded detailed messages to avoid glitchy list redraws
        return chatsList.map(newChat => {
          const matchingPrev = prev.find(p => p.chatId === newChat.chatId);
          return {
            ...newChat,
            messages: matchingPrev && matchingPrev.messages.length > 0 ? matchingPrev.messages : [newChat.lastMessage]
          };
        });
      });
      setWaLoading(false);
    }, (error) => {
      console.error('[TicketManager] WhatsApp chats subscription error:', error);
      setWaLoading(false);
    });

    return unsubscribe;
  }, [activeTab]);

  // 2. Real-time Firestore subscription for active WhatsApp chat's detailed message thread
  useEffect(() => {
    if (activeTab !== 'whatsapp' || !activeWaChatId) return;

    const q = query(
      collection(db, 'whatsapp_messages'),
      where('chatId', '==', activeWaChatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: OpenWaMessage[] = [];
      snapshot.forEach((docSnap) => {
        const msgData = docSnap.data();
        let createdAt = msgData.createdAt;
        if (!createdAt && msgData.timestamp) {
          createdAt = new Date(msgData.timestamp * 1000).toISOString();
        } else if (!createdAt) {
          createdAt = new Date().toISOString();
        }

        messagesList.push({
          id: msgData.id || docSnap.id,
          chatId: msgData.chatId,
          from: msgData.from,
          to: msgData.to,
          body: msgData.body || '',
          direction: msgData.direction || 'incoming',
          timestamp: String(createdAt),
          status: 'read',
          createdAt: String(createdAt)
        });
      });

      // Update messages for the active conversation
      setWaChats(prevChats => prevChats.map(chat => {
        if (chat.chatId === activeWaChatId) {
          return {
            ...chat,
            messages: messagesList,
            lastMessage: messagesList.length > 0 ? messagesList[messagesList.length - 1] : chat.lastMessage
          };
        }
        return chat;
      }));
    }, (error) => {
      console.error('[TicketManager] WhatsApp message thread subscription error:', error);
    });

    return unsubscribe;
  }, [activeTab, activeWaChatId]);

  // 3. Keep background gateways checks active to poll updates from phone if webhooks are delayed
  useEffect(() => {
    if (activeTab === 'whatsapp') {
      // Fire an initial check to trigger backend auto-webhook alignment
      fetchWhatsAppMessages(true);
      
      const interval = setInterval(() => {
        fetchWhatsAppMessages(true);
      }, 35000); // Polling check every 35s in background
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // 4. Force pull active chat detail history from gateway when clicked
  useEffect(() => {
    if (activeTab === 'whatsapp' && activeWaChatId) {
      fetchChatMessages(activeWaChatId);
      
      const interval = setInterval(() => {
        fetchChatMessages(activeWaChatId);
      }, 20000); // Fetch thread details from phone every 20s
      return () => clearInterval(interval);
    }
  }, [activeTab, activeWaChatId]);

  // Reply handlers
  const handleWebReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webReply.trim() || !activeWebTicket || webSubmitting) return;
    setWebSubmitting(true);
    try {
      const isStaff = !isTenantPortal;
      const reply: TicketMessage = {
        id: crypto.randomUUID(),
        senderId: auth.currentUser?.uid || 'user',
        senderName: isStaff ? 'Staff Support' : (auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Tenant'),
        senderRole: isStaff ? 'admin' : 'customer',
        text: webReply.trim(),
        timestamp: new Date()
      };

      const revisedMessages = [...activeWebTicket.messages, reply];
      await updateDoc(doc(db, 'supportTickets', activeWebTicket.id), {
        messages: revisedMessages,
        status: isStaff ? 'replied' : 'open',
        updatedAt: serverTimestamp()
      });

      setWebReply('');
    } catch (err: any) {
      console.error('[Web Ticket Reply Error]:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setWebSubmitting(false);
    }
  };

  const handleCreateWebTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || newTicketSubmitting) return;
    setNewTicketSubmitting(true);
    try {
      const currentUserEmail = auth.currentUser?.email || 'tenant@tripbone.com';
      const currentUserName = auth.currentUser?.displayName || currentUserEmail.split('@')[0] || 'Tenant';
      const currentUserId = auth.currentUser?.uid || 'tenant';

      const initialMessage: TicketMessage = {
        id: crypto.randomUUID(),
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: 'customer',
        text: newTicketMessage.trim(),
        timestamp: new Date()
      };

      const newTicketDoc = {
        subject: newTicketSubject.trim(),
        category: newTicketCategory,
        status: 'open',
        type: 'web',
        userEmail: currentUserEmail,
        userName: currentUserName,
        userId: currentUserId,
        messages: [initialMessage],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'supportTickets'), newTicketDoc);
      if (docRef?.id) {
        setActiveWebTicketId(docRef.id);
      }

      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('[Web Ticket Create Error]:', err);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setNewTicketSubmitting(false);
    }
  };

  const handleUpdateWebStatus = async (status: 'open' | 'replied' | 'pending' | 'closed') => {
    if (!activeWebTicket) return;
    try {
      await updateDoc(doc(db, 'supportTickets', activeWebTicket.id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('[Update Status Error]:', err);
    }
  };

  const handleWaReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waReply.trim() || !activeWaChat || waSubmitting) return;
    setWaSubmitting(true);
    setWaError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: activeWaChat.chatId,
          text: waReply.trim()
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to dispatch WhatsApp message.');
      }

      setWaReply('');
      // Refresh chat messages for this chat specifically
      await fetchChatMessages(activeWaChat.chatId);
      // Refresh timeline directly
      await fetchWhatsAppMessages(true);
    } catch (err: any) {
      console.error('[WhatsApp Send Error]:', err);
      setWaError(err.message || 'Error occurred while sending message');
    } finally {
      setWaSubmitting(false);
    }
  };

  const cleanPhoneDisplay = (chatId: string) => {
    const numeric = chatId.split('@')[0];
    if (numeric.startsWith('62')) {
      return `+62 ${numeric.slice(2, 5)}-${numeric.slice(5, 9)}-${numeric.slice(9)}`;
    }
    return `+${numeric}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[550px]">
        {/* List panel */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-[20px] shadow-sm flex flex-col overflow-hidden max-h-[600px]">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Active Tickets ({webTickets.length})</h3>
            {isTenantPortal && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setActiveWebTicketId(null);
                }}
                className="px-2.5 py-1.5 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all hover:brightness-110"
                style={{ backgroundColor: brandColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Ticket</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {webLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: brandColor }} />
              </div>
            ) : webTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-bold">No tickets found</p>
                {isTenantPortal && (
                  <p className="text-xs text-gray-400 mt-1">Submit a ticket to start a conversation.</p>
                )}
              </div>
            ) : (
              webTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveWebTicketId(t.id);
                    setShowCreateForm(false);
                  }}
                  className={cn(
                    "w-full text-left p-4.5 hover:bg-gray-50/60 transition-colors flex flex-col gap-2 relative border-l-4 border-l-transparent"
                  )}
                  style={t.id === activeWebTicketId ? { borderLeftColor: brandColor, backgroundColor: `${brandColor}10` } : {}}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                      style={{ color: brandColor, backgroundColor: `${brandColor}15` }}
                    >
                      {t.category}
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      t.status === 'open' && "bg-blue-50 text-blue-600 border-blue-100",
                      t.status === 'replied' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                      t.status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                      t.status === 'closed' && "bg-gray-50 text-gray-400 border-gray-100"
                    )}>
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm line-clamp-1">{t.subject}</h4>
                    <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">By: {t.userName} ({t.userEmail})</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium ml-auto">
                    {t.updatedAt instanceof Date ? t.updatedAt.toLocaleDateString() : 'Active'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat thread panel */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[20px] shadow-sm flex flex-col overflow-hidden min-h-[500px]">
          {showCreateForm && isTenantPortal ? (
            <div className="flex-1 p-6">
              <h3 className="font-bold text-gray-900 text-md mb-2">Create a Support Ticket</h3>
              <p className="text-xs text-gray-400 mb-6">Need help with something? Let the Tripbone team know and we will get back to you ASAP.</p>
              
              <form onSubmit={handleCreateWebTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Topic / Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full text-xs font-bold bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="General Inquiry">Technical / General Inquiry</option>
                    <option value="Payment">Billing & Payments Inquiry</option>
                    <option value="Feedback">Feedback & Feature Request</option>
                    <option value="Booking">Booking Platform Settings</option>
                    <option value="Tour Details">Tour Packages Setup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="Briefly describe the topic (e.g. Invoice receipt query)"
                    className="w-full py-3 px-4 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Question / Description</label>
                  <textarea
                    rows={6}
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    placeholder="Provide details about your query here..."
                    className="w-full py-3 px-4 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-all"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newTicketSubmitting}
                    className="px-5 py-2.5 text-xs font-bold text-white disabled:bg-gray-200 disabled:text-gray-400 rounded-xl shadow-lg transition-all hover:brightness-110 flex items-center space-x-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    {newTicketSubmitting ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : activeWebTicket ? (
            <div className="flex-1 flex flex-col h-[580px]">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-md">{activeWebTicket.subject}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Tenant Operator: <span className="font-bold text-gray-700">{activeWebTicket.userName}</span> ({activeWebTicket.userEmail})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status:</span>
                  {isTenantPortal ? (
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border",
                      activeWebTicket.status === 'open' && "bg-blue-50 text-blue-600 border-blue-100",
                      activeWebTicket.status === 'replied' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                      activeWebTicket.status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                      activeWebTicket.status === 'closed' && "bg-gray-50 text-gray-400 border-gray-100"
                    )}>
                      {activeWebTicket.status}
                    </span>
                  ) : (
                    <select
                      value={activeWebTicket.status}
                      onChange={(e: any) => handleUpdateWebStatus(e.target.value)}
                      className="text-xs font-bold bg-white border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-orange-500"
                    >
                      <option value="open">Open</option>
                      <option value="replied">Replied</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed / Solved</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Messages stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
                {activeWebTicket.messages.map((m) => {
                  const isStaffReply = m.senderRole === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col max-w-[80%] rounded-[16px] p-4 shadow-sm",
                        isStaffReply 
                          ? (isTenantPortal 
                              ? "mr-auto bg-white text-gray-800 border border-gray-100 rounded-tl-none" 
                              : "ml-auto text-white rounded-tr-none")
                          : (isTenantPortal 
                              ? "ml-auto text-white rounded-tr-none" 
                              : "mr-auto bg-white text-gray-800 border border-gray-100 rounded-tl-none")
                      )}
                      style={
                        isTenantPortal
                          ? (!isStaffReply ? { backgroundColor: brandColor } : {})
                          : (isStaffReply ? { backgroundColor: brandColor } : {})
                      }
                    >
                      <span 
                        className="text-[9px] font-black uppercase tracking-widest mb-1 block"
                        style={isStaffReply ? { color: brandColor } : { color: 'rgba(255,255,255,0.85)' }}
                      >
                        {m.senderName}
                      </span>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{m.text}</p>
                      <span 
                        className="text-[8px] text-right mt-1 opacity-75 block self-end"
                        style={isStaffReply ? { color: '#9ca3af' } : { color: 'rgba(255,255,255,0.75)' }}
                      >
                        {m.timestamp instanceof Date ? m.timestamp.toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply section */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleWebReplySubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={webReply}
                    onChange={(e) => setWebReply(e.target.value)}
                    placeholder="Type your reply to support..."
                    className="flex-1 py-3 px-4 bg-gray-50 focus:bg-white border border-gray-150 rounded-[12px] focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!webReply.trim() || webSubmitting}
                    className="p-3 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-[12px] transition-all cursor-pointer font-bold uppercase tracking-wider text-xs shrink-0 hover:brightness-110"
                    style={{ backgroundColor: brandColor }}
                  >
                    {webSubmitting ? 'Sending...' : <Send className="h-5 w-5" />}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-gray-300 h-[500px]">
              <LifeBuoy className="h-12 w-12 text-indigo-100 mb-3 animate-bounce" />
              <h4 className="font-extrabold text-gray-600 text-lg">Support Helpdesk</h4>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">
                {isTenantPortal 
                  ? "Select a support ticket from the left rail or click 'New Ticket' to submit a support inquiry."
                  : "Select a support ticket from the left rail to view conversations and reply."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
