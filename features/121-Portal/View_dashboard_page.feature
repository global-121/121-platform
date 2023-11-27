@portal
Feature: View dashboard page

  Background:
    Given a logged-in user with the "ProgramMetricsREAD" permissions
    Given the user views the "dashboard"-page for a given "program"
    Given the "program" is not configured with a "monitoringDashboardUrl"
    Given the "program" has actual data and not generated mock data

  Scenario: View PA-status metrics table successfully
    When the user views the "dashboard"-page
    Then the PA-status metrics table is showing on the top right
    And a date for "Last updated" is shown with a refresh button
    And the "most recent payment" is selected in the 'Payment #' row
    And the "most recent calendar month" is selected in the 'Calendar month' row
    And there is a column for each possible PA status, including "deleted"
    And for all rows and columns in the table an info-icon is shown
    And for all rows in the table numbers are shown reflecting the chosen program

  Scenario: View PA-status metrics for specific payment
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

  Scenario: Export PA-status metrics as a CSV file
    Given the user views the "dashboard"-page
    When the user clicks the "export as csv"-button
    Then a CSV file is downloaded
    And it contains the translated headers and the data shown in the page

  Scenario: View PAs helped to date
    When the user views the "dashboard" page
    Then total number of PA's helped is shown on the right below the "PA-status metrics table"
    And it shows the total number of PA's helped to date for that program
    And it also includes PAs with only failed and waiting transactions
    And it also still includes "deleted" PAs
    And a date for "Last updated" is shown with a refresh button
    And an info icon is shown

  Scenario: Refresh any element of the dashboard page
    Given the user has opened the "dashboard page" before
    When the user clicks the "update"-button on an element
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown





