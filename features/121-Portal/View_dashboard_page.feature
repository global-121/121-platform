@ho-portal
Feature: View dashboard page

  Background:
    Given a logged-in user with the "ProgramMetricsREAD" permissions
    Given the user views the "dashboard"-page

  Scenario: View PA-status metrics table successfully
    When the user views the "dashboard"-page
    Then the PA-status metrics table is showing on the top right
    And a date for "Last updated" is shown with a refresh button
    And the "most recent payment" is selected in the 'Payment #' row
    And the "most recent calendar month" is selected in the 'Calendar month' row
    And there is a column for each possible PA status, including "deleted"
    And for all rows and columns in the table an info-icon is shown
    And for all rows in the table numbers are shown

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

  Scenario: View metrics overview successfully
    When the user sees the "dashboard" page
    Then the "metrics overview" is showing at the bottom
    And it contains sections on main attributes (yellow), financial attributes (cyan), PA metrics (brown) and aidworkers (orange)
    And a date for "Last updated" is shown with a refresh button

  Scenario: View PAs helped to date
    When the user views the "dashboard" page
    Then total number of PA's helped is shown on the right below the "PA-status metrics table"
    And it shows the total number of PA's helped to date
    And it also still includes "deleted" PAs
    And a date for "Last updated" is shown with a refresh button
    And an info icon is shown

  Scenario: View pre-existing and new PAs per payment chart
    When the user views the "dashboard" page
    Then the chart is showing on the left below the "PA-status metrics table"
    And it shows all the payments - as defined by the "distribution duration" property of the program - on the x-axis
    And it shows the number of PAs per payment on the y-axis
    And it also still includes "deleted" PAs
    And they are split in "new" and "pre-existing" PAs, based on that payment being their first payment or not
    And an info-icon is shown
    And a "last updated" timestamp is shown with a refresh button
  
  Scenario: Refresh any element of the dashboard page
    Given the user has opened the "dashboard page" before
    When the user clicks the "update"-button on an element
    Then the most recent values for all metrics are shown
    And a new date for "Last updated" is shown


  


