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

  /* ---- TIJDELIJKE netwerk-diagnose (app altijd; web met ?ndbg=1) ----------------
     Het iOS<->iOS-wegvallen laat zich niet reproduceren in een desktopbrowser, dus
     meten we op het toestel zelf: socket-status + sluitcodes, kanaalstatus, hoe lang
     de tegenstander stil is, en of onze eigen herverbind-poging afgaat.
     Weghalen zodra we weten wat er gebeurt. -------------------------------------- */
  try {
    if (isNative || /[?&]ndbg=1/.test(location.search)) {
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99999;max-width:76vw;max-height:46vh;overflow:hidden;'
        + 'background:rgba(0,0,0,.82);color:#7ad0ff;font:9px/1.25 monospace;padding:5px 7px;border-radius:6px;white-space:pre;pointer-events:none';
      document.body.appendChild(box);
      const lines = [];
      const t0 = Date.now();
      const stamp = () => ((Date.now() - t0) / 1000).toFixed(1);
      const log = (msg) => { lines.unshift(stamp() + 's ' + msg); box.textContent = lines.slice(0, 26).join('\n'); };
      window.__netlog = log;

      let hookedSock = null;
      const hookSocket = (sock) => {
        if (!sock || sock === hookedSock || !sock.stateChangeCallbacks) return;
        hookedSock = sock;
        sock.stateChangeCallbacks.open.push(() => log('SOCKET OPEN'));
        sock.stateChangeCallbacks.close.push((e) => log('SOCKET CLOSE code=' + (e && e.code) + ' ' + ((e && e.reason) || '')));
        sock.stateChangeCallbacks.error.push((e) => log('SOCKET ERR ' + ((e && e.message) || e || '')));
        log('socket gekoppeld');
      };
      // eigen herverbind-poging zichtbaar maken
      const origPoke = Net.pokeRealtime && Net.pokeRealtime.bind(Net);
      if (origPoke) Net.pokeRealtime = function () { const r = origPoke(); log('POKE ' + (r ? 'afgevuurd' : '(cooldown)')); return r; };

      let last = '';
      setInterval(() => {
        const v = Net.versus, ch = v && v.channel;
        hookSocket(ch && ch.socket);
        const g = (window.Game && Game.vs) || null;
        const stil = (g && g.remote && g.remote.lastSeen) ? Math.round((Date.now() - g.remote.lastSeen) / 100) / 10 : -1;
        const s = 'ch:' + (ch ? ch.state : '-') + ' sk:' + (ch && ch.socket ? ch.socket.connectionState() : '-')
          + ' stil:' + (stil < 0 ? '-' : stil + 's') + ' st:' + (window.Game ? Game.state : '-');
        if (s !== last) { last = s; log(s); }
      }, 500);
      log('netdiag aan');
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
