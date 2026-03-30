odoo.define("pos_glory_connector.GloryModels", function (require) {
    "use strict";

    const {Order: OriginalOrder, Payment} = require("point_of_sale.models");
    const Registries = require("point_of_sale.Registries");

    const GloryOrderExtension = (OrderClass) =>
        class GloryOrder extends OrderClass {
            // @Override
            add_paymentline(payment_method) {
                this.assert_editable();
                if (this.electronic_payment_in_progress()) {
                    return false;
                }
                var newPaymentline = Payment.create(
                    {},
                    {order: this, payment_method: payment_method, pos: this.pos}
                );
                this.paymentlines.add(newPaymentline);
                this.select_paymentline(newPaymentline);
                if (this.pos.config.cash_rounding) {
                    this.selected_paymentline.set_amount(0);
                }
                newPaymentline.set_amount(this.get_due());

                if (payment_method.is_glory_machine) {
                    newPaymentline.set_payment_status("pending");
                }

                if (payment_method.payment_terminal) {
                    newPaymentline.set_payment_status("pending");
                }
                return newPaymentline;
            }
        };

    Registries.Model.extend(OriginalOrder, GloryOrderExtension);
});
