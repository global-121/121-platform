@pa-app
Feature: Use existing Digital ID


  Scenario: Use existing Digital ID
    Given the PA accesses the PA-App in a web-browser
    Given the "select language"-step is shown
    Given the PA selects a language
    Given the "signup/signin"-step is shown
    When the PA selects "Use existing Digital ID"
    Then the "login identity"-step is shown
    When the PA completes the step
    Then the conversation is cleared
    And the previously completed steps are shown as disabled
    And the last uncompleted step is shown

