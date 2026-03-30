# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).


from odoo import fields, models


class AccountBankStatementLineInherit(models.Model):
    _inherit = "account.bank.statement.line"

    employee_id = fields.Many2one(
        "hr.employee",
        string="Employee",
        copy=False,
        readonly=False,
    )
