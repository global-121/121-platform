Feature: Update Program Registration Attribute
  As an admin user
  I want to update program registration attributes
  So that I can modify registration field configurations and properties

  Background:
    Given the 121 Platform is running
    And there are existing programs with registration attributes in the system

  @api @automated @admin @program @registration-attribute @update
  Scenario: Successfully update properties of program registration attribute
    Given the "programId" is provided
    And the required property "attributeName" is provided and is existing in the database
    And 0 or more other attributes are provided
    When the user fills in the body properties
    And calls the "PATCH /programs/{programId}/registration-attributes/${attributeName}" endpoint
    Then only the provided properties of the existing "program registration attribute" are updated
    And the whole "program registration attribute" object is returned

  @api @automated @admin @program @registration-attribute @error-handling
  Scenario: Unsuccessfully update unknown program registration attribute
    Given the required property "attributeName" is provided and is not existing in the database
    When the user fills in the body properties
    And calls the "PATCH /programs/{programId}/registration-attributes/${attributeName}" endpoint
    Then a 404 response is returned with a message that the "program registration attribute" is not found
