odoo.define("pos_glory_connector.GloryAlertMoneyPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");
    const {useState} = owl;

    class GloryAlertMoneyPopup extends AbstractAwaitablePopup {
        setup() {
            super.setup();
            this.currency = this.env.pos.currency;
            this.state = useState({
                gloryAlertMoney: "",
            });
            if (this.env.pos.config.enable_glory) {
                this.checkGloryAlertMoney();
            }
        }

        async checkGloryAlertMoney() {
            const glory_alert_money = await this.rpc({
                model: "pos.session",
                method: "check_glory_alert_money",
                args: [[this.env.pos.pos_session.id]],
            });
            if (
                Object.prototype.hasOwnProperty.call(
                    glory_alert_money,
                    this.env.pos.pos_session.id
                ) &&
                glory_alert_money[this.env.pos.pos_session.id]
            ) {
                this.state.gloryAlertMoney =
                    glory_alert_money[this.env.pos.pos_session.id];
            } else {
                this.state.gloryAlertMoney = "";
            }
        }

        async openCashMoveButton() {
            const {confirmed} = await this.showPopup("CashMovePopup");
            if (!confirmed) return;
            this.cancel();
        }

        showCashMoveButton() {
            if (this.env.pos.config && this.env.pos.config.enable_glory) {
                return (
                    this.env.pos &&
                    this.env.pos.config &&
                    this.env.pos.config.cash_control &&
                    (!this.env.pos.cashier ||
                        this.env.pos.cashier.allow_cashin_operation ||
                        this.env.pos.cashier.allow_cashout_operation)
                );
            }
            return super.showCashMoveButton();
        }
    }

    GloryAlertMoneyPopup.template = "GloryAlertMoneyPopup";
    Registries.Component.add(GloryAlertMoneyPopup);
    return GloryAlertMoneyPopup;
});
