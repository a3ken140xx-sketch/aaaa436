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
      el.textContent = (key === 'tools' ? value : value.toLocaleString()) + '+';
    });
  }

  function refreshTools() {
    setStat('tools', document.querySelectorAll('.tool-card').length);
  }

  async function fetchStats() {
    try {
      const [dRes, uRes, vRes] = await Promise.all([
        fetch(`https://api.countapi.xyz/get/${STATS_NS}/downloads`).then(r => r.json()),
        fetch(`https://api.countapi.xyz/get/${STATS_NS}/users`).then(r => r.json()),
        fetch(`https://api.countapi.xyz/get/${STATS_NS}/visitors`).then(r => r.json())
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
      const res = await fetch(`https://api.countapi.xyz/hit/${STATS_NS}/${key}`);
      const d = await res.json();
      setStat(key, d.value);
    } catch {}
  }

  fetchStats();

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

  function updateAuthUI() {
    document.querySelectorAll('.auth-logged-out').forEach(el => el.style.display = currentUser ? 'none' : '');
    document.querySelectorAll('.auth-logged-in').forEach(el => el.style.display = currentUser ? '' : 'none');
    document.querySelectorAll('.user-email-display').forEach(el => el.textContent = currentUser ? currentUser.email : '');
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
      let url, body;

      if (pendingAction === 'login') {
        url = `${API_URL}/verify-login-code`;
        body = JSON.stringify({ email: pendingEmail, code });
      } else {
        url = `${API_URL}/verify-code`;
        body = JSON.stringify({
          email: pendingEmail,
          code,
          password: pendingPassword,
          firstName: pendingFirstName,
          lastName: pendingLastName
        });
      }

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
        incrementStat('users');
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
      const res = await fetch(`${API_URL}/send-login-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'فشل إرسال الكود', 'error');
        setBtnLoading(btn, false);
        return;
      }

      pendingEmail = email;
      pendingAction = 'login';
      document.querySelector('#verifyModal .auth-header h2').textContent = 'تأكيد تسجيل الدخول';
      document.querySelector('#verifyModal .auth-header p').textContent = 'تم إرسال كود تسجيل الدخول إلى بريدك';
      document.getElementById('verifyEmailDisplay').textContent = email;
      hideAllModals();
      showModal(verifyModal);
      showToast('تم إرسال كود تسجيل الدخول إلى بريدك الإلكتروني', 'success');
    } catch (err) {
      showToast('فشل الاتصال بالخادم', 'error');
    }

    setBtnLoading(btn, false);
  });

  // Init auth UI
  updateAuthUI();


});
