@portal
Feature: Manage aidworkers

  Background:
    Given a logged-in user with the "AidWorkerDELETE" and "AidWorkerProgramUPDATE" permissions
    Given the user views the "aid-workers" page

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
    Then the aidworker is unassigned from that program
    And the list is not showing the aidworker any more
    And if the aidworker is not assigned to any program anymore the aidworker is deleted

  Scenario: View "Add aidworker" form
    When the user scrolls to the "manage aidworkers" section
    Then a form is shown to create a new aidworkers
    And an "e-mail" field is shown
    And a "password" field is shown
    And a "password-toggle" button is shown
    And a "button" to "Add aidworker" is shown

  Scenario: Add aidworker
    Given the user has filled in a correct "email" and "password"
    When the user clicks "Add aidworker"
    Then a popup appears that the account is successfully added
    And the popup reminds the user to inform the aidworker of this
    And the popup includes "email" and "password" to include in this notification
    And the aidworker appears in the "Current aidworkers" list now

  Scenario: Add incorrect credentials
    Given the user has filled in an existing "email" or an incorrect "email" or "password"
    When the user clicks "Add aidworker"
    Then a popup appears
    And it says that "email" is not of correct format if email-format is incorrect
    And it says that "password" must be longer if password is too short
    And it says that "email" must be unique if there is already a "user" in the "system" with this "e-mail"
