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
    And the "bulk action" is "Send message to PAs"
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is able to receive WhatsApp messages
    And the "status" is updated to "Invited"
    When the action is confirmed
    Then the generic message template is sent via WhatsApp
    And it arrives successfully
    And the "Messages" column is filled with the text "WHATSAPP: sent" or "WHATSAPP: READ" for the selected rows
    And the FSP is updated to "Intersolve Voucher Whatsapp" // This is needed to store Whatsapp phonenumber (see next line), and hard-coded for now as this feature is only used in NLRC PV
    And the "whatsapp phonenumber" is updated to the phoneNumber value
    And - if replied to (automatic if twilio-mock) - the actual invite message is sent via WhatsApp

  Scenario: Confirm "Invite for registration" action with tryWhatsapp enabled and whatsapp fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And the "bulk action" is "Send message to PAs"
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number is NOT able to receive WhatsApp messages, but is able to receive SMS (use 16005550004 with mock twilio)
    And the "status" is updated to "Invited"
    When the action is confirmed
    Then the generic message template is sent via WhatsApp
    And it fails to arrive and this is reflected in the Message History column/popup with errorCode 63003
    And then instead the message is sent via SMS
    And it successfully arrives

  Scenario: Confirm "Invite for registration"  action with tryWhatsapp enabled and whatsapp and SMS fails
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    And the "bulk action" is "Send message to PAs"
    And "Send a message to these People Affected" is enabled
    And tryWhatsapp is on in the program configuration
    And the phone number cannot receive WhatsApp and SMS messages (use 15005550001 with mock twilio)
    When the action is confirmed
    Then the generic message template is sent via WhatsApp
    And it fails to arrive and this is reflected in the Message History column/popup with another errorCode than 63003
    And then no SMS is tried instead