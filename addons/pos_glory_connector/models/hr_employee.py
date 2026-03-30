# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import fields, models


class HrEmployeeInherit(models.AbstractModel):
    _inherit = "hr.employee"

    allow_cashin_operation = fields.Boolean()
    allow_cashout_operation = fields.Boolean()
    allow_see_cash_move_in_reason = fields.Boolean()
    allow_see_cash_move_out_reason = fields.Boolean()
    allow_status_operation = fields.Boolean()
    allow_inventory_operation = fields.Boolean()
    allow_administrator_operation = fields.Boolean()
    allow_reset_operation = fields.Boolean()
    allow_shutdown_operation = fields.Boolean()
    allow_reboot_operation = fields.Boolean()
    allow_exchange_operation = fields.Boolean()
    allow_see_inventory_total = fields.Boolean()
    allow_see_close_total = fields.Boolean()
