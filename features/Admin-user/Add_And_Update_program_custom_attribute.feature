@swagger-ui
Feature: Add and Update Program Custom Attribute

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully add custom attributes of program
    Given the "programId" is provided
    Given the required properties "name", "type", "label" (and unrequired "phases") for this "Custom Attribute" have been provided
    Given the provided combination of "name" and "programId" does not exist in the database 
    When the user fills in the body properties
    And calls the "/programs/{programId}/update/program-custom-attributes" endpoint
    Then a "Custom Attribute" with all its attributes is created and returned as response

  Scenario: Successfully update custom attributes of program
    Given the "programId" is provided
    Given the required property "name" for this "Custom Attribute" have been provided
    Given the provided combination of "name" and "programId" does already exist in the database 
    When the user fills in the "name" and a subset of other attributes "type", "label" and "phases"
    And calls the "/programs/{programId}/update/program-custom-attributes" endpoint
    Then the existing "Custom Attribute" is updated only with the provided values
    And the response only contains the updated properties
