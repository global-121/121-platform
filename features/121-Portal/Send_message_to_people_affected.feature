@portal
Feature: Send message to people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    And the "selected phase" is the "registrationValidation" or "inclusion" or "payment" phase

  Scenario: Use bulk-action "Send message to PAs"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "Send message to PAs" action
    Then the eligible rows are only those with a phone number

  Scenario: Confirm "Send message to PAs" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "Send message to PAs"
    Then a message is sent to the selected rows
    And if "whatsappPhoneNumber" is known then the generic Whatsapp template is sent and otherwise dirctly the actual message via SMS
    And the latest message columm shows this message type and also the latest status (In twilio-mock: READ for whatsapp and SENT for SMS)
    And if the WhatsApp is being replied to (in twilio-mock automatic) then also the follow-up WhatsApp message is sent

  # You can use 15005550001 in combination with Twilio Mock to test a failed message
  Scenario: Unsuccessful "Send message to PAs"
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And the message somehow cannot arrive successfully
    When the "bulk action" is "Send message to PAs"
    Then no message is sent (WhatsApp or SMS)
    And the "Messages" column shows "UNDELIVERED or FAILED" as status

  Scenario: Send message only to PAs with last message 'failed'
    Given the "Send message to PAs" bulk action has been used
    And this action has failed for one or more PAs
    When the filter "Last message" is used with the value "failed"
    Then only the PAs for which the last message failed, appear in the PA table
    And they can be selected for another "Send message to PAs" bulk action
