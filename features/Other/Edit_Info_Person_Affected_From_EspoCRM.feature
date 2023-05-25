@swagger-ui
Feature: Edit info From ESPO CRM

Background:
Given a user in the Swagger UI

Scenario: Successfully Update FSP from Whatsapp to Jumbo from EspoCRM

    Given the "programId" is provided
    Given the "refferenceId" is provided
    Given the "NewFspAttributes" is provided
    When 'newFspName' value is entered as 'Intersolve-jumbo-physical'
    And the user has filled in values for "NewFspAttributes"
    And calls the "registrations/update-chosen-fsp" endpoint
    Then for PA FSP is changed 
    And Code 201 is displayed

Scenario: Successfully Update FSP from Jumbo to Whatsapp from EspoCRM

    Given the "programId" is provided
    Given the "refferenceId" is provided
    Given the "NewFspAttributes" is provided
    When 'newFspName' value is entered as 'Intersolve-voucher-whatsapp'
    And the user has filled in values for "NewFspAttributes"
    And calls the "registrations/update-chosen-fsp" endpoint
    Then for PA FSP is changed 
    And Code 201 is displayed

Scenario: Unsuccessfully Update FSP from EspoCRM
    Given the "programId" is provided
    Given the "refferenceId" is provided
    When 'newFspName' value is Intersolve-jumbo-physical
    And it is changed to 'asdf'   
    And calls the "registrations/update-chosen-fsp" endpoint
    Then Code 400 is displayed