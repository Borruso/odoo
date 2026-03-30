# Copyright (C) 2025-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

from odoo import fields, models, tools


class GloryTransactionReport(models.Model):
    _name = "glory.transaction.report"
    _description = "Glory Transaction Analysis"
    _auto = False
    _rec_name = "dateday"
    _order = "dateday desc"

    company_id = fields.Many2one("res.company", string="Company", readonly=True)
    dateday = fields.Date(string="Date Day", readonly=True)
    config_id = fields.Many2one("pos.config", string="Point of Sale", readonly=True)
    start_balance = fields.Float(readonly=True)
    payment = fields.Float(readonly=True)
    cash_in = fields.Float(readonly=True)
    cash_out = fields.Float(readonly=True)
    collect = fields.Float(readonly=True)
    lock_bill = fields.Float(readonly=True)
    lock_coin = fields.Float(readonly=True)
    end_balance = fields.Float(readonly=True)

    def init(self):
        tools.drop_view_if_exists(self._cr, "glory_transaction_report")
        query = """
            CREATE or REPLACE view glory_transaction_report AS (
                SELECT
                    row_number() OVER() AS id,
                    company_id,
                    dateday,
                    config_id,
                    SUM(start_balance) AS start_balance,
                    SUM(payment) AS payment,
                    SUM(cash_in) AS cash_in,
                    SUM(cash_out) AS cash_out,
                    SUM(collect) AS collect,
                    SUM(lock_bill) AS lock_bill,
                    SUM(lock_coin) AS lock_coin,
                    SUM(end_balance) AS end_balance
                FROM (
                        SELECT
                            company_id,
                            datetime::TIMESTAMP::DATE AS dateday,
                            config_id,
                            (total_bills + total_coins) AS start_balance,
                            0 AS payment,
                            0 AS cash_in,
                            0 AS cash_out,
                            0 AS collect,
                            0 AS lock_bill,
                            0 AS lock_coin,
                            0 AS end_balance
                        FROM
                            glory_transaction
                        WHERE
                            id IN (
                                SELECT
                                    MIN(id)
                                FROM
                                    glory_transaction
                                GROUP BY
                                    company_id,
                                    datetime::TIMESTAMP::DATE,
                                    config_id
                            )
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        SUM(payment_amount) AS payment,
                        0 AS cash_in,
                        0 AS cash_out,
                        0 AS collect,
                        0 AS lock_bill,
                        0 AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation = 'payment_request'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        SUM(amount) AS cash_in,
                        0 AS cash_out,
                        0 AS collect,
                        0 AS lock_bill,
                        0 AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation = 'end_cashin_request'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        0 AS cash_in,
                        SUM(amount) AS cash_out,
                        0 AS collect,
                        0 AS lock_bill,
                        0 AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation = 'cashout_request'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        0 AS cash_in,
                        0 AS cash_out,
                        SUM(
                            diff_cassette_bill_100_00 * 100
                            + diff_cassette_bill_10_00 * 10
                            + diff_cassette_bill_200_00 * 200
                            + diff_cassette_bill_20_00 * 20
                            + diff_cassette_bill_500_00 * 500
                            + diff_cassette_bill_50_00 * 50
                            + diff_cassette_bill_5_00 * 5
                            + diff_cassette_coin_0_01 * 0.01
                            + diff_cassette_coin_0_02 * 0.02
                            + diff_cassette_coin_0_05 * 0.05
                            + diff_cassette_coin_0_10 * 0.1
                            + diff_cassette_coin_0_20 * 0.2
                            + diff_cassette_coin_0_25 * 0.25
                            + diff_cassette_coin_0_50 * 0.5
                            + diff_cassette_coin_1_00
                            + diff_cassette_coin_2_00 * 2
                        ) AS collect,
                        0 AS lock_bill,
                        0 AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation LIKE '%collect%'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        0 AS cash_in,
                        0 AS cash_out,
                        0 AS collect,
                        SUM(amount) AS lock_bill,
                        0 AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation = 'lock_bill_unit_request'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        0 AS cash_in,
                        0 AS cash_out,
                        0 AS collect,
                        0 AS lock_bill,
                        SUM(amount) AS lock_coin,
                        0 AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        operation= 'lock_coin_unit_request'
                    GROUP BY
                        company_id,
                        datetime::TIMESTAMP::DATE,
                        config_id
                UNION
                    SELECT
                        company_id,
                        datetime::TIMESTAMP::DATE AS dateday,
                        config_id,
                        0 AS start_balance,
                        0 AS payment,
                        0 AS cash_in,
                        0 AS cash_out,
                        0 AS collect,
                        0 AS lock_bill,
                        0 AS lock_coin,
                        (total_bills + total_coins) AS end_balance
                    FROM
                        glory_transaction
                    WHERE
                        id IN (
                            SELECT
                                MAX(id)
                            FROM
                                glory_transaction
                            GROUP BY
                                company_id,
                                datetime::TIMESTAMP::DATE,
                                config_id
                        )
                ) AS result_data
                GROUP BY
                    company_id,
                    dateday,
                    config_id
            )
        """
        self.env.cr.execute(query)
