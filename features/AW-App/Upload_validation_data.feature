@aw-app
Feature: Upload validation data

  Background:
    Given a logged-in "field-validation" user

  Scenario: Upload validation data
    Given there is internet connection
    Given validate data for at least one PA is available
    When the user presses "Upload validation data"
    Then the validation data is uploaded
    And a positive feedback message is shown
    And a button "back to main menu" is shown
