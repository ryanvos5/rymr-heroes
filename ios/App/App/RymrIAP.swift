import Foundation
import Capacitor
import StoreKit

/**
 * RymrIAP — kleine StoreKit 2-plugin voor consumable in-app aankopen (robijnen).
 *
 * Lokale Capacitor-plugin (geen npm-package). Aangeroepen vanuit js/iap.js via
 * Capacitor.registerPlugin('RymrIAP'). Werkt met de product-id's die in
 * App Store Connect zijn aangemaakt (zie js/config.js -> RUBY_PACKS).
 *
 * - getProducts: haalt prijs/titel op voor een lijst product-id's.
 * - purchase:    start een aankoop, verifieert via StoreKit en rondt af.
 * - restore:     herstel (consumables verschijnen hier niet; hier vooral no-op).
 *
 * Transacties die BUITEN de koop-knop binnenkomen ('Vraag om te kopen'-goedkeuring,
 * onderbroken aankoop, aankoop op een ander toestel) worden via Transaction.updates
 * opgevangen en als 'purchaseUpdate'-event naar JS gestuurd. JS ontdubbelt op
 * transactie-id zodat robijnen nooit dubbel worden bijgeschreven.
 */
@objc(RymrIAP)
public class RymrIAP: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RymrIAP"
    public let jsName = "RymrIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    // bevestigt dat de native plugin geladen is (raakt StoreKit niet aan)
    @objc func ping(_ call: CAPPluginCall) {
        var sk2 = false
        if #available(iOS 15.0, *) { sk2 = true }
        call.resolve(["ok": true, "storeKit2": sk2])
    }

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        if #available(iOS 15.0, *) {
            updatesTask = Task.detached { [weak self] in
                for await update in Transaction.updates {
                    if case .verified(let transaction) = update {
                        await transaction.finish()
                        self?.notifyListeners("purchaseUpdate", data: [
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    }
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["products": []]); return }
        let ids = call.getArray("productIds", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                let arr: [[String: Any]] = products.map { p in
                    return [
                        "id": p.id,
                        "price": p.displayPrice,
                        "title": p.displayName,
                        "description": p.description
                    ]
                }
                call.resolve(["products": arr])
            } catch {
                call.reject("Kon producten niet laden: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["status": "unavailable"]); return }
        guard let productId = call.getString("productId") else {
            call.reject("productId ontbreekt"); return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve(["status": "failed", "message": "Product niet gevonden"]); return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve([
                            "status": "ok",
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    case .unverified(_, let error):
                        call.resolve(["status": "failed", "message": "Niet-geverifieerd: \(error.localizedDescription)"])
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "failed"])
                }
            } catch {
                call.resolve(["status": "failed", "message": error.localizedDescription])
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["restored": []]); return }
        Task {
            var restored: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    restored.append(["productId": transaction.productID])
                }
            }
            call.resolve(["restored": restored])
        }
    }
}
