/* ============================================================
   MAIN — start alles op.
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // ---- native app (Capacitor / iOS-schil) herkennen ----
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isNative) {
    document.body.classList.add('native');                 // CSS verbergt o.a. de web-only "Update"-knop
    const P = window.Capacitor.Plugins || {};
    try { P.StatusBar && P.StatusBar.hide(); } catch (e) {}   // volledig scherm voor de game
    try { P.SplashScreen && P.SplashScreen.hide(); } catch (e) {}
  }

  Storage.load();
  // eenmalig voortgang herstellen via een ?restore=... link (ook handig op iOS)
  try { if (Storage.applyRestoreFromURL()) setTimeout(() => alert('✅ Voortgang hersteld!'), 300); } catch (e) {}
  try { Net.init(); } catch (e) { console.warn('Net.init', e); }
  try { if (window.IAP) IAP.init(); } catch (e) {}   // in-app aankopen (inert tot een plugin gekoppeld is)
  try { Sfx.init(); } catch (e) {}
  // ---- TIJDELIJKE audio-diagnose (alleen met ?adbg=1) — toont op het scherm wat er met
  //      het geluid gebeurt bij weg-swipen/terugkomen. Gewone spelers zien dit nooit. ----
  try {
    if (isNative || /[?&]adbg=1/.test(location.search)) {   // in de app altijd aan (diagnose), op web met ?adbg=1
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99999;max-width:78vw;max-height:52vh;overflow:auto;'
        + 'background:rgba(0,0,0,.82);color:#5aff7a;font:10px/1.3 monospace;padding:6px 8px;border-radius:8px;white-space:pre;pointer-events:none';
      document.body.appendChild(box);
      const lines = [];
      const st = () => (window.Sfx && Sfx.ctx ? Sfx.ctx.state : 'no-ctx');
      const snap = () => (window.Sfx ? (st() + (Sfx._timer ? ' loop' : ' -') + ' nat:' + (Sfx._native ? 1 : 0) + ' stale:' + (Sfx._stale ? 1 : 0) + (Sfx.musicOn ? '' : ' mOFF')) : 'no-sfx');
      const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
      const log = (ev) => {
        const secs = (((typeof performance !== 'undefined' ? performance.now() : 0) - t0) / 1000).toFixed(1);
        lines.unshift(secs + 's ' + ev + ' -> ' + snap());
        box.textContent = lines.slice(0, 22).join('\n');
      };
      log('start');
      document.addEventListener('visibilitychange', () => log('vis(' + document.visibilityState + ')'));
      ['focus', 'blur', 'pageshow', 'pagehide'].forEach((e) => window.addEventListener(e, () => log(e)));
      window.addEventListener('pointerdown', () => log('TAP'));
      try {
        const P = window.Capacitor && window.Capacitor.Plugins;
        if (P && P.App && P.App.addListener) P.App.addListener('appStateChange', (s) => log('appState(active=' + (s && s.isActive) + ')'));
      } catch (e) {}
      // alleen MEELEZEN (poll) — de onstatechange laten we met rust zodat de fix (_stale) niet breekt
      let last = ''; setInterval(() => { const s = snap(); if (s !== last) { last = s; log('poll'); } }, 400);
    }
  } catch (e) {}

  Input.init();
  UI.init();
  Game.init(document.getElementById('game-canvas'));
  UI.show('menu');

  // eerste keer opstarten: coach Ryan legt een oefen-match uit, daarna inloggen/registreren
  try {
    if (!localStorage.getItem('zombiedash_onboarded')) {
      setTimeout(() => { try { UI.startOnboarding(); } catch (e) { console.warn('onboarding', e); } }, 500);
    }
  } catch (e) {}

  // oriëntatie bijhouden (voor de draai-hint) + canvas herschalen
  function updateOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', portrait);
    Game.resize();
  }
  updateOrientation();
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', () => setTimeout(updateOrientation, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', updateOrientation);

  // pinch-zoom blokkeren (dubbeltik-zoom wordt al door touch-action:none voorkomen)
  document.addEventListener('gesturestart', (e) => e.preventDefault());
});
