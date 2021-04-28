@aw-app
Feature: Upload validation data

  Background:
    Given a logged-in "field-validation" user
    Given the user is on the "actions" page

  Scenario: Show pending validation data
    Given validated data for at least "1" PA is available
    When the user sees the "main menu"
    Then a label with value "1" is shown in the "upload validation data"-option

  Scenario: Upload validation data
    Given there is internet connectivity
    Given validated data for at least "1" PA is available
    Given the "main menu" is shown
    When the user presses "upload validation data"
    Then the validation data is uploaded
    And a positive feedback message is shown
    And a button "back to main menu" is shown
