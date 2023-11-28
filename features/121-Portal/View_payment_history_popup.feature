@portal
Feature: View payment history column and popup

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    Given the user is on the "payment" page
    Given 1 or more PAs with at least status "included"

  Scenario: View payment history column
    When the user views the "payment history" column
    Then it shows a button which says 'Payments'
    And the button has purple text and light grey outline

  Scenario: View payment history popup for a PA
    Given a payment is done for the PA
    When the user clicks on the button in the payment history column
    Then the payment history popup opens
    And it mentions the name of the PA
    And below it a row for each payment that is done for that PA or for which a single payment is possible for that PA
    And each row starts with a money icon
    And then Payment #X is mentioned
    And - for payments that are done for the PA - on the right side of the payment number the distribution date is displayed in format DD-MM-YYYY, hh:mm
    And under the payment number it mentions the status Successful/Waiting/Failed
    And the status text and outline is green if Successful
    And the status text and outline is yellow if Waiting
    And the status text and outline is red if Failed
    And - for payments for which a single payment is possible - it mentions 'Not yet sent' in yellow
    And if the FSP has voucher support and the status is 'Success' then an 'Open voucher' button is displayed
    And if status is 'Failed' or 'Waiting' then a 'Details' button is displayed
    And if payment is 'Not yet sent' then a 'Send payment' button is displayed
    And the user is able to open an accordion for each payment
    And when the user opens the accordion payment details are displayed in two columns
    And first column details contains the "sent datetime" and "amount"
    And second column details contains the "FSP" at time of payment
    And it contains any custom FSP-specific attributes (currently only card ID if FSP is Visa)
    And if any of the attributes are not completely visible, hovering over it will show the full value
    And User is able to close accordion by clicking on the "^" button
    And popup is closed when user clicks on "X" button

  Scenario: Do single payment
    Given the user has opened the payment history popup
    Given a single payment is possible for a payment
    - PA = included
    - payment has been done for at least 1 other PA
    - payment has not been done for this PA
    - only for last 5 payments
    When the user clicks the 'Send payment' button
    Then the 'do single payment' popup appears
    And it contains an editable transfer amount field
    And it contains a 'start payout now' button

    When the user clicks 'start payout now'
    Then an 'Are you sure?' popup appears
    And it contains the total amount to be paid out

    When the user confirms
    Then a payment is executed for this PA only (identical to payments done in: Make_new_payment.feature)
