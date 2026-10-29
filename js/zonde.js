// Zonde. — hoofdsite: slideshow met apps, "Hoe wil je hem downloaden?", live teller en delen.

const APPS = {
  fitchecker: {
    naam: 'Fitchecker', motto: 'Wear what you have', thema: 'Clothes',
    url: 'https://beau-procesvlot.github.io/Fitchecker/', pagina: 'fitchecker.html',
    icoon: 'img/fitchecker.png', qr: 'img/qr-fitchecker.svg',
  },
  datechecker: {
    naam: 'Datechecker', motto: 'Eat what you have', thema: 'Food',
    url: 'https://beau-procesvlot.github.io/Datechecker/', pagina: 'datechecker.html',
    icoon: 'img/datechecker.png', qr: 'img/qr-datechecker.svg',
  },
  binnenkort: { naam: 'Coming soon', motto: 'More to come', binnenkort: true },
};
const VOLGORDE = ['fitchecker', 'datechecker', 'binnenkort'];
const TELLER_URL = 'https://datechecker-teller.beau-f5b.workers.dev';

// Niet laten tonen binnen de site van een ander (tegen nep-knoppen eroverheen).
if (window.top !== window.self) window.top.location = window.self.location.href;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Apparaat herkennen ----------
const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const inApp = /Instagram|FBAN|FBAV|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp|Line\//.test(ua);
const iosAndereBrowser = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
const standaard = isIOS ? 'iphone' : isAndroid ? 'android' : 'laptop';

// ---------- Toast ----------
let toastTimer;
function toast(tekst) {
  const t = $('#toast');
  t.textContent = tekst;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

async function kopieer(tekst) {
  try { await navigator.clipboard.writeText(tekst); toast('Link copied'); }
  catch { prompt('Copy this link:', tekst); }
}

// ---------- Slideshow (loopt vanzelf door de apps) ----------
let actief = 0;
let autoTimer, hervatTimer;
const SLIDE_MS = 5000;

const n = VOLGORDE.length;
// Plek van app i ten opzichte van de actieve: 0 = vooraan, 1 = volgende, ...
const plekVan = (i, a = actief) => (i - a + n) % n;
let eersteKeer = true;

// Nieuwe achtergrond komt binnen achter een gescheurde krantenrand.
function wisselAchtergrond(id) {
  const nieuw = $('.hero-bg .bg-' + id);
  if (nieuw.classList.contains('on') && !nieuw.classList.contains('in')) return;
  const rand = $('.hero-bg .rand');
  $$('.hero-bg .bg.in').forEach(bg => bg.classList.remove('in'));
  nieuw.classList.remove('on');
  nieuw.offsetWidth;
  nieuw.classList.add('on', 'in');
  rand.classList.remove('gaat');
  rand.offsetWidth;
  rand.classList.add('gaat');
  nieuw.addEventListener('animationend', function klaar(e) {
    if (e.animationName !== 'veeg') return;
    nieuw.removeEventListener('animationend', klaar);
    if (!nieuw.classList.contains('in')) return;
    nieuw.classList.remove('in');
    rand.classList.remove('gaat');
    $$('.hero-bg .bg').forEach(bg => { if (bg !== nieuw) bg.classList.remove('on'); });
  });
}

// Kaarten op hun plek zetten. Een kaart die van voor naar achter springt, verdwijnt even.
function zetKaarten(vorige) {
  const kaarten = $$('.card');
  const rij = $('.cards');
  const breed = kaarten[0].offsetWidth;
  const gat = 14;
  rij.style.setProperty('--kaart-h', Math.max(...kaarten.map(k => k.offsetHeight)) + 12 + 'px');
  kaarten.forEach(kaart => {
    const i = VOLGORDE.indexOf(kaart.dataset.app);
    const plek = plekVan(i);
    const x = plek * (breed + gat) + (plek > 0 ? breed * .06 : 0);
    const vorm = `translateX(${x}px)${plek === 0 ? ' translateY(-6px) scale(1.06)' : ''}`;
    const springt = vorige !== undefined && Math.abs(plek - plekVan(i, vorige)) > 1;
    if (springt) {
      kaart.classList.add('wissel');
      setTimeout(() => {
        kaart.style.transition = 'none';
        kaart.style.transform = vorm;
        kaart.offsetWidth;
        kaart.style.transition = '';
        kaart.classList.remove('wissel');
      }, 380);
    } else {
      kaart.style.transform = vorm;
    }
  });
}

// Namen rollen: vorige erboven, actieve groot, volgende eronder.
function zetNamen(vorige) {
  $$('.namen span').forEach(el => {
    const i = VOLGORDE.indexOf(el.dataset.naam);
    let plek = plekVan(i);
    if (plek === n - 1) plek = -1;
    if (plek > 1) plek = 2;
    const oud = vorige === undefined ? plek : (p => p === n - 1 ? -1 : p > 1 ? 2 : p)(plekVan(i, vorige));
    if (Math.abs(plek - oud) > 1) {
      el.style.transition = 'none';
      el.dataset.plek = plek;
      el.offsetWidth;
      el.style.transition = '';
    } else {
      el.dataset.plek = plek;
    }
  });
}

function toon(i) {
  const vorige = eersteKeer ? undefined : actief;
  actief = (i + n) % n;
  const id = VOLGORDE[actief];
  const app = APPS[id];
  const nr = String(actief + 1).padStart(2, '0');
  if (vorige !== actief) {
    if (eersteKeer) $('.hero-bg .bg-' + id).classList.add('on');
    else wisselAchtergrond(id);
  }
  $$('.card').forEach(c => c.classList.toggle('on', c.dataset.app === id));
  zetKaarten(vorige);
  zetNamen(vorige);
  eersteKeer = false;
  $('#count').textContent = nr;
  $('.now b').textContent = nr;
  $('#now-text').textContent = app.binnenkort ? 'More to come' : `${app.thema} · ${app.motto}`;
  // Het lijntje loopt vol tot de volgende app komt.
  const balk = $('#progress-bar');
  balk.style.transition = 'none';
  balk.style.transform = 'scaleX(0)';
  balk.offsetWidth;
  balk.style.transition = autoTimer ? `transform ${SLIDE_MS}ms linear` : 'transform .4s ease';
  balk.style.transform = 'scaleX(1)';
}

function startAuto() {
  clearInterval(autoTimer);
  autoTimer = null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  autoTimer = setInterval(() => toon(actief + 1), SLIDE_MS);
  toon(actief);
}
// Even stil zodra iemand zelf iets doet, daarna loopt hij weer verder.
function pauzeer(ms = 9000) {
  clearInterval(autoTimer);
  autoTimer = null;
  clearTimeout(hervatTimer);
  hervatTimer = setTimeout(startAuto, ms);
}

function initSlider() {
  if (!$('.cards')) return;
  $$('.card-soon').forEach(kaart => kaart.addEventListener('click', e => { e.preventDefault(); openBinnenkort(); }));
  $$('.slider-controls .round').forEach(b => b.addEventListener('click', () => {
    pauzeer();
    toon(actief + Number(b.dataset.dir));
  }));
  $('.slider').addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearInterval(autoTimer); autoTimer = null; clearTimeout(hervatTimer); } });
  $('.slider').addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pauzeer(1500); });
  // Vegen over de kaarten = volgende of vorige app.
  let startX = null;
  $('.cards').addEventListener('touchstart', e => { startX = e.touches[0].clientX; pauzeer(); }, { passive: true });
  $('.cards').addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) {
      toon(actief + (dx < 0 ? 1 : -1));
      // Geen klik op de kaart na een veeg.
      $('.cards').addEventListener('click', ev => ev.preventDefault(), { once: true, capture: true });
    }
  });
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(autoTimer) : pauzeer(1500));
  addEventListener('resize', () => zetKaarten());
  toon(0);
  startAuto();
}

// ---------- Hoe wil je hem downloaden? ----------
const ICOON = {
  laptop: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
  iphone: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  android: '<svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 6h12M6 18h12"/></svg>',
  deel: '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>',
  meer: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>',
};
const ico = naam => `<span class="ico">${ICOON[naam]}</span>`;

function uitleg(app, apparaat) {
  if (apparaat === 'iphone') {
    let waarschuwing = '';
    if (inApp) {
      waarschuwing = `<div class="warn"><b>You’re inside an app like Instagram or TikTok.</b>You can’t add anything to your home screen from here. Copy the link and paste it in Safari.<br><button class="btn btn-ink" data-kopieer="${app.url}">Copy the link</button></div>`;
    } else if (iosAndereBrowser) {
      waarschuwing = `<div class="warn"><b>Tip: use Safari.</b>It works in this browser too, but Safari makes it easiest.<br><button class="btn btn-ink" data-kopieer="${app.url}">Copy the link</button></div>`;
    }
    return `${waarschuwing}<ol>
      <li><p>Open ${app.naam} in <span class="ui">Safari</span>.<br><a class="btn btn-ink" href="${app.url}">Open ${app.naam}</a></p></li>
      <li><p>Tap the Share button ${ico('deel')}. Can’t see it? Tap ${ico('meer')} first.</p></li>
      <li><p>Scroll down a bit and choose <span class="ui">Add to Home Screen</span> ${ico('plus')}.</p></li>
      <li><p>Tap <span class="ui">Add</span>. Done: ${app.naam} is now with your other apps.</p></li>
    </ol>
    <p class="tip"><b>Important:</b> from now on, open the app from the icon on your home screen. That way everything you add stays saved.</p>`;
  }
  if (apparaat === 'android') {
    return `<ol>
      <li><p>Open ${app.naam} in <span class="ui">Chrome</span>.<br><a class="btn btn-ink" href="${app.url}">Open ${app.naam}</a></p></li>
      <li><p>Tap ${ico('menu')} in the top right.</p></li>
      <li><p>Choose <span class="ui">Install app</span> or <span class="ui">Add to Home screen</span>.</p></li>
      <li><p>Tap <span class="ui">Install</span>. Done: ${app.naam} is now with your other apps.</p></li>
    </ol>
    <p class="tip"><b>Important:</b> from now on, open the app from its icon. That way everything you add stays saved.</p>`;
  }
  return `<div class="qr">
      <img src="${app.qr}" alt="QR code for ${app.naam}" width="190" height="190">
      <p>${app.naam} is made for your phone.<br><b>Scan this code with your phone’s camera</b> and follow the steps there.</p>
    </div>
    <a class="link-plain" href="${app.url}">Or open it on your laptop anyway →</a>
    <p class="tip">In Chrome or Edge you can install it on your laptop too: click the install icon on the right of the address bar.</p>`;
}

// Het keuzeblok Laptop / iPhone / Android, ingevuld voor één app.
function downloadBlok(el, id) {
  const app = APPS[id];
  el.innerHTML = `<div class="seg" role="tablist">
      ${['laptop', 'iphone', 'android'].map(a => `<button role="tab" data-apparaat="${a}">${ICOON[a]}${{ laptop: 'Laptop', iphone: 'iPhone', android: 'Android' }[a]}</button>`).join('')}
    </div>
    <div class="howto"></div>`;
  const kies = apparaat => {
    $$('.seg button', el).forEach(b => { b.classList.toggle('on', b.dataset.apparaat === apparaat); b.setAttribute('aria-selected', b.dataset.apparaat === apparaat); });
    $('.howto', el).innerHTML = uitleg(app, apparaat);
  };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => kies(b.dataset.apparaat)));
  el.addEventListener('click', e => { const k = e.target.closest('[data-kopieer]'); if (k) kopieer(k.dataset.kopieer); });
  kies(standaard);
}

// ---------- Onderblad voor "Binnenkort" ----------
function openBinnenkort() {
  const sheet = $('#app-sheet');
  $('#sheet-body').innerHTML = `<div class="grip"></div>
    <div class="sheet-head"><div><h2 id="sheet-title">More to come.</h2><p>The next Zonde. app</p></div><button class="close" aria-label="Close">×</button></div>
    <p class="sheet-desc">Clothes and food are just the start. There’s so much more that’s too good to throw away, and we’re working on it.</p>
    <p class="sheet-desc">Join in with one of the apps that are already here, and you’ll be the first to know.</p>
    <p><a class="btn btn-ink" href="fitchecker.html">See Fitchecker</a></p>`;
  sheet.showModal();
}

function initSheet() {
  const sheet = $('#app-sheet');
  if (!sheet) return;
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('.close')) sheet.close();
  });
}

// ---------- Live teller ----------
let totaalVraag;
function haalTotaal() {
  totaalVraag ??= fetch(TELLER_URL + '/totaal').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  return totaalVraag;
}
const kgTekst = gram => {
  const kg = gram / 1000;
  return kg.toLocaleString('en-GB', { maximumFractionDigits: kg < 100 ? 1 : 0 });
};

async function initTeller() {
  const vakken = $$('[data-teller]');
  if (!vakken.length) return;
  try {
    const { gram } = await haalTotaal();
    vakken.forEach(el => { el.textContent = kgTekst(gram); });
    $$('[data-teller-badge]').forEach(el => el.classList.add('on'));
    if (gram < 10000) $$('[data-teller-note]').forEach(el => { el.textContent = 'We’ve only just started. You can make the difference: counts live, completely anonymous.'; });
  } catch {
    vakken.forEach(el => { el.textContent = '–'; });
    $$('[data-teller-note]').forEach(el => { el.textContent = 'The counter can’t be reached right now. Please try again later.'; });
  }
}

// ---------- Delen ----------
function initDelen() {
  const knop = $('#share');
  if (!knop) return;
  knop.addEventListener('click', async () => {
    const url = new URL('./', location.href).href;
    const data = { title: 'Zonde.', text: 'Are you in? Free apps to use what you already have.', url };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else kopieer(url);
  });
}

$$('[data-scroll-slides]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  $('#slides').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));
$$('[data-download]').forEach(el => downloadBlok(el, el.dataset.download));

// ---------- Feedback en ideeën ----------
// Gaat naar onze eigen worker; die controleert het, beperkt hoe vaak er verstuurd kan worden en stuurt het
// via Make door naar de mail. Het Make-adres en het mailadres staan bewust niet in de site.
const FEEDBACK_URL = TELLER_URL + '/idee';

function initIdee() {
  const form = $('#idee-form');
  if (!form) return;
  const fout = $('#form-fout');
  const knop = $('#idee-knop');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form);
    if (d.get('_honey')) return;
    const bericht = String(d.get('bericht') || '').trim();
    const email = String(d.get('email') || '').trim();
    if (bericht.length < 5) { fout.textContent = 'Write your message first.'; form.bericht.focus(); return; }
    if (email && !form.email.checkValidity()) { fout.textContent = 'That email address doesn’t look right. You can also leave it empty.'; form.email.focus(); return; }
    fout.textContent = '';
    knop.disabled = true;
    knop.textContent = 'Sending…';
    const gegevens = {
      soort: d.get('soort'),
      app: d.get('app'),
      bericht,
      naam: String(d.get('naam') || '').trim(),
      email,
      _honey: d.get('_honey') || '',
    };
    try {
      // Als gewoon formulier versturen (geen JSON), anders blokkeert de browser het vooraf.
      const body = new FormData();
      Object.entries(gegevens).forEach(([k, v]) => body.append(k, v));
      const r = await fetch(FEEDBACK_URL, { method: 'POST', body });
      if (r.status === 429) { fout.textContent = 'You’ve already sent a few messages today. Please try again tomorrow.'; return; }
      if (!r.ok) throw new Error(r.status);
      form.reset();
      form.hidden = true;
      $('#idee-bedankt').hidden = false;
    } catch {
      fout.textContent = 'Sending didn’t work. Please try again later.';
    } finally {
      knop.disabled = false;
      knop.textContent = 'Send';
    }
  });
  $('#idee-nog').addEventListener('click', () => {
    $('#idee-bedankt').hidden = true;
    form.hidden = false;
    form.bericht.focus();
  });
}
initIdee();

// ---------- Beweging bij het scrollen ----------
function initScrollen() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // De achtergrond van de hero blijft wat achter, de tekst vervaagt een beetje.
  const bg = $('.hero-bg');
  const inner = $('.hero-inner');
  if (bg) {
    let bezig = false;
    addEventListener('scroll', () => {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(() => {
        const y = Math.min(scrollY, innerHeight * 1.2);
        bg.style.transform = `translate3d(0, ${y * .4}px, 0)`;
        if (inner) inner.style.opacity = Math.max(0, 1 - y / (innerHeight * .9));
        bezig = false;
      });
    }, { passive: true });
  }
  // Blokken schuiven rustig in beeld, stickers ploppen erop.
  const blokken = $$('main .sticker, main h2, .section-lead, .counter, .fact, .steps li, .manifest li, .doel-fact, .screen, .features li, .value, .app-row, .mini-title');
  if (!('IntersectionObserver' in window)) return;
  const kijker = new IntersectionObserver(items => items.forEach(item => {
    if (!item.isIntersecting) return;
    item.target.classList.add('zichtbaar');
    kijker.unobserve(item.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  blokken.forEach(el => {
    const broertjes = [...el.parentElement.children].filter(c => blokken.includes(c));
    el.style.transitionDelay = Math.min(broertjes.indexOf(el), 5) * 90 + 'ms';
    el.classList.add('reveal');
    kijker.observe(el);
  });
}
initScrollen();

initSlider();
initSheet();
initTeller();
initDelen();
