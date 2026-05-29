"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

function formatTime() {
  return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAIChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "مرحباً باسل! 👋 أنا Claude — مساعدك الشخصي بدون أي قيود. اسألني عن أي شيء يتعلق بالمشروع أو خارجه.",
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/admin/login"); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (profile?.role !== "admin") { router.push("/admin/login"); return; }
    setIsAdmin(true);
    setChecking(false);
  };

  const handleSend = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg: Message = { role: "user", content: userText, time: formatTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text || "عذراً، حدث خطأ.",
          time: formatTime(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ في الاتصال.", time: formatTime() },
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

  const quickSuggestions = [
    { icon: "📊", text: "حلل إحصائيات الموقع" },
    { icon: "🏠", text: "اكتب وصف إعلان عقاري" },
    { icon: "💡", text: "اقترح تحسينات للمشروع" },
    { icon: "📝", text: "ساعدني في كتابة محتوى" },
  ];

  if (checking) return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F9FB" }}>
      <div style={{ fontSize: 16, color: "#6B7280" }}>جاري التحقق...</div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        textarea { resize: none; font-family: inherit; }
        .sug-btn:hover { border-color: #7C3AED !important; color: #7C3AED !important; }
        .send-btn:hover { background: #6D28D9 !important; }
        strong { color: #7C3AED; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>دردشة الأدمن</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Claude بدون قيود — للأدمن فقط</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#7C3AED" }}>
            <span style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
            Claude · متصل
          </div>
          <a href="/admin/ai" style={{ padding: "8px 14px", background: "#F8F9FB", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
            ← إعدادات AI
          </a>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((msg, idx) => (
            <div key={idx}>
              {msg.role === "assistant" ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, maxWidth: "90%" }}>
                  <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Claude</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{msg.time}</span>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", padding: "16px 18px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.85, color: "#0f172a", whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "70%", marginRight: "auto", marginLeft: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{msg.time}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>أنت</span>
                  </div>
                  <div style={{ background: "#7C3AED", color: "#fff", borderRadius: "18px 4px 18px 18px", padding: "14px 18px", boxShadow: "0 4px 12px rgba(124,58,237,0.2)" }}>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8 }}>{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", padding: "16px 18px", display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C3AED", animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "0 24px 20px", flexShrink: 0 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "14px 16px", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="اسأل Claude أي شيء — بدون قيود…"
                rows={1}
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 14.5, lineHeight: 1.7, color: "#0f172a", padding: "8px 4px", maxHeight: 140, background: "transparent" }}
              />
              <button className="send-btn" onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: input.trim() ? "#7C3AED" : "#e2e8f0", border: "none", borderRadius: 12, color: input.trim() ? "#fff" : "#94a3b8", boxShadow: input.trim() ? "0 4px 10px rgba(124,58,237,0.3)" : "none", transition: "all 0.2s", cursor: "pointer" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {quickSuggestions.map((s, i) => (
              <button key={i} className="sug-btn" onClick={() => handleSend(s.text)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: "#475569", transition: "all 0.15s", cursor: "pointer", fontFamily: "inherit" }}>
                <span>{s.icon}</span>{s.text}
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
            هذه الصفحة للأدمن فقط — Claude يرد بدون قيود أو System Prompt مقيد
          </div>
        </div>
      </div>
    </div>
  );
}
