@swagger-ui
Feature: Synchronize Intersolve Visa customer data to 121 data

  Background:
    Given a logged-in "admin" user in the Swagger UI
    Given a PA with FSP "Intersolve Visa"

  Scenario: Successfully synchronize Intersolve customer data with 121 data
    Given the "programId" is provided
    And the "referenceId" is provided
    And potentially phone number and/or address fields are updated in the 121-Platform (or not, this endpoint just syncs)
    When the user calls the "/api/programs/{programId}/fsp-integration/intersolve-visa/customers/{referenceId}" endpoint
    Then the phone number and the address fields of the Intersolve Customer are updated at Intersolve to be the same as in the 121 registration
