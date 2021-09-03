@swagger-ui
Feature: Update chosen Financial Service Provider of Person Affected

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully find "referenceId" of a Person Affected by name and/or phone-number
    Given a "name" or "phoneNumber" is provided
    When the user fills (one of) these in as body and calls the "/registrations/search-name-phone" endpoint
    Then a "registration" with all its attributes is returned including the "referenceId"

  Scenario: Successfully update Financial Service Provider of Person Affected
    Given the new "Financial Service Provider" is provided
    Given the required "attributes" for this "Financial Service Provider" have been provided
    Given the "referenceId" of the Person Affected is already found (see above)
    When the user fills in the "referenceId" and the "newFspName" and the "newFspAttributes" in as body
    And calls the "/registrations/update-chosen-fsp" endpoint
    Then a "registration" with all its attributes is returned
    And it should reflect the updated "customData" attribute to include the provided "attributes"
    And it should reflect the updated "customData" attribute to not include anymore "attributes" associated with the previous "Financial Service Provider"
    And the "PA-table" in the "HO-portal" should now reflect the new "Financial Service Provider" for this Person Affected
