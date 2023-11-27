@portal
Feature: Manage Intersolve Visa card

  Background:
    Given a logged-in user with "FspDebitCardREAD" permission
    Given a PA with FSP 'Intersolve Visa debit card'
    Given the PA has at least 1 Visa debit card (typically through at least 1 payment with this FSP)
    Given the user is seeing the debit card section in the PA profile page (see 'View_PA_profile_page.feature')

  Scenario: View Visa debit card details
    When clicking one row in the Visa debit card table
    Then a popup opens
    And it shows the card number in the title
    And it shows the card Status again
    And it shows the Current balance
    And it shows the amount that was spend this month
    And it shows when the card was issued
    And it shows the last used date
    And it shows a button to block/unblock the card depending on the current status of the card
    And is has red text and outline in both cases
    And it shows a button to issue a new card

  Scenario: Succesfully pause Visa debit card
    Given the user has opened the Visa debit card details popup
    Given the card is currently not paused
    Given the user has the "FspDebitCardBLOCK" permission and thereby the 'pause' button is enabled
    When the user clicks on the "Pause card" button
    Then the card is paused/blocked with Intersolve and in 121 database
    And an automatic message is sent to the PA that the card is paused
    And a success alert is shown
    And - after closing the alert and subsequent refresh - the card's status in the table is "Paused"

  Scenario: Succesfully unpause Visa debit card
    Given the user has opened the Visa debit card details popup
    Given the card is currently paused
    Given the user has the "FspDebitCardUNBLOCK" permission and thereby the 'unpause' button is enabled
    When the user clicks on the "Unpause card" button
    Then the card is unpaused/unblocked with Intersolve and in 121 database
    And an automatic message is sent to the PA that the card is unpaused
    And a success alert is shown
    And - after closing the alert and subsequent refresh - the card's status in the table is now no longer "Paused" but back to its previous status

  Scenario: Unsuccesfully pause Visa debit card
    Given the user has opened the Visa debit card details popup
    Given the user has the "FspDebitCardBLOCK" permission and thereby the 'pause' button is enabled
    Given the card is currently not blocked with Intersolve but is somehow marked as blocked in the 121 database
    When the user clicks on the "Pause card" button
    Then the call to Intersolve fails
    And an error alert is shown that the token is already blocked
    And the blocked status in the 121 database is updated so the situation is aligned again

  Scenario: Unsuccesfully unpause Visa debit card
  >> Similar to "Unsuccesfully pause Visa debit card"

  Scenario: Successfully issue new card
    Given the user has opened the Visa debit card details popup
    Given the user has the "FspDebitCardCREATE" permission and thereby the 'Issue new card' button is enabled
    Given the old wallet is either "Blocked" or "Active" or "Inactive" (so status does not matter)
    Given potentially changed personal details (address, phone number)
    When the user clicks on the "Issue new card" button
    Then an 'are you sure' prompt is shown
    When clicking OK
    Then Intersolve creates a new wallet, links it to the customer, issues a new card with balance same as the old wallet, unloads balance from the old wallet and blocks the old wallet
    And updated address fields and phone number are used
    And an automatic message is sent to the PA that a new card has been issued
    And a success alert is shown
    And an extra card appears in the Debit card table on top
    And it has status 'Issued'
    And the old card is still there with status 'Blocked'
    And any older cards also have status 'Blocked'
    And when opening the details of the new card, it shows a balance of 0 as it is still 'Inactive' and after it is activated it shows the balance of the old card
    And when opening the details of the old card, it shows a balance of 0

  Scenario: Unsuccessfully issue new card
    When the user clicks on the "Issue new card" button but one of the calls to Intersolve fails for whatever reasons
    Then an error alert is shown
    And it mentions the step that failed and the specific error message
    And the user will be instructed to make adjustments if possible and retry
    And if the new wallet was already created, it is removed again in the 121 data
    And except if the very last step of blocking the old card, then the new wallet is not removed, and it will appear in the table with status 'Inactive'
    And the user will still need to retry >> TO DO: change funtionality?

  Scenario: Successfully retry issue new card
    Given the same assumptions as above
    Given the previous 'issue new card' attempt failed for whatever reason
    Given the user potentially has made adjustments based on the error message
    When the user clicks on the "Issue new card" button
    Then the retry flow should result in the same as the successful flow above
