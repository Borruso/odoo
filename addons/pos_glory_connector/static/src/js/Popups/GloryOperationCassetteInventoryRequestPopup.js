odoo.define(
    "pos_glory_connector.GloryOperationCassetteInventoryRequestPopup",
    function (require) {
        "use strict";

        const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
        const Registries = require("point_of_sale.Registries");
        const {_lt} = require("@web/core/l10n/translation");
        const {useState} = owl;

        class GloryOperationCassetteInventoryRequestPopup extends AbstractAwaitablePopup {
            setup() {
                super.setup();
                this.currency = this.env.pos.currency;
                this.state = useState({
                    moneyCassetteDetails: Object.fromEntries(
                        this.env.pos.bills.map((bill) => [bill.value, 0])
                    ),
                    total: 0,
                    totalCassetteCoins: 0,
                    totalCassetteBills: 0,
                });
                if (this.env.pos.config.enable_glory) {
                    this.executeInventoryRequest();
                }
            }

            get firstHalfMoneyDetails() {
                const moneyCassetteDetailsKeys = Object.keys(
                    this.state.moneyCassetteDetails
                ).sort((a, b) => a - b);
                return moneyCassetteDetailsKeys.slice(
                    0,
                    moneyCassetteDetailsKeys.length / 2 + 1
                );
            }

            get lastHalfMoneyDetails() {
                const moneyCassetteDetailsKeys = Object.keys(
                    this.state.moneyCassetteDetails
                ).sort((a, b) => a - b);
                return moneyCassetteDetailsKeys.slice(
                    moneyCassetteDetailsKeys.length / 2 + 1,
                    moneyCassetteDetailsKeys.length
                );
            }

            reset() {
                for (const key in this.state.moneyCassetteDetails) {
                    this.state.moneyCassetteDetails[key] = 0;
                }
                this.state.total = 0;
                this.state.totalCassetteCoins = 0;
                this.state.totalCassetteBills = 0;
            }

            updateMoneyDetailsAmount() {
                this.state.total = this.env.pos.round_decimals_currency(
                    Object.entries(this.state.moneyCassetteDetails).reduce(
                        (total, money) => total + money[0] * money[1],
                        0
                    )
                );

                this.state.totalCassetteCoins = 0;
                this.state.totalCassetteBills = 0;
                for (const moneyType in this.state.moneyCassetteDetails) {
                    const moneyCount = this.state.moneyCassetteDetails[moneyType];
                    if (moneyType < 5) {
                        this.state.totalCassetteCoins += moneyCount * moneyType;
                    } else {
                        this.state.totalCassetteBills += moneyCount * moneyType;
                    }
                }
            }

            computeDenominationAmount(cash, j, k) {
                const den = cash.childNodes[j].childNodes[k];
                const moneyType = parseInt(den.attributes[1].nodeValue, 10) / 100;
                const moneyCount = parseInt(den.childNodes[0].innerHTML, 10);
                if (moneyType && moneyCount) {
                    this.state.moneyCassetteDetails[moneyType] += moneyCount;
                }
            }

            async computeMoneyDetails(details) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(details, "text/xml");
                const cashes = xmlDoc.getElementsByTagName("CashUnits");
                for (const cash of cashes) {
                    for (let j = 0; j < cash.childNodes.length; j++) {
                        const numDens =
                            cash.childNodes[j].getElementsByTagName("Denomination");
                        for (let k = 0; k < numDens.length; k++) {
                            const cashType = cash.childNodes[j].attributes[0].nodeValue;
                            if (
                                [
                                    "4056",
                                    "4057",
                                    "4058",
                                    "4059",
                                    "4060",
                                    "4084",
                                    "4165",
                                ].includes(cashType)
                            ) {
                                this.computeDenominationAmount(cash, j, k);
                            }
                        }
                    }
                    this.updateMoneyDetailsAmount();
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
                    '<Option bru:type="3"/>' +
                    "</bru:InventoryRequest>" +
                    "</soapenv:Body>" +
                    "</soapenv:Envelope>";

                const self = this;
                xmlhttp.onreadystatechange = async function () {
                    if (xmlhttp.readyState === 4) {
                        if (xmlhttp.status === 200) {
                            await self.computeMoneyDetails(xmlhttp.responseText);
                        } else {
                            self.showPopup("ErrorPopup", {
                                title: self.env._t("Network Error"),
                                body: self.env._t("Glory machine seems unreachable"),
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

        GloryOperationCassetteInventoryRequestPopup.template =
            "GloryOperationCassetteInventoryRequestPopup";
        GloryOperationCassetteInventoryRequestPopup.defaultProps = {
            cancelText: _lt("Cancel"),
        };
        Registries.Component.add(GloryOperationCassetteInventoryRequestPopup);
        return GloryOperationCassetteInventoryRequestPopup;
    }
);
