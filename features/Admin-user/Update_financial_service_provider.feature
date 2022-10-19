@swagger-ui
Feature: Update chosen Financial Service Provider of Person Affected

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update Financial Service Provider of Person Affected
    Given the new "Financial Service Provider" is provided
    Given the required "attributes" for this "Financial Service Provider" have been provided
    Given the "referenceId" of the Person Affected is provided
    When the user fills in the "referenceId" and the "newFspName" and the "newFspAttributes" in as body
    And calls the "/registrations/update-chosen-fsp" endpoint
    Then a "registration" with all its attributes is returned
    And it should reflect the updated "customData" attribute to include the provided "attributes"
    And it should reflect the updated "customData" attribute to not include anymore "attributes" associated with the previous "Financial Service Provider"
    And the "PA-table" in the "HO-portal" should now reflect the new "Financial Service Provider" for this Person Affected
