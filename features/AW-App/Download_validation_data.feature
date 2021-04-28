@aw-app
Feature: Download validation data

  Background:
    Given a logged-in "field-validation" user
    Given the user is on the "actions" page

  Scenario: Downloading validation data successfully
    Given the user sees the "main menu" options
    Given "X" PA who have filled in program questions and are not validated yet for all programs the "field-validation" user is assigned to
    When the user selects the "download validation data" option
    Then a message "data is being downloaded" is shown
    And when finished a message "data is downloaded for X People Affected" is shown
    And the validation data is stored in local storage where it replaces any existing validation data
    And the "main menu" is shown

  Scenario: Downloading validation data unsuccessfully
    Given there is no internet connectivity
    When the user selects the "download validation data" option
    Then a popup that asks to try again is shown
    And the user can try again until it works
    And the user can cancel and come back later
