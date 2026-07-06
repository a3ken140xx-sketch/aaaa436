const ADMIN_EMAIL = 'a3ken140xx@gmail.com';
function json(body, s = 200) { return { statusCode: s, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(body) }; }

exports.handler = async (event) => {
  const p = (event.path || '').replace(/^\/\.netlify\/functions\/api\//, '').replace(/^\/api\//, '').replace(/^\//, '');
  const m = event.httpMethod;

  // ---- Health (no require needed) ----
  if (p === 'health') return json({ ok: true, key_len: (process.env.SUPABASE_KEY || '').length, url: (process.env.SUPABASE_URL || 'NOT_SET').slice(0, 30) });

  // ---- Load heavy deps only after health check ----
  const bcrypt = require('bcryptjs');
  const { createClient } = require('@supabase/supabase-js');
  const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const body = (() => { try { return JSON.parse(event.body || '{}'); } catch { return {}; } })();
  const q = event.queryStringParameters || {};

  try {
    // ---- LOGIN ----
    if (p === 'login' && m === 'POST') {
      if (!body.email || !body.password) return json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400);
      const { data: users, error } = await sb().from('users').select('*').eq('email', body.email).limit(1);
      if (error) return json({ error: 'خطأ في قاعدة البيانات' }, 500);
      const user = users && users.length ? users[0] : null;
      if (!user) return json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' }, 400);
      if (user.banned) return json({ error: 'حسابك محظور. تواصل مع الإدارة.' }, 403);
      if (!(await bcrypt.compare(body.password, user.password_hash))) return json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' }, 400);
      return json({ message: 'تم تسجيل الدخول بنجاح', email: body.email, admin: body.email === ADMIN_EMAIL });
    }

    // ---- CHECK ADMIN ----
    if (p === 'check-admin') return json({ admin: body.email === ADMIN_EMAIL });

    // ---- RESET ADMIN PASSWORD (temp) ----
    if (p === 'reset-admin-password') {
      const hash = await bcrypt.hash('admin123', 10);
      const { error } = await sb().from('users').update({ password_hash: hash }).eq('email', ADMIN_EMAIL);
      if (error) return json({ error: error.message }, 500);
      return json({ message: 'تم تغيير كلمة السر إلى: admin123' });
    }

    // ---- STATS ----
    if (p === 'stats/users') { const { data } = await sb().from('users').select('id'); return json({ value: data ? data.length : 0 }); }

    // ---- TOOLS ----
    if (p === 'tools' && m === 'GET') { const { data } = await sb().from('tools').select('*').order('created_at', { ascending: true }); return json(data || []); }

    // ---- VISITORS ----
    if (p === 'visitors' && m === 'POST') {
      const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim();
      await sb().from('visits').insert({ ip, user_agent: event.headers['user-agent'] || '' });
      const { data } = await sb().from('visits').select('id');
      return json({ value: data ? data.length : 0 });
    }
    if (p === 'visitors/count') { const { data } = await sb().from('visits').select('id'); return json({ value: data ? data.length : 0 }); }

    // ---- ADMIN: ADD TOOL ----
    if (p === 'admin/tools' && m === 'POST') {
      if (body.adminEmail !== ADMIN_EMAIL) return json({ error: 'غير مصرح' }, 403);
      const { data } = await sb().from('tools').insert(body).select().single();
      return json(data);
    }

    // ---- ADMIN: DELETE TOOL ----
    const td = p.match(/^admin\/tools\/(.+)/);
    if (td && m === 'DELETE') {
      if (q.admin !== ADMIN_EMAIL) return json({ error: 'غير مصرح' }, 403);
      await sb().from('tools').delete().eq('id', td[1]);
      return json({ message: 'تم الحذف' });
    }

    // ---- ADMIN: LIST USERS ----
    if (p === 'admin/users' && m === 'GET') {
      if (q.admin !== ADMIN_EMAIL) return json({ error: 'غير مصرح' }, 403);
      const { data } = await sb().from('users').select('id,email,first_name,last_name,banned,created_at').order('created_at', { ascending: false });
      return json(data || []);
    }

    // ---- ADMIN: DELETE USER ----
    const ud = p.match(/^admin\/users\/(.+)/);
    if (ud && m === 'DELETE') {
      if (q.admin !== ADMIN_EMAIL) return json({ error: 'غير مصرح' }, 403);
      await sb().from('users').delete().eq('email', decodeURIComponent(ud[1]));
      return json({ message: 'تم الحذف' });
    }

    // ---- ADMIN: BAN USER ----
    const ub = p.match(/^admin\/users\/(.+)\/ban/);
    if (ub && m === 'PUT') {
      if (body.adminEmail !== ADMIN_EMAIL) return json({ error: 'غير مصرح' }, 403);
      await sb().from('users').update({ banned: body.banned }).eq('email', decodeURIComponent(ub[1]));
      return json({ message: 'تم التحديث' });
    }

    // ---- SEND VERIFICATION ----
    if (p === 'send-verification') {
      if (!body.email) return json({ error: 'البريد الإلكتروني مطلوب' }, 400);
      const { data: existing } = await sb().from('users').select('id').eq('email', body.email).limit(1);
      if (existing && existing.length) return json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, 400);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await sb().from('verification_codes').insert({ email: body.email, code, type: 'signup', expires_at: new Date(Date.now() + 600000).toISOString() });
      return json({ message: 'تم إرسال الكود', code });
    }

    // ---- VERIFY CODE ----
    if (p === 'verify-code') {
      if (!body.email || !body.code || !body.password) return json({ error: 'جميع الحقول مطلوبة' }, 400);
      const { data: stored } = await sb().from('verification_codes').select('*').eq('email', body.email).eq('type', 'signup').order('created_at', { ascending: false }).limit(1);
      const s = stored && stored.length ? stored[0] : null;
      if (!s) return json({ error: 'لم يتم إرسال كود لهذا البريد' }, 400);
      if (Date.now() > new Date(s.expires_at).getTime()) return json({ error: 'انتهت صلاحية الكود' }, 400);
      if (s.code !== body.code) return json({ error: 'الكود غير صحيح' }, 400);
      await sb().from('verification_codes').delete().eq('email', body.email).eq('type', 'signup');
      const hash = await bcrypt.hash(body.password, 10);
      await sb().from('users').insert({ email: body.email, first_name: body.firstName, last_name: body.lastName, password_hash: hash, verified: true });
      return json({ message: 'تم تفعيل الحساب بنجاح', email: body.email });
    }

    return json({ error: 'مش موجود: ' + p }, 404);
  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message || 'خطأ داخلي' }, 500);
  }
};
