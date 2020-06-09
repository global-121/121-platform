@ho-portal
Feature: Select people affected for validation

  Background:
    Given a logged-in "project-officer" user
    Given the "active phase" is "registration & validation"

  Scenario: View people affected connected to a program
    When the user views the "program" page
    Then a table with all "people connected to a program" is shown
    And for each person the "Select" column is empty
    And for each person a "PA row identifier" is shown
    And for each person a "Created Digital ID" date+time is shown
    And for each person a "Completed Vulnerability Assessment" date+time is shown (if already available)
    And for each person a "Temporary Inclusion Score" is shown (if already available)
    And for each person a "Selected for validation" date+time is shown (if already available)
    And for each person a "Validated Vulnerability Assessment " date+time is shown (if already available)
    And for each person a "Validate Inclusion Score" is shown (if already available)
    And above the table a list of "bulk actions" is shown
    And next to it an "apply action" button is shown and it is "disabled"

  Scenario: View available actions
    When the user opens up the "choose action" dropdown
    Then a list appears with only "select for validation" as option
    And this is dependent on the currently logged-in "user" and "active phase" of the program
    And all other "users" and "phases" return no actions currently

  Scenario: Select "bulk action" while rows eligible
    Given at least 2 people are eligible for the "bulk action"
    When the user selects a "bulk action"
    Then the dropdown now shows the name of the "bulk action" instead of "choose action"
    And the "apply action" button is "enabled"
    And a "row checkbox" appears in the "select" column for eligible rows
    And a "header checkbox" appears in the "select" column

  Scenario: Select "bulk action" while no rows eligible
    Given no people are eligible for the "bulk action"
    When the user selects a "bulk action" from the dropdown
    Then a popup with the message "no people are eligible" is shown
    And the dropdown is reset to the default "choose action" option

  Scenario: Use bulk-action "select for validation"
    Given the generic "select bulk action" scenario
    When user selects the "select for validation" action
    Then the eligible rows are those with a "temporary inclusion score" entry and without a "selected for validation" entry

  Scenario: Sort people enrolled in a program by property(score, creation-date, update-date)
    Given a table with all "people connected to a program" is shown
    When the user clicks a column-header
    Then the rows show in "ascending, descending or initial" order

  Scenario: Select a row
    Given a "bulk action" is selected
    And "row checkboxes" have appeared for eligible rows
    And all "row checkboxes" are unchecked
    When the "user" clicks on the checkbox
    Then the row styling reflects selection by turning "blue"
    And the footer shows an updated number of selected people

  Scenario: Select all rows given no row selection
    Given a "bulk action" is selected
    And the "header checkbox" has appeared
    And the "header checkbox" is unchecked
    When the "user" checks the "header checkbox"
    Then all "row checkboxes" are selected and the "header checkbox" is selected
    When the "user" un-checks the "header checkbox"
    Then all "row checkboxes" are selected and the "header checkbox" is selected

  Scenario: Deselect all rows given full selection
    Given current "full" selection
    When unchecking "header checkbox"
    Then all "row checkboxes" are unchecked

  Scenario: Select all rows given partial selection
    Given current "partial" selection
    When user checks "header checkbox"
    Then all "row checkboxes" are checked

  Scenario: Unselect row given full selection
    Given current "full" selection
    When user un-checks single "row checkbox"
    Then the "header checkbox" also un-checks

  Scenario: Select row given (N-1) selection
    Given currently all eligible rows except 1 are selected
    When user checks last eligible row through "row checkbox"
    Then "header checkbox" also automatically checks

  Scenario: Apply action
    Given a "bulk action" is selected
    And 0 or more rows are selected
    When "user" clicks "apply action"
    Then a popup appears which lists which "bulk action" will be applied to "how many" people affected
    And it has a "confirm" button and a "cancel" button

  Scenario: Confirm apply action
    Given the confirm popup has appeared
    When "user" clicks confirm
    Then the popup disappears
    And the "changed data" is reflected in the table
    And the "action" dropdown is reset
    And the "apply action" is "disabled" again
    And all "row checkboxes" and "header checkbox" disappear

  Scenario: Confirm "select for validation" action
    Given the generic "confirm apply action" scenario
    When the "bulk action" is "select for validation"
    Then the "changed data" is that the "selected for validation" timestamp is filled for the selected rows
