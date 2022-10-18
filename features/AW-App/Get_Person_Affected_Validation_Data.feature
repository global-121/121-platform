@aw-app
Feature: Get Person Affected Validation Data

  Background:
    Given a logged-in user with "RegistrationPersonalForValidationREAD" permission
    And the user is on the "actions" page

  Scenario: Successfully get PA-data when online, with PA-data available
    Given there is internet-connectivity
    And the PA-data is available online
    And the PA-data is not available offline
    And a valid phonenumber is used
    When the phonenumber is entered
    Then a positive feedback message is shown
    And the correct PA-data is loaded
    And the "validate-program"-component is shown

  Scenario: Unsuccessfully get PA-data when online with incorrect phonenumber
    Given there is internet-connectivity
    And the PA-data is not available online
    And the PA-data is not available offline
    When an incorrect phonenumber is entered
    Then the message: "No Person Affected found with this phonenumber. Please try again by changing the phonenumber above and pressing the button again." is shown

  Scenario: Successfully get PA-data when offline, with the PA-data available
    Given there is no internet-connectivity
    And the PA-data is available offline
    And a valid phonenumber is being used
    When the phonenumber is entered
    Then the correct PA-data is loaded
    And a positive feedback message is shown
    And the "validate-program"-component is shown

