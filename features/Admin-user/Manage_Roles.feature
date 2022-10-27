@swagger-ui
Feature: View, Add and Edit roles

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: View all roles with permissions in current program
    When the user calls the GET "/roles" endpoint
    Then a list of roles with correspondig permissions is returned

  Scenario: Successfully add role
    Given a "role" that does not exist yet
    Given the new "Role" is provided
    Given the required attributes "label" and "permissions" for this "Role" have been provided
    When the user fills in the "role" and the "label" and the "permissions" in as body
    And calls the POST "/roles" endpoint
    Then a "Role" is created and returend as response

  Scenario: Unsuccessfully try to add role that already exists
    Given a "role" that already exists
    Given the new "Role" is provided
    Given the required "attributes" for this "Role" have been provided
    When the user fills in the "role" and the "label" and the "permissions" in as body
    And calls the POST "/roles" endpoint
    Then a status 400 is returned with a message that "Role exists already"

  Scenario: Successfully update role
    Given an existing roleId
    Given the required "attributes" for this "Role" have been provided
    When the user fills in the "label" and the "permissions" in as body
    And calls the PUT "/roles/:roleId" endpoint
    Then a "Role" with all its attributes is returned"

  Scenario: Unsuccessfully try to update unknown role
    Given an unkonwn roleId
    When the user fills in the "label" and the "permissions" in as body
    And calls the PUT "/roles/:roleId" endpoint
    Then a 404 response is returned that the role is not found

  Scenario: Successfully delete role
    Given the "Role" id is provided
    When the user calls the DELETE "/roles/:roleId" endpoint
    Then a success response (200) is returned

  Scenario: Unsuccessfully try to delete unknown role
    Given an unkonwn roleId
    And calls the DELETE "/roles/:roleId" endpoint
    Then a 404 response is returned that the role is not found
