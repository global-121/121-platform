@aw-app
Feature: Download validation data

  Background:
    Given a logged-in user with "RegistrationPersonalForValidationREAD" permission
    Given the user is on the "actions" page

  Scenario: Downloading validation data successfully
    Given the user sees the "main menu" options
    Given "X" PAs who have filled in program questions and are not validated yet for all programs the "field-validation" user is assigned to
    When the user selects the "download validation data" option
    Then a message "data is being downloaded" is shown
    And when finished a message "data is downloaded for X People Affected" is shown
    And the validation data is stored in local storage where it replaces any existing validation data
    And the "main menu" is shown

  Scenario: Downloading validation data unsuccessfully because no available data
    Given the user sees the "main menu" options
    Given 0 PAs who have filled in program questions and are not validated yet for all programs the "field-validation" user is assigned to
    When the user selects the "download validation data" option
    Then a message "No validation data could be downloaded at this time" is shown
    And the "main menu" is shown

  Scenario: No internet connectivity
    Given the user sees the "main menu" options
    When there is no internet connectivity
    Then the 'Download validation data' option is disabled
    And an 'OFFLINE' marker is visible in the header
