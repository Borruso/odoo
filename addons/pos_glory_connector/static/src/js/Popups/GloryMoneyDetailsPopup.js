odoo.define("pos_glory_connector.GloryMoneyDetailsPopup", function (require) {
    "use strict";

    const MoneyDetailsPopup = require("point_of_sale.MoneyDetailsPopup");
    const Registries = require("point_of_sale.Registries");
    const {useState} = owl;

    const GloryMoneyDetailsPopup = (BaseMoneyDetailsPopup) =>
        class extends BaseMoneyDetailsPopup {
            async setup() {
                super.setup();
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
                });
                this.allowSeeTotalSection = this.env.pos.config.enable_glory
                    ? this.env.pos.get_cashier().allow_see_inventory_total
                    : this.env.pos.get_cashier().role === "manager";
                if (this.env.pos.config.enable_glory) {
                    await this.inventoryRequest();
                    if (!this.env.pos.get_cashier().allow_inventory_operation) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        this.confirm();
                        this.showPopup("GlorySuccessPopup", {
                            title: this.env._t("Successful"),
                            body: this.env._t("Inventory successfully performed"),
                        });
                    }
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
            }

            inventoryRequest() {
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
                            const message = self.env._t(
                                "Inventory successfully performed"
                            );
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
                                    "",
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
                                    "",
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

            computeMoneyDetails(details) {
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
                                const moneyCount = parseInt(
                                    den.childNodes[0].innerHTML,
                                    10
                                );
                                this.state.moneyStackerDetails[moneyType] = moneyCount;
                                const moneyStatus = parseInt(
                                    den.childNodes[1].innerHTML,
                                    10
                                );
                                this.state.moneyStatus[moneyType] = moneyStatus;
                            }
                        }
                    }

                    this.updateMoneyDetailsAmount();
                    if (cashType === "4") break;
                }
            }
        };

    Registries.Component.extend(MoneyDetailsPopup, GloryMoneyDetailsPopup);
    return GloryMoneyDetailsPopup;
});
