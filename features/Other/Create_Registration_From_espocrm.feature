@swagger-ui
Feature: Create Registration From ESPO CRM

Background:
Given a user in the Swagger UI

Scenario: Successfully create PA from EspoCRM
    Given the "programId" is provided
    And 'FspName' is "Intersolve-jumbo-physical"
    And the following body properties are filled in for three registrations: 'preferredLanguage', 'paymentAmountMultiplier', 'firstName', 'lastName','phoneNumber','fspName','whatsappPhoneNumber','addressStreet','addressHouseNumber','addressHouseNumberAddition','addressPostalCode','addressCity' and 'referenceId'
    And calls the "registrations/import" endpoint
    Then a "Custom Attribute" with all its attributes is created and returned as response
    And Code 201 is displayed


Scenario: Unsuccessfully create PA from EspoCRM
    Given the "programId" is provided
    And the following body properties are filled in for three registrations: 'preferredLanguage', 'paymentAmountMultiplier', 'firstName', 'lastName','phoneNumber','fspName','whatsappPhoneNumber','addressStreet','addressHouseNumber','addressHouseNumberAddition','addressPostalCode','addressCity' and 'referenceId'
    And "preferredLanguage" value is changed to "aaaa"
    And "phoneNumber" value is changed to 141552388861  
    And "referenceId" value is the same for all registrations
    And calls the "registrations/import" endpoint
    Then error code 400 is displayed as corresponding response