@portal
Feature: View PA profile page

  Background:
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Given the user is viewing the PA table
    Given 1 or more PAs with at least status "created"
    Given the user sees the PA number

  Scenario: Open profile page
    When the user clicks on the PA number
    Then the profile page for that PA is opened

  Scenario: View Personal information table
    Given the user has opened the PA profile page
    Then the user sees the "Personal information" table
    And it mentions the name of the PA
    And it shows the current status of the PA and the date the status was changed
    And it shows the PA's primary language, phone number and FSP
    And if there are program attributes, it shows the WhatsApp phone number and the Partner Organization
    And - if program has scope - then it shows PAs scope

  Scenario: Open the edit PA popup
    Given the user sees the "Personal Information" table
    Given the user sees the "Show All" button
    When the user clicks on the "Show All" button
    Then the edit PA popup opens

  Scenario: View Visa debit cards table
    Given the PA has FSP 'Intersolve Visa debit card'
    Given the PA has at least 1 Visa debit card (typically through at least 1 payment with this FSP)
    Given the user has the "FspDebitCardREAD" permission
    When the user opens the PA profile page
    Then the user sees the "Visa debit cards" table on the left below the "Personal information" table
    And it shows a row for each Visa debit card
    And this should contain multiple rows only if a PA has a reissued card for some reason
    And it shows per card the card number and the status of the card
    And older cards should have status "Blocked"
    And the 1 current card can have status "Inactive", "Active" or "Blocked"
  >> See 'Manage_Intersolve_Visa_card.feature' for more scenarios related to this table

  Scenario: View Activity overview
    Given the user sees the "Activity overview" table
    And the user sees the "All" tab and the list of all available updates in the table
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Then the user sees the "Status history" tab
    When the user clicks on the "Status history" tab
    Then the user sees the list of status changes in the table
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Then the user sees the "Data Changes" tab
    When the user clicks on the "Data Changes" tab
    Then the user sees the list of data and FSP changes in the table
    And this information includes the date and time of the change, the user who made the change, the field that was changed, the old value, the new value and the reason
    Given a logged-in user with "RegistrationNotificationREAD" permission
    Then the user sees the "Messages" tab
    When the user clicks on the "Messages" tab
    Then the user sees the list of sent messages in the table
    Given a logged-in user with "PaymentREAD" and "PaymentTransactionREAD" permissions
    Then the user sees the "Payments" tab
    When the user clicks on the "Payments" tab
    Then the user sees the the list of payments in the table
    And all the tabs have a count of updates next to them

  Scenario: Successfully add note
    Given a logged-in user with "RegistrationPersonalUPDATE" permission
    Given the user sees the "Activity overview" table
    And the user sees the "Actions" button in the top right corner
    When the user clicks on the "Actions" button
    Then the user sees the "Add note" option
    When the user clicks on the "Add note" option
    Then the user sees the "Add note" popup
    When the user types some text in the 'Type note:' field
    Then the user sees the 'OK' button enable
    When the user clicks on the 'OK' button
    Then the user sees a feedback message that the note was added successfully
    And the page refreshes
    And the user sees the updated note in the "Activity overview" table

  Scenario: Unsuccessfully update note
    Given the same assumptions as in the 'successfully add note' scenario
    Given something goes wrong for some reason (which cannot be simulated by the tester)
    When the user follows the same steps as in the 'successfully add note' scenario and clicks on the 'OK' button
    Then a feedback message that something went wrong is given
    And it gives the basic error type if possible, e.g. "Bad Request"

  Scenario: Successfully view note(s)
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Given the user sees the "Activity overview" table
    Given the user sees the "All" tab and the list of all available updates in the table
    Given the user sees the "Notes" tab
    When the user clicks on the "Notes" tab
    Then the user sees the list of notes in the table
    And this information includes the date and time of the note and the user who made the note
