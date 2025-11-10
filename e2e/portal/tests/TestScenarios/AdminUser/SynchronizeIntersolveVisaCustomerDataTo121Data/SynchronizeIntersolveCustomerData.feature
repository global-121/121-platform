Feature: Synchronize Intersolve Customer Data
  As an admin user
  I want to synchronize Intersolve Visa customer data with 121 data
  So that customer information is kept up to date between systems

  Background:
    Given the 121 Platform is running
    And Intersolve integration is configured

  @api @automated @admin @intersolve @synchronization
  Scenario: Successfully synchronize Intersolve customer data with 121 data
    Given a logged-in "admin" user in the Swagger UI
    And a PA with FSP "Intersolve Visa"
    And the "programId" is provided
    And the "referenceId" is provided
    And potentially phone number and/or address fields are updated in the 121-Platform (or not, this endpoint just syncs)
    When the user calls the "/programs/{programId}/registration/{referenceId}/financial-service-providers/intersolve-visa/contact-information" endpoint
    Then the phone number and the address fields of the Intersolve Customer are updated at Intersolve to be the same as in the 121 registration
    And if non-mock, this could be checked by accessing the Intersolve customer API directly (integration environment only)
