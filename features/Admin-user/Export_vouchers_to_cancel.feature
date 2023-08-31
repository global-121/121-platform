@admin
Feature: Export vouchers to cancel (see WORKFLOWS.md for background)

  Background:
    Given 1 or more programs with "Intersolve" FSP
    Given a logged-in "admin" user on Swagger

  Scenario: Exporting vouchers to cancel
    When the user calls the '/metrics/to-cancel-vouchers' endpoint
    Then it returns an array
    And it contains vouchers to cancel for all programs in that instance

