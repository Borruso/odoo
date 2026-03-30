odoo.define(
    "pos_glory_connector.GloryOperationCollectRequestPopup",
    function (require) {
        "use strict";

        const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
        const Registries = require("point_of_sale.Registries");
        const {_lt} = require("@web/core/l10n/translation");
        const {useState} = owl;

        class GloryOperationCollectRequestPopup extends AbstractAwaitablePopup {
            async setup() {
                super.setup();
                this.currency = this.env.pos.currency;
                this.state = useState({
                    moneySpecificDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyInventoryDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                });
                if (this.env.pos.valueCollectSpecific) {
                    this.collectBody = _lt(
                        "Choose denominations you want to collect to the cassetta:"
                    );
                } else if (this.env.pos.valueCollectPartial === "0") {
                    this.collectBody = _lt(
                        "Are you sure you want to collect total to the cassetta?"
                    );
                } else {
                    this.collectBody = _lt(
                        "Are you sure you want to collect everything above the watermark to the cassetta?"
                    );
                }
                if (this.env.pos.config.enable_glory) {
                    this.executeInventoryRequest();
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            async confirm() {
                this.env.services.ui.block();
                const status = await this.sendCollectRequest();
                this.env.services.ui.unblock();
                if (status) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    await this.executeInventoryRequest();
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    const idCashier = this.env.pos.get_cashier().id;
                    const message = _lt("Collect successfully performed");
                    var operation = "";
                    var mode = "";
                    var moneyInventoryDetails = this.state.moneyInventoryDetails;
                    if (this.env.pos.valueCollectSpecific) {
                        operation = "collect_specific_request";
                        mode = "collect_specific";
                        moneyInventoryDetails = this.state.moneySpecificDetails;
                    } else if (this.env.pos.valueCollectPartial === "0") {
                        if (
                            this.env.pos.valueCollectBills &&
                            !this.env.pos.valueCollectCoins
                        ) {
                            operation = "collect_all_bills_request";
                            mode = "collect_all_bills";
                        } else if (
                            !this.env.pos.valueCollectBills &&
                            this.env.pos.valueCollectCoins
                        ) {
                            operation = "collect_all_coins_request";
                            mode = "collect_all_coins";
                        } else {
                            operation = "collect_all_request";
                            mode = "collect_all";
                        }
                    } else {
                        operation = "collect_surplus_request";
                        mode = "collect_surplus";
                    }
                    this.env.pos.valueCollectPartial = false;
                    this.showPopup("GlorySuccessPopup", {
                        title: _lt("Successful"),
                        body: message,
                    });
                    this.rpc({
                        model: "pos.session",
                        method: "try_write_glory_transaction",
                        args: [
                            [this.env.pos.pos_session.id],
                            idCashier,
                            message,
                            operation,
                            false,
                            false,
                            false,
                            moneyInventoryDetails,
                            mode,
                        ],
                    });
                }
                super.confirm();
            }

            get firstHalfMoneyDetails() {
                var moneyDetails = [];
                if (this.env.pos.valueCollectSpecific) {
                    moneyDetails = this.state.moneySpecificDetails;
                } else {
                    moneyDetails = this.state.moneyInventoryDetails;
                }
                const moneyDetailsKeys = Object.keys(moneyDetails).sort(
                    (a, b) => a - b
                );
                return moneyDetailsKeys.slice(0, moneyDetailsKeys.length / 2 + 1);
            }

            get lastHalfMoneyDetails() {
                var moneyDetails = [];
                if (this.env.pos.valueCollectSpecific) {
                    moneyDetails = this.state.moneySpecificDetails;
                } else {
                    moneyDetails = this.state.moneyInventoryDetails;
                }
                const moneyDetailsKeys = Object.keys(moneyDetails).sort(
                    (a, b) => a - b
                );
                return moneyDetailsKeys.slice(
                    moneyDetailsKeys.length / 2 + 1,
                    moneyDetailsKeys.length
                );
            }

            convertMoneyKeyWatermarker(moneyKey) {
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
                    result = "watermarker_coin_" + result;
                } else {
                    result = "watermarker_bill_" + result;
                }

                return result;
            }

            updateMoneyInventoryDetails(moneyType, moneyCount) {
                if (this.env.pos.valueCollectBills && moneyType >= 5) {
                    this.state.moneyInventoryDetails[moneyType] = moneyCount;
                }
                if (this.env.pos.valueCollectCoins && moneyType < 5) {
                    this.state.moneyInventoryDetails[moneyType] = moneyCount;
                }

                if (
                    this.env.pos.config.use_odoo_watermarker &&
                    this.env.pos.valueCollectPartial === "odoo"
                ) {
                    const convertKey = this.convertMoneyKeyWatermarker(
                        moneyType.toString()
                    );
                    const configValue = this.env.pos.config[convertKey] || 0;

                    if (configValue > this.state.moneyInventoryDetails[moneyType]) {
                        this.state.moneyInventoryDetails[moneyType] = 0;
                    } else {
                        this.state.moneyInventoryDetails[moneyType] -= configValue;
                    }
                }
            }

            processCashChildren(childNodes) {
                for (let j = 0; j < childNodes.length; j++) {
                    const den = childNodes[j];
                    if (!den.attributes) continue;

                    const moneyType = parseInt(den.attributes[1].nodeValue, 10) / 100;
                    if (moneyType === 0) continue;

                    const moneyCount = parseInt(den.childNodes[0].innerHTML, 10);
                    this.updateMoneyInventoryDetails(moneyType, moneyCount);
                }
            }

            async computeMoneyDetails(details) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(details, "text/xml");
                const cashes = xmlDoc.getElementsByTagName("Cash");
                for (const cash of cashes) {
                    if (!cash.attributes) continue;

                    const cashType = cash.attributes[0].nodeValue;
                    if (cashType !== "4") continue;

                    this.processCashChildren(cash.childNodes);
                    break;
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
                    '<Option bru:type="2"/>' +
                    "</bru:InventoryRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        if (xmlhttp.status === 200) {
                            await self.computeMoneyDetails(xmlhttp.responseText);
                        } else {
                            const message = self.env._t(
                                "Glory machine seems unreachable"
                            );
                            self.showPopup("ErrorPopup", {
                                title: self.env._t("Network Error"),
                                body: message,
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

            computeCollectRequestXml() {
                var valuePartialXml = this.env.pos.valueCollectPartial;
                if (this.env.pos.valueCollectPartial === "odoo") {
                    valuePartialXml = "0";
                }

                var moneyDetails = [];
                if (this.env.pos.valueCollectSpecific) {
                    moneyDetails = this.state.moneySpecificDetails;
                } else {
                    moneyDetails = this.state.moneyInventoryDetails;
                }

                var result =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:CollectRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="0"/>' +
                    '<IFCassette bru:type="0"/>';
                if (this.env.pos.config.glory_kind === "ci5") {
                    result += '<bru:Mix type="1"/>';
                }
                result =
                    result +
                    '<Partial bru:type="' +
                    valuePartialXml +
                    '"/>' +
                    '<Cash bru:type="5">';
                for (const moneyKey in moneyDetails) {
                    if (moneyDetails[moneyKey]) {
                        var devid = parseFloat(moneyKey) < 5 ? "2" : "1";
                        var currency = this.env.pos.currency.name;
                        var piece = moneyDetails[moneyKey];
                        result =
                            result +
                            '<Denomination bru:cc="' +
                            currency +
                            '" bru:fv="' +
                            parseFloat(moneyKey) * 100 +
                            '" bru:devid="' +
                            devid +
                            '">' +
                            "<bru:Piece>" +
                            piece +
                            "</bru:Piece>" +
                            "<bru:Status>0</bru:Status>" +
                            "</Denomination>";
                    }
                }
                result =
                    result +
                    "</Cash>" +
                    "</bru:CollectRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";
                return result;
            }

            sendCollectRequest() {
                let status = false;
                const promise = new Promise(function (resolve) {
                    status = resolve;
                });
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                var sr = this.computeCollectRequestXml();

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        var operation = "";
                        if (self.env.pos.valueCollectSpecific) {
                            operation = "collect_specific_request";
                        } else if (self.env.pos.valueCollectPartial === "0") {
                            if (
                                self.env.pos.valueCollectBills &&
                                !self.env.pos.valueCollectCoins
                            ) {
                                operation = "collect_all_bills_request";
                            } else if (
                                !self.env.pos.valueCollectBills &&
                                self.env.pos.valueCollectCoins
                            ) {
                                operation = "collect_all_coins_request";
                            } else {
                                operation = "collect_all_request";
                            }
                        } else {
                            operation = "collect_surplus_request";
                        }
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const collectResponse =
                                xmlDoc.getElementsByTagName("n:CollectResponse");
                            const result =
                                collectResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                status(true);
                            } else {
                                const message = self.env._t(
                                    "Transaction can not be processed at the moment or machine took too much time to respond."
                                );
                                self.showPopup("ErrorPopup", {
                                    title: self.env._t("Error"),
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
                                        false,
                                        false,
                                        "",
                                    ],
                                });
                                status(false);
                                self.env.services.ui.unblock();
                            }
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
                                    false,
                                    false,
                                    "",
                                ],
                            });
                            status(false);
                            self.env.services.ui.unblock();
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "CollectOperation");
                xmlhttp.send(sr);
                return promise;
            }
        }

        GloryOperationCollectRequestPopup.template =
            "GloryOperationCollectRequestPopup";
        GloryOperationCollectRequestPopup.defaultProps = {
            cancelText: _lt("Cancel"),
            confirmText: _lt("Confirm"),
        };
        Registries.Component.add(GloryOperationCollectRequestPopup);
        return GloryOperationCollectRequestPopup;
    }
);
