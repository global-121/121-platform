@pa-app
Feature: Create Digital ID

  This is a description of the overall flow a PA would go through initially.
  The specific contents of each step should be defined in their own separate features.

  Scenario: Create Digital ID (online)
    Given the PA accesses the PA-App in a web-browser
    Given the "select language"-step is shown
    Given the PA selects a language
    Given the "sign-up/sign-in"-step is shown
    When the PA selects "Create a Digital ID"
    Then the "create identity"-step is shown
    When the PA completes the step
    Then the "select country"-step is shown
    When the PA completes the step
    Then the "select program"-step is shown
    When the PA completes the step
    Then the "enroll in a program"-step is shown
    When the PA completes the step
    Then the "select financial service provider"-step is shown
    When the PA completes the step
    Then the "set notification number"-step is shown
    When the PA completes the step
    Then the "preprinted qr-code"-step is shown
    When the PA completes the step
    Then the "meeting reminder"-step is shown
    And the "store credential"-step is shown
    When the PA meets with an AidWorker and validation is completed
    Then the "handle proof"-step is shown
