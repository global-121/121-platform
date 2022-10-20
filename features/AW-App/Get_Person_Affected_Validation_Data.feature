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
    And the correct PA-data is loaded

  Scenario: Successfully show PA answers (without duplicate phonenumber & data found online)
    Given only one PA has been found with search by phone online
    Then the program answers are loaded
    And the fsp answers are loaded

  Scenario: Successfully show PA answers (with duplicate phonenumber data found online)
    Given multiple PA have been found with search by phone online
    And the full names are shown
    And the corresponding program labels are shown
    When a fullname is selected
    Then the program answers are loaded
    And the fsp answers are loaded


  Scenario: Successfully show PA answers (without duplicate phonenumber data found offline)
    Given only one PA has been found with search by phone from downloaded data
    Then the program answers are loaded
    And the fsp answers are loaded

  Scenario: Successfully show PA answers (with duplicate phonenumber  data found offline)
    Given multiple PA have been found with search by phone from downloaded data
    And the full names are shown
    And the corresponding program labels are shown
    When a fullname is selected
    Then the program answers are loaded
    And the fsp answers are loaded



