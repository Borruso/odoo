# Copyright (C) 2025-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import fields, models


class GloryTransactionMail(models.Model):
    _name = "glory.transaction.mail"
    _description = "Glory Transaction Mail"

    name = fields.Char()
    config_id = fields.Many2one("pos.config", string="Point of Sale")
    company_id = fields.Many2one("res.company", string="Company")
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
    state_coin_0_01 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.01",
    )
    state_coin_0_02 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.02",
    )
    state_coin_0_05 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.05",
    )
    state_coin_0_10 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.10",
    )
    state_coin_0_20 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.20",
    )
    state_coin_0_25 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.25",
    )
    state_coin_0_50 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 0.50",
    )
    state_coin_1_00 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 1.00",
    )
    state_coin_2_00 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Coin 2.00",
    )
    state_bill_5_00 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Bill 5.00",
    )
    state_bill_10_00 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Bill 10.00",
    )
    state_bill_20_00 = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
        string="State Bill 20.00",
    )
    state_cassette_coins = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
    )
    state_cassette_bills = fields.Selection(
        [
            ("empty", "empty"),
            ("low", "Low"),
            ("normal", "Normal"),
            ("high", "High"),
            ("full", "Full"),
        ],
    )
