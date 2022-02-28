@swagger-ui
Feature: View, Add and Edit roles

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: View all roles with permissions in current program
    When the user calls the "/roles" endpoint
    Then a list of roles with correspondig permissions is returned

  Scenario: Successfully add role
    Given the new "Role" is provided
    Given the required "attributes" for this "Role" have been provided
    When the user fills in the "role" and the "label" and the "permissions" in as body
    And calls the "/roles" endpoint
    Then a "Role" with all its attributes is returned"

  Scenario: Successfully update role
    Given the new "Role" is provided
    Given the required "attributes" for this "Role" have been provided
    When the user fills in the "label" and the "permissions" in as body
    And calls the "/roles/:roleId" endpoint
    Then a "Role" with all its attributes is returned"

  Scenario: Successfully delete role
    Given the "Role" id is provided
    When the user calls the "/roles/:roleId" endpoint
    Then a success response (200) is returned
