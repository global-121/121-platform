@aw-app
Feature: Download validation data

  Background:
    Given a logged-in "aidworker" user
    Given the user is in the "validation" tab

  Scenario: Downloading validation data successfully
    Given the user sees the "main menu" options
    Given "X" Persons Affected who have filled in program questions and are not validated yet for all programs the "aidworker" is assigned to
    When the user selects the "download validation data" option
    Then the user sees a message that "data is being downloaded"
    And when finished the user sees a message that "data is downloaded" for "X" Persons Affected
    And the validation data is stored in local storage where it replaces any existing validation data
    And the "main menu" is shown again

  Scenario: Downloading validation data unsuccessfully
    Given there is "no/bad internet"
    When the user selects the "download validation data" option
    Then the user sees a popup that asks to try again
    And the user can try again until it works
    And the user can cancel and come back later
