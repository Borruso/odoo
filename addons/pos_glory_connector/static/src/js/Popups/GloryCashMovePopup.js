odoo.define("pos_glory_connector.GloryCashMovePopup", function (require) {
    "use strict";

    const CashMovePopup = require("point_of_sale.CashMovePopup");
    const Registries = require("point_of_sale.Registries");
    const {useState} = owl;

    const GloryCashMovePopup = (BaseCashMovePopup) =>
        class extends BaseCashMovePopup {
            setup() {
                super.setup();
                this.state = useState({
                    inputType: "",
                    inputAmount: "",
                    inputReason: "",
                    inputHasError: false,
                    parsedAmount: 0,
                    sendStartCashinRequest: false,
                    showStartCashinRequest: this.env.pos.config.enable_glory || false,
                    sendEndCashinRequest: false,
                    showEndCashinRequest: false,
                    showCashoutRequest: false,
                    sendCashoutRequest: false,
                    moneyDetailsOut: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyDetailsIn: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyInventoryDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    moneyInventoryStatus: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, ""])
                    ),
                });
                if (this.env.pos.config.enable_glory) {
                    this.executeInventoryRequest();
                }
            }

            async confirm() {
                if (this.state.sendCashoutRequest) {
                    this.env.services.ui.block();
                    const status = await this.sendCashoutRequest();
                    this.env.services.ui.unblock();
                    if (!this.state.sendCashoutRequest && status) {
                        super.confirm();
                    }
                } else {
                    super.confirm();
                }
            }

            async cancel() {
                if (this.state.sendStartCashinRequest) {
                    const status = await this.sendCashinCancelRequest();
                    if (!this.state.sendStartCashinRequest && status) {
                        super.cancel();
                    }
                } else {
                    super.cancel();
                }
            }

            computeChartLabels() {
                var labels = [];
                var chartLabels = [];
                for (const mid in this.state.moneyInventoryDetails) {
                    labels.push(parseFloat(mid));
                }
                labels.sort(function (a, b) {
                    return a - b;
                });
                for (var i = 0; i < labels.length; i++) {
                    var moneyInventoryStatus = "ok";
                    if (this.state.moneyInventoryStatus[labels[i]] === 0) {
                        moneyInventoryStatus = "null";
                    } else if (this.state.moneyInventoryStatus[labels[i]] === 1) {
                        moneyInventoryStatus = "low";
                    } else if (this.state.moneyInventoryStatus[labels[i]] === 3) {
                        moneyInventoryStatus = "high";
                    } else if (this.state.moneyInventoryStatus[labels[i]] === 4) {
                        moneyInventoryStatus = "full";
                    }
                    chartLabels.push([labels[i], moneyInventoryStatus]);
                }
                return chartLabels;
            }

            computeChartDataInventoryFullDetails(labels) {
                var dataInventoryFullDetails = [];
                for (var i = 0; i < labels.length; i++) {
                    if (labels[i][1] === "full" || labels[i][1] === "high") {
                        dataInventoryFullDetails.push(
                            this.state.moneyInventoryDetails[labels[i][0]]
                        );
                    } else {
                        dataInventoryFullDetails.push(0);
                    }
                }
                return dataInventoryFullDetails;
            }

            computeChartDataInventoryGoodDetails(labels) {
                var dataInventoryGoodDetails = [];
                for (var i = 0; i < labels.length; i++) {
                    if (labels[i][1] === "ok") {
                        dataInventoryGoodDetails.push(
                            this.state.moneyInventoryDetails[labels[i][0]]
                        );
                    } else {
                        dataInventoryGoodDetails.push(0);
                    }
                }
                return dataInventoryGoodDetails;
            }

            computeChartDataInventoryBadDetails(labels) {
                var dataInventoryBadDetails = [];
                for (var i = 0; i < labels.length; i++) {
                    if (
                        labels[i][1] !== "full" &&
                        labels[i][1] !== "high" &&
                        labels[i][1] !== "ok"
                    ) {
                        dataInventoryBadDetails.push(
                            this.state.moneyInventoryDetails[labels[i][0]]
                        );
                    } else {
                        dataInventoryBadDetails.push(0);
                    }
                }
                return dataInventoryBadDetails;
            }

            computeChartDataOdooUnderstock(labels) {
                var dataOdooUnderstock = [];
                for (var i = 0; i < labels.length; i++) {
                    let convertKey = labels[i][0].toString().replace(".", "_");
                    if (convertKey.includes("_")) {
                        const lastGroup = convertKey.split("_").pop();
                        if (lastGroup.length < 2) {
                            convertKey += "0";
                        }
                    } else {
                        convertKey += "_00";
                    }
                    if (labels[i][0] < 5) {
                        convertKey = "understock_coin_" + convertKey;
                    } else {
                        convertKey = "understock_bill_" + convertKey;
                    }
                    dataOdooUnderstock.push(this.env.pos.config[convertKey]);
                }
                return dataOdooUnderstock;
            }

            /* eslint-disable no-undef */
            async renderChartMoneyDetails() {
                var ctx = $(this.el).find("#chartMoneyDetails")[0].getContext("2d");
                var labels = this.computeChartLabels();
                var dataInventoryFullDetails =
                    this.computeChartDataInventoryFullDetails(labels);
                var dataInventoryGoodDetails =
                    this.computeChartDataInventoryGoodDetails(labels);
                var dataInventoryBadDetails =
                    this.computeChartDataInventoryBadDetails(labels);
                var dataOdooUnderstock = this.computeChartDataOdooUnderstock(labels);
                var chartMoneyDetails = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: labels.map((item) => {
                            const number = item[0];
                            const formattedNumber =
                                number < 1 ? number.toFixed(2) : number.toString();
                            return [formattedNumber, item[1]];
                        }),
                        datasets: [
                            {
                                label: "Odoo Understock",
                                data: dataOdooUnderstock,
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 2,
                                grouped: false,
                                order: 1,
                                categoryPercentage: 0.8,
                                hidden: true,
                            },
                            {
                                label: "Full",
                                data: dataInventoryFullDetails,
                                backgroundColor: "rgba(48, 198, 82, 0.6)",
                                borderColor: "rgba(48, 198, 82, 1)",
                                borderWidth: 2,
                                grouped: false,
                                order: 2,
                                categoryPercentage: 0.6,
                            },
                            {
                                label: "Good",
                                data: dataInventoryGoodDetails,
                                backgroundColor: "rgba(247, 186, 7, 0.6)",
                                borderColor: "rgba(247, 186, 7, 1)",
                                borderWidth: 2,
                                grouped: false,
                                order: 2,
                                categoryPercentage: 0.6,
                            },
                            {
                                label: "Bad",
                                data: dataInventoryBadDetails,
                                backgroundColor: "rgba(193, 47, 61, 0.6)",
                                borderColor: "rgba(193, 47, 61, 1)",
                                borderWidth: 2,
                                grouped: false,
                                order: 2,
                                categoryPercentage: 0.6,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    title: (context) => {
                                        return (
                                            context[0].label.replaceAll(",", " (") + ")"
                                        );
                                    },
                                },
                            },
                            legend: {
                                position: "top",
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                            },
                        },
                    },
                });
                console.log("Chart Money Details: ", chartMoneyDetails);
            }
            /* eslint-enable no-undef */

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

            async computeMoneyDetails(details) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(details, "text/xml");
                const cashes = xmlDoc.getElementsByTagName("Cash");
                for (const cash of cashes) {
                    if (!cash.attributes) continue;

                    const cashType = cash.attributes[0].nodeValue;
                    if (cashType !== "4") continue;

                    for (let j = 0; j < cash.childNodes.length; j++) {
                        const den = cash.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        const moneyStatus = parseInt(den.childNodes[1].innerHTML, 10);
                        if (moneyType !== 0) {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            this.state.moneyInventoryDetails[moneyType] = moneyCount;

                            const convertKey = this.convertMoneyKeyUnderstock(
                                moneyType.toString()
                            );
                            const configValue = this.env.pos.config[convertKey] || 0;
                            if (moneyStatus === 4 || moneyStatus === 3) {
                                this.state.moneyInventoryStatus[moneyType] =
                                    moneyStatus;
                            } else if (moneyCount === 0 && configValue !== 0) {
                                this.state.moneyInventoryStatus[moneyType] = 0;
                            } else if (
                                configValue >
                                this.state.moneyInventoryDetails[moneyType]
                            ) {
                                this.state.moneyInventoryStatus[moneyType] = 1;
                            } else {
                                this.state.moneyInventoryStatus[moneyType] = 2;
                            }
                        }
                    }

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
                    '<Option bru:type="2"/>' +
                    "</bru:InventoryRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        if (xmlhttp.status === 200) {
                            await self.computeMoneyDetails(xmlhttp.responseText);
                            await self.renderChartMoneyDetails();
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

            async computeMoneyCash(xmlDoc) {
                const cash = xmlDoc.getElementsByTagName("Cash")[0];
                let moneyCash = 0;
                if (cash.attributes[0].nodeValue === "1") {
                    for (let j = 0; j < cash.childNodes.length; j++) {
                        const den = cash.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        if (moneyType !== 0) {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            moneyCash += moneyType * moneyCount;
                            this.state.moneyDetailsIn[moneyType] = moneyCount;
                        }
                    }
                }
                return moneyCash;
            }

            async onClickButton(type) {
                super.onClickButton(type);
                if (
                    this.state.inputType === "out" &&
                    this.env.pos.config.enable_glory
                ) {
                    this.state.showCashoutRequest = true;
                }
                if (
                    this.state.inputType === "in" &&
                    this.state.showStartCashinRequest &&
                    this.env.pos.config.enable_glory &&
                    this.env.pos.cashier.allow_cashin_operation
                ) {
                    this.sendStartCashinRequest();
                }
            }

            computeCashoutRequestXml() {
                var result =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:CashoutRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Delay bru:type="0"/>' +
                    '<Cash bru:type="2">';
                for (const moneyKey in this.state.moneyDetailsOut) {
                    if (this.state.moneyDetailsOut[moneyKey]) {
                        var devid = parseFloat(moneyKey) < 5 ? "2" : "1";
                        var currency = this.env.pos.currency.name;
                        var piece = this.state.moneyDetailsOut[moneyKey].toString();
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
                    "</bru:CashoutRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";
                return result;
            }

            async sendCashoutRequest() {
                if (!this.env.pos.config.enable_glory) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Glory machine not enabled!"),
                    });
                }

                let status = false;
                const promise = new Promise(function (resolve) {
                    status = resolve;
                });
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                var sr = this.computeCashoutRequestXml();

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "cashout_request";
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const cashoutResponse =
                                xmlDoc.getElementsByTagName("n:CashoutResponse");
                            const result =
                                cashoutResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                self.state.sendCashoutRequest = false;
                                status(true);
                                const message = self.env._t(
                                    "Cash out successfully performed"
                                );
                                self.rpc({
                                    model: "pos.session",
                                    method: "try_write_glory_transaction",
                                    args: [
                                        [self.env.pos.pos_session.id],
                                        idCashier,
                                        message + " - " + self.state.inputReason,
                                        operation,
                                        self.state.parsedAmount,
                                        false,
                                        self.state.moneyDetailsOut,
                                        self.state.moneyDetailsOut,
                                        "cashout",
                                    ],
                                });
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
                xmlhttp.setRequestHeader("SOAPAction", "CashoutOperation");
                xmlhttp.send(sr);
                return promise;
            }

            async sendEndCashinRequest() {
                if (!this.env.pos.config.enable_glory) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Glory machine not enabled!"),
                    });
                }

                let status = false;
                const promise = new Promise(function (resolve) {
                    status = resolve;
                });
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                var sr =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:EndCashinRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="0"/>' +
                    "</bru:EndCashinRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "end_cashin_request";
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const endCashinResponse =
                                xmlDoc.getElementsByTagName("n:EndCashinResponse");
                            const result =
                                endCashinResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                const moneyCash = await self.computeMoneyCash(xmlDoc);
                                self.state.inputAmount = self.env.pos
                                    .round_decimals_currency(moneyCash)
                                    .toString();
                                self.state.parsedAmount =
                                    self.env.pos.round_decimals_currency(
                                        self.state.inputAmount
                                    );
                                self.state.sendEndCashinRequest = true;
                                self.state.showStartCashinRequest = true;
                                self.state.showEndCashinRequest = false;
                                status(true);
                                const message = self.env._t(
                                    "End cash in successfully performed"
                                );
                                self.rpc({
                                    model: "pos.session",
                                    method: "try_write_glory_transaction",
                                    args: [
                                        [self.env.pos.pos_session.id],
                                        idCashier,
                                        message + " - " + self.state.inputReason,
                                        operation,
                                        moneyCash,
                                        false,
                                        self.state.moneyDetailsIn,
                                        self.state.moneyDetailsIn,
                                        "cashin",
                                    ],
                                });
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
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "EndCashinOperation");
                xmlhttp.send(sr);
                return promise;
            }

            sendCashinCancelRequest() {
                if (!this.env.pos.config.enable_glory) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Glory machine not enabled!"),
                    });
                }

                let status = false;
                const promise = new Promise(function (resolve) {
                    status = resolve;
                });
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                var sr =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:CashinCancelRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="0"/>' +
                    "</bru:CashinCancelRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "cashin_cancel_request";
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const cashinCancelResponse = xmlDoc.getElementsByTagName(
                                "n:CashinCancelResponse"
                            );
                            const result =
                                cashinCancelResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                self.state.sendStartCashinRequest = false;
                                self.state.showStartCashinRequest = true;
                                self.state.showEndCashinRequest = false;
                                status(true);
                                const message = self.env._t(
                                    "Cancel cash in successfully performed"
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
                                        false,
                                        false,
                                        "",
                                    ],
                                });
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
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "CashinCancelOperation");
                xmlhttp.send(sr);
                return promise;
            }

            async sendStartCashoutRequest() {
                if (!this.env.pos.config.enable_glory) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Glory machine not enabled!"),
                    });
                }

                if (this.state.inputType !== "out") {
                    this.state.inputHasError = true;
                    this.errorMessage = this.env._t("You must select Cash Out option.");
                    return;
                }

                if (!this.state.inputReason) {
                    this.state.inputHasError = true;
                    this.errorMessage = this.env._t("Reason is mandatory!");
                    return;
                }

                const {confirmed, payload} = await this.showPopup("GloryCashoutPopup");
                if (!confirmed) return;
                const {moneyDetails, total} = payload;
                var convertTotal = -1 * total;
                this.state.inputAmount = this.env.pos
                    .round_decimals_currency(convertTotal)
                    .toString();
                this.state.parsedAmount = this.env.pos.round_decimals_currency(
                    this.state.inputAmount
                );
                this.state.moneyDetailsOut = moneyDetails;
                this.state.sendCashoutRequest = true;
            }

            sendStartCashinRequest() {
                if (!this.env.pos.config.enable_glory) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Glory machine not enabled!"),
                    });
                }

                if (this.state.inputType === "") {
                    this.state.inputHasError = true;
                    this.errorMessage = this.env._t(
                        "Select either Cash In or Cash Out before confirming."
                    );
                    return;
                }

                let status = false;
                const promise = new Promise(function (resolve) {
                    status = resolve;
                });
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                var sr =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:StartCashinRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="0"/>' +
                    "</bru:StartCashinRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "start_cashin_request";
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const startCashinResponse = xmlDoc.getElementsByTagName(
                                "n:StartCashinResponse"
                            );
                            const result =
                                startCashinResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                self.state.sendStartCashinRequest = true;
                                self.state.showStartCashinRequest = false;
                                self.state.showEndCashinRequest = true;
                                const message = self.env._t(
                                    "Start cash in successfully performed"
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
                                        false,
                                        false,
                                        "",
                                    ],
                                });
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
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "StartCashinOperation");
                xmlhttp.timeout = 1000;
                xmlhttp.send(sr);
                return promise;
            }
        };

    Registries.Component.extend(CashMovePopup, GloryCashMovePopup);
    return GloryCashMovePopup;
});
