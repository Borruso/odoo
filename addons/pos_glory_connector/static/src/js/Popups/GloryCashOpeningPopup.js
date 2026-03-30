odoo.define("pos_glory_connector.GloryCashOpeningPopup", function (require) {
    "use strict";

    const CashOpeningPopup = require("point_of_sale.CashOpeningPopup");
    const Registries = require("point_of_sale.Registries");

    const GloryCashOpeningPopup = (BaseCashOpeningPopup) =>
        class extends BaseCashOpeningPopup {
            async setup() {
                super.setup();
                this.state.displayCashInput = this.env.pos.config.enable_glory
                    ? this.env.pos.get_cashier().allow_see_inventory_total
                    : this.state.displayCashInput;
                this.state.moneyDetails = Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                );
                this.state.totalMoneyDetails = 0;
                if (this.env.pos.config.enable_glory) {
                    await this.inventoryRequest();
                    await new Promise((resolve) => setTimeout(resolve, 150));
                    let moneyDetailsNotes = this.state.totalMoneyDetails
                        ? "Money details: \n"
                        : null;
                    this.env.pos.bills.forEach((bill) => {
                        if (this.state.moneyDetails[bill.value]) {
                            moneyDetailsNotes += `  - ${
                                this.state.moneyDetails[bill.value]
                            } x ${this.env.pos.format_currency(bill.value)}\n`;
                        }
                    });
                    this.updateCashOpening({
                        total: this.state.totalMoneyDetails,
                        moneyDetailsNotes,
                    });
                }
            }

            updateCashOpening({total, moneyDetailsNotes}) {
                if (this.state.displayCashInput) {
                    this.openingCashInputRef.el.value =
                        this.env.pos.format_currency_no_symbol(total);
                }
                this.state.openingCash = total;
                if (moneyDetailsNotes) {
                    this.state.notes = moneyDetailsNotes;
                }
                this.manualInputCashCount = false;
                this.closeDetailsPopup();
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
                        if (xmlhttp.status === 200) {
                            await self.computeMoneyDetails(xmlhttp.responseText);
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

            computeMoneyDetails(details) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(details, "text/xml");
                const cashes = xmlDoc.getElementsByTagName("Cash");
                for (const cash of cashes) {
                    if (!cash.attributes) continue;

                    const cashType = cash.attributes[0].nodeValue;
                    if (!(cashType === "3")) continue;

                    for (let j = 0; j < cash.childNodes.length; j++) {
                        const den = cash.childNodes[j];
                        const moneyType =
                            parseInt(den.attributes[1].nodeValue, 10) / 100;
                        if (moneyType !== 0) {
                            const moneyCount = parseInt(
                                den.childNodes[0].innerHTML,
                                10
                            );
                            this.state.moneyDetails[moneyType] = moneyCount;
                        }
                    }

                    const total = Object.entries(this.state.moneyDetails).reduce(
                        (sum, money) => sum + money[0] * money[1],
                        0
                    );
                    this.state.totalMoneyDetails =
                        this.env.pos.round_decimals_currency(total);
                }
            }
        };

    Registries.Component.extend(CashOpeningPopup, GloryCashOpeningPopup);
    return GloryCashOpeningPopup;
});
