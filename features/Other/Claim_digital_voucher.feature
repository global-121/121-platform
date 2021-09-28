@send-whatsapp-message
Feature: Claim digital vouchers

  Background:
    Given a program with "Intersolve" FSP
    And a PA has chosen FSP "Intersolve-whatsapp"
    And a payment has been made to this PA
    And the PA has received the initial whatsApp message  

  Scenario: Send 'yes' reply to initial whatsApp message when uncollected vouchers available
    When the PA replies 'yes' to initial whatsApp message
    Then a whatsApp is sent to the PA
    And it includes the voucher image
    And it includes an accompanying explanation text
    And it includes a second image which explains how to use the voucher in the store
    And it includes additional images for older uncollected vouchers, but only of the 2 installments prior to the current one
    And all sent vouchers are marked as 'claimed' in the database, and cannot be sent again in the future
    And the status of the transaction in the PA-table updates to 'success' if not already the case
    And the transaction in the PA-table now shows that the voucher is sent (through a cash-icon) and at whichs date

  Scenario: Send 'yes' reply when no uncollected vouchers available
    When the PA replies 'yes' to initial whatsApp message (or sends 'yes' at any moment)
    Then a whatsApp is sent to the PA
    And it mentions that this is an automated response and to contact the helpdesk
    
  Scenario: Send anything else besides 'yes' 
    When the PA sends anything else then 'yes'
    Then the same scenarios as above are followed, as it does not matter what text is exactly sent