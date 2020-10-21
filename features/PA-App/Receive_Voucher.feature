@pa-app
Feature: Receive Voucher

  Scenario: Receive supermarket voucher via WhatsApp
    When the "project-officer" sends a "payout"
    Then the "person-affected" receives the "payout voucher" on their "registered whatsapp number"
