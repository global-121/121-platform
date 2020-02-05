@ho-portal
Feature: Manage people enrolled in a program

  Background:
    Given a logged-in "program-manager" user
    Given the user views the page "program-details"


  Scenario: View people enrolled in a program
    Given a program property "X" representing the number of people to include
    When the user clicks the "manage people"-button
    Then the page "manage people" is shown
    And a table with all "people enrolled & not yet in/excluded in a program" is shown
    And for each person a "number" is shown
    And for each person a "inclusion score" is shown
    And for each person a "created date" is shown
    And for each person a "updated date" is shown
    And for each person a "include checkbox" is shown
    And the "include checkbox" is checked for the "X" persons with highest value of "inclusion score"
    And the total number of "people to include" equal to "X" is shown
    And the total number of "people enrolled & not yet in/excluded in a program" is shown

  Scenario: Sort people enrolled in a program by property(score, creation-date, update-date)
    Given the user views the page "manage people"
    Given a table with all "people enrolled & not yet in/excluded in a program" is shown
    When the user clicks a column-header ("score|created|updated")
    Then the rows show in "ascending, descending or initial" order

  Scenario: In/Exclude people
    Given the user views the page "manage people"
    Given a table with all "people enrolled & not yet in/excluded in a program" is shown
    When the user checks/unchecks an "include checkbox"
    Then the row of that "include checkbox" gains/loses its "selection styling"
    And the total number of "people to include" is updated

  Scenario: Show number of people to include/exclude
    Given the user views the page "manage people"
    Given a table with all "people enrolled in a program" is shown
    When the user clicks the "confirm inclusion decision"-button
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the total number of PA to include/exclude
    And the button "OK" is shown
    And the button "Cancel" is shown

  Scenario: Submit people to include/exclude
    Given the user views the page "manage people"
    Given a table with all "people enrolled in a program" is shown
    When the user clicks the "confirm inclusion decision"-button
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the list of people is submitted
    And the table is reloaded to a table with 0 rows
