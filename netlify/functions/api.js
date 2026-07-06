const express = require('express');
const serverless = require('serverless-http');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const supabase = require('../../supabaseClient');

const app = express();
app.use(express.json());

// In-memory fallback (used when Supabase is not configured)
const usersMem = {};
const verificationCodesMem = {};

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
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('Using Ethereal test email:', testAccount.user);
  }
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function emailTemplate(code, title, subtitle) {
  return `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background: #0a0f19; padding: 30px; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid rgba(100,255,218,0.15);">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="width: 60px; height: 60px; margin: 0 auto 15px; background: linear-gradient(135deg, #64ffda, #00d4a3); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: #0a0f19;">C</div>
        <h1 style="color: #ffffff; font-size: 22px; margin: 0;">${title}</h1>
      </div>
      <p style="color: rgba(255,255,255,0.7); font-size: 15px; text-align: center;">${subtitle}</p>
      <div style="text-align: center; margin: 25px 0;">
        <span style="font-size: 36px; font-weight: 900; color: #64ffda; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(100,255,218,0.3);">${code}</span>
      </div>
      <p style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center;">ينتهي الكود بعد 10 دقائق</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 25px 0;">
      <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">إذا لم تطلب هذا الكود، تجاهل هذه الرسالة.</p>
    </div>`;
}

// --- DB helpers ---
async function findUserByEmail(email) {
  if (supabase) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single();
    return data;
  }
  return usersMem[email] || null;
}

async function createUser(email, firstName, lastName, passwordHash) {
  if (supabase) {
    const { data } = await supabase.from('users').insert({
      email, first_name: firstName, last_name: lastName, password_hash: passwordHash, verified: true
    }).select().single();
    return data;
  }
  usersMem[email] = { email, firstName, lastName, password: passwordHash, verified: true, createdAt: new Date() };
  return usersMem[email];
}

async function saveVerificationCode(email, code, type = 'signup') {
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  if (supabase) {
    await supabase.from('verification_codes').insert({ email, code, type, expires_at: expires.toISOString() });
  } else {
    verificationCodesMem[email] = { code, expires: expires.getTime() };
  }
}

async function getVerificationCode(email, type = 'signup') {
  if (supabase) {
    const { data } = await supabase.from('verification_codes')
      .select('*').eq('email', email).eq('type', type)
      .order('created_at', { ascending: false }).limit(1).single();
    return data;
  }
  return verificationCodesMem[email] || null;
}

async function deleteVerificationCode(email, type = 'signup') {
  if (supabase) {
    await supabase.from('verification_codes').delete().eq('email', email).eq('type', type);
  } else {
    delete verificationCodesMem[email];
  }
}

// --- Routes ---

app.post('/api/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });

    const code = generateCode();
    await saveVerificationCode(email, code, 'signup');

    await transporter.sendMail({
      from: '"CrazyTeam" <noreply@crazyteam.com>',
      to: email,
      subject: 'كود تفعيل حساب CrazyTeam',
      html: emailTemplate(code, 'مرحباً بك في CrazyTeam', 'كود التفعيل الخاص بك هو:')
    });

    res.json({ message: 'تم إرسال الكود' });
  } catch (err) {
    console.error('Send verification error:', err);
    res.status(500).json({ error: 'فشل إرسال الكود' });
  }
});

app.post('/api/verify-code', async (req, res) => {
  try {
    const { email, code, password, firstName, lastName } = req.body;
    if (!email || !code || !password) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });

    const stored = await getVerificationCode(email, 'signup');
    if (!stored) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });

    const expires = supabase ? new Date(stored.expires_at).getTime() : stored.expires;
    if (Date.now() > expires) return res.status(400).json({ error: 'انتهت صلاحية الكود' });

    const storedCode = supabase ? stored.code : stored.code;
    if (storedCode !== code) return res.status(400).json({ error: 'الكود غير صحيح' });

    await deleteVerificationCode(email, 'signup');

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(email, firstName, lastName, hashedPassword);

    res.json({ message: 'تم تفعيل الحساب بنجاح', email });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'حدث خطأ في التفعيل' });
  }
});

app.post('/api/send-login-code', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    if (!user.verified) return res.status(400).json({ error: 'الحساب غير مفعل' });

    const passwordHash = supabase ? user.password_hash : user.password;
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) return res.status(400).json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });

    const code = generateCode();
    await saveVerificationCode(email, code, 'login');

    await transporter.sendMail({
      from: '"CrazyTeam" <noreply@crazyteam.com>',
      to: email,
      subject: 'كود تسجيل الدخول - CrazyTeam',
      html: emailTemplate(code, 'تسجيل الدخول - CrazyTeam', 'كود تسجيل الدخول الخاص بك هو:')
    });

    res.json({ message: 'تم إرسال كود تسجيل الدخول', email });
  } catch (err) {
    console.error('Send login code error:', err);
    res.status(500).json({ error: 'فشل إرسال الكود' });
  }
});

app.post('/api/verify-login-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'البريد الإلكتروني والكود مطلوبان' });

    const stored = await getVerificationCode(email, 'login');
    if (!stored) return res.status(400).json({ error: 'لم يتم إرسال كود لهذا البريد' });

    const expires = supabase ? new Date(stored.expires_at).getTime() : stored.expires;
    if (Date.now() > expires) return res.status(400).json({ error: 'انتهت صلاحية الكود' });

    const storedCode = supabase ? stored.code : stored.code;
    if (storedCode !== code) return res.status(400).json({ error: 'الكود غير صحيح' });

    await deleteVerificationCode(email, 'login');
    res.json({ message: 'تم تسجيل الدخول بنجاح', email });
  } catch (err) {
    console.error('Verify login code error:', err);
    res.status(500).json({ error: 'حدث خطأ في التحقق' });
  }
});

app.get('/api/stats/users', async (req, res) => {
  try {
    if (supabase) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      res.json({ value: count || 0 });
    } else {
      res.json({ value: Object.keys(usersMem).length });
    }
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
