# Copyright (C) 2023-Today:
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
import logging
from odoo import api,fields, models
from odoo.exceptions import UserError,AccessError

_logger = logging.getLogger(__name__)

class PosOrderInherit(models.Model):
    _inherit = "pos.order"

    glory_transaction_ids = fields.One2many(
        "glory.transaction",
        "order_id",
        string="Glory Transactions",
    )

    @api.model
    def create_from_ui(self, orders, draft=False):
        res = super().create_from_ui(orders, draft)

        for order_data in res:
            pos_order = self.env['pos.order'].browse(order_data['id'])
            for p in pos_order.payment_ids:
                last_transaction = self.env["glory.transaction"].search(
                    [
                        ("session_id", "=", pos_order.session_id.id),
                        ("config_id", "=", pos_order.config_id.id),
                        ("order_id", "=", False),
                        ("amount", "=", p.amount),
                        ("operation", "=", "payment_request"),
                        ("payment_method_id", "=", p.payment_method_id.id),
                    ],
                    limit=1,
                    order="datetime desc",
                )

                if last_transaction:
                    last_transaction.order_id = pos_order.id

        return res


    def action_set_glory_on_order(self):
        if not self.env.user.has_group('point_of_sale.group_pos_manager'):
            raise AccessError("Operation Allowed only for Pos Managers.")

        for order in self:
            for p in order.payment_ids:
                last_transaction = self.env["glory.transaction"].search(
                    [
                        ("session_id", "=", order.session_id.id),
                        ("config_id", "=", order.config_id.id),
                        ("order_id", "=", False),
                        ("amount", "=", p.amount),
                        ("operation", "=", "payment_request"),
                        ("payment_method_id", "=", p.payment_method_id.id),

                    ],
                    limit=1,
                    order="datetime desc",
                )

                if last_transaction:
                    last_transaction.write({"order_id": order.id})
                    break