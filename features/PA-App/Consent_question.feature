@pa-app
Feature: Consent question

  Scenario: No consent
    Given a PA is at the "consent question" step
    Given a message with a "consent question" is shown
    Given a button with "I agree" is shown
    Given a button with "I disagree" is shown
    When the PA presses "I disagree"
    Then the page is reloaded

  Scenario: Give consent
    Given a PA is at the "consent question" step
    Given a message with a "consent question" is shown
    Given a button with "I agree" is shown
    Given a button with "I disagree" is shown
    When the PA presses "I agree"
    Then the "sign-up/sign-in"-step is shown

