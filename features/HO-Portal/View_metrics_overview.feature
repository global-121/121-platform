@ho-portal
Feature: View metrics overview

  Scenario: View metrics overview successfully
    Given a logged-in "project-officer" user
    When the user views the page "program-details"
    Then a number for "funds received" is shown
    And a number for "funds transferred" is shown
    And a number for "funds available" is shown
    And a date for "Last updated" is shown

  Scenario: Funds not available
    Given the "funding-service" is unavailable
    Given a logged-in "project-officer" user
    When the user views the page "program-details"
    Then a "?" for "funds received" is shown
    And a "?" for "funds transferred" is shown
    And a "?" for "funds available" is shown

  Scenario: Refresh metrics overview
    Given a logged-in "project-officer" user
    Given the user viewed the metrics overview before
    Given any program-metrics have changed
    When the user clicks the "update"-button
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown
