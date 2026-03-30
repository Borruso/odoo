# Copyright (C) 2024-Today:
# Dinamiche Aziendali srl (<http://www.dinamicheaziendali.it/>)
# @author: Giuseppe Borruso (gborruso@dinamicheaziendali.it)
# License GPL-3.0 or later (http://www.gnu.org/licenses/gpl.html).

{
    "name": "POS Glory Connector",
    "version": "16.0.1.0.0",
    "category": "Sales/Point of Sale",
    "summary": "This module allows communication between Odoo PoS and Glory devices",
    "website": "https://www.dinamicheaziendali.it",
    "license": "AGPL-3",
    "author": "Dinamiche Aziendali srl",
    "maintainers": ["Borruso"],
    "depends": [
        "base",
        "account",
        "web",
        "point_of_sale",
        "pos_hr",
    ],
    "data": [
        "security/glory_security.xml",
        "security/ir.model.access.csv",
        "data/data.xml",
        "data/mail_template.xml",
        "data/ir_cron.xml",
        "reports/glory_transaction_report_view.xml",
        "views/account_move_view.xml",
        "views/hr_employee_view.xml",
        "views/res_config_settings_view.xml",
        "views/glory_transaction_view.xml",
        "views/pos_session_view.xml",
        "views/pos_payment_method_view.xml",
        "views/pos_config_view.xml",
    ],
    "assets": {
        "point_of_sale.assets": [
            "pos_glory_connector/static/src/scss/*",
            "pos_glory_connector/static/src/js/ChromeWidgets/*",
            "pos_glory_connector/static/src/js/Popups/*",
            "pos_glory_connector/static/src/js/Screens/PaymentScreen/*",
            "pos_glory_connector/static/src/js/*",
            "pos_glory_connector/static/src/xml/ChromeWidgets/*",
            "pos_glory_connector/static/src/xml/Popups/*",
            "pos_glory_connector/static/src/xml/Screens/PaymentScreen/*",
            "pos_glory_connector/static/src/xml/*",
        ],
    },
    "images": ["static/description/icon.png"],
    "installable": True,
}
