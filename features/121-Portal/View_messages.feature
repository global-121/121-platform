@portal
Feature: View Messages

  Background:
    Given a logged-in user with "RegistrationPersonalREAD" permission

  Scenario: View Last message column
    Given the user is on the "registration", "inclusion" or "payment" page
    Given at least 1 PA is shown in the PA Table with at least 1 "message"
    When the user views the "Last message" column
    Then it shows a button with the "message type" and "message status" of the latest "message"

  Scenario: View messages from message history pop-up
    Given the user is on the "registration", "inclusion" or "payment" page
    Given at least 1 PA is shown in the PA Table with at least 1 "message"
    When the user clicks the button in the "Last message" column
    Then it shows a pop-up with a list of all "Messages" for this PA

  Scenario: View messages from Activity overview
    Given the user has opened the PA profile page
    Given the PA has received at least 1 message
    When the user has selected the "All" or "Messages" tab
    Then the user sees a list with "Messages"

  Scenario: View message
    Given the user has opened the Acivity overview on the PA profile page or the message history pop-up
    Given the PA has received at least 1 message
    When the user sees a card with "Message"
    Then the user sees the "Mail icon" of "Message"
    And the user sees the "Template Type" of "Message"
    And the user sees if "Message" was sent via "SMS" or "WhatsApp"
    And the user sees the "Date" of "Message"
    And the user sees "Status" of "Success" for "Message"
    And the user sees the "Text" of the "Message"

  Scenario: View failed message
    Given the user has opened the Acivity overview on the PA profile page or the message history pop-up
    Given the PA was sent at least 1 "Message" that failed
    When the user sees a card with "Message"
    Then the user sees "Status" of "Failed" for "Message"
    And the user sees the text "Twilio error code" with a hyperlink to the Twilio error code
