@ho-portal
Feature: View payment history column and popup

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    Given the user 

  Scenario: View payment history column
    Given the user is on the "payment" page
    When the user views the "payment history column" 
    Then it shows 'no payment yet' for PAs without any payment yet
    And otherwise it shows a button which says 'Payment #X success/waiting/failed'
    And for each PA X is the last payment which is done for that PA
    And the button has red text and outline if waiting/failed

  Scenario: View payment history popup
    Given the user is on the "payment" page
    Given a payment is done for the PA
    When the user clicks on the button in the payment history column
    Then the payment history popup opens
    And it mentions the name of the PA
    And below it a row for each payment that is done for that PA or for which a single payment is possible for that PA
    And - for payments that are done for the PA - below the payment number it mentions the status success/waiting/failed
    And the status text is red if waiting/failed
    And on the right it shows the payment-status button
    And it contains the datetime, amount and relevant transaction-step-icons of the payment
    And it has red text, outline and icons if waiting/failed
    And - for payments for which single payment is possible for the PA - a 'Do single payment' button shows on the right

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
