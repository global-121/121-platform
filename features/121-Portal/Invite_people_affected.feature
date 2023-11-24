@portal
Feature: Invite people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    And the "selected phase" is "registrationValidation"

  Background:
    Given a logged-in user with "RegistrationStatusInvitedUPDATE" permission
    Then the "Invite for registration" action is visible

  Scenario: Use bulk-action "Invite for registration"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "Invite for registration" action
    Then the eligible rows are only those with status "Imported" or "No longer eligible"

  Scenario: Confirm "Invite for registration" action with tryWhatsapp disabled
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "Invite for registration"
    And the "status" is updated to "Invited"
    And if a templated message is present or the custom SMS option is used, an SMS message is sent to the "phoneNumber" (see View_and_Manage_people_affected.feature)

  Scenario: Confirm "Invite for registration" action with tryWhatsapp enabled
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is able to receive WhatsApp messages
    And the "status" is updated to "Invited"
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: sent" or "WHATSAPP: READ" for the selected rows
    And the message arrives via WhatsApp

  Scenario: Confirm "Invite for registration" action with tryWhatsapp enabled and whatsapp fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is NOT able to receive WhatsApp messages (use 16005550004 with mock twilio)
    And the "status" is updated to "Invited"
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: FAILED" for the selected rows
    And the message arrives via SMS

  Scenario: Confirm "Invite for registration"  action with tryWhatsapp enabled and whatsapp and SMS fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number cannot receive WhatsApp and SMS messages (use 15005550001 with mock twilio)
    When the "bulk action" is "Send message to PAs"
    Then the "changed data" is that "Messages" is filled with the text "WHATSAPP: FAILED" for the selected rows
    And the message doesn't arrive
