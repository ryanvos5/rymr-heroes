/* ============================================================
   IAP — in-app aankopen (Apple StoreKit via Capacitor).
   NU NOG INERT: er is nog geen aankoop-plugin geïnstalleerd en er zijn
   nog geen producten in App Store Connect. Dit bestand geeft alvast een
   nette structuur zodat je later alleen de plugin hoeft te koppelen.

   Apple-regels om te onthouden (zie APPSTORE.md):
   - Digitale goederen (munten, robijnen, kist-wachttijd skippen) MOETEN via
     Apple In-App Purchase lopen — geen eigen betaal-link.
   - Een "Herstel aankopen"-knop is verplicht voor non-consumables/abonnementen.
   - Kisten geven willekeurige zeldzaamheid: als kisten (of robijnen die de
     wachttijd skippen) ooit te KOPEN zijn, moet je de kansen per zeldzaamheid
     TONEN vóór de aankoop (loot-box-regel 3.1.1).

   Aanbevolen plugin: RevenueCat 'purchases-capacitor' of
   '@capacitor-community/in-app-purchases'. Koppel die in _bindPlugin().
   ============================================================ */
const IAP = {
  available: false,       // true zodra een plugin + producten gekoppeld zijn
  products: {},           // productId -> { price, title, ... }

  // toekomstige product-id's (moeten exact matchen met App Store Connect)
  PRODUCTS: {
    coins_small:  'com.ryanvos.tinypowersmashers.coins.small',    // consumable
    coins_large:  'com.ryanvos.tinypowersmashers.coins.large',    // consumable
    rubies_small: 'com.ryanvos.tinypowersmashers.rubies.small',   // consumable
    rubies_large: 'com.ryanvos.tinypowersmashers.rubies.large',   // consumable
    remove_ads:   'com.ryanvos.tinypowersmashers.noads',          // non-consumable (indien ooit ads)
  },

  init() {
    const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!isNative) return;                 // web/PWA: geen IAP
    try { this._bindPlugin(); } catch (e) { console.warn('[IAP] init', e); }
  },

  // TODO: koppel hier de echte Capacitor-aankoop-plugin.
  _bindPlugin() {
    // Voorbeeld (na het installeren van de plugin):
    //   const { Purchases } = window.Capacitor.Plugins;
    //   if (!Purchases) return;
    //   await Purchases.configure({ apiKey: '...' });   // RevenueCat
    //   this._plugin = Purchases;
    //   this.available = true;
    //   await this.loadProducts();
    this.available = false;
  },

  async loadProducts() {
    if (!this.available) return {};
    // TODO: haal producten + prijzen op via de plugin en vul this.products
    return this.products;
  },

  // een aankoop starten (geeft true bij succes). Werkt pas na _bindPlugin().
  async purchase(productId) {
    if (!this.available) { console.warn('[IAP] nog niet geconfigureerd'); return false; }
    // TODO: this._plugin.purchaseProduct({ productIdentifier: productId })
    return false;
  },

  // robijn-pakket kopen (shop → Rubies-tab). Geeft een status-string terug:
  // 'ok' (robijnen bijgeschreven) | 'unavailable' (IAP nog niet geconfigureerd) | 'failed'
  async buyRubies(pack) {
    if (!pack) return 'failed';
    if (!this.available) return 'unavailable';       // producten/plugin nog niet gekoppeld (zie APPSTORE.md)
    try {
      const ok = await this.purchase(pack.product);
      if (!ok) return 'failed';
      // aankoop gelukt -> robijnen bijschrijven (idealiter server-side geverifieerd)
      if (window.Storage && Storage.addRubies) Storage.addRubies(pack.rubies);
      return 'ok';
    } catch (e) { console.warn('[IAP] buyRubies', e); return 'failed'; }
  },

  // VERPLICHT voor non-consumables/abonnementen: eerdere aankopen herstellen.
  async restore() {
    if (!this.available) { console.warn('[IAP] nog niet geconfigureerd'); return false; }
    // TODO: this._plugin.restorePurchases()
    return false;
  },
};
window.IAP = IAP;
