@ho-portal
Feature: Manage aidworkers

  Background:
    Given a logged-in "program-manager" user
    Given the user views the "program" page

  Scenario: View assigned aidworkers
    When the user scrolls to the "manage aidworkers" section
    Then a list of all "aidworkers" "assigned" to this program is shown
    And for each aidworker an "email address" is shown
    And for each aidworker a "creation date" is shown
    And for each aidworker a "delete button" is shown

  Scenario: Sort aidworkers by property(email, creation-date)
    Given a table with all "aidworkers" is shown
    When the user clicks a column-header
    Then the rows show in "ascending, descending or initial" order

  Scenario: Delete aidworker
    Given a table with all "aidworkers" is shown
    When the user clicks the "delete button" for an aidworker
    Then the pop-up "Are you sure?" is shown
    And the button "OK" is shown
    And the button "Cancel" is shown

  Scenario: Confirm delete aidworker
    Given a table with all "aidworkers" is shown
    Given the user clicks the "delete button" for an aidworker
    Given the pop-up "Are you sure?" is shown
    When the user clicks the "OK"-button
    Then the aidworker is deleted
    And the list is not showing the aidworker any more

  Scenario: Add aidworker
    @Ruben


