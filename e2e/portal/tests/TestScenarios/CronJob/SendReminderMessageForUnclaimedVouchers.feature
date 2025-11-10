Feature: Send Reminder Messages for Unclaimed Vouchers
  As the 121 Platform system
  I want to automatically send reminder messages to PAs who haven't claimed their vouchers
  So that PAs don't miss their digital voucher opportunities

  Background:
    Given the 121 Platform is running
    And there is a program with "Intersolve" FSP
    And the cron job is configured to run every minute for testing
    And the time filter is adjusted for testing purposes
    And WhatsApp messaging is enabled and configured

  @api @automated @cronjob @reminder @whatsapp
  Scenario: PA does not send anything to initial WhatsApp-message
    Given a PA with phone number 16005550002
    And the PA has chosen FSP "Intersolve-voucher-whatsapp"
    And a payment has been made to this PA
    And the PA has received the initial WhatsApp-message
    When the PA does not send anything back to the initial message
    Then a reminder is sent out the next day at noon
    When the PA does not send anything back to the first reminder
    Then a reminder is sent out the next day at noon
    When the PA does not send anything back to the second reminder
    Then a third reminder is sent out the next day at noon
    And a PA without WhatsApp should not get any reminders
    And the PA should not be reminded more than 3 times total

  @api @automated @cronjob @reminder @whatsapp @multiple-programs
  Scenario: PA does not send anything to initial WhatsApp-message with other programs in the instance
    Given a PA with phone number 16005550002
    And the PA has chosen FSP "Intersolve-voucher-whatsapp"
    And a payment has been made to this PA
    And the PA has received the initial WhatsApp-message
    And there is another program that has 3 or more payments
    And the PA is only ever included into the one program
    When the PA does not send anything to the initial message
    Then a reminder is sent out the next day at noon irrespective of how many payments any other programs have
    And the counting of 'sending maximum 3 latest vouchers' is done per program, not overall
    And the PA should not be reminded more than 3 times for their specific program
    And other programs' payment counts do not affect this PA's reminder schedule
