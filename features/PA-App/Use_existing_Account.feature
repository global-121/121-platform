@pa-app
Feature: Use existing Account


  Scenario: Use existing Account
    Given the PA accesses the PA-App in a web-browser
    Given the "select language"-step is shown
    Given the PA selects a language
    Given the "sign-up/sign-in"-step is shown
    When the PA selects "Use existing Account"
    Then the "login account"-step is shown
    When the PA completes the step
    Then the conversation is cleared
    And the previously completed steps are shown as disabled
    And the last uncompleted step is shown
