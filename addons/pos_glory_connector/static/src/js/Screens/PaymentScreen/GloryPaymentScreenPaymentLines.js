odoo.define("pos_glory_connector.GloryPaymentScreenPaymentLines", function (require) {
    "use strict";

    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class GloryPaymentScreenPaymentLines extends PosComponent {
        formatLineAmount(paymentline) {
            return this.env.pos.format_currency_no_symbol(paymentline.get_amount());
        }

        selectedLineClass(line) {
            return {"payment-terminal": line.get_payment_status()};
        }

        unselectedLineClass(line) {
            console.log(line);
            return {};
        }
    }

    GloryPaymentScreenPaymentLines.template = "GloryPaymentScreenPaymentLines";
    Registries.Component.add(GloryPaymentScreenPaymentLines);
    return GloryPaymentScreenPaymentLines;
});
