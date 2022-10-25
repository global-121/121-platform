@ho-portal
Feature: View metrics overview

  Background:
    Given a logged-in user with the "ProgramMetricsREAD" permissions

  Scenario: View metrics overview successfully
    Given the user sees the "dashboard" page
    Then a date for "Last updated" is shown

  Scenario: Refresh metrics overview
    Given the user viewed the metrics overview before
    Given any program-metrics changed
    When the user clicks the "update"-button
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown

  Scenario: View PA's helped till date
    Given a logged-in user
    When the user views the "dashboard" page
    Then total number of PA's helped is shown
    And a date for "Last updated" is shown
