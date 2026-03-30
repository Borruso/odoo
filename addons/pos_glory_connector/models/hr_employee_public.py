# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import fields, models


class HrEmployeePublicInherit(models.Model):
    _inherit = "hr.employee.public"

    allow_cashin_operation = fields.Boolean(
        related="employee_id.allow_cashin_operation"
    )
    allow_cashout_operation = fields.Boolean(
        related="employee_id.allow_cashout_operation"
    )
    allow_see_cash_move_in_reason = fields.Boolean(
        related="employee_id.allow_see_cash_move_in_reason"
    )
    allow_see_cash_move_out_reason = fields.Boolean(
        related="employee_id.allow_see_cash_move_out_reason"
    )
    allow_status_operation = fields.Boolean(
        related="employee_id.allow_status_operation"
    )
    allow_inventory_operation = fields.Boolean(
        related="employee_id.allow_inventory_operation"
    )
    allow_administrator_operation = fields.Boolean(
        related="employee_id.allow_administrator_operation"
    )
    allow_reset_operation = fields.Boolean(related="employee_id.allow_reset_operation")
    allow_shutdown_operation = fields.Boolean(
        related="employee_id.allow_shutdown_operation"
    )
    allow_reboot_operation = fields.Boolean(
        related="employee_id.allow_reboot_operation"
    )
    allow_exchange_operation = fields.Boolean(
        related="employee_id.allow_exchange_operation"
    )
    allow_see_inventory_total = fields.Boolean(
        related="employee_id.allow_see_inventory_total"
    )
    allow_see_close_total = fields.Boolean(related="employee_id.allow_see_close_total")
