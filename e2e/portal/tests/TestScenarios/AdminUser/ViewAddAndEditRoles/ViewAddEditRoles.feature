Feature: View, Add and Edit Roles
  As an admin user
  I want to manage roles and their permissions
  So that I can control user access and permissions within the platform

  Background:
    Given the 121 Platform is running
    And there is a current program with role management capabilities

  @api @automated @admin @roles @view
  Scenario: View all roles with permissions in current program
    Given a logged-in "admin" user in the Swagger UI
    When the user calls the GET "/roles" endpoint
    Then a list of roles with corresponding permissions is returned

  @api @automated @admin @roles @create
  Scenario: Successfully add role
    Given a logged-in "admin" user in the Swagger UI
    And a "role" that does not exist yet
    And the new "Role" is provided
    And the required attributes "label" and "permissions" for this "Role" have been provided
    When the user fills in the "role" and the "label" and the "permissions" in as body
    And calls the POST "/roles" endpoint
    Then a "Role" is created and returned as response

  @api @automated @admin @roles @create @error-handling
  Scenario: Unsuccessfully try to add role that already exists
    Given a logged-in "admin" user in the Swagger UI
    And a "role" that already exists
    And the new "Role" is provided
    And the required "attributes" for this "Role" have been provided
    When the user fills in the "role" and the "label" and the "permissions" in as body
    And calls the POST "/roles" endpoint
    Then a status 400 is returned with a message that "Role exists already"

  @api @automated @admin @roles @update
  Scenario: Successfully update role
    Given a logged-in "admin" user in the Swagger UI
    And an existing roleId
    And the required "attributes" for this "Role" have been provided
    When the user fills in the "label" and the "permissions" in as body
    And calls the PUT "/roles/:roleId" endpoint
    Then a "Role" with all its attributes is returned

  @api @automated @admin @roles @update @error-handling
  Scenario: Unsuccessfully try to update unknown role
    Given a logged-in "admin" user in the Swagger UI
    And an unknown roleId
    When the user fills in the "label" and the "permissions" in as body
    And calls the PUT "/roles/:roleId" endpoint
    Then a 404 response is returned that the role is not found

  @api @automated @admin @roles @delete
  Scenario: Successfully delete role
    Given a logged-in "admin" user in the Swagger UI
    And the "Role" id is provided
    When the user calls the DELETE "/roles/:roleId" endpoint
    Then a success response (200) is returned

  @api @automated @admin @roles @delete @error-handling
  Scenario: Unsuccessfully try to delete unknown role
    Given a logged-in "admin" user in the Swagger UI
    And roleId is unknown
    When admin calls the DELETE "/roles/:roleId" endpoint
    Then a 404 response is returned that the role is not found
