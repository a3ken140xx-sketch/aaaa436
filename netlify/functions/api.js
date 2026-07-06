const express = require('express');
const serverless = require('serverless-http');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const usersMem = {};
const verificationCodesMem = {};
const toolsMem = [];

const ADMIN_EMAIL = 'a3ken140xx@gmail.com';
let transporter;

async function initTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  }
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isAdmin(email) { return email === ADMIN_EMAIL; }

function emailTemplate(code, title, subtitle) {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#0a0f19;padding:30px;border-radius:16px;max-width:500px;margin:auto;border:1px solid rgba(100,255,218,0.15);"><div style="text-align:center;margin-bottom:25px;"><div style="width:60px;height:60px;margin:0 auto 15px;background:linear-gradient(135deg,#64ffda,#00d4a3);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#0a0f19;">C</div><h1 style="color:#ffffff;font-size:22px;margin:0;">${title}</h1></div><p style="color:rgba(255,255,255,0.7);font-size:15px;text-align:center;">${subtitle}</p><div style="text-align:center;margin:25px 0;"><span style="font-size:36px;font-weight:900;color:#64ffda;letter-spacing:8px;font-family:'Courier New',monospace;text-shadow:0 0 20px rgba(100,255,218,0.3);">${code}</span></div><p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">ينتهي الكود بعد 10 دقائق</p></div>`;
}

// ---- DB helpers ----
async function findUserByEmail(email) {
  if (supabase) { const { data } = await supabase.from('users').select('*').eq('email', email).single(); return data; }
  return usersMem[email] || null;
}

async function createUser(email, fn, ln, hash) {
  if (supabase) {
    const { data } = await supabase.from('users').insert({ email, first_name: fn, last_name: ln, password_hash: hash, verified: true }).select().single();
    return data;
  }
  usersMem[email] = { email, firstName: fn, lastName: ln, password: hash, verified: true, createdAt: new Date() };
  return usersMem[email];
}

async function saveCode(email, code, type) {
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  if (supabase) { await supabase.from('verification_codes').insert({ email, code, type, expires_at: expires }); }
  else { verificationCodesMem[email] = { code, expires: new Date(expires).getTime() }; }
}

async function getCode(email, type) {
  if (supabase) {
    const { data } = await supabase.from('verification_codes').select('*').eq('email', email).eq('type', type).order('created_at', { ascending: false }).limit(1).single();
    return data;
  }
  return verificationCodesMem[email] || null;
}

async function deleteCode(email, type) {
  if (supabase) { await supabase.from('verification_codes').delete().eq('email', email).eq('type', type); }
  else { delete verificationCodesMem[email]; }
}

async function getAllUsers() {
  if (supabase) { const { data } = await supabase.from('users').select('id,email,first_name,last_name,banned,created_at').order('created_at', { ascending: false }); return data || []; }
  return Object.values(usersMem).map(u => ({ id: u.email, email: u.email, first_name: u.firstName, last_name: u.lastName, banned: false, created_at: u.createdAt }));
}

async function deleteUser(email) {
  if (supabase) { await supabase.from('users').delete().eq('email', email); }
  else { delete usersMem[email]; }
}

async function banUser(email, banned) {
  if (supabase) { await supabase.from('users').update({ banned }).eq('email', email); }
}

// ---- Tools ----
async function getTools() {
  if (supabase) { const { data } = await supabase.from('tools').select('*').order('created_at', { ascending: true }); return data || []; }
  return toolsMem;
}

async function addTool(t) {
  if (supabase) { const { data } = await supabase.from('tools').insert(t).select().single(); return data; }
  t.id = Date.now().toString(); toolsMem.push(t); return t;
}

async function updateTool(id, updates) {
  if (supabase) { await supabase.from('tools').update(updates).eq('id', id); }
  else { Object.assign(toolsMem.find(t => t.id === id) || {}, updates); }
}

async function deleteTool(id) {
  if (supabase) { await supabase.from('tools').delete().eq('id', id); }
  else { const i = toolsMem.findIndex(t => t.id === id); if (i > -1) toolsMem.splice(i, 1); }
}

// ---- Auth Routes ----
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    if (await findUserByEmail(email)) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    const code = generateCode();
    await saveCode(email, code, 'signup');
    await transporter.sendMail({ from: '"CrazyTeam" <noreply@crazyteam.com>', to: email, subject: 'كود تفعيل حساب CrazyTeam', html: emailTemplate(code, 'مرحباً بك في CrazyTeam', 'كود التفعيل الخاص بك هو:') });
    res.json({ message: 'تم إرسال الكود' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'فشل إرسال الكود' }); }
});

app.post('/api/verify-code', async (req, res) => {
  try {
    const { email, code, password, firstName, lastName } = req.body;
    if (!email || !code || !password) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    const stored = await getCode(email, 'signup');
    if (!stored) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });
    if (Date.now() > new Date(supabase ? stored.expires_at : stored.expires).getTime()) return res.status(400).json({ error: 'انتهت صلاحية الكود' });
    if (stored.code !== code) return res.status(400).json({ error: 'الكود غير صحيح' });
    await deleteCode(email, 'signup');
    const hash = await bcrypt.hash(password, 10);
    await createUser(email, firstName, lastName, hash);
    res.json({ message: 'تم تفعيل الحساب بنجاح', email });
  } catch (err) { console.error(err); res.status(500).json({ error: 'حدث خطأ في التفعيل' }); }
});

app.post('/api/send-login-code', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    if (!user.verified) return res.status(400).json({ error: 'الحساب غير مفعل' });
    if (user.banned) return res.status(403).json({ error: 'حسابك محظور. تواصل مع الإدارة.' });
    const pwHash = supabase ? user.password_hash : user.password;
    if (!(await bcrypt.compare(password, pwHash))) return res.status(400).json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    const code = generateCode();
    await saveCode(email, code, 'login');
    await transporter.sendMail({ from: '"CrazyTeam" <noreply@crazyteam.com>', to: email, subject: 'كود تسجيل الدخول - CrazyTeam', html: emailTemplate(code, 'تسجيل الدخول - CrazyTeam', 'كود تسجيل الدخول الخاص بك هو:') });
    res.json({ message: 'تم إرسال كود تسجيل الدخول', email });
  } catch (err) { console.error(err); res.status(500).json({ error: 'فشل إرسال الكود' }); }
});

app.post('/api/verify-login-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'البريد الإلكتروني والكود مطلوبان' });
    const stored = await getCode(email, 'login');
    if (!stored) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });
    if (Date.now() > new Date(supabase ? stored.expires_at : stored.expires).getTime()) return res.status(400).json({ error: 'انتهت صلاحية الكود' });
    if (stored.code !== code) return res.status(400).json({ error: 'الكود غير صحيح' });
    await deleteCode(email, 'login');
    res.json({ message: 'تم تسجيل الدخول بنجاح', email, admin: isAdmin(email) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'حدث خطأ في التحقق' }); }
});

app.post('/api/check-admin', (req, res) => {
  res.json({ admin: isAdmin(req.body.email) });
});

app.get('/api/stats/users', async (req, res) => {
  try {
    if (supabase) { const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }); return res.json({ value: count || 0 }); }
    res.json({ value: Object.keys(usersMem).length });
  } catch { res.json({ value: 0 }); }
});

// ---- Admin: Tools ----
app.post('/api/admin/tools', async (req, res) => {
  if (!isAdmin(req.body.adminEmail)) return res.status(403).json({ error: 'غير مصرح' });
  try {
    const t = await addTool({ name: req.body.name, description: req.body.description, icon: req.body.icon || 'fa-shield-halved', download_url: req.body.download_url, video_url: req.body.video_url || '', tag1: req.body.tag1 || 'جديد', tag2: req.body.tag2 || 'v1.0', rating: req.body.rating || '4.9' });
    res.json(t);
  } catch (err) { res.status(500).json({ error: 'فشل إضافة الأداة' }); }
});

app.put('/api/admin/tools/:id', async (req, res) => {
  if (!isAdmin(req.body.adminEmail)) return res.status(403).json({ error: 'غير مصرح' });
  try { await updateTool(req.params.id, req.body); res.json({ message: 'تم التحديث' }); }
  catch { res.status(500).json({ error: 'فشل التحديث' }); }
});

app.delete('/api/admin/tools/:id', async (req, res) => {
  if (!isAdmin(req.query.admin)) return res.status(403).json({ error: 'غير مصرح' });
  try { await deleteTool(req.params.id); res.json({ message: 'تم الحذف' }); }
  catch { res.status(500).json({ error: 'فشل الحذف' }); }
});

app.get('/api/tools', async (req, res) => {
  try { const tools = await getTools(); res.json(tools); }
  catch { res.json([]); }
});

// ---- Admin: Users ----
app.get('/api/admin/users', async (req, res) => {
  if (!isAdmin(req.query.admin)) return res.status(403).json({ error: 'غير مصرح' });
  try { const users = await getAllUsers(); res.json(users); }
  catch { res.json([]); }
});

app.delete('/api/admin/users/:email', async (req, res) => {
  if (!isAdmin(req.query.admin)) return res.status(403).json({ error: 'غير مصرح' });
  try { await deleteUser(decodeURIComponent(req.params.email)); res.json({ message: 'تم الحذف' }); }
  catch { res.status(500).json({ error: 'فشل الحذف' }); }
});

app.put('/api/admin/users/:email/ban', async (req, res) => {
  if (!isAdmin(req.body.adminEmail)) return res.status(403).json({ error: 'غير مصرح' });
  try { await banUser(decodeURIComponent(req.params.email), req.body.banned); res.json({ message: 'تم التحديث' }); }
  catch { res.status(500).json({ error: 'فشل التحديث' }); }
});

// ---- Visitors ----
app.post('/api/visitors', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    if (supabase) {
      await supabase.from('visits').insert({ ip, user_agent: ua });
      const { count } = await supabase.from('visits').select('*', { count: 'exact', head: true });
      return res.json({ value: count || 1 });
    }
    return res.json({ value: 1 });
  } catch (err) {
    res.json({ value: 0 });
  }
});

app.get('/api/visitors/count', async (req, res) => {
  try {
    if (supabase) { const { count } = await supabase.from('visits').select('*', { count: 'exact', head: true }); return res.json({ value: count || 0 }); }
    res.json({ value: 0 });
  } catch { res.json({ value: 0 }); }
});

let handler;
async function getHandler() {
  if (!transporter) await initTransporter();
  if (!handler) handler = serverless(app);
  return handler;
}

exports.handler = async (event, context) => {
  const h = await getHandler();
  return h(event, context);
};
