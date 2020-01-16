@ho-portal
Feature: Manage people in/excluded in a program

  Background:
    Given a logged-in "administrator|privacy-officer" user
    Given the user views the page "program-details"


  Scenario: View people in/excluded in a program
    When the user clicks the "manage people (Privacy Officer)"-button
    Then the page "manage people" is shown
    And a table with all "in/excluded people" is shown
    And for each person a "number" is shown
    And for each person a "inclusion score" is shown
    And for each person a "created date" is shown
    And for each person a "updated date" is shown
    And for each person a "inclusion status" is shown
    And for each person a "name" is shown
    And for each person a "date of birth" is shown

  Scenario: Sort people in/excluded in a program by property(score, creation-date, update-date, name, date-of-birth)
    Given the user views the page "manage people"
    Given a table with all "in/excluded people" is shown
    When the user clicks a column-header ("score|created|updated|name|date-of-birth")
    Then the rows show in "ascending, descending or initial" order

  Scenario: Show number of people to update
    Given the user views the page "manage people"
    Given a table with all "in/excluded people" is shown
    When the user clicks the "update inclusion status"-button
    Then the pop-up "Are you sure?" is shown
    And the pop-up shows the total number of PA to include/exclude
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
