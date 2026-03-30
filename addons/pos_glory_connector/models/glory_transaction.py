# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import _, api, fields, models
from odoo.tools.misc import format_datetime


class GloryTransaction(models.Model):
    _name = "glory.transaction"
    _description = "Glory Transaction"
    _order = "datetime desc"
    _sql_constraints = [
        (
            "glory_transaction_pos_payment_uuid_uniq",
            "unique(pos_payment_uuid)",
            "POS payment UUID must be unique.",
        ),
    ]

    name = fields.Char(compute="_compute_name")
    session_id = fields.Many2one("pos.session", string="Session", index=True)
    config_id = fields.Many2one(
        "pos.config", related="session_id.config_id", store=True
    )
    company_id = fields.Many2one(
        "res.company", related="session_id.company_id", store=True
    )
    datetime = fields.Datetime(default=fields.Datetime.now, copy=False)
    payment_method_id = fields.Many2one(
        "pos.payment.method", string="Payment Method", copy=False
    )
    order_id = fields.Many2one(
        "pos.order",
        string="Order",
        copy=False,
    )
    employee_id = fields.Many2one("hr.employee", string="Employee", copy=False)
    machine_state = fields.Char(copy=False)
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("pending", "Pending"),
            ("done", "Done"),
            ("error", "Error"),
        ],
        default="draft",
        copy=False,
        index=True,
    )
    pos_payment_uuid = fields.Char(copy=False, index=True)
    attempt_count = fields.Integer(default=0, copy=False)
    last_error = fields.Text(copy=False)
    processed_at = fields.Datetime(copy=False)
    operation = fields.Selection(
        [
            ("cashin_cancel_request", "Cashin Cancel Request"),
            ("start_cashin_request", "Start Cashin Request"),
            ("end_cashin_request", "End Cashin Request"),
            ("cashout_request", "Cashout Request"),
            ("exchange_request", "Exchange Request"),
            ("collect_all_request", "Collect All Request"),
            ("collect_all_bills_request", "Collect All Bills Request"),
            ("collect_all_coins_request", "Collect All Coins Request"),
            ("collect_surplus_request", "Collect Surplus Request"),
            ("collect_specific_request", "Collect Specific Request"),
            ("inventory_request", "Inventory Request"),
            ("lock_bill_unit_request", "Lock Bill Unit Request"),
            ("unlock_bill_unit_request", "Unlock Bill Unit Request"),
            ("lock_coin_unit_request", "Lock Coin Unit Request"),
            ("unlock_coin_unit_request", "Unlock Coin Unit Request"),
            ("payment_request", "Payment Request"),
            ("aborted_payment_request", "Aborted Payment Request"),
            ("refund_payment_request", "Refund Payment Request"),
            ("reboot_request", "Reboot Request"),
            ("reset_request", "Reset Request"),
            ("shutdown_request", "Shutdown Request"),
            ("status_request", "Status Request"),
        ],
    )
    amount = fields.Float(digits="Product Price", copy=False)
    rest_amount = fields.Float(
        digits="Product Price",
        compute="_compute_rest_amount",
        store=True,
    )
    payment_amount = fields.Float(
        digits="Product Price",
        compute="_compute_payment_amount",
        store=True,
    )
    previous_glory_transaction_id = fields.Many2one(
        "glory.transaction", string="Previous Glory Transaction", copy=False
    )
    coin_0_01 = fields.Integer(string="Coin 0.01")
    coin_0_02 = fields.Integer(string="Coin 0.02")
    coin_0_05 = fields.Integer(string="Coin 0.05")
    coin_0_10 = fields.Integer(string="Coin 0.10")
    coin_0_20 = fields.Integer(string="Coin 0.20")
    coin_0_25 = fields.Integer(string="Coin 0.25")
    coin_0_50 = fields.Integer(string="Coin 0.50")
    coin_1_00 = fields.Integer(string="Coin 1.00")
    coin_2_00 = fields.Integer(string="Coin 2.00")
    bill_5_00 = fields.Integer(string="Bill 5.00")
    bill_10_00 = fields.Integer(string="Bill 10.00")
    bill_20_00 = fields.Integer(string="Bill 20.00")
    bill_50_00 = fields.Integer(string="Bill 50.00")
    bill_100_00 = fields.Integer(string="Bill 100.00")
    bill_200_00 = fields.Integer(string="Bill 200.00")
    bill_500_00 = fields.Integer(string="Bill 500.00")
    diff_coin_0_01 = fields.Integer(
        string="Diff. Coin 0.01",
        compute="_compute_diff_coin_0_01",
        store=True,
    )
    diff_coin_0_02 = fields.Integer(
        string="Diff. Coin 0.02",
        compute="_compute_diff_coin_0_02",
        store=True,
    )
    diff_coin_0_05 = fields.Integer(
        string="Diff. Coin 0.05",
        compute="_compute_diff_coin_0_05",
        store=True,
    )
    diff_coin_0_10 = fields.Integer(
        string="Diff. Coin 0.10",
        compute="_compute_diff_coin_0_10",
        store=True,
    )
    diff_coin_0_20 = fields.Integer(
        string="Diff. Coin 0.20",
        compute="_compute_diff_coin_0_20",
        store=True,
    )
    diff_coin_0_25 = fields.Integer(
        string="Diff. Coin 0.25",
        compute="_compute_diff_coin_0_25",
        store=True,
    )
    diff_coin_0_50 = fields.Integer(
        string="Diff. Coin 0.50",
        compute="_compute_diff_coin_0_50",
        store=True,
    )
    diff_coin_1_00 = fields.Integer(
        string="Diff. Coin 1.00",
        compute="_compute_diff_coin_1_00",
        store=True,
    )
    diff_coin_2_00 = fields.Integer(
        string="Diff. Coin 2.00",
        compute="_compute_diff_coin_2_00",
        store=True,
    )
    diff_bill_5_00 = fields.Integer(
        string="Diff. Bill 5.00",
        compute="_compute_diff_bill_5_00",
        store=True,
    )
    diff_bill_10_00 = fields.Integer(
        string="Diff. Bill 10.00",
        compute="_compute_diff_bill_10_00",
        store=True,
    )
    diff_bill_20_00 = fields.Integer(
        string="Diff. Bill 20.00",
        compute="_compute_diff_bill_20_00",
        store=True,
    )
    diff_bill_50_00 = fields.Integer(
        string="Diff. Bill 50.00",
        compute="_compute_diff_bill_50_00",
        store=True,
    )
    diff_bill_100_00 = fields.Integer(
        string="Diff. Bill 100.00",
        compute="_compute_diff_bill_100_00",
        store=True,
    )
    diff_bill_200_00 = fields.Integer(
        string="Diff. Bill 200.00",
        compute="_compute_diff_bill_200_00",
        store=True,
    )
    diff_bill_500_00 = fields.Integer(
        string="Diff. Bill 500.00",
        compute="_compute_diff_bill_500_00",
        store=True,
    )
    total_coins = fields.Float(compute="_compute_total_coins", store=True)
    total_bills = fields.Float(compute="_compute_total_bills", store=True)
    stacker_coin_0_01 = fields.Integer(string="Stacker Coin 0.01")
    stacker_coin_0_02 = fields.Integer(string="Stacker Coin 0.02")
    stacker_coin_0_05 = fields.Integer(string="Stacker Coin 0.05")
    stacker_coin_0_10 = fields.Integer(string="Stacker Coin 0.10")
    stacker_coin_0_20 = fields.Integer(string="Stacker Coin 0.20")
    stacker_coin_0_25 = fields.Integer(string="Stacker Coin 0.25")
    stacker_coin_0_50 = fields.Integer(string="Stacker Coin 0.50")
    stacker_coin_1_00 = fields.Integer(string="Stacker Coin 1.00")
    stacker_coin_2_00 = fields.Integer(string="Stacker Coin 2.00")
    stacker_bill_5_00 = fields.Integer(string="Stacker Bill 5.00")
    stacker_bill_10_00 = fields.Integer(string="Stacker Bill 10.00")
    stacker_bill_20_00 = fields.Integer(string="Stacker Bill 20.00")
    stacker_bill_50_00 = fields.Integer(string="Stacker Bill 50.00")
    stacker_bill_100_00 = fields.Integer(string="Stacker Bill 100.00")
    stacker_bill_200_00 = fields.Integer(string="Stacker Bill 200.00")
    stacker_bill_500_00 = fields.Integer(string="Stacker Bill 500.00")
    diff_stacker_coin_0_01 = fields.Integer(
        string="Diff. Stacker Coin 0.01",
        compute="_compute_diff_stacker_coin_0_01",
        store=True,
    )
    diff_stacker_coin_0_02 = fields.Integer(
        string="Diff. Stacker Coin 0.02",
        compute="_compute_diff_stacker_coin_0_02",
        store=True,
    )
    diff_stacker_coin_0_05 = fields.Integer(
        string="Diff. Stacker Coin 0.05",
        compute="_compute_diff_stacker_coin_0_05",
        store=True,
    )
    diff_stacker_coin_0_10 = fields.Integer(
        string="Diff. Stacker Coin 0.10",
        compute="_compute_diff_stacker_coin_0_10",
        store=True,
    )
    diff_stacker_coin_0_20 = fields.Integer(
        string="Diff. Stacker Coin 0.20",
        compute="_compute_diff_stacker_coin_0_20",
        store=True,
    )
    diff_stacker_coin_0_25 = fields.Integer(
        string="Diff. Stacker Coin 0.25",
        compute="_compute_diff_stacker_coin_0_25",
        store=True,
    )
    diff_stacker_coin_0_50 = fields.Integer(
        string="Diff. Stacker Coin 0.50",
        compute="_compute_diff_stacker_coin_0_50",
        store=True,
    )
    diff_stacker_coin_1_00 = fields.Integer(
        string="Diff. Stacker Coin 1.00",
        compute="_compute_diff_stacker_coin_1_00",
        store=True,
    )
    diff_stacker_coin_2_00 = fields.Integer(
        string="Diff. Stacker Coin 2.00",
        compute="_compute_diff_stacker_coin_2_00",
        store=True,
    )
    diff_stacker_bill_5_00 = fields.Integer(
        string="Diff. Stacker Bill 5.00",
        compute="_compute_diff_stacker_bill_5_00",
        store=True,
    )
    diff_stacker_bill_10_00 = fields.Integer(
        string="Diff. Stacker Bill 10.00",
        compute="_compute_diff_stacker_bill_10_00",
        store=True,
    )
    diff_stacker_bill_20_00 = fields.Integer(
        string="Diff. Stacker Bill 20.00",
        compute="_compute_diff_stacker_bill_20_00",
        store=True,
    )
    diff_stacker_bill_50_00 = fields.Integer(
        string="Diff. Stacker Bill 50.00",
        compute="_compute_diff_stacker_bill_50_00",
        store=True,
    )
    diff_stacker_bill_100_00 = fields.Integer(
        string="Diff. Stacker Bill 100.00",
        compute="_compute_diff_stacker_bill_100_00",
        store=True,
    )
    diff_stacker_bill_200_00 = fields.Integer(
        string="Diff. Stacker Bill 200.00",
        compute="_compute_diff_stacker_bill_200_00",
        store=True,
    )
    diff_stacker_bill_500_00 = fields.Integer(
        string="Diff. Stacker Bill 500.00",
        compute="_compute_diff_stacker_bill_500_00",
        store=True,
    )
    total_stacker_coins = fields.Float(
        compute="_compute_total_stacker_coins", store=True
    )
    total_stacker_bills = fields.Float(
        compute="_compute_total_stacker_bills", store=True
    )
    cassette_coin_0_01 = fields.Integer(
        string="Cassette Coin 0.01",
        compute="_compute_cassette_coin_0_01",
        store=True,
    )
    cassette_coin_0_02 = fields.Integer(
        string="Cassette Coin 0.02",
        compute="_compute_cassette_coin_0_02",
        store=True,
    )
    cassette_coin_0_05 = fields.Integer(
        string="Cassette Coin 0.05",
        compute="_compute_cassette_coin_0_05",
        store=True,
    )
    cassette_coin_0_10 = fields.Integer(
        string="Cassette Coin 0.10",
        compute="_compute_cassette_coin_0_10",
        store=True,
    )
    cassette_coin_0_20 = fields.Integer(
        string="Cassette Coin 0.20",
        compute="_compute_cassette_coin_0_20",
        store=True,
    )
    cassette_coin_0_25 = fields.Integer(
        string="Cassette Coin 0.25",
        compute="_compute_cassette_coin_0_25",
        store=True,
    )
    cassette_coin_0_50 = fields.Integer(
        string="Cassette Coin 0.50",
        compute="_compute_cassette_coin_0_50",
        store=True,
    )
    cassette_coin_1_00 = fields.Integer(
        string="Cassette Coin 1.00",
        compute="_compute_cassette_coin_1_00",
        store=True,
    )
    cassette_coin_2_00 = fields.Integer(
        string="Cassette Coin 2.00",
        compute="_compute_cassette_coin_2_00",
        store=True,
    )
    cassette_bill_5_00 = fields.Integer(
        string="Cassette Bill 5.00",
        compute="_compute_cassette_bill_5_00",
        store=True,
    )
    cassette_bill_10_00 = fields.Integer(
        string="Cassette Bill 10.00",
        compute="_compute_cassette_bill_10_00",
        store=True,
    )
    cassette_bill_20_00 = fields.Integer(
        string="Cassette Bill 20.00",
        compute="_compute_cassette_bill_20_00",
        store=True,
    )
    cassette_bill_50_00 = fields.Integer(
        string="Cassette Bill 50.00",
        compute="_compute_cassette_bill_50_00",
        store=True,
    )
    cassette_bill_100_00 = fields.Integer(
        string="Cassette Bill 100.00",
        compute="_compute_cassette_bill_100_00",
        store=True,
    )
    cassette_bill_200_00 = fields.Integer(
        string="Cassette Bill 200.00",
        compute="_compute_cassette_bill_200_00",
        store=True,
    )
    cassette_bill_500_00 = fields.Integer(
        string="Cassette Bill 500.00",
        compute="_compute_cassette_bill_500_00",
        store=True,
    )
    diff_cassette_coin_0_01 = fields.Integer(
        string="Diff. Cassette Coin 0.01",
        compute="_compute_diff_cassette_coin_0_01",
        store=True,
    )
    diff_cassette_coin_0_02 = fields.Integer(
        string="Diff. Cassette Coin 0.02",
        compute="_compute_diff_cassette_coin_0_02",
        store=True,
    )
    diff_cassette_coin_0_05 = fields.Integer(
        string="Diff. Cassette Coin 0.05",
        compute="_compute_diff_cassette_coin_0_05",
        store=True,
    )
    diff_cassette_coin_0_10 = fields.Integer(
        string="Diff. Cassette Coin 0.10",
        compute="_compute_diff_cassette_coin_0_10",
        store=True,
    )
    diff_cassette_coin_0_20 = fields.Integer(
        string="Diff. Cassette Coin 0.20",
        compute="_compute_diff_cassette_coin_0_20",
        store=True,
    )
    diff_cassette_coin_0_25 = fields.Integer(
        string="Diff. Cassette Coin 0.25",
        compute="_compute_diff_cassette_coin_0_25",
        store=True,
    )
    diff_cassette_coin_0_50 = fields.Integer(
        string="Diff. Cassette Coin 0.50",
        compute="_compute_diff_cassette_coin_0_50",
        store=True,
    )
    diff_cassette_coin_1_00 = fields.Integer(
        string="Diff. Cassette Coin 1.00",
        compute="_compute_diff_cassette_coin_1_00",
        store=True,
    )
    diff_cassette_coin_2_00 = fields.Integer(
        string="Diff. Cassette Coin 2.00",
        compute="_compute_diff_cassette_coin_2_00",
        store=True,
    )
    diff_cassette_bill_5_00 = fields.Integer(
        string="Diff. Cassette Bill 5.00",
        compute="_compute_diff_cassette_bill_5_00",
        store=True,
    )
    diff_cassette_bill_10_00 = fields.Integer(
        string="Diff. Cassette Bill 10.00",
        compute="_compute_diff_cassette_bill_10_00",
        store=True,
    )
    diff_cassette_bill_20_00 = fields.Integer(
        string="Diff. Cassette Bill 20.00",
        compute="_compute_diff_cassette_bill_20_00",
        store=True,
    )
    diff_cassette_bill_50_00 = fields.Integer(
        string="Diff. Cassette Bill 50.00",
        compute="_compute_diff_cassette_bill_50_00",
        store=True,
    )
    diff_cassette_bill_100_00 = fields.Integer(
        string="Diff. Cassette Bill 100.00",
        compute="_compute_diff_cassette_bill_100_00",
        store=True,
    )
    diff_cassette_bill_200_00 = fields.Integer(
        string="Diff. Cassette Bill 200.00",
        compute="_compute_diff_cassette_bill_200_00",
        store=True,
    )
    diff_cassette_bill_500_00 = fields.Integer(
        string="Diff. Cassette Bill 500.00",
        compute="_compute_diff_cassette_bill_500_00",
        store=True,
    )
    total_cassette_coins = fields.Float(
        compute="_compute_total_cassette_coins", store=True
    )
    total_cassette_bills = fields.Float(
        compute="_compute_total_cassette_bills", store=True
    )
    state_cassette_coins = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        compute="_compute_state_cassette_coins",
        store=True,
    )
    state_cassette_bills = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        compute="_compute_state_cassette_bills",
        store=True,
    )
    total_cassette = fields.Float(compute="_compute_total_cassette", store=True)
    start_balance = fields.Float(readonly=True)
    end_balance = fields.Float(compute="_compute_end_balance")
    is_completed = fields.Boolean(default=False, copy=False)

    @api.depends("session_id", "datetime")
    def _compute_name(self):
        for transaction in self:
            transaction.name = " ".join(
                filter(
                    None,
                    [
                        transaction.session_id.display_name,
                        format_datetime(transaction.env, transaction.datetime),
                    ],
                )
            )

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_01(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_01 = (
                    transaction.coin_0_01 - previous_glory_transaction.coin_0_01
                )
            else:
                transaction.diff_coin_0_01 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_02(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_02 = (
                    transaction.coin_0_02 - previous_glory_transaction.coin_0_02
                )
            else:
                transaction.diff_coin_0_02 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_05(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_05 = (
                    transaction.coin_0_05 - previous_glory_transaction.coin_0_05
                )
            else:
                transaction.diff_coin_0_05 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_10(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_10 = (
                    transaction.coin_0_10 - previous_glory_transaction.coin_0_10
                )
            else:
                transaction.diff_coin_0_10 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_20(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_20 = (
                    transaction.coin_0_20 - previous_glory_transaction.coin_0_20
                )
            else:
                transaction.diff_coin_0_20 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_25(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_25 = (
                    transaction.coin_0_25 - previous_glory_transaction.coin_0_25
                )
            else:
                transaction.diff_coin_0_25 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_0_50(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_0_50 = (
                    transaction.coin_0_50 - previous_glory_transaction.coin_0_50
                )
            else:
                transaction.diff_coin_0_50 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_1_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_1_00 = (
                    transaction.coin_1_00 - previous_glory_transaction.coin_1_00
                )
            else:
                transaction.diff_coin_1_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_coin_2_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_coin_2_00 = (
                    transaction.coin_2_00 - previous_glory_transaction.coin_2_00
                )
            else:
                transaction.diff_coin_2_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_5_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_5_00 = (
                    transaction.bill_5_00 - previous_glory_transaction.bill_5_00
                )
            else:
                transaction.diff_bill_5_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_10_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_10_00 = (
                    transaction.bill_10_00 - previous_glory_transaction.bill_10_00
                )
            else:
                transaction.diff_bill_10_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_20_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_20_00 = (
                    transaction.bill_20_00 - previous_glory_transaction.bill_20_00
                )
            else:
                transaction.diff_bill_20_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_50_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_50_00 = (
                    transaction.bill_50_00 - previous_glory_transaction.bill_50_00
                )
            else:
                transaction.diff_bill_50_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_100_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_100_00 = (
                    transaction.bill_100_00 - previous_glory_transaction.bill_100_00
                )
            else:
                transaction.diff_bill_100_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_200_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_200_00 = (
                    transaction.bill_200_00 - previous_glory_transaction.bill_200_00
                )
            else:
                transaction.diff_bill_200_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_bill_500_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_bill_500_00 = (
                    transaction.bill_500_00 - previous_glory_transaction.bill_500_00
                )
            else:
                transaction.diff_bill_500_00 = 0.00

    @api.depends(
        "coin_0_01",
        "coin_0_02",
        "coin_0_05",
        "coin_0_10",
        "coin_0_20",
        "coin_0_25",
        "coin_0_50",
        "coin_1_00",
        "coin_2_00",
    )
    def _compute_total_coins(self):
        for transaction in self:
            total_coins = 0.00
            if transaction.coin_0_01:
                total_coins += transaction.coin_0_01 * 0.01
            if transaction.coin_0_02:
                total_coins += transaction.coin_0_02 * 0.02
            if transaction.coin_0_05:
                total_coins += transaction.coin_0_05 * 0.05
            if transaction.coin_0_10:
                total_coins += transaction.coin_0_10 * 0.10
            if transaction.coin_0_20:
                total_coins += transaction.coin_0_20 * 0.20
            if transaction.coin_0_25:
                total_coins += transaction.coin_0_25 * 0.25
            if transaction.coin_0_50:
                total_coins += transaction.coin_0_50 * 0.50
            if transaction.coin_1_00:
                total_coins += transaction.coin_1_00 * 1.00
            if transaction.coin_2_00:
                total_coins += transaction.coin_2_00 * 2.00
            transaction.total_coins = total_coins

    @api.depends(
        "bill_5_00",
        "bill_10_00",
        "bill_50_00",
        "bill_100_00",
        "bill_200_00",
        "bill_500_00",
    )
    def _compute_total_bills(self):
        for transaction in self:
            total_bills = 0
            if transaction.bill_5_00:
                total_bills += transaction.bill_5_00 * 5.00
            if transaction.bill_10_00:
                total_bills += transaction.bill_10_00 * 10.00
            if transaction.bill_20_00:
                total_bills += transaction.bill_20_00 * 20.00
            if transaction.bill_50_00:
                total_bills += transaction.bill_50_00 * 50.00
            if transaction.bill_100_00:
                total_bills += transaction.bill_100_00 * 100.00
            if transaction.bill_200_00:
                total_bills += transaction.bill_200_00 * 200.00
            if transaction.bill_500_00:
                total_bills += transaction.bill_500_00 * 500.00
            transaction.total_bills = total_bills

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_01(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_01 = (
                    transaction.stacker_coin_0_01
                    - previous_glory_transaction.stacker_coin_0_01
                )
            else:
                transaction.diff_stacker_coin_0_01 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_02(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_02 = (
                    transaction.stacker_coin_0_02
                    - previous_glory_transaction.stacker_coin_0_02
                )
            else:
                transaction.diff_stacker_coin_0_02 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_05(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_05 = (
                    transaction.stacker_coin_0_05
                    - previous_glory_transaction.stacker_coin_0_05
                )
            else:
                transaction.diff_stacker_coin_0_05 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_10(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_10 = (
                    transaction.stacker_coin_0_10
                    - previous_glory_transaction.stacker_coin_0_10
                )
            else:
                transaction.diff_stacker_coin_0_10 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_20(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_20 = (
                    transaction.stacker_coin_0_20
                    - previous_glory_transaction.stacker_coin_0_20
                )
            else:
                transaction.diff_stacker_coin_0_20 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_25(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_25 = (
                    transaction.stacker_coin_0_25
                    - previous_glory_transaction.stacker_coin_0_25
                )
            else:
                transaction.diff_stacker_coin_0_25 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_0_50(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_0_50 = (
                    transaction.stacker_coin_0_50
                    - previous_glory_transaction.stacker_coin_0_50
                )
            else:
                transaction.diff_stacker_coin_0_50 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_1_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_1_00 = (
                    transaction.stacker_coin_1_00
                    - previous_glory_transaction.stacker_coin_1_00
                )
            else:
                transaction.diff_stacker_coin_1_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_coin_2_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_coin_2_00 = (
                    transaction.stacker_coin_2_00
                    - previous_glory_transaction.stacker_coin_2_00
                )
            else:
                transaction.diff_stacker_coin_2_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_5_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_5_00 = (
                    transaction.stacker_bill_5_00
                    - previous_glory_transaction.stacker_bill_5_00
                )
            else:
                transaction.diff_stacker_bill_5_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_10_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_10_00 = (
                    transaction.stacker_bill_10_00
                    - previous_glory_transaction.stacker_bill_10_00
                )
            else:
                transaction.diff_stacker_bill_10_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_20_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_20_00 = (
                    transaction.stacker_bill_20_00
                    - previous_glory_transaction.stacker_bill_20_00
                )
            else:
                transaction.diff_stacker_bill_20_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_50_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_50_00 = (
                    transaction.stacker_bill_50_00
                    - previous_glory_transaction.stacker_bill_50_00
                )
            else:
                transaction.diff_stacker_bill_50_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_100_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_100_00 = (
                    transaction.stacker_bill_100_00
                    - previous_glory_transaction.stacker_bill_100_00
                )
            else:
                transaction.diff_stacker_bill_100_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_200_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_200_00 = (
                    transaction.stacker_bill_200_00
                    - previous_glory_transaction.stacker_bill_200_00
                )
            else:
                transaction.diff_stacker_bill_200_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_stacker_bill_500_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_stacker_bill_500_00 = (
                    transaction.stacker_bill_500_00
                    - previous_glory_transaction.stacker_bill_500_00
                )
            else:
                transaction.diff_stacker_bill_500_00 = 0.00

    @api.depends(
        "stacker_coin_0_01",
        "stacker_coin_0_02",
        "stacker_coin_0_05",
        "stacker_coin_0_10",
        "stacker_coin_0_20",
        "stacker_coin_0_25",
        "stacker_coin_0_50",
        "stacker_coin_1_00",
        "stacker_coin_2_00",
    )
    def _compute_total_stacker_coins(self):
        for transaction in self:
            total_stacker_coins = 0.00
            if transaction.stacker_coin_0_01:
                total_stacker_coins += transaction.stacker_coin_0_01 * 0.01
            if transaction.stacker_coin_0_02:
                total_stacker_coins += transaction.stacker_coin_0_02 * 0.02
            if transaction.stacker_coin_0_05:
                total_stacker_coins += transaction.stacker_coin_0_05 * 0.05
            if transaction.stacker_coin_0_10:
                total_stacker_coins += transaction.stacker_coin_0_10 * 0.10
            if transaction.stacker_coin_0_20:
                total_stacker_coins += transaction.stacker_coin_0_20 * 0.20
            if transaction.stacker_coin_0_25:
                total_stacker_coins += transaction.stacker_coin_0_25 * 0.25
            if transaction.stacker_coin_0_50:
                total_stacker_coins += transaction.stacker_coin_0_50 * 0.50
            if transaction.stacker_coin_1_00:
                total_stacker_coins += transaction.stacker_coin_1_00 * 1.00
            if transaction.stacker_coin_2_00:
                total_stacker_coins += transaction.stacker_coin_2_00 * 2.00
            transaction.total_stacker_coins = total_stacker_coins

    @api.depends(
        "stacker_bill_5_00",
        "stacker_bill_10_00",
        "stacker_bill_50_00",
        "stacker_bill_100_00",
        "stacker_bill_200_00",
        "stacker_bill_500_00",
    )
    def _compute_total_stacker_bills(self):
        for transaction in self:
            total_stacker_bills = 0
            if transaction.stacker_bill_5_00:
                total_stacker_bills += transaction.stacker_bill_5_00 * 5.00
            if transaction.stacker_bill_10_00:
                total_stacker_bills += transaction.stacker_bill_10_00 * 10.00
            if transaction.stacker_bill_20_00:
                total_stacker_bills += transaction.stacker_bill_20_00 * 20.00
            if transaction.stacker_bill_50_00:
                total_stacker_bills += transaction.stacker_bill_50_00 * 50.00
            if transaction.stacker_bill_100_00:
                total_stacker_bills += transaction.stacker_bill_100_00 * 100.00
            if transaction.stacker_bill_200_00:
                total_stacker_bills += transaction.stacker_bill_200_00 * 200.00
            if transaction.stacker_bill_500_00:
                total_stacker_bills += transaction.stacker_bill_500_00 * 500.00
            transaction.total_stacker_bills = total_stacker_bills

    @api.depends("coin_0_01", "stacker_coin_0_01")
    def _compute_cassette_coin_0_01(self):
        for transaction in self:
            transaction.cassette_coin_0_01 = (
                transaction.coin_0_01 - transaction.stacker_coin_0_01
            )

    @api.depends("coin_0_02", "stacker_coin_0_02")
    def _compute_cassette_coin_0_02(self):
        for transaction in self:
            transaction.cassette_coin_0_02 = (
                transaction.coin_0_02 - transaction.stacker_coin_0_02
            )

    @api.depends("coin_0_05", "stacker_coin_0_05")
    def _compute_cassette_coin_0_05(self):
        for transaction in self:
            transaction.cassette_coin_0_05 = (
                transaction.coin_0_05 - transaction.stacker_coin_0_05
            )

    @api.depends("coin_0_10", "stacker_coin_0_10")
    def _compute_cassette_coin_0_10(self):
        for transaction in self:
            transaction.cassette_coin_0_10 = (
                transaction.coin_0_10 - transaction.stacker_coin_0_10
            )

    @api.depends("coin_0_20", "stacker_coin_0_20")
    def _compute_cassette_coin_0_20(self):
        for transaction in self:
            transaction.cassette_coin_0_20 = (
                transaction.coin_0_20 - transaction.stacker_coin_0_20
            )

    @api.depends("coin_0_25", "stacker_coin_0_25")
    def _compute_cassette_coin_0_25(self):
        for transaction in self:
            transaction.cassette_coin_0_25 = (
                transaction.coin_0_25 - transaction.stacker_coin_0_25
            )

    @api.depends("coin_0_50", "stacker_coin_0_50")
    def _compute_cassette_coin_0_50(self):
        for transaction in self:
            transaction.cassette_coin_0_50 = (
                transaction.coin_0_50 - transaction.stacker_coin_0_50
            )

    @api.depends("coin_1_00", "stacker_coin_1_00")
    def _compute_cassette_coin_1_00(self):
        for transaction in self:
            transaction.cassette_coin_1_00 = (
                transaction.coin_1_00 - transaction.stacker_coin_1_00
            )

    @api.depends("coin_2_00", "stacker_coin_2_00")
    def _compute_cassette_coin_2_00(self):
        for transaction in self:
            transaction.cassette_coin_2_00 = (
                transaction.coin_2_00 - transaction.stacker_coin_2_00
            )

    @api.depends("bill_5_00", "stacker_bill_5_00")
    def _compute_cassette_bill_5_00(self):
        for transaction in self:
            transaction.cassette_bill_5_00 = (
                transaction.bill_5_00 - transaction.stacker_bill_5_00
            )

    @api.depends("bill_10_00", "stacker_bill_10_00")
    def _compute_cassette_bill_10_00(self):
        for transaction in self:
            transaction.cassette_bill_10_00 = (
                transaction.bill_10_00 - transaction.stacker_bill_10_00
            )

    @api.depends("bill_20_00", "stacker_bill_20_00")
    def _compute_cassette_bill_20_00(self):
        for transaction in self:
            transaction.cassette_bill_20_00 = (
                transaction.bill_20_00 - transaction.stacker_bill_20_00
            )

    @api.depends("bill_50_00", "stacker_bill_50_00")
    def _compute_cassette_bill_50_00(self):
        for transaction in self:
            transaction.cassette_bill_50_00 = (
                transaction.bill_50_00 - transaction.stacker_bill_50_00
            )

    @api.depends("bill_100_00", "stacker_bill_100_00")
    def _compute_cassette_bill_100_00(self):
        for transaction in self:
            transaction.cassette_bill_100_00 = (
                transaction.bill_100_00 - transaction.stacker_bill_100_00
            )

    @api.depends("bill_200_00", "stacker_bill_200_00")
    def _compute_cassette_bill_200_00(self):
        for transaction in self:
            transaction.cassette_bill_200_00 = (
                transaction.bill_200_00 - transaction.stacker_bill_200_00
            )

    @api.depends("bill_500_00", "stacker_bill_500_00")
    def _compute_cassette_bill_500_00(self):
        for transaction in self:
            transaction.cassette_bill_500_00 = (
                transaction.bill_500_00 - transaction.stacker_bill_500_00
            )

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_01(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_01 = (
                    transaction.cassette_coin_0_01
                    - previous_glory_transaction.cassette_coin_0_01
                )
            else:
                transaction.diff_cassette_coin_0_01 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_02(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_02 = (
                    transaction.cassette_coin_0_02
                    - previous_glory_transaction.cassette_coin_0_02
                )
            else:
                transaction.diff_cassette_coin_0_02 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_05(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_05 = (
                    transaction.cassette_coin_0_05
                    - previous_glory_transaction.cassette_coin_0_05
                )
            else:
                transaction.diff_cassette_coin_0_05 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_10(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_10 = (
                    transaction.cassette_coin_0_10
                    - previous_glory_transaction.cassette_coin_0_10
                )
            else:
                transaction.diff_cassette_coin_0_10 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_20(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_20 = (
                    transaction.cassette_coin_0_20
                    - previous_glory_transaction.cassette_coin_0_20
                )
            else:
                transaction.diff_cassette_coin_0_20 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_25(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_25 = (
                    transaction.cassette_coin_0_25
                    - previous_glory_transaction.cassette_coin_0_25
                )
            else:
                transaction.diff_cassette_coin_0_25 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_0_50(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_0_50 = (
                    transaction.cassette_coin_0_50
                    - previous_glory_transaction.cassette_coin_0_50
                )
            else:
                transaction.diff_cassette_coin_0_50 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_1_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_1_00 = (
                    transaction.cassette_coin_1_00
                    - previous_glory_transaction.cassette_coin_1_00
                )
            else:
                transaction.diff_cassette_coin_1_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_coin_2_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_coin_2_00 = (
                    transaction.cassette_coin_2_00
                    - previous_glory_transaction.cassette_coin_2_00
                )
            else:
                transaction.diff_cassette_coin_2_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_5_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_5_00 = (
                    transaction.cassette_bill_5_00
                    - previous_glory_transaction.cassette_bill_5_00
                )
            else:
                transaction.diff_cassette_bill_5_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_10_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_10_00 = (
                    transaction.cassette_bill_10_00
                    - previous_glory_transaction.cassette_bill_10_00
                )
            else:
                transaction.diff_cassette_bill_10_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_20_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_20_00 = (
                    transaction.cassette_bill_20_00
                    - previous_glory_transaction.cassette_bill_20_00
                )
            else:
                transaction.diff_cassette_bill_20_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_50_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_50_00 = (
                    transaction.cassette_bill_50_00
                    - previous_glory_transaction.cassette_bill_50_00
                )
            else:
                transaction.diff_cassette_bill_50_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_100_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_100_00 = (
                    transaction.cassette_bill_100_00
                    - previous_glory_transaction.cassette_bill_100_00
                )
            else:
                transaction.diff_cassette_bill_100_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_200_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_200_00 = (
                    transaction.cassette_bill_200_00
                    - previous_glory_transaction.cassette_bill_200_00
                )
            else:
                transaction.diff_cassette_bill_200_00 = 0.00

    @api.depends("previous_glory_transaction_id")
    def _compute_diff_cassette_bill_500_00(self):
        for transaction in self:
            previous_glory_transaction = transaction.previous_glory_transaction_id
            if previous_glory_transaction:
                transaction.diff_cassette_bill_500_00 = (
                    transaction.cassette_bill_500_00
                    - previous_glory_transaction.cassette_bill_500_00
                )
            else:
                transaction.diff_cassette_bill_500_00 = 0.00

    @api.depends("total_coins", "total_stacker_coins")
    def _compute_total_cassette_coins(self):
        for transaction in self:
            transaction.total_cassette_coins = (
                transaction.total_coins - transaction.total_stacker_coins
            )

    @api.depends("total_bills", "total_stacker_bills")
    def _compute_total_cassette_bills(self):
        for transaction in self:
            transaction.total_cassette_bills = (
                transaction.total_bills - transaction.total_stacker_bills
            )

    @api.depends(
        "config_id.total_money_cassette",
        "cassette_coin_0_01",
        "cassette_coin_0_02",
        "cassette_coin_0_05",
        "cassette_coin_0_10",
        "cassette_coin_0_20",
        "cassette_coin_0_25",
        "cassette_coin_0_50",
        "cassette_coin_1_00",
        "cassette_coin_2_00",
    )
    def _compute_state_cassette_coins(self):
        for transaction in self:
            total_cassette_unit_coins = sum(
                [
                    transaction.cassette_coin_0_01,
                    transaction.cassette_coin_0_02,
                    transaction.cassette_coin_0_05,
                    transaction.cassette_coin_0_10,
                    transaction.cassette_coin_0_20,
                    transaction.cassette_coin_0_25,
                    transaction.cassette_coin_0_50,
                    transaction.cassette_coin_1_00,
                    transaction.cassette_coin_2_00,
                ]
            )
            total_money_cassette = transaction.config_id.total_money_cassette

            if total_cassette_unit_coins == 0:
                state_cassette_coins = "empty"
            elif total_cassette_unit_coins <= (total_money_cassette * 0.2):
                state_cassette_coins = "low"
            elif (
                (total_money_cassette * 0.2)
                < total_cassette_unit_coins
                < (total_money_cassette * 0.8)
            ):
                state_cassette_coins = "normal"
            elif total_cassette_unit_coins <= (total_money_cassette * 0.8):
                state_cassette_coins = "high"
            else:
                state_cassette_coins = "full"

            transaction.state_cassette_coins = state_cassette_coins

    @api.depends(
        "config_id.total_money_cassette",
        "cassette_bill_5_00",
        "cassette_bill_10_00",
        "cassette_bill_50_00",
        "cassette_bill_100_00",
        "cassette_bill_200_00",
        "cassette_bill_500_00",
    )
    def _compute_state_cassette_bills(self):
        for transaction in self:
            total_cassette_unit_bills = sum(
                [
                    transaction.cassette_bill_5_00,
                    transaction.cassette_bill_10_00,
                    transaction.cassette_bill_20_00,
                    transaction.cassette_bill_50_00,
                    transaction.cassette_bill_100_00,
                    transaction.cassette_bill_200_00,
                    transaction.cassette_bill_500_00,
                ]
            )
            total_money_cassette = transaction.config_id.total_money_cassette

            if total_cassette_unit_bills == 0:
                state_cassette_bills = "empty"
            elif total_cassette_unit_bills <= (total_money_cassette * 0.2):
                state_cassette_bills = "low"
            elif (
                (total_money_cassette * 0.2)
                < total_cassette_unit_bills
                < (total_money_cassette * 0.8)
            ):
                state_cassette_bills = "normal"
            elif total_cassette_unit_bills <= (total_money_cassette * 0.8):
                state_cassette_bills = "high"
            else:
                state_cassette_bills = "full"

            transaction.state_cassette_bills = state_cassette_bills

    @api.depends("total_cassette_bills", "total_cassette_coins")
    def _compute_total_cassette(self):
        for transaction in self:
            transaction.total_cassette = (
                transaction.total_cassette_bills + transaction.total_cassette_coins
            )

    @api.depends("total_coins", "total_bills")
    def _compute_end_balance(self):
        for transaction in self:
            transaction.end_balance = transaction.total_coins + transaction.total_bills

    @api.depends("amount", "operation", "total_coins", "total_bills")
    def _compute_rest_amount(self):
        for transaction in self:
            if transaction.amount and transaction.operation == "payment_request":
                transaction.rest_amount = (
                    transaction.end_balance
                    - transaction.start_balance
                    - transaction.amount
                )
            else:
                transaction.rest_amount = 0.00

    @api.depends("amount", "rest_amount")
    def _compute_payment_amount(self):
        for transaction in self:
            if transaction.operation == "payment_request":
                transaction.payment_amount = (
                    transaction.amount + transaction.rest_amount
                )
            else:
                transaction.payment_amount = 0.00

    def check_glory_alert_money(self):
        self.ensure_one()

        thresholds = {
            "coin_0_01": _("Coin 0.01 is below than understock: %s coin/s"),
            "coin_0_02": _("Coin 0.02 is below than understock: %s coin/s"),
            "coin_0_05": _("Coin 0.05 is below than understock: %s coin/s"),
            "coin_0_10": _("Coin 0.10 is below than understock: %s coin/s"),
            "coin_0_20": _("Coin 0.20 is below than understock: %s coin/s"),
            "coin_0_25": _("Coin 0.25 is below than understock: %s coin/s"),
            "coin_0_50": _("Coin 0.50 is below than understock: %s coin/s"),
            "coin_1_00": _("Coin 1.00 is below than understock: %s coin/s"),
            "coin_2_00": _("Coin 2.00 is below than understock: %s coin/s"),
            "bill_5_00": _("Bill 5.00 is below than understock: %s bill/s"),
            "bill_10_00": _("Bill 10.00 is below than understock: %s bill/s"),
            "bill_20_00": _("Bill 20.00 is below than understock: %s bill/s"),
        }
        glory_alert_money = []
        for attr, message in thresholds.items():
            has_stacker = hasattr(self, "stacker_" + attr)
            has_understock = hasattr(self.config_id, "understock_" + attr)
            if has_stacker and has_understock:
                stacker = getattr(self, "stacker_" + attr)
                understock = getattr(self.config_id, "understock_" + attr)
                if stacker < understock:
                    money_reach_understock = understock - stacker
                    glory_alert_money.append(message % money_reach_understock)

        if glory_alert_money:
            return glory_alert_money
        return False

    def get_glory_transaction_mail(self, state):
        glory_transaction_mail = self.env["glory.transaction.mail"].search(
            [
                ("config_id", "=", self.config_id.id),
                ("company_id", "=", self.company_id.id),
            ],
            limit=1,
        )
        if not glory_transaction_mail:
            glory_transaction_mail = self.env["glory.transaction.mail"].create(
                {
                    "name": self.name,
                    "config_id": self.config_id.id,
                    "company_id": self.company_id.id,
                }
            )

        coin_values = [
            "0_01",
            "0_02",
            "0_05",
            "0_10",
            "0_20",
            "0_25",
            "0_50",
            "1_00",
            "2_00",
        ]
        bill_values = ["5_00", "10_00", "20_00"]
        denominations = {"coin": coin_values, "bill": bill_values}

        if state in ["high", "low"]:
            prefix = "cassette" if state == "high" else "stacker"
            glory_transaction_mail.write(
                {
                    f"{money_type}_{value}": getattr(
                        self, f"{prefix}_{money_type}_{value}"
                    )
                    for money_type, values in denominations.items()
                    for value in values
                }
            )

        for money_type, values in denominations.items():
            for value in values:
                field = f"{money_type}_{value}"
                amount = getattr(
                    self, f"{'cassette' if state == 'high' else 'stacker'}_{field}"
                )

                if state == "high":
                    total_money = self.config_id.total_money_cassette
                    thresholds = [0, total_money * 0.2, total_money * 0.8]
                    states = ["empty", "low", "normal", "high", "full"]
                else:
                    understock_amount = getattr(self.config_id, f"understock_{field}")
                    thresholds = [0, understock_amount]
                    states = ["empty", "low", "normal"]

                status = next(
                    (
                        s
                        for t, s in zip(thresholds, states, strict=False)
                        if amount <= t
                    ),
                    states[-1],
                )
                setattr(glory_transaction_mail, f"state_{field}", status)

        glory_transaction_mail.write(
            {
                "state_cassette_coins": self.state_cassette_coins,
                "state_cassette_bills": self.state_cassette_bills,
            }
        )
        return glory_transaction_mail

    def check_glory_transaction_state_cassette_high(self):
        last_glory_transaction = fields.first(self.search([]))

        if (
            not last_glory_transaction
            or not last_glory_transaction.config_id.state_cassette_email
        ):
            return

        HIGH_STATES = ["high", "full"]
        if (
            last_glory_transaction.state_cassette_coins in HIGH_STATES
            or last_glory_transaction.state_cassette_bills in HIGH_STATES
        ):
            glory_transaction_mail = last_glory_transaction.get_glory_transaction_mail(
                "high"
            )
            mail = "pos_glory_connector.mail_template_glory_transaction_state_cassette"
            template = self.env.ref(mail)
            if template:
                template.send_mail(
                    glory_transaction_mail.id,
                    email_values=dict(
                        email_to=last_glory_transaction.config_id.state_cassette_email
                    ),
                )

    def check_glory_transaction_state_stacker_low(self):
        last_glory_transaction = fields.first(self.search([]))

        if (
            not last_glory_transaction
            or not last_glory_transaction.config_id.state_stacker_low_email
        ):
            return

        glory_alert_money = last_glory_transaction.check_glory_alert_money()
        if glory_alert_money:
            glory_transaction_mail = last_glory_transaction.get_glory_transaction_mail(
                "low"
            )
            mail = "pos_glory_connector.mail_template_glory_transaction_state_stacker"
            template = self.env.ref(mail)
            if template:
                template.send_mail(
                    glory_transaction_mail.id,
                    email_values=dict(
                        email_to=last_glory_transaction.config_id.state_stacker_low_email
                    ),
                )
