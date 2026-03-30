odoo.define("pos_glory_connector.GlorySuccessPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");
    const {_lt} = require("@web/core/l10n/translation");

    class GlorySuccessPopup extends AbstractAwaitablePopup {}
    GlorySuccessPopup.template = "GlorySuccessPopup";
    GlorySuccessPopup.defaultProps = {
        confirmText: _lt("Ok"),
        title: _lt("Confirm ?"),
        body: "",
    };

    Registries.Component.add(GlorySuccessPopup);
    return GlorySuccessPopup;
});
