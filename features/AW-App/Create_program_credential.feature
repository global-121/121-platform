@aw-app
Feature: Create program credential

  Background:
    Given a logged-in "aidworker" user
    Given validation data of a PA is available

  Scenario: Create program credential
    Given the user validates the data of the PA
    When the user presses "Store program credential"
    Then the did is stored
    And a positive feedback message is shown
    And the "main menu" is shown
