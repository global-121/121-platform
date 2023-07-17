@swagger-ui
Feature: Update phone number at Intersolve Visa

  Background:
    Given a logged-in "admin" user in the Swagger UI
    Given a PA with FSP "Intersolve Visa"

  Scenario: Successfully align Intersolve phone number with 121 phone number
    Given the "programId" is provided
    And the "referenceId" is provided
    And the phone number is updated in the 121-Platform (or not, this endpoint just aligns)
    When the user calls the "/api/programs/{programId}/fsp-integration/intersolve-visa/customers/{referenceId}" endpoint
    Then the phone number of the Intersolve Customer is updated at Intersolve to be the same as in the 121 registration
