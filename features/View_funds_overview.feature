@ho-portal
Feature: View funds overview

  Scenario: View funds overview successfully
    Given a logged-in "program-manager" user
    When the user views the page "program-details"
    Then a number for "funds received" is shown
    And a number for "funds transferred" is shown
    And a number for "funds available" is shown
    And a date for "Last updated" is shown

  Scenario: Funds overview not available
    Given the "funding-service" is unavailable
    Given a logged-in "program-manager" user
    When the user views the page "program-details"
    Then an error-message: "Funds overview not available" is shown

  Scenario: Refresh funds overview
    Given a logged-in "program-manager" user
    Given the user viewed the funds overview before
    Given the program-funds have changed
    When the user clicks the "update"-button
    Then a new number for "funds received" is shown
    And a new number for "funds transferred" is shown
    And a new number for "funds available" is shown
    And a new date for "Last updated" is shown

