@swagger-ui
Feature: Find "referenceId" of Person Affected

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully find "referenceId" of a Person Affected by phone-number
    Given a "phoneNumber" is provided
    When the user calls the "/registrations/search-phone" endpoint
    Then a "registration" with all its attributes is returned including the "referenceId"
