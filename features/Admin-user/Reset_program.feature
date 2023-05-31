@swagger-ui
Feature: Reset Program

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Reset program sucessfully
    Given the "script" is provided
    Given the "secret" is provided
    When calls the "/api/scripts/reset" endpoint
    Then code 202 is displayed
    And list of selected programs are displayed in portal