@ho-portal
Feature: View payment history column and popup

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    Given the user is on the "payment" page
    Given 1 or more PAs with at least status "included"

  Scenario: View payment history column
    When the user views the "payment history column" 
    Then it shows 'no payment yet' for PAs without any payment yet
    And otherwise it shows a button which says 'Payment #X success/waiting/failed'
    And for each PA X is the last payment which is done for that PA
    And the button has red text and outline if waiting/failed

  Scenario: View payment history popup for a PA
    Given a payment is done for the PA
    When the user clicks on the button in the payment history column
    Then the payment history popup opens
    And it mentions the name of the PA
    And below it a row for each payment that is done for that PA or for which a single payment is possible for that PA
    And payments are called transfers
    And - for payments that are done for the PA - on the right side of the payment number it mentions the status Successful/Failed/Not yet sent
    And the status text and outline is green if Successful
    And the status text and outline is yellow if Waiting
    And the status text and outline is red if Failed
    And icon is displayed on the left side of payment number
    And if payment is sucessful, in the line of payment number, on the right side of payment status, 'Open voucher' button is displayed
    And if status is 'Failed' or 'Waiting', then 'Send payment' button is displayed on the right side of payment status
    And under the payment number distribution date is displayed
    And date format is dd-mm-yyyy
    And user is able to open accordion for each payment
    And when user opens accordion details are displayed in two columns
    And first column details contains the sent datetime, Financial officer, and amount
    And second column details contains the recieved datetime, FSP, and usage
    And User is able to close accordion by clicking on the "^" button
    And popup is closed when user clicks on "X" button

  Scenario: Do single payment
    Given the user has opened the payment history popup
    Given a single payment is possible for a payment 
      - PA = included
      - payment has been done for at least 1 other PA
      - payment has not been done for this PA
      - only for last 5 payments ()
    When the user clicks the 'Do single payment' button
    Then the 'do single payment' popup appears
    And it contains an editable transfer amount field
    And it contains a 'start payout now' button

    When the user clicks 'start payout now' 
    Then a payment is executed for this PA only (identical to payments done in: Make_new_payment.feature)
