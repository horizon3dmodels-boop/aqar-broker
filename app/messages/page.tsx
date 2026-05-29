'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'support'>('chats');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (uid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    // تجميع المحادثات
    const convMap: Record<string, any> = {};
    for (const msg of data) {
      const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      if (!otherId) continue;
      const convKey = `${otherId}_${msg.property_id || 'general'}`;
      if (!convMap[convKey]) {
        convMap[convKey] = {
          id: otherId,
          convKey,
          property_id: msg.property_id || null,
          lastMsg: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          unread: msg.receiver_id === uid && !msg.read ? 1 : 0,
          name: msg.sender_id === uid ? (msg.receiver_name || otherId.slice(0, 8)) : (msg.sender_name || otherId.slice(0, 8)),
          role: msg.sender_id === uid ? '' : (msg.sender_role || ''),
          propertyName: msg.project_name || '',
        };
      }
    }
    setConversations(Object.values(convMap));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setUserProfile(profile);
      
      await fetchConversations(session.user.id);

      // افتح المحادثة تلقائياً إذا جاء من إشعار
      const params = new URLSearchParams(window.location.search);
      const targetUser = params.get('user');
      
      console.log("URL params:", window.location.search);
      console.log("targetUser:", targetUser);
      
      if (targetUser) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${targetUser},receiver_id.eq.${targetUser}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          const conv = {
            id: targetUser,
            name: data.sender_id === session.user.id ? (data.receiver_name || targetUser.slice(0, 8)) : (data.sender_name || targetUser.slice(0, 8)),
            role: data.sender_role || '',
          };
          setSelected(conv);
          
          // جلب الرسائل مباشرة بدون الاعتماد على userId state
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${targetUser}),and(sender_id.eq.${targetUser},receiver_id.eq.${session.user.id})`)
            .order('created_at', { ascending: true });
          
          setMessages(msgs || []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selected || !userId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new;
        if (
          (msg.sender_id === userId && msg.receiver_id === selected.id) ||
          (msg.sender_id === selected.id && msg.receiver_id === userId)
        ) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, userId]);

  const fetchMessages = async (otherId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || !userId) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: selected.id,
      content: input.trim(),
      sender_name: userProfile?.full_name || 'مستخدم',
      sender_role: userProfile?.role || '',
      read: false,
    });
    if (!error) {
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', selected.id)
        .eq('type', 'message')
        .eq('read', false)
        .eq('link', `/messages?user=${userId}&property=${selected.property_id || 'general'}`)
        .maybeSingle();
        
      if (existingNotif) {
        await supabase.from('notifications').update({
          body: input.trim().slice(0, 80),
          created_at: new Date().toISOString(),
        }).eq('id', existingNotif.id);
      } else {
        await supabase.from('notifications').insert({
          user_id: selected.id,
          title: `رسالة جديدة من ${userProfile?.full_name || 'مستخدم'}`,
          body: input.trim().slice(0, 80),
          type: 'message',
          read: false,
          link: `/messages?user=${userId}&property=${selected.property_id || 'general'}`,
        });
      }
      
      setInput('');
      fetchMessages(selected.id);
      fetchConversations(userId);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelected(conv);
    let query = supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${conv.id}),and(sender_id.eq.${conv.id},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (conv.property_id) {
      query = query.eq('property_id', conv.property_id);
    }
    const { data } = await query;
    setMessages(data || []);

    // تحديث الرسائل المستقبلة داخل الـ State لتصبح مقروءة فوراً في الواجهة
    setMessages(prev =>
      prev.map(m => m.receiver_id === userId ? { ...m, read: true } : m)
    );

    // تعليم الرسائل كمقروءة في قاعدة البيانات
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', conv.id);

    // تحديث قائمة المحادثات لإزالة علامة الرسالة
    setConversations(prev =>
      prev.map(c => c.convKey === conv.convKey ? { ...c, unread: 0 } : c)
    );

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const filtered = conversations.filter(c =>
    !search || c.name?.includes(search)
  );

  const roleColors: Record<string, string> = {
    broker: '#2563EB', owner: '#16a34a', contractor: '#F59E0B', engineer: '#7C3AED', admin: '#EF4444'
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", height: "calc(100vh - 64px)", display: "flex", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .conv-item { transition: background 0.15s; cursor: pointer; }
        .conv-item:hover { background: #F0F4FF !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 320, background: "#fff", borderLeft: "1px solid #F0F0F0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>الرسائل</h1>
          <div style={{ display: "flex", background: "#F8F9FB", borderRadius: 10, padding: 3, gap: 3, marginBottom: 12 }}>
            {[{ key: 'chats', label: '💬 محادثاتي' }, { key: 'support', label: '🏢 الدعم' }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Cairo', sans-serif", cursor: "pointer", background: activeTab === t.key ? "#fff" : "transparent", color: activeTab === t.key ? "#0f172a" : "#6B7280", boxShadow: activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB" }} />
        </div>

        {activeTab === 'support' && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 16, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4 }}>دعم عقار بروكر</div>
              <a href="https://wa.me/966500000000" target="_blank" style={{ display: "block", background: "#25D366", color: "#fff", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 800, textDecoration: "none", marginTop: 14 }}>💬 واتساب مباشر</a>
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>لا توجد محادثات بعد</div>
            ) : filtered.map(conv => (
              <div key={conv.convKey} className="conv-item" onClick={() => selectConversation(conv)} style={{ padding: "14px 20px", background: selected?.convKey === conv.convKey ? "#EFF6FF" : "#fff", borderBottom: "1px solid #F8F9FB", borderRight: selected?.convKey === conv.convKey ? "3px solid #2563EB" : "3px solid transparent", position: "relative" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, background: (roleColors[conv.role] || '#6B7280') + '22', borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: roleColors[conv.role] || '#6B7280', flexShrink: 0 }}>
                    {conv.name?.charAt(0) || '؟'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{conv.name}</span>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          await supabase.from('messages')
                            .delete()
                            .or(`and(sender_id.eq.${userId},receiver_id.eq.${conv.id}),and(sender_id.eq.${conv.id},receiver_id.eq.${userId})`)
                            .eq('property_id', conv.property_id);
                          if (selected?.convKey === conv.convKey) {
                            setSelected(null);
                            setMessages([]);
                          }
                          fetchConversations(userId);
                        }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 12, padding: "2px 4px", fontFamily: "'Cairo', sans-serif" }}>
                          ✕
                        </button>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{conv.time}</span>
                          {conv.unread > 0 && (
                            <span style={{ background: "#2563EB", color: "#fff", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {conv.propertyName && (
                      <span style={{ fontSize: 11, color: "#2563EB", fontWeight: 600, display: "block", marginBottom: 2 }}>
                        🏠 {conv.propertyName}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{conv.lastMsg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#9CA3AF" }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>اختر محادثة للبدء</p>
          </div>
        ) : (
          <>
            <div style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, background: (roleColors[selected.role] || '#6B7280') + '22', borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: roleColors[selected.role] || '#6B7280' }}>
                {selected.name?.charAt(0) || '؟'}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{selected.role}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender_id === userId ? "flex-start" : "flex-end" }}>
                  <div style={{ maxWidth: "65%", background: msg.sender_id === userId ? "#2563EB" : "#fff", color: msg.sender_id === userId ? "#fff" : "#0f172a", borderRadius: msg.sender_id === userId ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: msg.sender_id === userId ? "none" : "1px solid #F0F0F0" }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{msg.content}</p>
                    <span style={{ fontSize: 10, opacity: 0.7, display: "block", marginTop: 4 }}>
                      {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.sender_id === userId && msg.read && (
                      <span style={{ fontSize: 10, color: "#93c5fd", display: "block", marginTop: 2 }}>✓✓ تم القراءة</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ background: "#fff", padding: "14px 24px", borderTop: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="اكتب رسالتك..." style={{ flex: 1, padding: "11px 16px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB" }} />
                <button onClick={sendMessage} style={{ width: 42, height: 42, background: "#2563EB", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>←</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}