odoo.define("pos_glory_connector.GloryPaymentScreen", function (require) {
    "use strict";

    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const {useListener} = require("@web/core/utils/hooks");
    const {useState} = owl;
    const NumberBuffer = require("point_of_sale.NumberBuffer");
    const Registries = require("point_of_sale.Registries");

    const GloryPaymentScreen = (BasePaymentScreen) =>
        class extends BasePaymentScreen {
            setup() {
                super.setup();
                useListener(
                    "send-glory-payment-request",
                    this._sendGloryPaymentRequest
                );
                useListener("send-glory-payment-cancel", this._sendGloryPaymentCancel);
                this.state = useState({
                    moneyDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                });
            }

            async addNewPaymentLine({detail: paymentMethod}) {
                // Original function: click_paymentmethods
                const result = this.currentOrder.add_paymentline(paymentMethod);
                if (result) {
                    NumberBuffer.reset();
                    return true;
                }
                this.showPopup("ErrorPopup", {
                    title: this.env._t("Error"),
                    body: this.env._t(
                        "There is already an electronic payment in progress."
                    ),
                });
                return false;
            }

            async deletePaymentLine(event) {
                var self = this;
                const {cid} = event.detail;
                const paymentLine = this.paymentLines.find((line) => line.cid === cid);

                // If a paymentline with a payment terminal linked to
                // it is removed, the terminal should get a cancel
                // request.
                if (
                    ["waiting", "waitingCard", "timeout"].includes(
                        paymentLine.get_payment_status()
                    )
                ) {
                    if (paymentLine.getType !== "Cash") {
                        paymentLine.set_payment_status("waitingCancel");
                        paymentLine.payment_method.payment_terminal
                            .send_payment_cancel(this.currentOrder, cid)
                            .then(function () {
                                self.currentOrder.remove_paymentline(paymentLine);
                                NumberBuffer.reset();
                                self.render();
                            });
                    }
                } else if (paymentLine.get_payment_status() !== "waitingCancel") {
                    this.currentOrder.remove_paymentline(paymentLine);
                    NumberBuffer.reset();
                    this.render();
                }
            }

            async _checkStatus() {
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
                    "<bru:StatusRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="1"/>' +
                    '<RequireVerification bru:type="0"/>' +
                    "</bru:StatusRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "status_request";
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const statusResponse =
                                xmlDoc.getElementsByTagName("n:StatusResponse");
                            const errorCodes = ["13", "30"];
                            const status_code = statusResponse[0]
                                .getElementsByTagName("Status")[0]
                                .getElementsByTagName("n:Code")[0]
                                .getHTML();
                            if (errorCodes.includes(status_code)) {
                                const rbw_status_code = statusResponse[0]
                                    .getElementsByTagName("Status")[0]
                                    .getElementsByTagName("DevStatus")[0].attributes[
                                    "n:st"
                                ].value;
                                const rcw_status_code = statusResponse[0]
                                    .getElementsByTagName("Status")[0]
                                    .getElementsByTagName("DevStatus")[1].attributes[
                                    "n:st"
                                ].value;
                                const message = self.env._t(
                                    "Error on Glory machine\n" +
                                        "Machine status : code " +
                                        status_code +
                                        "\n" +
                                        "RBW status : code " +
                                        rbw_status_code +
                                        "\n" +
                                        "RCW status : code " +
                                        rcw_status_code +
                                        "\n"
                                );
                                await self.showPopup("ErrorPopup", {
                                    title: self.env._t("Error"),
                                    body: message,
                                });
                                await self.rpc({
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
                            if (status_code === "1") {
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
                xmlhttp.setRequestHeader("SOAPAction", "GetStatus");
                xmlhttp.timeout = 1000;
                xmlhttp.send(sr);
                return promise;
            }

            async executeInventoryRequest() {
                const self = this;
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

                return new Promise((resolve, reject) => {
                    const xmlhttp = new XMLHttpRequest();
                    xmlhttp.open("POST", this.env.pos.config.fcc_url, true);

                    xmlhttp.onreadystatechange = function () {
                        if (xmlhttp.readyState === 4) {
                            if (xmlhttp.status === 200) {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(
                                    xmlhttp.responseText,
                                    "application/xml"
                                );
                                const denomNodes = Array.from(
                                    xmlDoc.getElementsByTagName("Denomination")
                                );
                                var denoms = denomNodes.map((node) => {
                                    const pieceNode =
                                        node.getElementsByTagName("n:Piece")[0];
                                    const piece = pieceNode
                                        ? parseInt(pieceNode.textContent, 10)
                                        : 0;

                                    return {
                                        cc: node.getAttribute("n:cc"),
                                        fv:
                                            parseInt(node.getAttribute("n:fv"), 10) /
                                            100,
                                        devid: node.getAttribute("n:devid"),
                                        piece: piece,
                                    };
                                });
                                resolve(denoms);
                            } else {
                                const message = self.env._t(
                                    "Glory machine seems unreachable"
                                );
                                self.showPopup("ErrorPopup", {
                                    title: self.env._t("Network Error"),
                                    body: message,
                                });
                                reject(new Error("Network Error"));
                            }
                        }
                    };

                    // Send the POST request
                    xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                    xmlhttp.setRequestHeader("SOAPAction", "InventoryOperation");
                    xmlhttp.timeout = 1000;
                    xmlhttp.send(sr);
                });
            }

            allocateGreedy(amount, inventory) {
                let remaining = amount * -1;
                const sorted = [...inventory].sort((a, b) => b.fv - a.fv);
                const alloc = [];
                const rounding_factor = Math.pow(10, 2);
                let pre_remaining = 0.0;

                for (const {cc, fv, devid, piece: avail} of sorted) {
                    if (remaining <= 0) break;
                    const maxUse = Math.min(Math.floor(remaining / fv), avail);
                    if (maxUse > 0) {
                        alloc.push({cc, fv, devid, piece: maxUse});
                        pre_remaining = Number((remaining - maxUse * fv).toFixed(2));
                        remaining =
                            Math.trunc(pre_remaining * rounding_factor) /
                            rounding_factor;
                    }
                }

                if (remaining !== 0) {
                    throw new Error(
                        `Rimangono ${remaining} non distribuibili con greedy`
                    );
                }
                return alloc;
            }

            async computeCashoutRequestXml(amountToDispense) {
                const inventory = await this.executeInventoryRequest();
                const allocation = this.allocateGreedy(amountToDispense, inventory);
                var result =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:CashoutRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Delay bru:type="0"/>' +
                    '<Cash bru:type="2">';
                for (const {cc, fv, devid, piece} of allocation) {
                    result =
                        result +
                        '<Denomination bru:cc="' +
                        cc +
                        '" bru:fv="' +
                        fv * 100 +
                        '" bru:devid="' +
                        devid +
                        '">' +
                        "<bru:Piece>" +
                        piece +
                        "</bru:Piece>" +
                        "<bru:Status>0</bru:Status>" +
                        "</Denomination>";
                }
                result =
                    result +
                    "</Cash>" +
                    "</bru:CashoutRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";
                return result;
            }

            async computeMoneyCash(xmlDoc) {
                const cashIn = xmlDoc.getElementsByTagName("Cash")[0];
                let moneyCash = 0;
                if (cashIn.attributes[0].nodeValue === "1") {
                    for (let j = 0; j < cashIn.childNodes.length; j++) {
                        const den = cashIn.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        if (moneyType !== 0) {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            moneyCash += moneyType * moneyCount;
                            this.state.moneyDetails[moneyType] = moneyCount;
                        }
                    }
                }
                const cashOut = xmlDoc.getElementsByTagName("Cash")[1];
                if (cashOut.attributes[0].nodeValue === "2") {
                    for (let j = 0; j < cashOut.childNodes.length; j++) {
                        const den = cashOut.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        if (moneyType !== 0) {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            this.state.moneyDetails[moneyType] = -moneyCount;
                        }
                    }
                }
                return moneyCash;
            }

            async _processCashoutResponse(xmlDoc, line, idCashier, paymentMethodId) {
                let message = "";
                const operationError = "aborted_payment_request";
                const operationDone = "refund_payment_request";
                const cashoutResponse =
                    xmlDoc.getElementsByTagName("n:CashoutResponse")[0];

                if (!cashoutResponse || !cashoutResponse.attributes["n:result"]) {
                    message = this.env._t(
                        "Transaction can not be processed at the moment or machine took too much time to respond."
                    );
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: message,
                    });
                    this.rpc({
                        model: "pos.session",
                        method: "try_write_glory_transaction",
                        args: [
                            [this.env.pos.pos_session.id],
                            idCashier,
                            message,
                            operationError,
                            false,
                            paymentMethodId,
                            false,
                            false,
                            "",
                            line.glory_payment_uuid || line.uuid || false,
                        ],
                    });
                    return;
                }

                const result = cashoutResponse.attributes["n:result"].value;

                if (["0", "11"].includes(result)) {
                    line.set_payment_status("done");
                    message = this.env._t("Cash out successfully performed - Refund");
                    this.rpc({
                        model: "pos.session",
                        method: "try_write_glory_transaction",
                        args: [
                            [this.env.pos.pos_session.id],
                            idCashier,
                            message,
                            operationDone,
                            line.amount,
                            paymentMethodId,
                            this.state.moneyDetails,
                            this.state.moneyDetails,
                            "payment",
                            line.glory_payment_uuid || line.uuid || false,
                        ],
                    });
                } else {
                    message = this.env._t(
                        "Transaction can not be processed at the moment or machine took too much time to respond."
                    );
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: message,
                    });
                    this.rpc({
                        model: "pos.session",
                        method: "try_write_glory_transaction",
                        args: [
                            [this.env.pos.pos_session.id],
                            idCashier,
                            message,
                            operationError,
                            false,
                            paymentMethodId,
                            false,
                            false,
                            "",
                            line.glory_payment_uuid || line.uuid || false,
                        ],
                    });
                }
            }

            async _processChangeResponse(xmlDoc, line, idCashier, paymentMethodId) {
                let message = "";
                const operationError = "aborted_payment_request";
                const operationDone = "payment_request";
                const changeResponse =
                    xmlDoc.getElementsByTagName("n:ChangeResponse")[0];

                if (!changeResponse || !changeResponse.attributes["n:result"]) {
                    message = this.env._t(
                        "Transaction can not be processed at the moment or machine took too much time to respond."
                    );
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: message,
                    });
                    this.rpc({
                        model: "pos.session",
                        method: "try_write_glory_transaction",
                        args: [
                            [this.env.pos.pos_session.id],
                            idCashier,
                            message,
                            operationError,
                            false,
                            paymentMethodId,
                            false,
                            false,
                            "",
                            line.glory_payment_uuid || line.uuid || false,
                        ],
                    });
                    return;
                }

                const result = changeResponse.attributes["n:result"].value;

                switch (result) {
                    case "1":
                        message = this.env._t("Payment cancelled!");
                        this.showPopup("ErrorPopup", {
                            title: this.env._t("Error"),
                            body: message,
                        });
                        this.rpc({
                            model: "pos.session",
                            method: "try_write_glory_transaction",
                            args: [
                                [this.env.pos.pos_session.id],
                                idCashier,
                                message,
                                operationError,
                                line.amount,
                                paymentMethodId,
                                false,
                                false,
                                "",
                                line.glory_payment_uuid || line.uuid || false,
                            ],
                        });
                        break;

                    case "10":
                        line.shortage = true;
                        line.set_payment_status("waitingCancel");
                        message = this.env._t("Don't have enough change!");
                        this.showPopup("ErrorPopup", {
                            title: this.env._t("Error"),
                            body: message,
                        });
                        this.rpc({
                            model: "pos.session",
                            method: "try_write_glory_transaction",
                            args: [
                                [this.env.pos.pos_session.id],
                                idCashier,
                                message,
                                operationError,
                                line.amount,
                                paymentMethodId,
                                false,
                                false,
                                "",
                                line.glory_payment_uuid || line.uuid || false,
                            ],
                        });
                        break;

                    case "0": {
                        const moneyCash = await this.computeMoneyCash(xmlDoc);
                        line.set_amount(moneyCash);
                        line.set_payment_status("done");
                        message = this.env._t("Payment successfully performed");
                        this.rpc({
                            model: "pos.session",
                            method: "try_write_glory_transaction",
                            args: [
                                [this.env.pos.pos_session.id],
                                idCashier,
                                message,
                                operationDone,
                                moneyCash,
                                paymentMethodId,
                                this.state.moneyDetails,
                                this.state.moneyDetails,
                                "payment",
                                line.glory_payment_uuid || line.uuid || false,
                            ],
                        });
                        break;
                    }

                    default:
                        message = this.env._t(
                            "Transaction can not be processed at the moment or machine took too much time to respond."
                        );
                        this.showPopup("ErrorPopup", {
                            title: this.env._t("Error"),
                            body: message,
                        });
                        this.rpc({
                            model: "pos.session",
                            method: "try_write_glory_transaction",
                            args: [
                                [this.env.pos.pos_session.id],
                                idCashier,
                                message,
                                operationError,
                                false,
                                paymentMethodId,
                                false,
                                false,
                                "",
                                line.glory_payment_uuid || line.uuid || false,
                            ],
                        });
                        break;
                }
            }

            async _sendGloryPaymentRequest({detail: line}) {
                const status = await this._checkStatus();
                if (!status) return;

                const pos = this.env.pos;
                const config = pos.config;

                if (config.enable_glory && pos.pos_session.checkGloryAlertMoney) {
                    await this.showPopup("GloryAlertMoneyPopup");
                }

                const decPrecision = pos.currency.decimal_places;
                const lineAmount = Number((line.amount * 100).toFixed(decPrecision));

                if (lineAmount === 0) {
                    this.showPopup("ErrorPopup", {
                        title: this.env._t("Error"),
                        body: this.env._t("Null amounts are not allowed."),
                    });
                    return;
                }

                line.set_payment_status("waiting");

                let sr = "";
                if (lineAmount < 0) {
                    sr = await this.computeCashoutRequestXml(line.amount);
                } else {
                    sr =
                        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                        "<soapenv:Header/>" +
                        "<soapenv:Body>" +
                        "<bru:ChangeRequest>" +
                        "<bru:SeqNo>1</bru:SeqNo>" +
                        "<bru:Amount>" +
                        lineAmount +
                        "</bru:Amount>" +
                        '<Option bru:type="1"/>' +
                        "</bru:ChangeRequest>" +
                        "</soapenv:Body>" +
                        "</soapenv:Envelope>";
                }

                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", config.fcc_url, true);
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader(
                    "SOAPAction",
                    lineAmount < 0 ? "CashoutOperation" : "ChangeOperation"
                );

                const self = this;
                let message = "";

                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState !== 4) return;

                    const idCashier = pos.get_cashier().id;
                    const operationError = "aborted_payment_request";
                    const paymentMethodId = line.payment_method.id;

                    if (xmlhttp.status !== 200) {
                        message = self.env._t("Glory machine seems unreachable");
                        self.showPopup("ErrorPopup", {
                            title: self.env._t("Network Error"),
                            body: message,
                        });
                        self.rpc({
                            model: "pos.session",
                            method: "try_write_glory_transaction",
                            args: [
                                [pos.pos_session.id],
                                idCashier,
                                message,
                                operationError,
                                false,
                                paymentMethodId,
                                false,
                                false,
                                "",
                                line.glory_payment_uuid || line.uuid || false,
                            ],
                        });
                        return;
                    }

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(
                        xmlhttp.responseText,
                        "text/xml"
                    );

                    if (lineAmount < 0) {
                        await self._processCashoutResponse(
                            xmlDoc,
                            line,
                            idCashier,
                            paymentMethodId
                        );
                    } else {
                        await self._processChangeResponse(
                            xmlDoc,
                            line,
                            idCashier,
                            paymentMethodId
                        );
                    }
                };

                // Send the POST request
                xmlhttp.send(sr);
                return xmlhttp.responseText;
            }

            async _sendGloryPaymentCancel({detail: line}) {
                line.set_payment_status("waitingCancel");
                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open("POST", this.env.pos.config.fcc_url, true);
                var valueRequest = line.shortage ? "1" : "0";

                var sr =
                    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bru="http://www.glory.co.jp/bruebox.xsd">' +
                    "<soapenv:Header/>" +
                    "<soapenv:Body>" +
                    "<bru:ChangeCancelRequest>" +
                    "<bru:SeqNo>1</bru:SeqNo>" +
                    '<Option bru:type="' +
                    valueRequest +
                    '"/>' +
                    "</bru:ChangeCancelRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        const idCashier = self.env.pos.get_cashier().id;
                        const operation = "aborted_payment_request";
                        const paymentMethod = line.payment_method.id;
                        if (xmlhttp.status === 200) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(
                                xmlhttp.responseText,
                                "text/xml"
                            );
                            const changeCancelResponse = xmlDoc.getElementsByTagName(
                                "n:ChangeCancelResponse"
                            );
                            const result =
                                changeCancelResponse[0].attributes["n:result"].value;
                            if (result === "0" || result === "11") {
                                line.set_payment_status("retry");
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
                                        paymentMethod,
                                        false,
                                        false,
                                        "",
                                        line.glory_payment_uuid || line.uuid || false,
                                    ],
                                });
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
                                    paymentMethod,
                                    false,
                                    false,
                                    "",
                                    line.glory_payment_uuid || line.uuid || false,
                                ],
                            });
                        }
                    }
                };

                // Send the POST request
                xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                xmlhttp.setRequestHeader("SOAPAction", "ChangeCancelOperation");
                xmlhttp.send(sr);
                return xmlhttp.responseText;
            }
        };

    Registries.Component.extend(PaymentScreen, GloryPaymentScreen);
    return GloryPaymentScreen;
});
