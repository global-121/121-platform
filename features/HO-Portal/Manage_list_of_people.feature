@ho-portal
Feature: Manage people connected to a program

  Background:
    Given a logged-in "project-officer" user
    Given a program property "X" representing the target number of people to include

  Scenario: View people enrolled in a program
    When the user views the "program" page
    Then a table with all "people connected to a program" is shown
    And for each person an "identifier" is shown
    And for each person a "Process started" date is shown 
    And for each person a "Digital ID Applied" date is shown if already available
    And for each person a "Vulnerability Assessment Applied" date is shown if already available and it is now equal to "Digital ID Applied" date
    And for each person a "Digital ID Validated" date is shown if already available
    And for each person a "Vulnerability Assessment Validated" date is shown if already available and it is now equal to "Digital ID Validated" date
    And for each person a "inclusion score" is shown if already available
    And for each person a "include checkbox" is shown if "selected phase" and "active phase" is "Inclusion" and if the person is not "included" or "excluded" yet
    And the "include checkbox" is checked for the "X" persons with highest value of "inclusion score"
    And for each person a "included result" is shown if already available
    And for each person a "Inclusion communication" date is shown if already available
    And for each person a "Payment" date is shown if already available for each installment
    And a "confirm inclusion decision" button is shown 
    And this button is enabled if "selected phase" and "active phase" is "Inclusion"

  Scenario: Sort people enrolled in a program by property(score, creation-date, update-date)
    Given a table with all "people connected to a program" is shown
    When the user clicks a column-header
    Then the rows show in "ascending, descending or initial" order

  Scenario: In/Exclude people
    Given a table with all "people connected to a program" is shown
    When the user checks/unchecks an "include checkbox"
    Then the row of that "include checkbox" gains/loses its "selection styling"

  Scenario: Show number of people to include/exclude
    Given a table with all "people connected to a program" is shown
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
    And the table is reloaded with columns "Included" and "Inclusion communication" now filled
