# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).


from odoo import api, fields, models


class AccountMoveLineInherit(models.Model):
    _inherit = "account.move.line"

    employee_id = fields.Many2one(
        "hr.employee",
        string="Employee",
        compute="_compute_employee",
        store=True,
    )

    @api.depends("statement_line_id", "statement_line_id.employee_id")
    def _compute_employee(self):
        for move_line in self:
            move_line.employee_id = move_line.statement_line_id.employee_id.id
