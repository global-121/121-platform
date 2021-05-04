@aw-app
Feature: Validate Person Affected

  Background:
    Given a logged-in "field-validation" user
    And the user has retrieved the Person Affected's Validation Data (see feature "Get Person Affected Validation Data")

  Scenario: Validate PA-data without Financial Service Provider questions
    Given the "validate program questions" component is shown
    And there are no Financial Service Provider questions
    When user confirms the current answers
    Then a summary of answers is shown 
    And the options to "save" and to "change information" are shown
    When the user "saves" the answers
    Then a positive feedback message is shown
    And the "validate Financial Service Provider questions" component is shown
    And it confirms there are no Financial Service Provider questions
    And a "Back to main menu" button is shown
    When the user presses "back to main menu"
    Then the "main menu" component is shown
    And the "Upload validation data" option has a "counter" badge with a number that is one higher than before

  Scenario: Validate PA-data with Financial Service Provider questions
    Given the "validate program questions" component is shown
    And there is at least one Financial Service Provider question
    When user confirms the current answers
    Then a summary of answers is shown 
    And the options to "save" and to "change information" are shown
    When the user "saves" the answers
    Then a positive feedback message is shown
    And the "validate Financial Service Provider questions" component is shown
    When user confirms the current answers
    Then a positive feedback message is shown
    And a "Back to main menu" button is shown
    Then the "main menu" component is shown
    And the "Upload validation data" option has a "counter" badge with a number that is one higher than before


