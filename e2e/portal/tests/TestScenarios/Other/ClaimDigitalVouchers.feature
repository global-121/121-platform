Feature: Claim Digital Vouchers via WhatsApp
  As a Program Administrator (PA)
  I want to claim my digital vouchers by replying to WhatsApp messages
  So that I can receive my voucher images and use them in stores

  Background:
    Given the 121 Platform is running
    And there is a program with "Intersolve" FSP
    And a PA has chosen FSP "Intersolve-voucher-whatsapp"
    And WhatsApp messaging is enabled and configured

  @api @automated @voucher-claiming @whatsapp
  Scenario: Send 'yes' reply to initial WhatsApp message when uncollected vouchers available
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And there are uncollected vouchers available for this PA
    When the PA replies 'yes' to the initial WhatsApp message
    Then a WhatsApp message is sent to the PA
    And it includes the voucher image
    And it includes an accompanying explanation text
    And it includes a second image which explains how to use the voucher in the store
    And it includes additional images for older uncollected vouchers, but only of the 2 payments prior to the current one
    And all sent vouchers are marked as 'claimed' in the database
    And the claimed vouchers cannot be sent again in the future
    And the status of the transaction in the PA-table updates to 'success' if not already the case
    And the transaction in the PA-table now shows that the voucher is sent through a cash icon
    And the transaction shows the date when the voucher was sent

  @api @automated @voucher-claiming @whatsapp @no-vouchers
  Scenario: Send 'yes' reply when no uncollected vouchers available
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And there are no uncollected vouchers available for this PA
    When the PA replies 'yes' to the initial WhatsApp message
    Then a WhatsApp message is sent to the PA
    And it mentions that this is an automated response
    And it instructs the PA to contact the help-desk

  @api @automated @voucher-claiming @whatsapp @any-text
  Scenario: Send any text reply besides 'yes'
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And there are uncollected vouchers available for this PA
    When the PA sends anything else other than 'yes'
    Then the same voucher claiming process is triggered
    And the PA receives their vouchers regardless of the exact text sent
    And all voucher claiming behaviors work the same as when replying 'yes'

  @api @automated @voucher-claiming @whatsapp @reminder
  Scenario: PA does not respond to initial WhatsApp message
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And the PA has WhatsApp capability
    When the PA does not send any reply
    Then a reminder is sent out the next day at noon
    And the same voucher claiming process applies when they eventually respond
    And a PA without WhatsApp should not receive any reminders
    And a PA should not be reminded more than 3 times total

  @api @automated @voucher-claiming @whatsapp @multiple-programs
  Scenario: PA claims digital voucher while enrolled in multiple programs with different payment counts
    Given there is another program that has 3 or more payments
    And the PA is enrolled only in the current program with fewer payments
    And a payment has been made to this PA in their enrolled program
    And the PA has received the initial WhatsApp message
    When the PA replies 'yes' to the initial WhatsApp message
    Then the PA receives all vouchers for their specific program that were not already sent
    And the system includes up to 3 payments back from their enrolled program only
    And the voucher count limit is applied per program, not across all programs
    And vouchers from other programs do not affect this PA's voucher delivery

  @api @automated @voucher-claiming @whatsapp @error-handling
  Scenario: Template error occurs when sending WhatsApp message
    Given the PA has phone number 16005550003
    And Twilio mock is enabled for testing
    And a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    When the PA replies 'yes' to the initial WhatsApp message
    And the system encounters error code 63016 during message sending
    Then the system automatically retries sending the message
    And the system will retry up to 3 times
    And there is a 30-second delay between each retry attempt
    And if all retries fail, the error is logged appropriately

  @api @automated @voucher-claiming @whatsapp @edge-case
  Scenario: PA sends 'yes' at any moment regardless of timing
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And some time has passed since the initial message
    When the PA sends 'yes' at any moment
    Then the voucher claiming process is triggered
    And the system responds with appropriate vouchers if available
    And the same claiming rules and limitations apply

  @api @automated @voucher-claiming @whatsapp @multiple-responses
  Scenario: PA sends multiple responses to WhatsApp message
    Given a payment has been made to this PA
    And the PA has received the initial WhatsApp message
    And the PA has already claimed their vouchers by replying once
    When the PA sends another response to the WhatsApp message
    Then the system responds appropriately without duplicating vouchers
    And previously claimed vouchers remain marked as 'claimed'
    And the PA receives an appropriate response about their voucher status

  @api @automated @voucher-claiming @whatsapp @payment-status
  Scenario: Verify transaction status updates after voucher claiming
    Given a payment has been made to this PA
    And the payment status is initially 'waiting' or 'sent'
    And the PA has received the initial WhatsApp message
    When the PA successfully claims their vouchers by replying 'yes'
    Then the transaction status updates to 'success' in the PA-table
    And the transaction record shows the voucher delivery method (cash icon)
    And the transaction record includes the exact timestamp of voucher delivery
    And the voucher claim status is permanently recorded in the database
