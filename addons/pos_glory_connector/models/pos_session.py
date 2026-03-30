# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).


from odoo import _, api, fields, models
from odoo.exceptions import UserError
from odoo.tools import float_is_zero


class PosSessionInherit(models.Model):
    _inherit = "pos.session"

    glory_transaction_ids = fields.One2many(
        "glory.transaction",
        "session_id",
        string="Glory Transactions",
    )
    glory_transaction_count = fields.Integer(
        compute="_compute_glory_transaction_count",
    )

    def _get_pos_ui_hr_employee(self, params):
        employees = super()._get_pos_ui_hr_employee(params)
        for employee in employees:
            emp = self.env["hr.employee"].browse(employee["id"])
            employee["allow_cashin_operation"] = emp.allow_cashin_operation
            employee["allow_cashout_operation"] = emp.allow_cashout_operation
            employee[
                "allow_see_cash_move_in_reason"
            ] = emp.allow_see_cash_move_in_reason
            employee[
                "allow_see_cash_move_out_reason"
            ] = emp.allow_see_cash_move_out_reason
            employee["allow_status_operation"] = emp.allow_status_operation
            employee["allow_inventory_operation"] = emp.allow_inventory_operation
            employee[
                "allow_administrator_operation"
            ] = emp.allow_administrator_operation
            employee["allow_reset_operation"] = emp.allow_reset_operation
            employee["allow_shutdown_operation"] = emp.allow_shutdown_operation
            employee["allow_reboot_operation"] = emp.allow_reboot_operation
            employee["allow_exchange_operation"] = emp.allow_exchange_operation
            employee["allow_see_inventory_total"] = emp.allow_see_inventory_total
            employee["allow_see_close_total"] = emp.allow_see_close_total
        return employees

    def _loader_params_pos_payment_method(self):
        result = super()._loader_params_pos_payment_method()
        result["search_params"]["fields"].append("is_glory_machine")
        return result

    def _compute_glory_transaction_count(self):
        gts_data = (
            self.env["glory.transaction"]
            .sudo()
            ._read_group(
                [("session_id", "in", self.ids)],
                ["session_id"],
                ["session_id"],
            )
        )
        sessions_data = {
            gt_data["session_id"][0]: gt_data["session_id_count"]
            for gt_data in gts_data
        }
        for session in self:
            session.glory_transaction_count = sessions_data.get(session.id, 0)

    def action_show_glory_transactions(self):
        return {
            "name": _("Glory Transactions"),
            "res_model": "glory.transaction",
            "view_mode": "tree,form",
            "views": [
                (
                    self.env.ref(
                        "pos_glory_connector.glory_transaction_tree_no_session_view"
                    ).id,
                    "tree",
                ),
                (
                    self.env.ref("pos_glory_connector.glory_transaction_form_view").id,
                    "form",
                ),
            ],
            "type": "ir.actions.act_window",
            "domain": [("session_id", "in", self.ids)],
        }

    @api.model
    def _compute_money_value(self, money_value):
        float_value = float(money_value)
        result = money_value.replace(".", "_")
        if "_" in result:
            last_group = result.split("_")[-1]
            if len(last_group) < 2:
                result += "0"
        else:
            result += "_00"
        if float_value < 5:
            result = "coin_" + result
        else:
            result = "bill_" + result
        return result

    def generate_glory_transaction(
        self, payment_method, id_cashier, message, operation, amount, pos_payment_uuid
    ):
        self.ensure_one()
        if pos_payment_uuid:
            existing_transaction = self.env["glory.transaction"].sudo().search(
                [
                    ("session_id", "=", self.id),
                    ("pos_payment_uuid", "=", pos_payment_uuid),
                ],
                limit=1,
            )
            if existing_transaction:
                update_vals = {
                    "employee_id": id_cashier,
                    "machine_state": message,
                    "operation": operation,
                    "attempt_count": existing_transaction.attempt_count + 1,
                    "processed_at": fields.Datetime.now(),
                }
                if payment_method:
                    update_vals["payment_method_id"] = int(payment_method)
                if amount not in (False, None):
                    update_vals["amount"] = float(amount)
                if operation in ["payment_request", "refund_payment_request"]:
                    update_vals.update({"state": "done", "last_error": False})
                elif operation == "aborted_payment_request":
                    update_vals.update({"state": "error", "last_error": message})
                existing_transaction.write(update_vals)
                return existing_transaction

        transaction_vals = {
            "session_id": self.id,
            "payment_method_id": int(payment_method) if payment_method else False,
            "employee_id": id_cashier,
            "machine_state": message,
            "operation": operation,
            "amount": float(amount) if amount else 0.00,
            "pos_payment_uuid": pos_payment_uuid or False,
            "attempt_count": 1,
            "processed_at": fields.Datetime.now(),
        }
        if operation in ["payment_request", "refund_payment_request"]:
            transaction_vals["state"] = "done"
        elif operation == "aborted_payment_request":
            transaction_vals["state"] = "error"
            transaction_vals["last_error"] = message

        if self.glory_transaction_ids:
            previous_glory_transaction = fields.first(self.glory_transaction_ids).sudo()
            transaction_vals[
                "previous_glory_transaction_id"
            ] = previous_glory_transaction.id
            transaction_vals["start_balance"] = (
                previous_glory_transaction.total_coins
                + previous_glory_transaction.total_bills
            )
            if (
                previous_glory_transaction.operation == "end_cashin_request"
                and operation == "cashout_request"
                and abs(previous_glory_transaction.amount) == abs(amount)
            ):
                previous_glory_transaction.operation = "exchange_request"
                transaction_vals["operation"] = "exchange_request"
            glory_transaction = previous_glory_transaction.copy(transaction_vals)
        else:
            glory_transaction = (
                self.env["glory.transaction"].sudo().create(transaction_vals)
            )

        return glory_transaction

    def update_money_details(
        self, glory_transaction, money_details, stacker_money_details, payment_mode
    ):
        self.ensure_one()

        positive_payment_mode = [
            "cashin",
            "payment",
        ]
        negative_payment_mode = [
            "cashout",
            "collect_surplus",
            "collect_specific",
            "collect_all_bills",
            "collect_all_coins",
            "collect_all",
        ]

        def update_transaction_details(details, prefix=""):
            for money_value, money_piece in details.items():
                if prefix and float(money_value) >= 50:
                    continue

                money_value = f"{prefix}{self._compute_money_value(money_value)}"
                if payment_mode in positive_payment_mode + negative_payment_mode:
                    if payment_mode in negative_payment_mode:
                        money_piece *= -1
                    money_piece += getattr(glory_transaction, money_value)
                glory_transaction.sudo().write({money_value: money_piece})

        if money_details:
            update_transaction_details(money_details)
        update_transaction_details(stacker_money_details, "stacker_")

        return glory_transaction

    def write_bank_statement_line(self, glory_transaction, amount):
        self.ensure_one()

        if not self.cash_journal_id:
            raise UserError(_("There is no cash payment method for this PoS Session"))

        statement_line = self.env["account.bank.statement.line"].create(
            [
                {
                    "pos_session_id": self.id,
                    "employee_id": glory_transaction.employee_id.id,
                    "journal_id": self.cash_journal_id.id,
                    "amount": amount,
                    "date": fields.Date.context_today(self),
                    "payment_ref": "-".join([self.name, glory_transaction.operation]),
                }
            ]
        )

        for line in statement_line.move_id.line_ids:
            line.employee_id = glory_transaction.employee_id.id

        return glory_transaction

    def try_write_glory_transaction(
        self,
        id_cashier,
        message,
        operation,
        amount,
        payment_method,
        money_details,
        stacker_money_details,
        payment_mode,
        pos_payment_uuid=False,
    ):
        for session in self:
            session_sudo = session.sudo()
            glory_transaction = session_sudo.generate_glory_transaction(
                payment_method,
                id_cashier,
                message,
                operation,
                amount,
                pos_payment_uuid,
            )
            if money_details or stacker_money_details:
                glory_transaction = session_sudo.update_money_details(
                    glory_transaction,
                    money_details,
                    stacker_money_details,
                    payment_mode,
                )
            if payment_mode in ["cashin", "cashout", "lock_bill", "lock_coin"]:
                if payment_mode in ["lock_bill", "lock_coin"]:
                    amount = (
                        glory_transaction.end_balance - glory_transaction.start_balance
                    )
                    if float_is_zero(amount, precision_digits=2):
                        continue
                    glory_transaction.amount = amount
                session_sudo.write_bank_statement_line(glory_transaction, amount)

    def check_glory_alert_money(self):
        dict_glory_alert_money = {}
        for session in self:
            session_sudo = session.sudo()
            glory_transaction = fields.first(session_sudo.glory_transaction_ids)
            if glory_transaction:
                glory_alert_money = glory_transaction.check_glory_alert_money()
                dict_glory_alert_money[session.id] = glory_alert_money
        if dict_glory_alert_money:
            return dict_glory_alert_money
        return False

    def check_first_glory_transaction(self):
        dict_first_glory_transaction = {}
        for session in self:
            session_sudo = session.sudo()
            glory_transaction = fields.first(session_sudo.glory_transaction_ids)
            dict_first_glory_transaction[session.id] = bool(not glory_transaction)
        if dict_first_glory_transaction:
            return dict_first_glory_transaction
        return False

    def try_cash_in_out(self, _type, amount, reason, extras):
        res = super().try_cash_in_out(_type, amount, reason, extras)
        for session in self.filtered("cash_journal_id"):
            if session.config_id.enable_glory:
                unlink_statement_line = fields.first(session.statement_line_ids)
                unlink_statement_line.unlink()
                if reason:
                    statement_line = fields.first(session.statement_line_ids)
                    if statement_line.payment_ref:
                        statement_line.payment_ref += f" - {reason}"
                    else:
                        statement_line.payment_ref = reason
        return res
