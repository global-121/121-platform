@portal
Feature: Send message to people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    And the "selected phase" is the "registrationValidation" or "inclusion" or "payment" phase

  Scenario: Use bulk-action "Send message to PAs"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "Send message to PAs" action
    Then the eligible rows are only those with a phone number

  Scenario: Confirm "Send message to PAs" action with tryWhatsapp disabled
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And tryWhatsapp is off in the program configuration
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "SMS: SENT" for the selected rows
    And the message arrives via SMS

  # You can use 15005550001 in combination with Twilio Mock to test a failed SMS
  Scenario: Confirm "Send message to PAs" action with tryWhatsapp disabled and SMS fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And tryWhatsapp is off in the program configuration
    And the phone number cannot receive SMS messages
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "SMS: UNDELIVERED" or "SMS: FAILED" for the selected rows
    And the message doesn't arrive

  Scenario: Confirm "Invite for registration" action with tryWhatsapp enabled
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is able to receive WhatsApp messages
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: sent" or "WHATSAPP: READ" for the selected rows
    And the message arrives via WhatsApp

  Scenario: Confirm "Invite for registration" action with tryWhatsapp enabled and whatsapp fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is NOT able to receive WhatsApp messages
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: FAILED" for the selected rows
    And the message arrives via SMS

  Scenario: Confirm "Invite for registration"  action with tryWhatsapp enabled and whatsapp and SMS fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number cannot receive WhatsApp and SMS messages
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: FAILED" for the selected rows
    And the message doesn't arrive

  Scenario: Confirm "Send message to PAs" action for PA with last message 'failed'
    Given the "Send message to PAs" bulk action has been used
    And this action has failed for one or more PA
    When the text filter has "Last message" attrubute selected and the value used is "failed"
    Then only the PA for which the last message failed appear in the PA table
    And they can be selected for another "Send message to PAs" bulk action
