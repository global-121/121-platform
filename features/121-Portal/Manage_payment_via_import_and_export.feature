@portal
Feature: Manage payment via import and export

  Background:
    Given an FSP of integration type "csv" or "xml"
    Given at least 1 payment is done for the program

  Scenario: Export payment instructions for FSP without reconciliation
    Given an FSP with "hasReconciliation=false"
    Given a logged-in user with "PaymentFspInstructionREAD" permissions
    When the user selects a "closed" payment from the dropdown-list
    Then the "export payment instructions" button is enabled
    When the user clicks the "export payment instructions" button
    Then an confirm popup opens with a description
    And it shows an 'action done last on' timestamp if available
    When the user confirms
    Then an Excel-file is dowloaded
    And it shows a list of the registrations that were "included" for this payment
    And "transaction" information where the "amount" is the multiplication of the PA's "paymentAmountMultiplier" and the supplied "transfer value"
    And all data as programmed for this FSP

  Scenario: Export payment instructions for FSP with reconciliation
    Given an FSP with "hasReconciliation=true"
    Given everything the same as in previous scenario
    When the user clicks the "export payment instructions" button
    Then a difference is that only 'waiting' transactions are included, instead of all
    And this is also explained in the export popup
    And - depending on the FSP - an XML or Excel file is downloaded
    And - if FSP='Excel' - then see [wiki](https://github.com/global-121/121-platform/wiki/Excel-payment-instructions-FSP) for details on which columns are exported

  Scenario: Successfully import payment reconciliation data
    Given a logged-in user with "PaymentCREATE" permissions
    Given a correct input file (XML for 'Vodacash'; CSV for 'Excel')
    When the user selects a "closed" payment from the dropdown-list
    Then the "import payment reconciliation data" button is enabled (except for the last payment if still in progress)
    When the user clicks the button
    Then a filepicker popup opens
    And it shows an 'action done last on' timestamp if available
    When an input-file is chosen and confirmed
    Then the file is processed
    And an popup appears which confirms the total number of updated 'waiting' transactions
    And splits them out in 'to success' and 'to failed'
    And it mentions 'not found' records, if any.
    And - if FSP='Excel' - then see [wiki](https://github.com/global-121/121-platform/wiki/Excel-payment-instructions-FSP) for details on import format

  Scenario: Unsuccessfully import payment reconciliation data
    Given an incorrect input-file
    When the file is chosen and confirmed
    Then a popup appears that 'something went wrong' and it includes a description of the error if possible

