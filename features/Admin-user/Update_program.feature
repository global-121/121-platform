@swagger-ui
Feature: Update Program

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update properties of program
    Given the "programId" is provided
    Given 0 or more other program attributes are provided 
    When the user fills in the body properties
    And calls the "/programs/{programId}/update" endpoint
    Then only the provided properties of the "program" are updated
    And the whole "program" object is returned


Scenario: Successfully reset program
    Given the "script" is provided
    When user selects script
    And enters value 'password' for 'secret'
    And calls the "/programs/{programId}/update" endpoint
    Then program is reset to selected one
    And code 201 is displayed
