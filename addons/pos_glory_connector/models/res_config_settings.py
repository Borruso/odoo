# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import fields, models


class ResConfigSetting(models.TransientModel):
    _inherit = "res.config.settings"

    enable_glory = fields.Boolean(related="pos_config_id.enable_glory", readonly=False)
    glory_ip = fields.Char(related="pos_config_id.glory_ip", readonly=False)
    glory_kind = fields.Selection(related="pos_config_id.glory_kind", readonly=False)
    state_cassette_email = fields.Char(
        related="pos_config_id.state_cassette_email", readonly=False
    )
    state_stacker_low_email = fields.Char(
        related="pos_config_id.state_stacker_low_email", readonly=False
    )
    use_odoo_watermarker = fields.Boolean(
        related="pos_config_id.use_odoo_watermarker", readonly=False
    )
    watermarker_coin_0_01 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_01", readonly=False
    )
    watermarker_coin_0_02 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_02", readonly=False
    )
    watermarker_coin_0_05 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_05", readonly=False
    )
    watermarker_coin_0_10 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_10", readonly=False
    )
    watermarker_coin_0_20 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_20", readonly=False
    )
    watermarker_coin_0_25 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_25", readonly=False
    )
    watermarker_coin_0_50 = fields.Integer(
        related="pos_config_id.watermarker_coin_0_50", readonly=False
    )
    watermarker_coin_1_00 = fields.Integer(
        related="pos_config_id.watermarker_coin_1_00", readonly=False
    )
    watermarker_coin_2_00 = fields.Integer(
        related="pos_config_id.watermarker_coin_2_00", readonly=False
    )
    watermarker_bill_5_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_5_00", readonly=False
    )
    watermarker_bill_10_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_10_00", readonly=False
    )
    watermarker_bill_20_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_20_00", readonly=False
    )
    watermarker_bill_50_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_50_00", readonly=False
    )
    watermarker_bill_100_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_100_00", readonly=False
    )
    watermarker_bill_200_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_200_00", readonly=False
    )
    watermarker_bill_500_00 = fields.Integer(
        related="pos_config_id.watermarker_bill_500_00", readonly=False
    )
    total_watermarker_coins_bills = fields.Float(
        related="pos_config_id.total_watermarker_coins_bills"
    )
    understock_coin_0_01 = fields.Integer(
        related="pos_config_id.understock_coin_0_01", readonly=False
    )
    understock_coin_0_02 = fields.Integer(
        related="pos_config_id.understock_coin_0_02", readonly=False
    )
    understock_coin_0_05 = fields.Integer(
        related="pos_config_id.understock_coin_0_05", readonly=False
    )
    understock_coin_0_10 = fields.Integer(
        related="pos_config_id.understock_coin_0_10", readonly=False
    )
    understock_coin_0_20 = fields.Integer(
        related="pos_config_id.understock_coin_0_20", readonly=False
    )
    understock_coin_0_25 = fields.Integer(
        related="pos_config_id.understock_coin_0_25", readonly=False
    )
    understock_coin_0_50 = fields.Integer(
        related="pos_config_id.understock_coin_0_50", readonly=False
    )
    understock_coin_1_00 = fields.Integer(
        related="pos_config_id.understock_coin_1_00", readonly=False
    )
    understock_coin_2_00 = fields.Integer(
        related="pos_config_id.understock_coin_2_00", readonly=False
    )
    understock_bill_5_00 = fields.Integer(
        related="pos_config_id.understock_bill_5_00", readonly=False
    )
    understock_bill_10_00 = fields.Integer(
        related="pos_config_id.understock_bill_10_00", readonly=False
    )
    understock_bill_20_00 = fields.Integer(
        related="pos_config_id.understock_bill_20_00", readonly=False
    )
    understock_bill_50_00 = fields.Integer(
        related="pos_config_id.understock_bill_50_00", readonly=False
    )
    understock_bill_100_00 = fields.Integer(
        related="pos_config_id.understock_bill_100_00", readonly=False
    )
    understock_bill_200_00 = fields.Integer(
        related="pos_config_id.understock_bill_200_00", readonly=False
    )
    understock_bill_500_00 = fields.Integer(
        related="pos_config_id.understock_bill_500_00", readonly=False
    )
    total_money_cassette = fields.Integer(
        related="pos_config_id.total_money_cassette", readonly=False
    )
