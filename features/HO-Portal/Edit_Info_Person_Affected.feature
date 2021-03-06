@ho-portal
Feature: Edit information on Person Affected

  Background:
    Given the "selected phase" is one of the phases with the "People Affected table"

  Scenario: View icon to edit information
    Given a logged-in user with "personal data" role
    When the user views the "People Affected Table"
    Then the user sees an "edit icon" in each row at the end of the "Person Affected" column
    When the user hovers over it
    Then it is highlighted

  Scenario: No permission to edit information
    Given the user does not have the "personal data" role
    When the user views the "People Affected Table"
    Then the user does not see the edit-icon, but only the 'PA#X' text

  Scenario: Open the popup to edit information
    Given a logged-in user with "personal data" role
    When the user click the "edit icon"
    Then a popup opens
    And in the title the ID-number of the Person Affected is mentioned
    And an input-field for the "paymentAmountMultiplier" is shown
    And the popup has a "Notes" section
    And there is an explanation, including PII-warning
    And there is a free text "note" field
    And it shows the current version of the note if available
    And it shows a placeholder if no note currently saved
    And there is a "save" button
    And there is a 'Last updated on' mention if there is a current version of the note available

  Scenario: Successfully update note
    Given a logged-in user with "personal data" role
    Given the user has opened the popup to edit information
    And whether the user has changed something or not in the "note" field
    When the user presses the "save" button
    Then the content of the "note" field is written to the database
    And the date+time of this action is written to the database
    And a feedback message is shown that the save was successful
    When the user closes this feedback message
    When the user opens the popup for the same PA again
    Then the user sees the updated note
    And the user sees a new "last updated" time

  Scenario: Unsuccessfully update note
    Given a logged-in user with "personal data" role
    Given something goes wrong for some reason (which cannot be simulated by the tester)
    When the user presses the "save" button
    Then a feedback message that something went wrong is given
    And it gives the basic error type if possible, e.g. "Bad Request"

  Scenario: Update paymentAmountMultiplier successfully
    Given a logged-in user with "personal data" role
    Given the user has opened the popup to edit information
    Given an input-field for the "paymentAmountMultiplier" is shown
    When the user changes the value and presses the  update-button
    Then the update-button changes into a progress indicator
    And the value of the input-field is written to the database
    And the progress indicator changes into the update-button again
    And the page refreshes

  Scenario: Update paymentAmountMultiplier with invalid value
    Given a logged-in user with "personal data" role
    Given the user has opened the popup to edit information
    Given an input-field for the "paymentAmountMultiplier" is shown
    When the user changes the value to "" or a negative number and presses the  update-button
    Then the update-button changes into a progress indicator
    And a feedback message with the specific requirements of the value is shown
    And the progress indicator changes into the update-button again
