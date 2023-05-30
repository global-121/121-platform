@swagger-ui
Feature: Edit info From ESPO CRM

Background:
Given a user in the Swagger UI

Scenario: Successfully Update FSP from Whatsapp to Jumbo from EspoCRM

    Given the "programId" is provided
    Given the "referenceId" is provided
    Given the "NewFspAttributes" is provided
    Given 'newFspName' value is entered as 'Intersolve-jumbo-physical'
    Given the user has filled in values for "NewFspAttributes"
    When calls the "registrations/update-chosen-fsp" endpoint
    Then for PA FSP is changed 
    And Code 201 is displayed

Scenario: Successfully Update FSP from Jumbo to Whatsapp from EspoCRM

    Given the "programId" is provided
    Given the "referenceId" is provided
    Given the "NewFspAttributes" is provided
    Given 'newFspName' value is entered as 'Intersolve-voucher-whatsapp'
    Given the user has filled in values for "NewFspAttributes"
    When calls the "registrations/update-chosen-fsp" endpoint
    Then for PA FSP is changed 
    And Code 201 is displayed

Scenario: Unsuccessfully Update FSP from EspoCRM
    Given the "programId" is provided
    Given the "referenceId" is provided
    Given 'newFspName' value is 'asdf'   
    When calls the "registrations/update-chosen-fsp" endpoint
    Then Code 400 is displayed