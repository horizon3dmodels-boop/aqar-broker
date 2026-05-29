'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('البريد الإلكتروني أو كلمة السر غير صحيحة');
      setLoading(false);
      return;
    }

    // تحقق من role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('ليس لديك صلاحية الوصول للوحة التحكم');
      setLoading(false);
      return;
    }

    router.push('/admin');
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap');`}</style>
      <div style={{ background: '#1e293b', borderRadius: 24, padding: '48px', width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: '1px solid #334155' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>لوحة تحكم عقار بروكر</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>تسجيل دخول المسؤول</p>
        </div>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{ width: '100%', background: '#0f172a', border: '1.5px solid #334155', borderRadius: 12, padding: '13px 14px', fontSize: 13, color: '#fff', fontFamily: "'Cairo', sans-serif" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 8 }}>كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', background: '#0f172a', border: '1.5px solid #334155', borderRadius: 12, padding: '13px 14px', fontSize: 13, color: '#fff', fontFamily: "'Cairo', sans-serif" }}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ background: loading ? '#15803d' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", marginTop: 8, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}
          >
            {loading ? 'جاري التحقق...' : 'دخول إلى لوحة التحكم'}
          </button>
        </div>
      </div>
    </div>
  );
}