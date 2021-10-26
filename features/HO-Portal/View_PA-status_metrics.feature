@ho-portal
Feature: View PA-status metrics

  Background:
    Given a logged-in user with the "run program" role

  Scenario: View PA-status metrics successfully
    When the user views the "dashboard"-page
    Then a date for "Last updated" is shown
    And the "most recent payment" is selected
    And the "most recent calendar month" is selected
    And for all rows in the table numbers are shown

  Scenario: Refresh PA-status metrics
    Given the user viewed the PA-status metrics before
    Given any PA-status changed
    When the user clicks the "update"-button
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown

  Scenario: View PA-status metrics for specific payment
    Given the user views the "dashboard"-page
    When the user clicks the "Choose payment"-list
    Then a list of all past payments with their dates is shown
    When the user makes a selection from the list
    Then metrics are requested from the API for that "payment"
    And the most recent values for all metrics are shown
    And a new date for "Last updated" is shown

  Scenario: View PA-status metrics for specific month
    Given the user views the "dashboard"-page
    When the user clicks the "Choose month"-list
    Then a list of all past months where payments where done
    When the user makes a selection from the list
    Then metrics are requested from the API for that "year" + "month"
    And the most recent values for all metrics are shown
    And a new date for "Last updated" is shown

  Scenario: Export metrics as a CSV file
    Given the user views the "dashboard"-page
    When the user clicks the "export as csv"-button
    Then a CSV file is downloaded
    And it contains the translated headers and the data shown in the page

