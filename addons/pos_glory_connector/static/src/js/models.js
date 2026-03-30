odoo.define("pos_glory_connector.GloryModels", function (require) {
    "use strict";

    const {
        Order: OriginalOrder,
        Payment: OriginalPayment,
    } = require("point_of_sale.models");
    const Registries = require("point_of_sale.Registries");

    const GloryPaymentExtension = (PaymentClass) =>
        class GloryPayment extends PaymentClass {
            init_from_JSON(json) {
                super.init_from_JSON(...arguments);
                this.glory_payment_uuid =
                    json.glory_payment_uuid || this.glory_payment_uuid || false;
            }

            export_as_JSON() {
                const json = super.export_as_JSON(...arguments);
                json.glory_payment_uuid =
                    this.glory_payment_uuid || this.uuid || false;
                return json;
            }
        };

    const GloryOrderExtension = (OrderClass) =>
        class GloryOrder extends OrderClass {
            // @Override
            add_paymentline(payment_method) {
                this.assert_editable();
                if (this.electronic_payment_in_progress()) {
                    return false;
                }
                var newPaymentline = OriginalPayment.create(
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
                    newPaymentline.glory_payment_uuid = newPaymentline.uuid;
                    newPaymentline.set_payment_status("pending");
                }

                if (payment_method.payment_terminal) {
                    newPaymentline.set_payment_status("pending");
                }
                return newPaymentline;
            }
        };

    Registries.Model.extend(OriginalOrder, GloryOrderExtension);
    Registries.Model.extend(OriginalPayment, GloryPaymentExtension);
});
