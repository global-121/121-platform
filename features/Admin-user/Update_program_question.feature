@swagger-ui
Feature: Update Program question

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update properties of program question
    Given the "programId" is provided
    Given the required property "name" is provided and is existing in the database
    Given 0 or more other attributes are provided 
    When the user fills in the body properties
    And calls the "/programs/{programId}/update/program-question" endpoint
    Then only the provided properties of the existing "program question" are updated
    And the whole "program question" object is returned

  Scenario: Unsuccessfully update unknown program question
    Given the required property "name" is provided and is not existing in the database
    When the user fills in the body properties
    And calls the "/programs/{programId}/update/program-question" endpoint
    Then a 404 response is returned with a message that the "program question" is not found
