odoo.define("pos_glory_connector.GloryChrome", function (require) {
    "use strict";

    const Chrome = require("point_of_sale.Chrome");
    const Registries = require("point_of_sale.Registries");
    const {_lt} = require("@web/core/l10n/translation");

    const GloryChrome = (BaseChrome) =>
        class extends BaseChrome {
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

            async showGloryAlertMoneyButton() {
                if (this.env.pos.config && this.env.pos.config.enable_glory) {
                    var glory_alert_money = {};
                    glory_alert_money = await this.rpc({
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
                        this.env.pos.pos_session.checkGloryAlertMoney = true;
                    } else {
                        this.env.pos.pos_session.checkGloryAlertMoney = false;
                    }
                } else {
                    this.env.pos.pos_session.checkGloryAlertMoney = false;
                }
            }

            async checkFirstGloryTransaction() {
                if (
                    !this.env.pos.moneyDetails &&
                    this.env.pos.config &&
                    this.env.pos.config.enable_glory
                ) {
                    var first_glory_transaction = {};
                    first_glory_transaction = await this.rpc({
                        model: "pos.session",
                        method: "check_first_glory_transaction",
                        args: [[this.env.pos.pos_session.id]],
                    });
                    if (
                        Object.prototype.hasOwnProperty.call(
                            first_glory_transaction,
                            this.env.pos.pos_session.id
                        ) &&
                        first_glory_transaction[this.env.pos.pos_session.id]
                    ) {
                        this.executeInventoryRequest(this.env.pos.pos_session.id);
                    }
                }
            }

            async computeMoneyDetails(details) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(details, "text/xml");
                const cashes = xmlDoc.getElementsByTagName("Cash");
                for (const cash of cashes) {
                    if (!cash.attributes) continue;

                    const cashType = cash.attributes[0].nodeValue;
                    if (!(cashType === "3" || cashType === "4")) continue;

                    for (let j = 0; j < cash.childNodes.length; j++) {
                        const den = cash.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        if (moneyType !== 0) {
                            if (cashType === "3") {
                                const moneyCount = parseInt(
                                    den.childNodes[0].innerHTML,
                                    10
                                );
                                this.env.pos.moneyDetails[moneyType] = moneyCount;
                            }
                            if (cashType === "4") {
                                const moneyCount = parseInt(
                                    den.childNodes[0].innerHTML,
                                    10
                                );
                                this.env.pos.moneyStackerDetails[moneyType] =
                                    moneyCount;
                            }
                        }
                    }

                    if (cashType === "4") break;
                }
            }

            async executeInventoryRequest(pos_session) {
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);
                this.env.pos.moneyDetails = Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                );
                this.env.pos.moneyStackerDetails = Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                );

                var sr =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:InventoryRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="0"/>' +
                    "</bru:InventoryRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "inventory_request";
                        if (xmlhttp.status === 200) {
                            await self.computeMoneyDetails(xmlhttp.responseText);
                            const message = _lt("Inventory successfully performed");
                            self.rpc({
                                model: "pos.session",
                                method: "try_write_glory_transaction",
                                args: [
                                    [pos_session],
                                    idCashier,
                                    message,
                                    operation,
                                    false,
                                    false,
                                    self.env.pos.moneyDetails,
                                    self.env.pos.moneyStackerDetails,
                                    false,
                                ],
                            });
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "InventoryOperation");
                xmlhttp.timeout = 1000;
                xmlhttp.send(sr);
                return xmlhttp.responseText;
            }
        };

    Registries.Component.extend(Chrome, GloryChrome);

    return GloryChrome;
});
