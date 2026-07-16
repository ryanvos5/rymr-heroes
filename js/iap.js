/* ============================================================
   IAP — in-app aankopen (Apple StoreKit 2 via de lokale plugin RymrIAP).

   Native kant: ios/App/App/RymrIAP.swift (Capacitor-plugin, StoreKit 2).
   Alleen actief in de iOS-app; op web/PWA blijft dit inert.

   Apple-regels om te onthouden (zie APPSTORE.md):
   - Digitale goederen (robijnen, kist-wachttijd skippen) MOETEN via Apple IAP.
   - Kisten geven willekeurige zeldzaamheid: als kisten/robijnen die de wachttijd
     skippen te KOPEN zijn, moet je de kansen per zeldzaamheid TONEN vóór aankoop
     (loot-box-regel 3.1.1).
   - Consumables (robijnen) zijn niet "herstelbaar" — een restore-knop is alleen
     verplicht bij non-consumables/abonnementen.

   Robijnen worden pas bijgeschreven na een door StoreKit GEVERIFIEERDE transactie.
   Elke transactie-id wordt onthouden (localStorage) zodat robijnen nooit dubbel
   worden uitgekeerd (bv. als dezelfde aankoop ook via Transaction.updates binnenkomt).
   ============================================================ */
const IAP = {
  available: false,       // true zodra de native plugin reageert (ping)
  products: {},           // productId -> { id, price, title, description }
  _plugin: null,
  _txKey: 'rymr_iap_tx',  // localStorage-sleutel met reeds uitgekeerde transactie-id's
  _diag: {},              // diagnose-info (voor foutopsporing op het scherm)

  _rubyPacks() { return (window.RUBY_PACKS || []); },
  _rubyProductIds() { return this._rubyPacks().map((p) => p.product).filter(Boolean); },
  _packFor(productId) { return this._rubyPacks().find((p) => p.product === productId) || null; },

  // plugin op meerdere manieren vinden (auto-registratie of registerPlugin)
  _resolvePlugin() {
    const cap = window.Capacitor;
    if (!cap) return null;
    if (cap.Plugins && cap.Plugins.RymrIAP) return cap.Plugins.RymrIAP;
    if (cap.registerPlugin) { try { return cap.registerPlugin('RymrIAP'); } catch (e) {} }
    return null;
  },

  async init() {
    const cap = window.Capacitor;
    const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
    const d = this._diag;
    d.platform = cap && cap.getPlatform && cap.getPlatform();
    d.native = isNative;
    d.hasRegister = !!(cap && cap.registerPlugin);
    d.pluginKeys = cap && cap.Plugins ? Object.keys(cap.Plugins).join(',') : '(geen)';
    if (!isNative || d.platform !== 'ios') { d.err = 'niet-native/iOS'; return; }

    const plugin = this._resolvePlugin();
    d.gotPlugin = !!plugin;
    if (!plugin) { d.err = 'plugin niet gevonden'; return; }
    this._plugin = plugin;

    // 1) bevestig native aanwezigheid via ping (raakt StoreKit niet aan)
    try {
      const p = await plugin.ping();
      this.available = true;
      d.ping = 'ok'; d.storeKit2 = p && p.storeKit2;
    } catch (e) {
      this.available = false;
      d.ping = 'fail'; d.err = (e && (e.message || e.errorMessage)) || String(e);
      console.warn('[IAP] ping mislukt:', d.err);
      return;
    }

    // 2) live prijzen laden — mag mislukken (StoreKit-propagatie); blokkeert de shop niet
    try {
      const res = await plugin.getProducts({ productIds: this._rubyProductIds() });
      ((res && res.products) || []).forEach((p) => { if (p && p.id) this.products[p.id] = p; });
      d.productCount = Object.keys(this.products).length;
    } catch (e) {
      d.productsErr = (e && (e.message || e.errorMessage)) || String(e);
      console.warn('[IAP] producten laden mislukt:', d.productsErr);
    }

    // transacties die buiten de koop-knop binnenkomen ('Vraag om te kopen', onderbroken, etc.)
    try { plugin.addListener('purchaseUpdate', (info) => this._onExternalPurchase(info)); } catch (e) {}
  },

  // korte diagnose-string voor op het scherm
  diagText() {
    const d = this._diag;
    return 'IAP: plat=' + d.platform + ' plugin=' + (d.gotPlugin ? 'ja' : 'nee')
      + ' ping=' + (d.ping || '-') + ' prod=' + (d.productCount != null ? d.productCount : '-')
      + (d.err ? ' err=' + d.err : '') + (d.productsErr ? ' pErr=' + d.productsErr : '')
      + ' keys=[' + (d.pluginKeys || '') + ']';
  },

  // live StoreKit-prijs (bv. "€ 1,99"); valt terug op null als nog niet geladen
  priceFor(productId) {
    const p = this.products[productId];
    return p && p.price ? p.price : null;
  },

  // --- transactie-ontdubbeling ---------------------------------------------
  _grantedTx() {
    try { return JSON.parse(localStorage.getItem(this._txKey) || '[]'); } catch (e) { return []; }
  },
  _isNewTx(id) { return !!id && this._grantedTx().indexOf(String(id)) === -1; },
  _markTx(id) {
    if (!id) return;
    const list = this._grantedTx();
    if (list.indexOf(String(id)) === -1) {
      list.push(String(id));
      while (list.length > 300) list.shift();
      try { localStorage.setItem(this._txKey, JSON.stringify(list)); } catch (e) {}
    }
  },

  _grant(pack, txId) {
    if (!pack) return false;
    if (txId && !this._isNewTx(txId)) return false;          // al uitgekeerd -> niets doen
    if (window.Storage && Storage.addRubies) Storage.addRubies(pack.rubies);
    this._markTx(txId);
    return true;
  },

  // robijn-pakket kopen (shop -> Rubies-tab). Geeft een status-string terug:
  // 'ok' | 'cancelled' | 'pending' | 'unavailable' | 'failed'
  async buyRubies(pack) {
    if (!pack) return 'failed';
    if (!this.available || !this._plugin) return 'unavailable';
    try {
      const r = await this._plugin.purchase({ productId: pack.product });
      const status = r && r.status;
      if (status === 'ok') {
        this._grant(pack, r.transactionId);                 // ontdubbelt op transactie-id
        return 'ok';
      }
      if (status === 'cancelled') return 'cancelled';
      if (status === 'pending') return 'pending';
      return 'failed';
    } catch (e) { console.warn('[IAP] buyRubies', e); return 'failed'; }
  },

  // transactie die buiten de knop-flow binnenkwam -> alsnog uitkeren (indien nieuw)
  _onExternalPurchase(info) {
    const pid = info && info.productId;
    const pack = this._packFor(pid);
    if (!pack) return;
    if (this._grant(pack, info && info.transactionId)) {
      if (window.UI && UI.syncCoins) UI.syncCoins();
      if (window.UI && UI.renderShop) UI.renderShop();
      if (window.UI && UI.toast) UI.toast('+' + pack.rubies + ' ◆');
    }
  },

  async restore() {
    if (!this.available || !this._plugin) return false;
    try { await this._plugin.restore(); return true; } catch (e) { return false; }
  },
};
window.IAP = IAP;
