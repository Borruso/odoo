odoo.define("pos_glory_connector.GloryOperationButton", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");
    const core = require("web.core");
    var _t = core._t;

    class GloryOperationButton extends PosComponent {
        async onClick() {
            if (this.env.pos.config.enable_glory) {
                this.showPopup("GloryOperationPopup");
            } else {
                this.showPopup("ErrorPopup", {
                    title: _t("Error"),
                    body: _t("Enable Glory in PoS Configuration"),
                });
            }
        }
    }

    GloryOperationButton.template = "GloryOperationButton";
    Registries.Component.add(GloryOperationButton);
    return GloryOperationButton;
});
