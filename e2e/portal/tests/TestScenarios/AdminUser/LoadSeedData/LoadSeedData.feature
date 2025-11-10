Feature: Load Seed Data
  As an admin user
  I want to reset instance and program data with seed scripts
  So that I can set up test environments and load mock data for testing

  Background:
    Given the 121 Platform is running
    And an admin user has access to the Swagger UI

  @api @automated @admin @seed-data @reset
  Scenario: Reset instance and program data successfully
    Given a logged-in "admin" user in the Swagger UI
    And the "secret" is provided
    And the "script" is provided
    When the user calls the "/api/scripts/reset" endpoint
    Then status code 202 is returned
    And 1 or more programs show in the Portal, depending on the chosen "script"

  @api @automated @admin @seed-data @reset @mock-data
  Scenario: Reset instance and program data with mock registration data successfully
    Given a logged-in "admin" user in the Swagger UI
    And the "secret" is provided
    And the provided "script" is "nlrc-multiple-mock-data"
    And "mockPv" or "mockOcw" or both are true
    And positive numbers are provided for "mockPowerNumberRegistrations", "mockNumberPayments" and "mockPowerNumberMessages"
    When the user calls the "/api/scripts/reset" endpoint
    Then status code 202 is returned
    And both programs show in the Portal
    And registrations, payments and messages show in the Portal
