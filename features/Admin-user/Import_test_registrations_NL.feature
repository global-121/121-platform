@swagger-ui
Feature: Import test registrations NL

  Background:
    Given a logged-in "admin" user in the Swagger UI
    And an "NLRC" program is loaded

  Scenario: Successfully import test registrations via CSV 
    Given a valid import CSV file is prepared with "X" rows 
    And it has columns "namePartnerOrganization", "preferredLanguage", "nameFirst", "nameLast", "phoneNumber", "fspName", "whatsappPhoneNumber"
    And it has as delimiter ";" or ","
    When the user selects this file and fills in "programId" 1 and calls the /connection/import-test-registrations/ endpoint
    Then a loading spinner starts
    When finished
    Then feedback "Imported X PAs" is given
    And the PA-table in the HO-portal shows "X" new rows of PAs
    And they have status "Registered" 
    And all other columns are filled as if a real registration was done
    And no SMS is sent to the PA unlike a real registration
    And in the AW-app the validation data for these PAs can be downloaded

  Scenario: Unsuccessfully import test registrations via CSV
    Given an invalid import CSV file (wrong column names, unallowed values, etc.)
    When the user selects this file and fills in "programId" 1 and calls the /connection/import-test-registrations/ endpoint
    Then feedback is given that something went wrong and it gives details on where the error is