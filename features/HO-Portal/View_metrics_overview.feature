@ho-portal
Feature: View metrics overview

  Scenario: View metrics overview successfully
    Given a logged-in "project-officer" user
    When the user views the page "program-details"
    And a date for "Last updated" is shown

  Scenario: Refresh metrics overview
    Given a logged-in "project-officer" user
    Given the user viewed the metrics overview before
    Given any program-metrics have changed
    When the user clicks the "update"-button
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown
