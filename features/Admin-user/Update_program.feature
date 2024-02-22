@swagger-ui
Feature: Update Program

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully update properties of program
    Given the "programId" is provided
    When user calls the "PATCH /programs/{programId}" endpoint
    And 1 or more other program attributes are provided
    Then only the provided properties of the "program" are updated
    And the whole "program" object is returned

  Scenario: Successfully add Financial Service Provider to a program
    Given the "programId" is provided
    When user calls the "PATCH /programs/{programId}" endpoint
    And 1 or more FSPs are provided that are not yet configured for this program
    Then these FSPs are added to the program
    And the whole "program" object is returned

  Scenario: Unsuccessfully add non-existing Financial Service Provider to a program
    Given the "programId" is provided
    When user calls the "PATCH /programs/{programId}" endpoint
    And 1 or more FSPs are provided that do not exist in the instance
    Then a 400 Bad Request response is returned with a message with more information about the error

