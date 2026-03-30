odoo.define("pos_glory_connector.GloryAlertMoneyButton", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");
    const core = require("web.core");
    var _t = core._t;

    class GloryAlertMoneyButton extends PosComponent {
        async onClick() {
            if (this.env.pos.config.enable_glory) {
                this.showPopup("GloryAlertMoneyPopup");
            } else {
                this.showPopup("ErrorPopup", {
                    title: _t("Error"),
                    body: _t("Enable Glory in PoS Configuration"),
                });
            }
        }
    }

    GloryAlertMoneyButton.template = "GloryAlertMoneyButton";
    Registries.Component.add(GloryAlertMoneyButton);
    return GloryAlertMoneyButton;
});
