@pa-app
Feature: Receive Voucher

  Scenario: Receive supermarket voucher via WhatsApp
    When a "payout" is done from the "HO-portal"
    Then the "person-affected" receives the "payout voucher ready"-message on their "registered WhatsApp number"
