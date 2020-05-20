@ho-portal
Feature: Update_inclusion_decision

  Background:
    Given a logged-in "program-manager" user
    Given the user views the "program" page

  Scenario: View people in/excluded in a program
    When the user views the "program" page
    Then a table with all "in/excluded people" is shown
    And for each person a "Process started" date is shown 
    And for each person a "Digital ID Applied" date is shown
    And for each person a "Vulnerability Assessment Applied" date is shown and it is now equal to "Digital ID Applied" date
    And for each person a "Digital ID Validated" date is shown
    And for each person a "Vulnerability Assessment Validated" date is shown and it is now equal to "Digital ID Validated" date
    And for each person a "inclusion score" is shown
    And for each person a "include checkbox" is shown if "selected phase" is "active phase" and "active phase" is "Inclusion" or "Review inclusion" or "Payment"
    And the "include checkbox" is checked for the "included" persons and unchecked for "excluded" persons
    And for each person a current "included status" is shown
    And for each person a "Inclusion communication" date is shown if already available
    And for each person a "Payment" date is shown if already available, for each installment
    And for each person a "name" is shown
    And for each person a "date of birth" is shown
    And an "update inclusion decision" button is shown 
    And this button is enabled if "selected phase" is "active phase" and "active phase" is "Inclusion" or "Review inclusion" or "Payment"

  Scenario: Sort people in/excluded in a program by property(score, creation-date, update-date, name, date-of-birth)
    Given the user views the "program" page
    Given a table with all "in/excluded people" is shown
    When the user clicks a column-header
    Then the rows show in "ascending, descending or initial" order

  Scenario: Select people to in/exclude
    Given the user views the "program" page
    Given a table with all "people enrolled & not yet in/excluded in a program" is shown
    When the user checks/unchecks an "include checkbox"
    Then the row of that "include checkbox" gains/loses its "selection styling"

  Scenario: Show number of people to update
    Given the user views the page "manage people"
    Given a table with all "in/excluded people" is shown
    When the user clicks the "update inclusion status"-button
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the total number of PA to transfer from include to exclude and vice versa
    And the button "OK" is shown
    And the button "Cancel" is shown

  Scenario: Submit people to include/exclude
    Given the user views the page "manage people"
    Given a table with all "in/excluded people" is shown
    When the user clicks the "update inclusion status"-button
    Given the pop-up "Are you sure?" is shown
    When the user clicks the button "OK"
    Then the list of people is submitted
    And the table is reloaded
