@ho-portal
Feature: View PA profile page

  Background:
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Given the user is viewing the PA table
    Given 1 or more PAs with at least status "created"
    Given the user sees the PA name

  Scenario: Open profile page
    When the user clicks on the PA name
    Then the profile page for that PA is opened

  Scenario: View Personal information table
    Given the user has opened the PA profile page
    Then the user sees the "Personal information" table
    And it mentions the name of the PA
    And it shows the current status of the PA and the date the status was changed
    And it shows the PA's primary language, phone number and FSP
    And if there are program attributes, it shows the WhatsApp phone number and the Partner Organization

  Scenario: Open the edit PA popup
    Given the user sees the "Personal Information" table
    Given the user sees the "Show All" button
    When the user clicks on the "Show All" button
    Then the edit PA popup opens

  Scenario: View Visa debit cards table
    Given the PA has FSP 'Intersolve Visa debit card'
    Given the PA has at least 1 Visa debit card (typically through at least 1 payment with this FSP)
    Given the user has the "PaymentTransactionREAD" permission
    When the user opens the PA profile page
    Then the user sees the "Visa debit cards" table on the left below the "Personal information" table
    And it shows a row for each Visa debit card
    And this should contain multiple rows only if a PA has a reissued card for some reason
    And it shows per card the card number and the status of the card
    And older cards should have status "Substituted"
    And the 1 current card can have status "Inactive", "Active" or "Blocked"

  Scenario: View Visa debit card details
    Given the PA has FSP 'Intersolve Visa debit card'
    Given the PA has at least 1 Visa debit card (typically through at least 1 payment with this FSP)
    Given the user has the "PaymentTransactionREAD" permission
    When clicking one row in the Visa debit card table
    Then a popup opens
    And it shows the card number in the title
    And it shows the card Status again
    And it shows the last used date

  Scenario: View Payment overview table
    Given the PA's status is either "included", "completed", "inclusionEnded", or "rejected"
    Given a logged-in user with "PaymentREAD" and "PaymentTransactionREAD" permissions
    Then the user sees the "Payment overview" table
    And it shows the latest payment if it exists
    And it shows a list of four payments or up until the payment limit if it is set
    And it shows the status of the transaction for made payments
    And it shows "Planned" for future payments
    Given the user sees the "Show All" button
    When the user clicks on the "Show All" button
    Then the Payment History pupup opens

  Scenario: View Activity overview
    Given the user sees the "Activity overview" table
    And the user sees the "All" tab and the list of all available updates in the table
    Given a logged-in user with "RegistrationPersonalREAD" permission
    Then the user sees the "Status history" tab
    When the user clicks on the "Status history" tab
    Then the user sees the list status changes in the table
    Given a logged-in user with "RegistrationNotificationREAD" permission
    Then the user sees the "Messages" tab
    When the user clicks on the "Messages" tab
    Then the user sees the list of sent messages in the table
    Given a logged-in user with "PaymentREAD" and "PaymentTransactionREAD" permissions
    Then the user sees the "Payments" tab
    When the user clicks on the "Payments" tab
    Then the user sees the the list of payments in the table
    And all the tabs have a count of updates next to them
