odoo.define(
    "pos_glory_connector.GloryOperationInventoryRequestPopup",
    function (require) {
        "use strict";

        const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
        const Registries = require("point_of_sale.Registries");
        const {_lt} = require("@web/core/l10n/translation");
        const {useState} = owl;

        class GloryOperationInventoryRequestPopup extends AbstractAwaitablePopup {
            setup() {
                super.setup();
                this.currency = this.env.pos.currency;
                this.state = useState({
                    moneyDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyStackerDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyStatus: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, ""])
                    ),
                    moneyStatusOdoo: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, ""])
                    ),
                    showStatusGlory: false,
                    total: 0,
                    totalStackerCoins: 0,
                    totalStackerBills: 0,
                    totalCassetteCoins: 0,
                    totalCassetteBills: 0,
                });
                if (this.env.pos.config.enable_glory) {
                    this.executeInventoryRequest();
                }
            }

            onClickShowStatusGlory() {
                this.state.showStatusGlory = true;
            }
            onClickHideStatusGlory() {
                this.state.showStatusGlory = false;
            }

            get firstHalfMoneyDetails() {
                const moneyDetailsKeys = Object.keys(this.state.moneyDetails).sort(
                    (a, b) => a - b
                );
                return moneyDetailsKeys.slice(0, moneyDetailsKeys.length / 2 + 1);
            }

            get lastHalfMoneyDetails() {
                const moneyDetailsKeys = Object.keys(this.state.moneyDetails).sort(
                    (a, b) => a - b
                );
                return moneyDetailsKeys.slice(
                    moneyDetailsKeys.length / 2 + 1,
                    moneyDetailsKeys.length
                );
            }

            reset() {
                for (const key in this.state.moneyDetails) {
                    this.state.moneyDetails[key] = 0;
                }
                for (const key in this.state.moneyStackerDetails) {
                    this.state.moneyStackerDetails[key] = 0;
                }
                for (const key in this.state.moneyStatus) {
                    this.state.moneyStatus[key] = "";
                }
                for (const key in this.state.moneyStatusOdoo) {
                    this.state.moneyStatusOdoo[key] = "";
                }
                this.state.showStatusGlory = false;
                this.state.total = 0;
                this.state.totalStackerCoins = 0;
                this.state.totalStackerBills = 0;
                this.state.totalCassetteCoins = 0;
                this.state.totalCassetteBills = 0;
            }

            updateMoneyDetailsAmount() {
                this.state.total = this.env.pos.round_decimals_currency(
                    Object.entries(this.state.moneyDetails).reduce(
                        (total, money) => total + money[0] * money[1],
                        0
                    )
                );

                this.state.totalCassetteCoins = 0;
                this.state.totalCassetteBills = 0;
                for (const moneyType in this.state.moneyDetails) {
                    const moneyCount =
                        this.state.moneyDetails[moneyType] -
                        this.state.moneyStackerDetails[moneyType];
                    if (moneyType < 5) {
                        this.state.totalCassetteCoins += moneyCount * moneyType;
                    } else {
                        this.state.totalCassetteBills += moneyCount * moneyType;
                    }
                }
            }

            convertMoneyKeyUnderstock(moneyKey) {
                const floatValue = parseFloat(moneyKey);
                let result = moneyKey.replace(".", "_");

                if (result.includes("_")) {
                    const lastGroup = result.split("_").pop();
                    if (lastGroup.length < 2) {
                        result += "0";
                    }
                } else {
                    result += "_00";
                }

                if (floatValue < 5) {
                    result = "understock_coin_" + result;
                } else {
                    result = "understock_bill_" + result;
                }

                return result;
            }

            computeMoneyStatusOdooValue(moneyType, moneyCount) {
                const convertKey = this.convertMoneyKeyUnderstock(moneyType.toString());
                const configValue = this.env.pos.config[convertKey] || 0;
                var result = 2;
                if (moneyCount === 0 && configValue !== 0) {
                    result = 0;
                } else if (configValue > this.state.moneyDetails[moneyType]) {
                    result = 1;
                }

                return result;
            }

            computeMoneyStatusValue(den, moneyType) {
                const moneyCount = parseInt(den.childNodes[0].innerHTML, 10);
                this.state.moneyStackerDetails[moneyType] = moneyCount;
                if (moneyType < 5) {
                    this.state.totalStackerCoins += moneyCount * moneyType;
                } else {
                    this.state.totalStackerBills += moneyCount * moneyType;
                }
                const moneyStatus = parseInt(den.childNodes[1].innerHTML, 10);
                this.state.moneyStatus[moneyType] = moneyStatus;
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
                                this.state.moneyDetails[moneyType] = moneyCount;
                                this.state.moneyStatusOdoo[moneyType] =
                                    this.computeMoneyStatusOdooValue(
                                        moneyType,
                                        moneyCount
                                    );
                            }
                            if (cashType === "4") {
                                this.computeMoneyStatusValue(den, moneyType);
                            }
                        }
                    }

                    this.updateMoneyDetailsAmount();
                    if (cashType === "4") break;
                }
            }

            async executeInventoryRequest() {
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

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
                                    [self.env.pos.pos_session.id],
                                    idCashier,
                                    message,
                                    operation,
                                    false,
                                    false,
                                    self.state.moneyDetails,
                                    self.state.moneyStackerDetails,
                                    false,
                                ],
                            });
                        } else {
                            const message = self.env._t(
                                "Glory machine seems unreachable"
                            );
                            self.showPopup("ErrorPopup", {
                                title: self.env._t("Network Error"),
                                body: message,
                            });
                            self.rpc({
                                model: "pos.session",
                                method: "try_write_glory_transaction",
                                args: [
                                    [self.env.pos.pos_session.id],
                                    idCashier,
                                    message,
                                    operation,
                                    false,
                                    false,
                                    self.state.moneyDetails,
                                    self.state.moneyStackerDetails,
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
        }

        GloryOperationInventoryRequestPopup.template =
            "GloryOperationInventoryRequestPopup";
        GloryOperationInventoryRequestPopup.defaultProps = {cancelText: _lt("Cancel")};
        Registries.Component.add(GloryOperationInventoryRequestPopup);
        return GloryOperationInventoryRequestPopup;
    }
);
