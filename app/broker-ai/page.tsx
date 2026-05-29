"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  properties?: Property[];
  time?: string;
}

interface Property {
  id: string;
  title: string;
  type: string;
  purpose: string;
  price: number;
  city: string;
  district?: string;
  rooms?: number;
  baths?: number;
  area?: number;
  images?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updated_at: string;
}

const STORAGE_KEY = "broker_ai_guest_count";

const quickSuggestions = [
  { icon: "📋", text: "احسب القسط الشهري" },
  { icon: "📊", text: "قارن بين حيين" },
  { icon: "📄", text: "حلّل عقد إيجار" },
  { icon: "📍", text: "توقّع سعر منطقة" },
];

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "أهلاً بك! أنا **Broker AI**، مساعدك العقاري الذكي 🏠 — أقدر أساعدك في البحث عن عقار، حساب الأقساط، تحليل عقود الإيجار، ومقارنة الأحياء. كيف أقدر أخدمك اليوم؟",
  time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
};

function formatTime() {
  return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(price: number) {
  return price?.toLocaleString("ar-SA") || "—";
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 7 && !isToday(dateStr);
}

export default function BrokerAIPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [guestLimit, setGuestLimit] = useState(5);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convTitle, setConvTitle] = useState("محادثة جديدة");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchConversations(data.session.user.id);
    });
    const count = parseInt(localStorage.getItem(STORAGE_KEY) || "0");
    setGuestCount(count);
    // جلب الحد الحقيقي من الـ API
    fetch("/api/broker-ai/guest-limit")
      .then(r => r.json())
      .then(d => { if (d.limit) setGuestLimit(d.limit); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, messages, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setConversations(data);
  };

  const saveConversation = async (msgs: Message[], title: string, convId: string | null) => {
    if (!session) return null;
    const payload = {
      user_id: session.user.id,
      title,
      messages: msgs,
      updated_at: new Date().toISOString(),
    };
    if (convId) {
      await supabase.from("ai_conversations").update(payload).eq("id", convId);
      fetchConversations(session.user.id);
      return convId;
    } else {
      const { data } = await supabase.from("ai_conversations").insert(payload).select("id").single();
      fetchConversations(session.user.id);
      return data?.id || null;
    }
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    setConvTitle(conv.title);
  };

  const startNewChat = () => {
    setMessages([WELCOME_MSG]);
    setActiveConvId(null);
    setConvTitle("محادثة جديدة");
    setInput("");
  };

  const handleSend = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    if (!session) {
      if (guestCount >= guestLimit) {
        setShowLoginPrompt(true);
        return;
      }
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      localStorage.setItem(STORAGE_KEY, String(newCount));
    }

    const userMsg: Message = { role: "user", content: userText, time: formatTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // عنوان المحادثة من أول رسالة
    const newTitle = convTitle === "محادثة جديدة" ? userText.slice(0, 40) : convTitle;
    if (convTitle === "محادثة جديدة") setConvTitle(newTitle);

    try {
      const res = await fetch("/api/broker-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          guestCount: session ? undefined : guestCount,
          userId: session ? session.user.id : undefined,
        }),
      });

      const data = await res.json();

      if (data.error === "limit_reached") {
        setShowLoginPrompt(true);
        setLoading(false);
        return;
      }

      const aiMsg: Message = {
        role: "assistant",
        content: data.text || "عذراً، حدث خطأ. حاول مرة أخرى.",
        properties: data.properties || [],
        time: formatTime(),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // حفظ في Supabase
      if (session) {
        const savedId = await saveConversation(finalMessages, newTitle, activeConvId);
        if (!activeConvId && savedId) setActiveConvId(savedId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.", time: formatTime() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const remaining = guestLimit - guestCount;
  const isLoggedIn = !!session;
  const todayConvs = conversations.filter(c => isToday(c.updated_at));
  const weekConvs = conversations.filter(c => isThisWeek(c.updated_at));
  const olderConvs = conversations.filter(c => !isToday(c.updated_at) && !isThisWeek(c.updated_at));

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", display: "flex", width: "100%", height: "100vh", background: "#f8fafc" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        ::-webkit-scrollbar-track { background: transparent; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea { font-family: inherit; }
        textarea { resize: none; }
        .hist-btn:hover { background: #f8fafc !important; }
        .hist-btn.active { background: #f0f9ff !important; border-color: #bae6fd !important; }
        .prop-card:hover { border-color: #0284c7 !important; box-shadow: 0 4px 16px rgba(2,132,199,0.12) !important; }
        .sug-btn:hover { border-color: #0284c7 !important; color: #0284c7 !important; }
        .send-btn:hover { background: #0369a1 !important; }
        strong { color: #0284c7; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* ======= SIDEBAR ======= */}
      <aside style={{ flexShrink: 0, width: 288, display: "flex", flexDirection: "column", background: "#fff", borderLeft: "1px solid #e2e8f0" }}>

        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", boxShadow: "0 6px 14px rgba(2,132,199,0.28)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2 }}>Broker AI</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>مساعدك العقاري الذكي</div>
            </div>
          </div>
        </div>

        {/* New chat */}
        <div style={{ padding: "14px 14px 8px" }}>
          <button onClick={startNewChat}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 14px", background: "#0284c7", color: "#fff", border: "none", borderRadius: 11, fontSize: 13.5, fontWeight: 700, boxShadow: "0 4px 10px rgba(2,132,199,0.25)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            محادثة جديدة
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "0 14px 10px" }}>
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="ابحث في محادثاتك…" style={{ width: "100%", padding: "9px 36px 9px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12.5, color: "#0f172a", outline: "none" }} />
          </div>
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 14px" }}>
          {!isLoggedIn ? (
            <div style={{ padding: "20px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>سجّل دخولك لحفظ محادثاتك والرجوع إليها لاحقاً</div>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "20px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>لا توجد محادثات بعد. ابدأ محادثتك الأولى!</div>
            </div>
          ) : (
            <>
              {todayConvs.length > 0 && (
                <>
                  <div style={{ padding: "10px 8px 6px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>اليوم</div>
                  {todayConvs.map((c) => (
                    <button key={c.id} onClick={() => loadConversation(c)}
                      className={`hist-btn ${activeConvId === c.id ? "active" : ""}`}
                      style={{ display: "flex", alignItems: "flex-start", gap: 9, width: "100%", textAlign: "right", padding: "10px", background: activeConvId === c.id ? "#f0f9ff" : "transparent", border: `1px solid ${activeConvId === c.id ? "#bae6fd" : "transparent"}`, borderRadius: 10, marginBottom: 4 }}>
                      <div style={{ flexShrink: 0, width: 6, height: 6, background: activeConvId === c.id ? "#0284c7" : "#e2e8f0", borderRadius: "50%", marginTop: 7 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: activeConvId === c.id ? 700 : 600, color: activeConvId === c.id ? "#0c4a6e" : "#334155", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: activeConvId === c.id ? "#0369a1" : "#94a3b8", marginTop: 3 }}>{c.messages.length - 1} رسائل</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {weekConvs.length > 0 && (
                <>
                  <div style={{ padding: "14px 8px 6px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>هذا الأسبوع</div>
                  {weekConvs.map((c) => (
                    <button key={c.id} onClick={() => loadConversation(c)}
                      className={`hist-btn ${activeConvId === c.id ? "active" : ""}`}
                      style={{ display: "flex", alignItems: "flex-start", gap: 9, width: "100%", textAlign: "right", padding: "10px", background: activeConvId === c.id ? "#f0f9ff" : "transparent", border: `1px solid ${activeConvId === c.id ? "#bae6fd" : "transparent"}`, borderRadius: 10, marginBottom: 4 }}>
                      <div style={{ flexShrink: 0, width: 6, height: 6, background: activeConvId === c.id ? "#0284c7" : "#e2e8f0", borderRadius: "50%", marginTop: 7 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{c.messages.length - 1} رسائل</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {olderConvs.length > 0 && (
                <>
                  <div style={{ padding: "14px 8px 6px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>سابقاً</div>
                  {olderConvs.map((c) => (
                    <button key={c.id} onClick={() => loadConversation(c)}
                      className={`hist-btn ${activeConvId === c.id ? "active" : ""}`}
                      style={{ display: "flex", alignItems: "flex-start", gap: 9, width: "100%", textAlign: "right", padding: "10px", background: activeConvId === c.id ? "#f0f9ff" : "transparent", border: `1px solid ${activeConvId === c.id ? "#bae6fd" : "transparent"}`, borderRadius: 10, marginBottom: 4 }}>
                      <div style={{ flexShrink: 0, width: 6, height: 6, background: "#e2e8f0", borderRadius: "50%", marginTop: 7 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{c.messages.length - 1} رسائل</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Free tier / Login prompt */}
        <div style={{ padding: "12px 14px 14px" }}>
          {!isLoggedIn ? (
            <div style={{ background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)", border: "1px solid #bae6fd", borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "#fff", border: "1px solid #bae6fd", borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: "#0369a1" }}>
                  <span style={{ width: 5, height: 5, background: "#0284c7", borderRadius: "50%" }} />
                  الباقة المجانية
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0c4a6e" }}>{guestCount} / {guestLimit}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e", marginBottom: 4 }}>
                {remaining > 0 ? `باقي لك ${remaining} ${remaining === 1 ? "رسالة" : "رسائل"}` : "انتهت رسائلك المجانية"}
              </div>
              <div style={{ fontSize: 11.5, color: "#0369a1", lineHeight: 1.5, marginBottom: 12 }}>سجّل دخولك مجاناً للحصول على رسائل غير محدودة</div>
              <div style={{ width: "100%", height: 6, background: "rgba(2,132,199,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: `${(guestCount / guestLimit) * 100}%`, height: "100%", background: "linear-gradient(90deg,#0284c7,#0ea5e9)", borderRadius: 999 }} />
              </div>
              <button onClick={() => router.push("/auth/register")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 12px", background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 700, boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
                ✦ سجّل مجاناً — رسائل غير محدودة
              </button>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>✓ حساب مفعّل — رسائل غير محدودة</div>
            </div>
          )}
        </div>

        {/* User footer */}
        {isLoggedIn && (
          <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#fde68a,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#78350f", fontWeight: 800, fontSize: 13 }}>
              {session?.user?.email?.[0]?.toUpperCase() || "م"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user?.email}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>حساب مفعّل</div>
            </div>
          </div>
        )}
      </aside>

      {/* ======= MAIN ======= */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)" }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", boxShadow: "0 4px 10px rgba(2,132,199,0.25)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{convTitle}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{messages.length - 1} رسائل</div>
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#0369a1" }}>
            <span style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
            Broker AI · متصل
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px 24px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === "assistant" ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, maxWidth: "92%" }}>
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", boxShadow: "0 2px 6px rgba(2,132,199,0.2)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Broker AI</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{msg.time}</span>
                      </div>
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", padding: "16px 18px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.85, color: "#0f172a", whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                      {msg.properties && msg.properties.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
                          {msg.properties.map((p) => (
                            <div key={p.id} className="prop-card"
                              onClick={() => router.push(`/properties/${p.id}`)}
                              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(15,23,42,0.03)" }}>
                              <div style={{ position: "relative", aspectRatio: "16/10", background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", backgroundImage: p.images?.[0] ? `url(${p.images[0]})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
                                <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.95)", borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: "#0284c7", padding: "3px 8px" }}>{p.type}</span>
                              </div>
                              <div style={{ padding: "12px 14px" }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.title}</div>
                                <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 10 }}>📍 {p.district ? `${p.district}، ` : ""}{p.city}</div>
                                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#475569", marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed #e2e8f0" }}>
                                  {p.rooms ? <span>🛏 {p.rooms} غرف</span> : null}
                                  {p.area ? <span>· 📐 {p.area} م²</span> : null}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div>
                                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "#0284c7" }}>{formatPrice(p.price)}</div>
                                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>ريال سعودي</div>
                                  </div>
                                  <button style={{ padding: "7px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: 8, fontSize: 11.5, fontWeight: 700 }}>التفاصيل</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "70%", marginRight: "auto", marginLeft: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{msg.time}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>أنت</span>
                    </div>
                    <div style={{ background: "#0284c7", color: "#fff", borderRadius: "18px 4px 18px 18px", padding: "14px 18px", boxShadow: "0 4px 12px rgba(2,132,199,0.18)" }}>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8 }}>{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", padding: "16px 18px", display: "flex", gap: 6, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#0284c7", animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Login Prompt */}
        {showLoginPrompt && (
          <div style={{ margin: "0 28px 16px", background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)", border: "1px solid #bae6fd", borderRadius: 14, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0c4a6e", marginBottom: 4 }}>استمتعت بالمحادثة؟ 😊</div>
              <div style={{ fontSize: 12.5, color: "#0369a1" }}>سجّل دخولك مجاناً وتكلم مع Broker AI بلا حدود</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => router.push("/auth/register")}
                style={{ padding: "9px 18px", background: "#0284c7", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                سجّل مجاناً
              </button>
              <button onClick={() => setShowLoginPrompt(false)}
                style={{ padding: "9px 14px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
                لاحقاً
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "0 28px 20px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "14px 16px", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="اسأل Broker AI عن أي عقار، حي، قسط، أو عقد إيجار…"
                  rows={1}
                  style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 14.5, lineHeight: 1.7, color: "#0f172a", padding: "8px 4px", maxHeight: 140, background: "transparent" }}
                />
                <button className="send-btn" onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: input.trim() ? "#0284c7" : "#e2e8f0", border: "none", borderRadius: 12, color: input.trim() ? "#fff" : "#94a3b8", boxShadow: input.trim() ? "0 4px 10px rgba(2,132,199,0.3)" : "none", transition: "all 0.2s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {quickSuggestions.map((s, i) => (
                <button key={i} className="sug-btn" onClick={() => handleSend(s.text)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: "#475569", transition: "all 0.15s" }}>
                  <span>{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
              قد يخطئ Broker AI أحياناً. تحقق دائماً من السعر والمواصفات قبل اتخاذ القرار.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}