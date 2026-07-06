document.addEventListener('DOMContentLoaded', () => {

  // LOADER
  setTimeout(() => {
    document.querySelector('.loader-wrapper').classList.add('hidden');
  }, 2000);

  // CUSTOM CURSOR
  const cursor = document.querySelector('.cursor');
  const follower = document.querySelector('.cursor-follower');
  let posX = 0, posY = 0;
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  function animateCursor() {
    posX += (mouseX - posX) * 0.1;
    posY += (mouseY - posY) * 0.1;
    follower.style.left = posX - 20 + 'px';
    follower.style.top = posY - 20 + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, .tool-card, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'scale(2)';
      follower.style.transform = 'scale(1.5)';
      follower.style.borderColor = '#00b4d8';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'scale(1)';
      follower.style.transform = 'scale(1)';
      follower.style.borderColor = '#7289da';
    });
  });

  // PARTICLES
  const particlesContainer = document.getElementById('particles-js');
  const canvas = document.createElement('canvas');
  particlesContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = ['#7289da', '#5865f2', '#00b4d8', '#7209b7'][Math.floor(Math.random() * 4)];
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
    }
  }

  const particles = Array.from({ length: 80 }, () => new Particle());

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#7289da';
          ctx.globalAlpha = 0.1 * (1 - dist / 150);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // NAVBAR SCROLL
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // MOBILE NAV TOGGLE
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // ACTIVE NAV LINK
  const sections = document.querySelectorAll('section');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });

  // SCROLL REVEAL
  const revealElements = document.querySelectorAll('.tool-card, .feature-item, .stat-item, .testimonial-card, .download-card, .section-header');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.style.opacity = '1';
        }, i * 100);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    revealObserver.observe(el);
  });

  // REAL STATS TRACKING
  const STATS_NS = 'crazyteam';

  function setStat(key, value) {
    document.querySelectorAll(`[data-stat="${key}"]`).forEach(el => {
      el.textContent = (key === 'tools' ? value : value.toLocaleString());
    });
  }

  let dbTools = [];

  async function loadToolsFromDB() {
    try {
      const res = await fetch(`${API_URL}/tools`);
      dbTools = await res.json();
      if (!dbTools.length) return;
      const grid = document.querySelector('.tools-grid');
      // Remove only dynamically added cards (data-db="true")
      grid.querySelectorAll('.tool-card[data-db="true"]').forEach(el => el.remove());
      dbTools.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.setAttribute('data-tilt', '');
        card.dataset.db = 'true';
        card.innerHTML = `
          <div class="tool-glow"></div>
          <div class="tool-icon"><i class="fas ${t.icon || 'fa-shield-halved'}" style="font-size:2rem;"></i></div>
          <div class="tool-info">
            <h3 class="tool-name">${escapeHtml(t.name)}</h3>
            <p class="tool-desc">${escapeHtml(t.description)}</p>
            <div class="tool-tags">
              <span class="tool-tag">${escapeHtml(t.tag1 || 'جديد')}</span>
              <span class="tool-tag">${escapeHtml(t.tag2 || 'v1.0')}</span>
            </div>
            <div class="tool-bottom">
              <span class="tool-rating"><i class="fas fa-star"></i> ${escapeHtml(t.rating || '4.9')}</span>
              <a href="${escapeHtml(t.download_url)}" target="_blank" class="nitro-btn tool-db-btn"><i class="fas fa-download"></i> تحميل</a>
            </div>
          </div>`;
        grid.appendChild(card);
      });
      // Re-init tilt and cursor effects
      document.querySelectorAll('.tool-card[data-db="true"], a, button, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
          cursor.style.transform = 'scale(2)';
          follower.style.transform = 'scale(1.5)';
          follower.style.borderColor = '#00b4d8';
        });
        el.addEventListener('mouseleave', () => {
          cursor.style.transform = 'scale(1)';
          follower.style.transform = 'scale(1)';
          follower.style.borderColor = '#7289da';
        });
      });
      // Bind download tracking
      document.querySelectorAll('.tool-db-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          if (!currentUser) { e.preventDefault(); hideAllModals(); showModal(loginModal); showToast('يجب تسجيل الدخول أولاً', 'error'); return; }
          incrementStat('downloads');
        });
      });
    } catch {}
    refreshTools();
  }

  function refreshTools() {
    const total = document.querySelectorAll('.tool-card').length;
    setStat('tools', total);
  }

  async function fetchStats() {
    try {
      const [dRes, uRes, vRes] = await Promise.all([
        fetch(`https://api.countapi.xyz/get/${STATS_NS}/downloads`).then(r => r.json()),
        fetch(`${API_URL}/stats/users`).then(r => r.json()),
        fetch(`${API_URL}/visitors/count`).then(r => r.json())
      ]);
      setStat('downloads', dRes.value || 0);
      setStat('users', uRes.value || 0);
      setStat('visitors', vRes.value || 0);
    } catch {
      setStat('downloads', 0);
      setStat('users', 0);
      setStat('visitors', 0);
    }
    refreshTools();
    incrementStat('visitors');
  }

  async function incrementStat(key) {
    try {
      if (key === 'visitors') {
        const res = await fetch(`${API_URL}/visitors`, { method: 'POST' });
        const d = await res.json();
        setStat(key, d.value || 0);
        return;
      }
      const res = await fetch(`https://api.countapi.xyz/hit/${STATS_NS}/${key}`);
      const d = await res.json();
      setStat(key, d.value);
    } catch {}
  }

  fetchStats();
  loadToolsFromDB();

  // TYPING EFFECT
  const texts = ['CrazyTeam', 'أدوات ديسكورد', 'مودات احترافية', 'CRAZYTEAM'];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingElement = document.querySelector('.typing-text');

  function typeEffect() {
    const currentText = texts[textIndex];
    if (isDeleting) {
      typingElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }
  typeEffect();

  // TILT EFFECT ON CARDS
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  });

  // RIPPLE EFFECT ON BUTTONS
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // SCROLL TO TOP
  const scrollTop = document.querySelector('.scroll-top');
  window.addEventListener('scroll', () => {
    scrollTop.classList.toggle('visible', window.scrollY > 500);
  });

  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // SMOOTH SCROLL FOR NAV
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // PARALLAX ON HERO
  document.querySelector('.hero').addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.float-card');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    cards.forEach((card, i) => {
      const speed = 20 + i * 10;
      card.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
    });
  });

  // DYNAMIC YEAR IN FOOTER
  document.querySelector('.footer-bottom p').innerHTML =
    `&copy; ${new Date().getFullYear()} CrazyTeam. جميع الحقوق محفوظة. غير مرتبط بديسكورد.`;

  // ===== AUTH SYSTEM =====
  const API_URL = '/api';
  let currentUser = JSON.parse(localStorage.getItem('crazyteam_user') || 'null');

  const authOverlay = document.getElementById('authOverlay');
  const signupModal = document.getElementById('signupModal');
  const loginModal = document.getElementById('loginModal');
  const verifyModal = document.getElementById('verifyModal');
  const toast = document.getElementById('toast');

  let pendingEmail = '';
  let pendingPassword = '';
  let pendingFirstName = '';
  let pendingLastName = '';
  let pendingAction = ''; // 'signup' or 'login'

  let isAdmin = false;

  async function checkAdmin() {
    if (!currentUser) { isAdmin = false; document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none'); return; }
    try {
      const res = await fetch(`${API_URL}/check-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      const d = await res.json();
      isAdmin = d.admin;
    } catch { isAdmin = false; }
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? '' : 'none');
  }

  function updateAuthUI() {
    document.querySelectorAll('.auth-logged-out').forEach(el => el.style.display = currentUser ? 'none' : '');
    document.querySelectorAll('.auth-logged-in').forEach(el => el.style.display = currentUser ? '' : 'none');
    document.querySelectorAll('.user-email-display').forEach(el => el.textContent = currentUser ? currentUser.email : '');
    checkAdmin();
  }

  function requireAuth(e, callback) {
    if (!currentUser) {
      e.preventDefault();
      hideAllModals();
      showModal(loginModal);
      showToast('يجب تسجيل الدخول أولاً', 'error');
      return false;
    }
    return true;
  }

  function showModal(modal) {
    authOverlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hideAllModals() {
    authOverlay.classList.remove('active');
    signupModal.classList.remove('active');
    loginModal.classList.remove('active');
    verifyModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  function setBtnLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-btn"></span>';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    }
  }

  // Auth lock + download tracking for ALL download buttons
  document.querySelectorAll('.tool-card .nitro-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (!currentUser) {
        e.preventDefault();
        hideAllModals();
        showModal(loginModal);
        showToast('يجب تسجيل الدخول أولاً', 'error');
        return;
      }
      if (this.querySelector('.fa-download') || this.textContent.includes('تحميل')) {
        incrementStat('downloads');
      }
    });
  });

  // Open modals
  const openLogin = (e) => { e.preventDefault(); hideAllModals(); showModal(loginModal); };
  const openSignup = (e) => { e.preventDefault(); hideAllModals(); showModal(signupModal); };

  document.getElementById('loginBtn').addEventListener('click', openLogin);
  document.getElementById('signupBtn').addEventListener('click', openSignup);
  document.getElementById('loginBtn2')?.addEventListener('click', openLogin);
  document.getElementById('signupBtn2')?.addEventListener('click', openSignup);

  // Logout
  function logout(e) {
    e.preventDefault();
    currentUser = null;
    localStorage.removeItem('crazyteam_user');
    updateAuthUI();
    showToast('تم تسجيل الخروج', 'success');
  }

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtn2')?.addEventListener('click', logout);

  // Close modals
  document.getElementById('closeLogin').addEventListener('click', hideAllModals);
  document.getElementById('closeSignup').addEventListener('click', hideAllModals);
  document.getElementById('closeVerify').addEventListener('click', hideAllModals);
  authOverlay.addEventListener('click', hideAllModals);

  // Switch between login and signup
  document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllModals();
    showModal(loginModal);
  });

  document.getElementById('switchToSignup').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllModals();
    showModal(signupModal);
  });

  // Code input auto-advance
  document.querySelectorAll('.code-input').forEach(input => {
    input.addEventListener('input', () => {
      const index = parseInt(input.dataset.index);
      if (input.value.length === 1 && index < 5) {
        document.querySelector(`.code-input[data-index="${index + 1}"]`).focus();
        input.classList.add('filled');
      }
    });

    input.addEventListener('keydown', (e) => {
      const index = parseInt(input.dataset.index);
      if (e.key === 'Backspace' && !input.value && index > 0) {
        document.querySelector(`.code-input[data-index="${index - 1}"]`).focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      document.querySelectorAll('.code-input').forEach((inp, i) => {
        if (paste[i]) {
          inp.value = paste[i];
          inp.classList.add('filled');
        }
      });
      const nextEmpty = document.querySelector('.code-input:not(.filled)');
      if (nextEmpty) nextEmpty.focus();
      else document.querySelector('.code-input[data-index="5"]').focus();
    });
  });

  // Signup form submit
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (password.length < 6) {
      showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('كلمة المرور غير متطابقة', 'error');
      return;
    }

    const btn = document.getElementById('signupSubmit');
    setBtnLoading(btn, true);

    try {
      const res = await fetch(`${API_URL}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'حدث خطأ', 'error');
        setBtnLoading(btn, false);
        return;
      }

      pendingEmail = email;
      pendingPassword = password;
      pendingFirstName = firstName;
      pendingLastName = lastName;
      pendingAction = 'signup';
      document.querySelector('#verifyModal .auth-header h2').textContent = 'تفعيل البريد الإلكتروني';
      document.querySelector('#verifyModal .auth-header p').textContent = 'تم إرسال كود التفعيل إلى بريدك الإلكتروني';
      document.getElementById('verifyEmailDisplay').textContent = email;
      hideAllModals();
      showModal(verifyModal);
      showToast('تم إرسال كود التفعيل إلى بريدك الإلكتروني', 'success');
    } catch (err) {
      showToast('فشل الاتصال بالخادم', 'error');
    }

    setBtnLoading(btn, false);
  });

  // Verify form submit
  document.getElementById('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    let code = '';
    document.querySelectorAll('.code-input').forEach(inp => { code += inp.value; });

    if (code.length !== 6) {
      showToast('يرجى إدخال كود التفعيل كاملاً', 'error');
      return;
    }

    const btn = document.querySelector('#verifyForm .auth-submit');
    setBtnLoading(btn, true);

    try {
      url = `${API_URL}/verify-code`;
      body = JSON.stringify({
        email: pendingEmail,
        code,
        password: pendingPassword,
        firstName: pendingFirstName,
        lastName: pendingLastName
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'الكود غير صحيح', 'error');
        setBtnLoading(btn, false);
        return;
      }

      currentUser = { email: pendingEmail };
      localStorage.setItem('crazyteam_user', JSON.stringify(currentUser));
      updateAuthUI();
      if (pendingAction === 'signup') {
        setTimeout(fetchStats, 500);
      }
      showToast(pendingAction === 'login' ? 'تم تسجيل الدخول بنجاح!' : 'تم تسجيل الحساب بنجاح!', 'success');
      hideAllModals();
      document.getElementById('signupForm').reset();
      document.getElementById('loginForm').reset();
      document.querySelectorAll('.code-input').forEach(inp => { inp.value = ''; inp.classList.remove('filled'); });
      pendingEmail = '';
      pendingPassword = '';
      pendingAction = '';
    } catch (err) {
      showToast('فشل الاتصال بالخادم', 'error');
    }

    setBtnLoading(btn, false);
  });

  // Resend code
  document.getElementById('resendCode').addEventListener('click', async (e) => {
    e.preventDefault();

    if (!pendingEmail) {
      showToast('البريد الإلكتروني غير موجود', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'حدث خطأ', 'error');
        return;
      }

      showToast('تم إعادة إرسال الكود', 'success');
    } catch (err) {
      showToast('فشل الاتصال بالخادم', 'error');
    }
  });

  // Login form submit
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const btn = document.querySelector('#loginForm .auth-submit');
    setBtnLoading(btn, true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'فشل تسجيل الدخول', 'error');
        setBtnLoading(btn, false);
        return;
      }

      currentUser = { email };
      localStorage.setItem('crazyteam_user', JSON.stringify(currentUser));
      updateAuthUI();
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      hideAllModals();
      document.getElementById('loginForm').reset();
    } catch (err) {
      showToast('فشل الاتصال بالخادم', 'error');
    }

    setBtnLoading(btn, false);
  });

  // ----- ADMIN PANEL -----
  function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    try {
      const res = await fetch(`${API_URL}/admin/users?admin=${encodeURIComponent(currentUser.email)}`);
      const users = await res.json();
      if (!users.length) { list.innerHTML = '<div style="color:var(--text-muted);text-align:center;">لا يوجد مستخدمين</div>'; return; }
      list.innerHTML = users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:8px;">
          <div>
            <div style="font-weight:600;">${escapeHtml(u.first_name)} ${escapeHtml(u.last_name)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(u.email)}</div>
          </div>
          <div style="display:flex;gap:8px;">
            ${u.email === currentUser.email ? '<span style="color:var(--accent-1);font-size:12px;">أنت</span>' : `
              <button class="admin-ban-btn" data-email="${escapeHtml(u.email)}" data-banned="${u.banned}" style="padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:${u.banned ? '#2ecc71' : '#e74c3c'};color:#fff;">${u.banned ? 'رفع الحظر' : 'حظر'}</button>
              <button class="admin-del-btn" data-email="${escapeHtml(u.email)}" style="padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:#c0392b;color:#fff;">حذف</button>
            `}
          </div>
        </div>
      `).join('');
      list.querySelectorAll('.admin-ban-btn').forEach(b => b.addEventListener('click', async () => {
        await fetch(`${API_URL}/admin/users/${encodeURIComponent(b.dataset.email)}/ban`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminEmail: currentUser.email, banned: b.dataset.banned === 'false' }) });
        loadAdminUsers();
      }));
      list.querySelectorAll('.admin-del-btn').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('حذف هذا المستخدم؟')) return;
        await fetch(`${API_URL}/admin/users/${encodeURIComponent(b.dataset.email)}?admin=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' });
        loadAdminUsers();
      }));
    } catch { list.innerHTML = '<div style="color:var(--text-muted);text-align:center;">تعذر تحميل المستخدمين</div>'; }
  }

  async function loadAdminTools() {
    const list = document.getElementById('adminToolsList');
    try {
      const res = await fetch(`${API_URL}/tools`);
      const tools = await res.json();
      if (!tools.length) { list.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;">لا يوجد أدوات. أضف أول أداة!</div>'; return; }
      list.innerHTML = tools.map(t => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:8px;">
          <div style="flex:1;">
            <div style="font-weight:600;">${escapeHtml(t.name)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(t.description).slice(0, 60)}...</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="admin-edit-tool" data-id="${t.id}" style="padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:var(--accent-2);color:#fff;">تعديل</button>
            <button class="admin-del-tool" data-id="${t.id}" style="padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:#c0392b;color:#fff;">حذف</button>
          </div>
        </div>
      `).join('');
      list.querySelectorAll('.admin-del-tool').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('حذف هذه الأداة؟')) return;
        await fetch(`${API_URL}/admin/tools/${b.dataset.id}?admin=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' });
        loadAdminTools();
      }));
    } catch { list.innerHTML = '<div style="color:var(--text-muted);text-align:center;">تعذر تحميل الأدوات</div>'; }
  }

  window.showAdminTab = function(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.getElementById('adminTab' + tab).style.display = '';
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active-theme'));
    document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`)?.classList.add('active-theme');
  }

  async function loadAdminPanel() {
    const v = document.querySelectorAll('[data-stat="visitors"]')[0]?.textContent || '0';
    document.getElementById('adminUserCount').textContent = document.querySelectorAll('[data-stat="users"]')[0]?.textContent || '0';
    document.getElementById('adminToolCount').textContent = document.querySelectorAll('[data-stat="tools"]')[0]?.textContent || '0';
    document.getElementById('adminVisitorCount').textContent = v;
    // جلب العدد الحقيقي من Supabase
    try { const r = await fetch(`${API_URL}/visitors/count`); const d = await r.json(); document.getElementById('adminVisitorCount').textContent = d.value || 0; } catch {}
    showAdminTab('stats');
    loadAdminUsers();
    loadAdminTools();
  }

  // Add tool form
  document.getElementById('adminAddToolForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'جاري الإضافة...';
    try {
      const res = await fetch(`${API_URL}/admin/tools`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: currentUser.email,
          name: document.getElementById('toolName').value,
          description: document.getElementById('toolDesc').value,
          download_url: document.getElementById('toolUrl').value,
          video_url: document.getElementById('toolVid').value,
          icon: document.getElementById('toolIcon').value || 'fa-shield-halved',
          tag1: document.getElementById('toolTag1').value || 'جديد',
          tag2: document.getElementById('toolTag2').value || 'v1.0',
          rating: document.getElementById('toolRating').value || '4.9'
        })
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error); btn.disabled = false; btn.textContent = 'إضافة'; return; }
      e.target.reset();
      loadAdminTools();
      refreshTools();
      alert('تم إضافة الأداة!');
    } catch { alert('فشل الإضافة'); }
    btn.disabled = false; btn.textContent = 'إضافة';
  });

  document.getElementById('adminNavLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    loadAdminPanel();
    document.getElementById('adminOverlay').classList.add('active');
    document.getElementById('adminModal').classList.add('active');
  });
  document.getElementById('closeAdmin')?.addEventListener('click', () => {
    document.getElementById('adminOverlay').classList.remove('active');
    document.getElementById('adminModal').classList.remove('active');
  });
  document.getElementById('adminOverlay')?.addEventListener('click', () => {
    document.getElementById('adminOverlay').classList.remove('active');
    document.getElementById('adminModal').classList.remove('active');
  });

  // Init auth UI
  updateAuthUI();

});
