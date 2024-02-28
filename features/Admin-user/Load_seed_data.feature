@swagger-ui
Feature: Load seed data

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Reset instance and program data sucessfully
    Given the "secret" is provided
    Given the "script" is provided
    When the user calls the "/api/scripts/reset" endpoint
    Then status code 202 is returned
    And 1 or mor programs show in the Portal, depending on the chosen "script"

  Scenario: Reset instance and program data with mock registration data sucessfully
    Given the "secret" is provided
    Given the provided "script" is "nlrc-multiple-mock-data"
    Given "mockPv" or "mockOcw" or both are true
    Given positive numbers are provided for "mockPowerNumberRegistrations", "mockNumberPayments" and "mockPowerNumberMessages"
    When the user calls the "/api/scripts/reset" endpoint
    Then status code 202 is returned
    And both programs show in the Portal
    And registrations, payments and messages show in the Portal