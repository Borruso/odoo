odoo.define("pos_glory_connector.GloryOperationPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");
    const {_lt} = require("@web/core/l10n/translation");

    class GloryOperationPopup extends AbstractAwaitablePopup {
        async openGloryOperationInventoryRequestPopup() {
            this.showPopup("GloryOperationInventoryRequestPopup");
        }

        async openGloryOperationCassetteInventoryRequestPopup() {
            this.showPopup("GloryOperationCassetteInventoryRequestPopup");
        }

        async openGloryOperationAdministrator() {
            this.showPopup("GloryOperationAdministratorPopup");
        }

        async openGloryOperationExchange() {
            this.showPopup("GloryOperationExchangePopup");
        }

        async openGloryOperationStatusRequest() {
            const status = await this.checkStatusRequest();
            if (status) {
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Connection to Glory Machine is ready");
                const operation = "status_request";
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
                        false,
                        "",
                    ],
                });
            }
        }

        async openGloryOperationResetRequest() {
            this.env.services.ui.block();
            const status = await this.sendResetRequest();
            this.env.services.ui.unblock();
            if (status) {
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Reset successfully performed");
                const operation = "reset_request";
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
                        false,
                        "",
                    ],
                });
            }
        }

        async openGloryOperationShutdownRequest() {
            const valueControl = "0";
            const status = await this.sendPowerControlRequest(valueControl);
            if (status) {
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Shutdown successfully performed");
                const operation = "shutdown_request";
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
                        false,
                        "",
                    ],
                });
            }
        }

        async openGloryOperationRebootRequest() {
            const valueControl = "1";
            const status = await this.sendPowerControlRequest(valueControl);
            if (status) {
                const idCashier = this.env.pos.get_cashier().id;
                const message = _lt("Reboot successfully performed");
                const operation = "reboot_request";
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
                        false,
                        "",
                    ],
                });
            }
        }

        checkStatusRequest() {
            const dictMachineStatusCode = {
                0: this.env._t("Initializing"),
                1: this.env._t("Idle"),
                2: this.env._t("At Starting change"),
                3: this.env._t("Waiting insertion of cash"),
                4: this.env._t("Counting"),
                5: this.env._t("Dispensing"),
                6: this.env._t("Waiting removal of cash in reject"),
                7: this.env._t("Waiting removal of cash out"),
                8: this.env._t("Resetting"),
                9: this.env._t("Canceling of Change operation"),
                10: this.env._t("Calculating Change amount"),
                11: this.env._t("Canceling Deposit"),
                12: this.env._t("Collecting"),
                13: this.env._t("Error"),
                14: this.env._t("Upload firmware"),
                15: this.env._t("Reading log"),
                16: this.env._t("Waiting Replenishment"),
                17: this.env._t("Counting Replenishment"),
                18: this.env._t("Unlocking"),
                19: this.env._t("Waiting inventory"),
                20: this.env._t("Fixed deposit amount"),
                21: this.env._t("Fixed dispense amount"),
                23: this.env._t("Waiting change cancel"),
                24: this.env._t("Counted category2 note"),
                25: this.env._t("Waiting deposit end"),
                26: this.env._t("Waiting removal of COFT"),
                27: this.env._t("Sealing"),
                30: this.env._t("Waiting for Error recovery"),
            };
            const dictRbwRcwStatusCode = {
                0: this.env._t("STATE_INITIALIZE"),
                1000: this.env._t("STATE_IDLE"),
                1500: this.env._t("STATE_IDLE_OCCUPY"),
                2000: this.env._t("STATE_DEPOSIT_BUSY"),
                2050: this.env._t("STATE_DEPOSIT_COUNTING"),
                2055: this.env._t("STATE_DEPOSIT_END"),
                2100: this.env._t("STATE_WAIT_STORE"),
                2200: this.env._t("STATE_STORE_BUSY"),
                2300: this.env._t("STATE_STORE_END"),
                2500: this.env._t("STATE_WAIT_RETURN"),
                2600: this.env._t("STATE_COUNT_BUSY"),
                2610: this.env._t("STATE_COUNT_COUNTING"),
                2700: this.env._t("STATE_REPLENISH_BUSY"),
                3000: this.env._t("STATE_DISPENSE_BUSY"),
                3100: this.env._t("STATE_WAIT_DISPENSE"),
                4000: this.env._t("STATE_REFILL"),
                4050: this.env._t("STATE_REFILL_COUNTING"),
                4055: this.env._t("STATE_REFILL_END"),
                5000: this.env._t("STATE_RESET"),
                6000: this.env._t("STATE_COLLECT_BUSY"),
                6500: this.env._t("STATE_VERIFY_BUSY"),
                6600: this.env._t("STATE_VERIFYCOLLECT_BUSY"),
                7000: this.env._t("STATE_INVENTORY_CLEAR"),
                7100: this.env._t("STATE_INVENTORY_ADJUST"),
                8000: this.env._t("STATE_DOWNLOAD_BUSY"),
                8100: this.env._t("STATE_LOG_READ_BUSY"),
                9100: this.env._t("STATE_BUSY"),
                9200: this.env._t("STATE_ERROR"),
                9300: this.env._t("STATE_COM_ERROR"),
                9400: this.env._t("STATE_WAIT_FOR_RESET"),
                9500: this.env._t("STATE_CONFIG_ERROR"),
                50000: this.env._t("STATE_LOCKED_BY_OTHER_SESSION"),
            };
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
                '<RequireVerification bru:type="1"/>' +
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
                                    "Machine status : " +
                                    dictMachineStatusCode[status_code] +
                                    "\n" +
                                    "RBW status : " +
                                    dictRbwRcwStatusCode[rbw_status_code] +
                                    "\n" +
                                    "RCW status : " +
                                    dictRbwRcwStatusCode[rcw_status_code] +
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
                            const message = _lt(
                                "Transaction can not be processed at the moment or machine took too much time to respond."
                            );
                            self.showPopup("ErrorPopup", {
                                title: _lt("Error"),
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
                        const message = _lt("Glory machine seems unreachable");
                        self.showPopup("ErrorPopup", {
                            title: _lt("Network Error"),
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

        sendResetRequest() {
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
                "<bru:ResetRequest>" +
                "<bru:SeqNo>1</bru:SeqNo>" +
                "</bru:ResetRequest>" +
                "</soapenv:Body>" +
                "</soapenv:Envelope>";

            const self = this;
            xmlhttp.onreadystatechange = async function () {
                if (xmlhttp.readyState === 4) {
                    const idCashier = self.env.pos.get_cashier().id;
                    const operation = "reset_request";
                    if (xmlhttp.status === 200) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(
                            xmlhttp.responseText,
                            "text/xml"
                        );
                        const resetResponse =
                            xmlDoc.getElementsByTagName("n:ResetResponse");
                        const errorCodes = ["13", "30"];
                        const status_code = resetResponse[0]
                            .getElementsByTagName("Status")[0]
                            .getElementsByTagName("n:Code")[0]
                            .getHTML();
                        if (errorCodes.includes(status_code)) {
                            const rbw_status_code = resetResponse[0]
                                .getElementsByTagName("Status")[0]
                                .getElementsByTagName("DevStatus")[0].attributes[
                                "n:st"
                            ].value;
                            const rcw_status_code = resetResponse[0]
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
                            self.env.services.ui.unblock();
                        }
                        if (status_code === "1") {
                            status(true);
                        } else {
                            const message = _lt(
                                "Transaction can not be processed at the moment or machine took too much time to respond."
                            );
                            self.showPopup("ErrorPopup", {
                                title: _lt("Error"),
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
                        const message = _lt("Glory machine seems unreachable");
                        self.showPopup("ErrorPopup", {
                            title: _lt("Network Error"),
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
            xmlhttp.setRequestHeader("SOAPAction", "ResetOperation");
            xmlhttp.send(sr);
            return promise;
        }

        sendPowerControlRequest(valueControl) {
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
                "<bru:PowerControlRequest>" +
                "<bru:SeqNo>1</bru:SeqNo>" +
                '<Option bru:type="' +
                valueControl +
                '"/>' +
                "</bru:PowerControlRequest>" +
                "</soapenv:Body>" +
                "</soapenv:Envelope>";

            const self = this;
            xmlhttp.onreadystatechange = async function () {
                if (xmlhttp.readyState === 4) {
                    const idCashier = self.env.pos.get_cashier().id;
                    const operation =
                        valueControl === "0" ? "shutdown_request" : "reboot_request";
                    if (xmlhttp.status === 200) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(
                            xmlhttp.responseText,
                            "text/xml"
                        );
                        const powerControlResponse = xmlDoc.getElementsByTagName(
                            "n:PowerControlResponse"
                        );
                        const result =
                            powerControlResponse[0].attributes["n:result"].value;
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
            xmlhttp.setRequestHeader("SOAPAction", "PowerControlOperation");
            xmlhttp.timeout = 1000;
            xmlhttp.send(sr);
            return promise;
        }
    }

    GloryOperationPopup.template = "GloryOperationPopup";
    Registries.Component.add(GloryOperationPopup);
    return GloryOperationPopup;
});
