@swagger-ui
Feature: Update Program registration attribute

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update properties of program registration attribute
    Given the "programId" is provided
    Given the required property "attributeName" is provided and is existing in the database
    Given 0 or more other attributes are provided
    When the user fills in the body properties
    And calls the "PATCH /programs/{programId}/registration-attributes/${attributeName}" endpoint
    Then only the provided properties of the existing "program registration attribute" are updated
    And the whole "program registration attribute" object is returned

  Scenario: Unsuccessfully update unknown program registration attribute
    Given the required property "attributeName" is provided and is not existing in the database
    When the user fills in the body properties
    And calls the "PATCH /programs/{programId}/registration-attributes/${attributeName}" endpoint
    Then a 404 response is returned with a message that the "program registration attribute" is not found
