Feature: Export Vouchers to Cancel
  As an admin user
  I want to export vouchers that need to be cancelled
  So that I can manage voucher cancellations across all programs in the instance

  Background:
    Given the 121 Platform is running
    And there are programs with "Intersolve-voucher-whatsapp" FSP

  @api @manual @admin @voucher-export
  Scenario: Exporting vouchers to cancel
    Given 1 or more programs with "Intersolve-voucher-whatsapp" FSP
    And a logged-in "admin" user on Swagger
    When the user calls the '/metrics/to-cancel-vouchers' endpoint
    Then it returns an array
    And it contains vouchers to cancel for all programs in that instance
