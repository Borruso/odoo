odoo.define("pos_glory_connector.GloryOperationAdministratorPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");
    const {_lt} = require("@web/core/l10n/translation");
    const {useState} = owl;

    class GloryOperationAdministratorPopup extends AbstractAwaitablePopup {
        async setup() {
            super.setup();
            this.state = useState({
                moneyDetails: Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                ),
                moneyStackerDetails: Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                ),
            });
        }

        async openGloryOperationUnlockBillRequest() {
            const valueUnlock = "1";
            var status = false;
            if (this.env.pos.config.glory_kind === "ci5") {
                status = true;
            } else {
                status = await this.sendUnLockUnitRequest(valueUnlock);
            }
            if (status) {
                this.env.services.ui.block();
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.executeInventoryRequest();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const idCashier = this.env.pos.get_cashier().id;
                this.showPopup("GloryOperationLockBillPopup");
                const message = _lt("Unlock bill unit successfully performed");
                const operation = "unlock_bill_unit_request";
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
                        this.state.moneyDetails,
                        this.state.moneyStackerDetails,
                        false,
                    ],
                });
                this.env.services.ui.unblock();
            }
        }

        async openGloryOperationUnlockCoinRequest() {
            const valueUnlock = "2";
            const status = await this.sendUnLockUnitRequest(valueUnlock);
            if (status) {
                this.env.services.ui.block();
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.executeInventoryRequest();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const idCashier = this.env.pos.get_cashier().id;
                this.showPopup("GloryOperationLockCoinPopup");
                const message = _lt("Unlock coin unit successfully performed");
                const operation = "unlock_coin_unit_request";
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
                        this.state.moneyDetails,
                        this.state.moneyStackerDetails,
                        false,
                    ],
                });
                this.env.services.ui.unblock();
            }
        }

        async openGloryOperationLockBillRequest() {
            const valueLock = "1";
            var statusRequest = false;
            if (this.env.pos.config.glory_kind === "ci5") {
                statusRequest = true;
            } else {
                statusRequest = await this.sendLockUnitRequest(valueLock);
            }
            if (statusRequest) {
                this.env.services.ui.block();
                await new Promise((resolve) => setTimeout(resolve, 5000));
                let statusMachine = false;
                while (!statusMachine) {
                    statusMachine = await this._checkStatus();
                    if (!statusMachine) {
                        await new Promise((resolve) => setTimeout(resolve, 500));
                    }
                }
                await this.executeInventoryRequest();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Lock bill unit successfully performed");
                const operation = "lock_bill_unit_request";
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
                        this.state.moneyDetails,
                        this.state.moneyStackerDetails,
                        "lock_bill",
                    ],
                });
                this.env.services.ui.unblock();
            }
        }

        async openGloryOperationLockCoinRequest() {
            const valueLock = "2";
            const statusRequest = await this.sendLockUnitRequest(valueLock);
            if (statusRequest) {
                this.env.services.ui.block();
                await new Promise((resolve) => setTimeout(resolve, 5000));
                let statusMachine = false;
                while (!statusMachine) {
                    statusMachine = await this._checkStatus();
                    if (!statusMachine) {
                        await new Promise((resolve) => setTimeout(resolve, 500));
                    }
                }
                await this.executeInventoryRequest();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Lock coin unit successfully performed");
                const operation = "lock_coin_unit_request";
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
                        this.state.moneyDetails,
                        this.state.moneyStackerDetails,
                        "lock_coin",
                    ],
                });
                this.env.services.ui.unblock();
            }
        }

        async openGloryOperationCollectSurplusRequest() {
            this.env.pos.valueCollectPartial = "1";
            this.env.pos.valueCollectSpecific = false;
            this.env.pos.valueCollectBills = true;
            this.env.pos.valueCollectCoins = true;
            if (this.env.pos.config.use_odoo_watermarker) {
                this.env.pos.valueCollectPartial = "odoo";
            }
            this.showPopup("GloryOperationCollectRequestPopup");
        }

        async openGloryOperationCollectAllRequest() {
            this.env.pos.valueCollectPartial = "0";
            this.env.pos.valueCollectSpecific = false;
            this.env.pos.valueCollectBills = true;
            this.env.pos.valueCollectCoins = true;
            this.showPopup("GloryOperationCollectRequestPopup");
        }

        async openGloryOperationCollectAllBillsRequest() {
            this.env.pos.valueCollectPartial = "0";
            this.env.pos.valueCollectSpecific = false;
            this.env.pos.valueCollectBills = true;
            this.env.pos.valueCollectCoins = false;
            this.showPopup("GloryOperationCollectRequestPopup");
        }

        async openGloryOperationCollectAllCoinsRequest() {
            this.env.pos.valueCollectPartial = "0";
            this.env.pos.valueCollectSpecific = false;
            this.env.pos.valueCollectBills = false;
            this.env.pos.valueCollectCoins = true;
            this.showPopup("GloryOperationCollectRequestPopup");
        }

        async openGloryOperationCollectSpecificRequest() {
            this.env.pos.valueCollectPartial = "0";
            this.env.pos.valueCollectSpecific = true;
            this.env.pos.valueCollectBills = true;
            this.env.pos.valueCollectCoins = true;
            this.showPopup("GloryOperationCollectRequestPopup");
        }

        sendUnLockUnitRequest(valueUnlock) {
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
                "<bru:UnLockUnitRequest>" +
                "<bru:SeqNo>1</bru:SeqNo>" +
                '<Option bru:type="' +
                valueUnlock +
                '"/>' +
                "</bru:UnLockUnitRequest>" +
                "</soapenv:Body>" +
                "</soapenv:Envelope>";

            const self = this;
            xmlhttp.onreadystatechange = async function () {
                if (xmlhttp.readyState === 4) {
                    const idCashier = self.env.pos.get_cashier().id;
                    const operation =
                        valueUnlock === "1"
                            ? "unlock_bill_unit_request"
                            : "unlock_coin_unit_request";
                    if (xmlhttp.status === 200) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(
                            xmlhttp.responseText,
                            "text/xml"
                        );
                        const unLockUnitResponse =
                            xmlDoc.getElementsByTagName("n:UnLockUnitResponse");
                        const result =
                            unLockUnitResponse[0].attributes["n:result"].value;
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
                        }
                    } else {
                        const message = self.env._t("Glory machine seems unreachable");
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
            xmlhttp.setRequestHeader("SOAPAction", "UnLockUnitOperation");
            xmlhttp.timeout = 1000;
            xmlhttp.send(sr);
            return promise;
        }

        sendLockUnitRequest(valueLock) {
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
                "<bru:LockUnitRequest>" +
                "<bru:SeqNo>1</bru:SeqNo>" +
                '<Option bru:type="' +
                valueLock +
                '"/>' +
                "</bru:LockUnitRequest>" +
                "</soapenv:Body>" +
                "</soapenv:Envelope>";

            const self = this;
            xmlhttp.onreadystatechange = async function () {
                if (xmlhttp.readyState === 4) {
                    const idCashier = self.env.pos.get_cashier().id;
                    const operation =
                        valueLock === "1"
                            ? "lock_bill_unit_request"
                            : "lock_coin_unit_request";
                    if (xmlhttp.status === 200) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(
                            xmlhttp.responseText,
                            "text/xml"
                        );
                        const lockUnitResponse =
                            xmlDoc.getElementsByTagName("n:LockUnitResponse");
                        const result = lockUnitResponse[0].attributes["n:result"].value;
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
                        }
                    } else {
                        const message = self.env._t("Glory machine seems unreachable");
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
            xmlhttp.setRequestHeader("SOAPAction", "LockUnitOperation");
            xmlhttp.timeout = 1000;
            xmlhttp.send(sr);
            return promise;
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
                    const moneyType = parseInt(den.attributes[1].nodeValue, 10) / 100;
                    if (moneyType !== 0) {
                        if (cashType === "3") {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            this.state.moneyDetails[moneyType] = moneyCount;
                        }
                        if (cashType === "4") {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            this.state.moneyStackerDetails[moneyType] = moneyCount;
                        }
                    }
                }

                if (cashType === "4") break;
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

            xmlhttp.onreadystatechange = async function () {
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status === 200) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(
                            xmlhttp.responseText,
                            "text/xml"
                        );
                        const statusResponse =
                            xmlDoc.getElementsByTagName("n:StatusResponse");
                        const status_code = statusResponse[0]
                            .getElementsByTagName("Status")[0]
                            .getElementsByTagName("n:Code")[0]
                            .getHTML();
                        if (status_code === "1") {
                            status(true);
                        } else {
                            status(false);
                        }
                    } else {
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
                    } else {
                        const message = self.env._t("Glory machine seems unreachable");
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

    GloryOperationAdministratorPopup.template = "GloryOperationAdministratorPopup";
    Registries.Component.add(GloryOperationAdministratorPopup);
    return GloryOperationAdministratorPopup;
});
