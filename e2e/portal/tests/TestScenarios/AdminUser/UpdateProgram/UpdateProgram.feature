Feature: Update Program
  As an admin user
  I want to update program attributes
  So that I can modify program settings and configurations

  Background:
    Given the 121 Platform is running
    And there are existing programs in the system

  @api @automated @admin @program @update
  Scenario: Update program attributes successfully
    Given a logged-in "admin" user in the Swagger UI
    And the "programId" is provided
    When user calls the "PATCH /programs/{programId}" endpoint
    And 1 or more other program attributes are provided
    Then only the provided properties of the "program" are updated
    And the whole "program" object is returned
