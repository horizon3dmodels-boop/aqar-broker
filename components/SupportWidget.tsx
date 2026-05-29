"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "مرحباً! 👋 كيف أقدر أساعدك اليوم؟" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticket, setTicket] = useState({ subject: "", message: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." }]);
      if (data.showTicket) setShowTicketForm(true);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "عذراً، الخدمة غير متاحة حالياً. يمكنك إرسال طلب دعم مباشرة." }]);
      setShowTicketForm(true);
    } finally {
      setLoading(false);
    }
  };

  const submitTicket = async () => {
    if (!ticket.subject || !ticket.message) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('support_tickets').insert({
      user_id: session.user.id,
      subject: ticket.subject,
      message: ticket.message,
      type: 'technical',
      priority: 'medium',
      channel: 'platform',
      status: 'open',
    });
    setTicketSent(true);
    setShowTicketForm(false);
    setMessages(prev => [...prev, { role: "assistant", content: "✅ تم إرسال طلبك! سيتواصل معك فريق الدعم خلال 24 ساعة." }]);
  };

  return (
    <>
      {/* زر Broker AI */}
      <button
        onClick={() => window.open("/broker-ai", "_blank")}
        style={{
          position: "fixed", bottom: 90, left: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(2,132,199,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, transition: "all 0.2s",
        }}
        title="بروكر AI"
      >
        ✨
      </button>

      {/* الزر العائم */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #16a34a, #22c55e)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, transition: "all 0.2s",
        }}
      >
        {open ? "✕" : "🎧"}
      </button>

      {/* نافذة الدردشة */}
      {open && (
        <div style={{
          position: "fixed", bottom: 160, left: 24, zIndex: 1000,
          width: 340, height: 480, background: "#fff",
          borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          border: "1px solid #E5E7EB", display: "flex", flexDirection: "column",
          fontFamily: "'Cairo', sans-serif",
        }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');`}</style>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "20px 20px 0 0", padding: "16px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>مساعد عقار بروكر</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                {process.env.NEXT_PUBLIC_AI_ENABLED === 'true' ? "● متصل" : "● سيتوفر قريباً"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: m.role === "user" ? "#16a34a" : "#F8F9FB",
                  color: m.role === "user" ? "#fff" : "#374151",
                  fontSize: 13, lineHeight: 1.6,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#F8F9FB", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", fontSize: 13, color: "#9CA3AF" }}>
                  جاري الكتابة...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ticket Form */}
          {showTicketForm && !ticketSent && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #F0F0F0", background: "#FFFBEB" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>📋 أرسل طلب دعم:</p>
              <input value={ticket.subject} onChange={e => setTicket({ ...ticket, subject: e.target.value })} placeholder="عنوان المشكلة" style={{ width: "100%", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "'Cairo'", marginBottom: 6, outline: "none" }} />
              <textarea value={ticket.message} onChange={e => setTicket({ ...ticket, message: e.target.value })} placeholder="وصف المشكلة..." rows={2} style={{ width: "100%", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "'Cairo'", resize: "none", outline: "none", marginBottom: 6 }} />
              <button onClick={submitTicket} style={{ width: "100%", background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>إرسال الطلب</button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #F0F0F0", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="اكتب سؤالك..."
              style={{ flex: 1, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo'", outline: "none" }}
            />
            <button onClick={sendMessage} disabled={loading} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 14, cursor: "pointer" }}>
              ←
            </button>
          </div>
        </div>
      )}
    </>
  );
}