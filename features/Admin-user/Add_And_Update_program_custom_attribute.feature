@swagger-ui
Feature: Add and Update Program Custom Attribute

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully add custom attributes of program
    Given the new "Custom Attribute" is provided
    Given the "programId" is provided
    Given the required "attributes" for this "Custom Attribute" have been provided
    When the user fills in the "name" and the "type" and the "label" in as body
    And calls the "/programs/{programId}/update/program-custom-attributes" endpoint
    Then a "Custom Attribute" with all its attributes is returned"

  Scenario: Successfully update custom attributes of program
    Given the new "Custom Attribute" is provided
    Given the "programId" is provided
    Given the required "attributes" for this "Custom Attribute" have been provided
    When the user fills in the "name" and in the "type" in as body
    And calls the "/programs/{programId}/update/program-custom-attributes" endpoint
    Then a "Custom Attribute" with all its attributes is returned
