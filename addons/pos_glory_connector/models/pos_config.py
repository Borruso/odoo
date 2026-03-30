# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import api, fields, models


class PosConfigInherit(models.Model):
    _inherit = "pos.config"

    enable_glory = fields.Boolean()
    glory_ip = fields.Char(string="Glory IP")
    fcc_url = fields.Char(compute="_compute_fcc_url")
    glory_kind = fields.Selection(
        selection=[
            ("ci5", "CI-5"),
            ("ci10", "CI-10"),
        ],
        default="ci10",
    )
    state_cassette_email = fields.Char(copy=False)
    state_stacker_low_email = fields.Char(copy=False)
    use_odoo_watermarker = fields.Boolean()
    watermarker_coin_0_01 = fields.Integer(string="Watermarker Coin 0.01")
    watermarker_coin_0_02 = fields.Integer(string="Watermarker Coin 0.02")
    watermarker_coin_0_05 = fields.Integer(string="Watermarker Coin 0.05")
    watermarker_coin_0_10 = fields.Integer(string="Watermarker Coin 0.10")
    watermarker_coin_0_20 = fields.Integer(string="Watermarker Coin 0.20")
    watermarker_coin_0_25 = fields.Integer(string="Watermarker Coin 0.25")
    watermarker_coin_0_50 = fields.Integer(string="Watermarker Coin 0.50")
    watermarker_coin_1_00 = fields.Integer(string="Watermarker Coin 1.00")
    watermarker_coin_2_00 = fields.Integer(string="Watermarker Coin 2.00")
    watermarker_bill_5_00 = fields.Integer(string="Watermarker Bill 5.00")
    watermarker_bill_10_00 = fields.Integer(string="Watermarker Bill 10.00")
    watermarker_bill_20_00 = fields.Integer(string="Watermarker Bill 20.00")
    watermarker_bill_50_00 = fields.Integer(string="Watermarker Bill 50.00")
    watermarker_bill_100_00 = fields.Integer(string="Watermarker Bill 100.00")
    watermarker_bill_200_00 = fields.Integer(string="Watermarker Bill 200.00")
    watermarker_bill_500_00 = fields.Integer(string="Watermarker Bill 500.00")
    total_watermarker_coins_bills = fields.Float(
        string="Total Watermarker Coins/Bills",
        compute="_compute_total_watermarker_coins_bills",
    )
    understock_coin_0_01 = fields.Integer(string="Understock Coin 0.01")
    understock_coin_0_02 = fields.Integer(string="Understock Coin 0.02")
    understock_coin_0_05 = fields.Integer(string="Understock Coin 0.05")
    understock_coin_0_10 = fields.Integer(string="Understock Coin 0.10")
    understock_coin_0_20 = fields.Integer(string="Understock Coin 0.20")
    understock_coin_0_25 = fields.Integer(string="Understock Coin 0.25")
    understock_coin_0_50 = fields.Integer(string="Understock Coin 0.50")
    understock_coin_1_00 = fields.Integer(string="Understock Coin 1.00")
    understock_coin_2_00 = fields.Integer(string="Understock Coin 2.00")
    understock_bill_5_00 = fields.Integer(string="Understock Bill 5.00")
    understock_bill_10_00 = fields.Integer(string="Understock Bill 10.00")
    understock_bill_20_00 = fields.Integer(string="Understock Bill 20.00")
    understock_bill_50_00 = fields.Integer(string="Understock Bill 50.00")
    understock_bill_100_00 = fields.Integer(string="Understock Bill 100.00")
    understock_bill_200_00 = fields.Integer(string="Understock Bill 200.00")
    understock_bill_500_00 = fields.Integer(string="Understock Bill 500.00")
    total_money_cassette = fields.Integer()

    @api.depends("glory_ip")
    def _compute_fcc_url(self):
        for pos_config in self:
            if pos_config.glory_ip:
                pos_config.fcc_url = (
                    "https://" + pos_config.glory_ip + "/axis2/services/BrueBoxService"
                )
            else:
                pos_config.fcc_url = ""

    @api.depends(
        "watermarker_coin_0_01",
        "watermarker_coin_0_02",
        "watermarker_coin_0_05",
        "watermarker_coin_0_10",
        "watermarker_coin_0_20",
        "watermarker_coin_0_25",
        "watermarker_coin_0_50",
        "watermarker_coin_1_00",
        "watermarker_coin_2_00",
        "watermarker_bill_5_00",
        "watermarker_bill_10_00",
        "watermarker_bill_20_00",
        "watermarker_bill_50_00",
        "watermarker_bill_100_00",
        "watermarker_bill_200_00",
        "watermarker_bill_500_00",
    )
    def _compute_total_watermarker_coins_bills(self):  # noqa: C901
        for pos_config in self:
            total_watermarker_coins_bills = 0.00
            if pos_config.watermarker_coin_0_01:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_01 * 0.01
            if pos_config.watermarker_coin_0_02:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_02 * 0.02
            if pos_config.watermarker_coin_0_05:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_05 * 0.05
            if pos_config.watermarker_coin_0_10:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_10 * 0.10
            if pos_config.watermarker_coin_0_20:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_20 * 0.20
            if pos_config.watermarker_coin_0_25:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_25 * 0.25
            if pos_config.watermarker_coin_0_50:
                total_watermarker_coins_bills += pos_config.watermarker_coin_0_50 * 0.50
            if pos_config.watermarker_coin_1_00:
                total_watermarker_coins_bills += pos_config.watermarker_coin_1_00 * 1.00
            if pos_config.watermarker_coin_2_00:
                total_watermarker_coins_bills += pos_config.watermarker_coin_2_00 * 2.00
            if pos_config.watermarker_bill_5_00:
                total_watermarker_coins_bills += pos_config.watermarker_bill_5_00 * 5.00
            if pos_config.watermarker_bill_10_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_10_00 * 10.00
                )
            if pos_config.watermarker_bill_20_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_20_00 * 20.00
                )
            if pos_config.watermarker_bill_50_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_50_00 * 50.00
                )
            if pos_config.watermarker_bill_100_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_100_00 * 100.00
                )
            if pos_config.watermarker_bill_200_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_200_00 * 200.00
                )
            if pos_config.watermarker_bill_500_00:
                total_watermarker_coins_bills += (
                    pos_config.watermarker_bill_500_00 * 500.00
                )
            pos_config.total_watermarker_coins_bills = total_watermarker_coins_bills

    def action_last_glory_transaction(self):
        for pos_config in self:
            session = fields.first(pos_config.session_ids).sudo()
            if session.glory_transaction_ids:
                last_glory_transaction = fields.first(
                    session.glory_transaction_ids
                ).sudo()
                action = self.env["ir.actions.act_window"]._for_xml_id(
                    "pos_glory_connector.action_glory_transaction"
                )
                action["views"] = [
                    (
                        self.env.ref(
                            "pos_glory_connector.glory_transaction_form_last_transaction_view"
                        ).id,
                        "form",
                    )
                ]
                action["res_id"] = last_glory_transaction.id
            else:
                action = {"type": "ir.actions.act_window_close"}

            return action
