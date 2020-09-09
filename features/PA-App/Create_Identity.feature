@pa-app
Feature: Create Identity

  Scenario: No consent
    Given a PA is at the "create identity" step
    Given a message with a "consent question" is shown
    Given a button with "I agree" is shown
    Given a button with "I disagree" is shown
    When the PA presses "I disagree"
    Then the page is reloaded

  Scenario: With consent
    Given a PA is at the "create identity" step
    Given a message with a "consent question" is shown
    Given a button with "I agree" is shown
    Given a button with "I disagree" is shown
    When the PA presses "I agree"
    Then the "create username" field is shown
    When the PA enters a "username" and presses "submit"
    Then the "create password" field is shown
    When the PA enters a "password" and presses "submit"
    Then the "confirm password" field is shown
    When the PA enters the same "password" and presses "submit"
    Then the identity is created
    And a positive feedback message is shown
