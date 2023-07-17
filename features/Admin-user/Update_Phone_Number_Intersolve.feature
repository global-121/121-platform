@swagger-ui
Feature: Update phone number at Intersolve

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update properties of program
    Given the "programId" is provided
    And the "referenceId" is provided
    And the phone number is updated in the 121-Platform
    When the user calls the "/api/programs/{programId}/fsp-integration/intersolve-visa/customers/{referenceId}" endpoint
    Then the phone number of the Intersolve Customer is updated at Intersolve
