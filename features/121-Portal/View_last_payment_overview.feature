@portal
Feature: View last payment overview

  Background:
    Given a logged-in user with the "PaymentREAD" and "TransactionREAD" permissions

  Scenario: View last payment overview when a payment is done
    Given at least 1 payment has been done
    When the user views the "payment" page
    Then right above the "People affected table" an overview of the last payment is shown
    And it mentions "Last payment: #<X>"
    And it shows the amount of successful, waiting, and failed payments
    And - if program and user have scope - then these numbers are filtered to only those PAs within the scope of the user
    And also if no PAs fall within the scope, then the overview still shows with 0 for all numbers
    And it shows a "Retry all" button only if there are failed payments and the user also has the "PaymentCREATE" permission
  >> For using "Retry all": see "Retry payment for all failed payments of PAs" in "Make_new_payment.feature"

  Scenario: Do not see last payment overview when no payment is done yet
    Given no payment has been done
    When the user views the "payment" page
    Then no overview is shown