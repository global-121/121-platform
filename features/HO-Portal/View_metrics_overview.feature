@ho-portal
Feature: View metrics overview

  Scenario: View metrics overview successfully
    Given a logged-in user with the "run program" role
    When the user views the "dashboard" page
    And a date for "Last updated" is shown

  Scenario: Refresh metrics overview
    Given a logged-in user with the "run program" role
    Given the user viewed the metrics overview before
    Given any program-metrics changed
    When the user clicks the "update"-button
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown
