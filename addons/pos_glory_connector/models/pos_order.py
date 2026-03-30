# Copyright (C) 2023-Today:
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
import logging

from odoo import api, fields, models
from odoo.exceptions import AccessError

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
        order_payload_map = {}
        for order_wrapper in orders:
            data = order_wrapper.get("data", {})
            for key in [data.get("name"), data.get("uid"), data.get("pos_reference")]:
                if key:
                    order_payload_map[key] = data

        for order_data in res:
            pos_order = self.env["pos.order"].browse(order_data["id"])
            order_payload = (
                order_payload_map.get(order_data.get("name"))
                or order_payload_map.get(pos_order.pos_reference)
                or order_payload_map.get(pos_order.name)
                or {}
            )
            statement_lines = order_payload.get("statement_ids", [])
            tx_by_payment_uuid = {}
            for statement_line in statement_lines:
                if (
                    isinstance(statement_line, (list, tuple))
                    and len(statement_line) > 2
                    and isinstance(statement_line[2], dict)
                ):
                    payment_uuid = statement_line[2].get("glory_payment_uuid")
                    if payment_uuid:
                        tx_by_payment_uuid[payment_uuid] = self.env[
                            "glory.transaction"
                        ].search(
                            [("pos_payment_uuid", "=", payment_uuid)],
                            limit=1,
                        )
            for p in pos_order.payment_ids:
                payment_uuid = p.uuid
                if (
                    p.payment_method_id.is_glory_machine
                    and payment_uuid
                    and tx_by_payment_uuid
                ):
                    tx = tx_by_payment_uuid.get(payment_uuid)
                    if not tx:
                        tx = self.env["glory.transaction"].search(
                            [("pos_payment_uuid", "=", payment_uuid)],
                            limit=1,
                        )
                    if tx and not tx.order_id:
                        tx.write({"order_id": pos_order.id})
                        continue
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
        if not self.env.user.has_group("point_of_sale.group_pos_manager"):
            raise AccessError("Operation Allowed only for Pos Managers.")

        for order in self:
            for p in order.payment_ids:
                if p.payment_method_id.is_glory_machine and p.uuid:
                    linked_transaction = self.env["glory.transaction"].search(
                        [("pos_payment_uuid", "=", p.uuid)],
                        limit=1,
                    )
                    if linked_transaction:
                        linked_transaction.write({"order_id": order.id})
                        continue
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
