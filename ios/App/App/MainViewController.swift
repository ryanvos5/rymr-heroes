import UIKit
import Capacitor

/**
 * Eigen bridge-view-controller zodat we lokale (niet-npm) Capacitor-plugins
 * expliciet kunnen registreren. De automatische plugin-detectie pakt een
 * plugin die in de app-target zelf staat (RymrIAP) niet altijd op — daarom
 * registreren we 'm hier handmatig via de gedocumenteerde hook.
 */
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(RymrIAP())
    }
}
