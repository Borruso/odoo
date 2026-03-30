odoo.define("pos_glory_connector.GloryCashoutPopup", function (require) {
    "use strict";

    const AbstractAwaitablePopup = require("point_of_sale.AbstractAwaitablePopup");
    const Registries = require("point_of_sale.Registries");
    const {_lt} = require("@web/core/l10n/translation");
    const {useState} = owl;

    class GloryCashoutPopup extends AbstractAwaitablePopup {
        setup() {
            super.setup();
            this.currency = this.env.pos.currency;
            this.state = useState({
                moneyDetails: Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                ),
                moneyInventoryDetails: Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, 0])
                ),
                moneyInventoryStatus: Object.fromEntries(
                    this.env.pos.bills.map((bill) => [bill.value, ""])
                ),
                total: 0,
            });
            if (this.env.pos.config.enable_glory) {
                this.executeInventoryRequest();
            }
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
            for (const key in this.state.moneyInventoryDetails) {
                this.state.moneyInventoryDetails[key] = 0;
            }
            for (const key in this.state.moneyInventoryStatus) {
                this.state.moneyInventoryStatus[key] = "";
            }
            this.state.total = 0;
        }

        updateMoneyDetailsAmount() {
            this.state.total = this.env.pos.round_decimals_currency(
                Object.entries(this.state.moneyDetails).reduce(
                    (total, money) => total + money[0] * money[1],
                    0
                )
            );
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
                                    return context[0].label.replaceAll(",", " (") + ")";
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
                    const moneyType = parseInt(den.attributes[1].nodeValue, 10) / 100;
                    if (moneyType !== 0) {
                        const moneyCount = parseInt(den.childNodes[0].innerHTML, 10);
                        const moneyStatus = parseInt(den.childNodes[1].innerHTML, 10);
                        this.state.moneyDetails[moneyType] = 0;
                        this.state.moneyInventoryDetails[moneyType] = moneyCount;

                        const convertKey = this.convertMoneyKeyUnderstock(
                            moneyType.toString()
                        );
                        const configValue = this.env.pos.config[convertKey] || 0;
                        if (moneyStatus === 4 || moneyStatus === 3) {
                            this.state.moneyInventoryStatus[moneyType] = moneyStatus;
                        } else if (moneyCount === 0 && configValue !== 0) {
                            this.state.moneyInventoryStatus[moneyType] = 0;
                        } else if (
                            configValue > this.state.moneyInventoryDetails[moneyType]
                        ) {
                            this.state.moneyInventoryStatus[moneyType] = 1;
                        } else {
                            this.state.moneyInventoryStatus[moneyType] = 2;
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
                '<Option bru:type="2"/>' +
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
                        await self.renderChartMoneyDetails();
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

        confirm() {
            var convertTotal = this.env.pos.round_decimals_currency(this.state.total);
            if (
                this.env.pos.exchangeAmount &&
                convertTotal !== this.env.pos.exchangeAmount
            ) {
                const message = this.env._t("Error amount for exchange not valid.");
                this.showPopup("ErrorPopup", {
                    title: this.env._t("Error"),
                    body: message,
                });
            } else {
                super.confirm();
            }
        }

        getPayload() {
            return {
                moneyDetails: this.state.moneyDetails,
                total: this.env.pos.round_decimals_currency(this.state.total),
            };
        }
    }

    GloryCashoutPopup.template = "GloryCashoutPopup";
    GloryCashoutPopup.defaultProps = {
        confirmText: _lt("Confirm"),
        cancelText: _lt("Cancel"),
    };
    Registries.Component.add(GloryCashoutPopup);
    return GloryCashoutPopup;
});
