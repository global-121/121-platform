@cronjob
Feature: Send reminder message for unclaimed vouchers (use phonenumber: 16005550002 & change the cronjob to run every minute and change the time filter to test this)

  Background:
    Given a program with "Intersolve" FSP
    Given a PA has chosen FSP "Intersolve-voucher-whatsapp"
    Given a payment has been made to this PA
    Given the PA has received the initial WhatsApp-message

  Scenario: PA does not send anything to initial WhatsApp-message
    When the PA does not send anything back
    Then a reminder is sent out the next day at noon
    When the PA does not send anything back
    Then a reminder is sent out the next day at noon
    And a PA without WhatsApp should not get a reminder
    And a PA should not be reminded more than 3 times

  Scenario: PA does not send anything to initial WhatsApp-message with other programs in the instance
    Given there is another program that has 3+ more payments
    Given the PA is only ever included into the one program
    When the PA does not send anything
    Then a reminder is sent out the next day at noon irrespective of how many payments any other programs have
    And this basically means that the counting of 'sending maximum 3 latest vouchers' is done per program, not overall
    And the PA should not be reminded more than 3 times
