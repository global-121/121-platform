@ho-portal
Feature: Invite people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationREAD" permission
    And the "selected phase" is "registration (& validation)"

  Background:
    Given a logged-in user with "RegistrationStatusInvitedUPDATE" permission
    Then the "Invite for registration" action is visible

  Scenario: Use bulk-action "Invite for registration"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "Invite for registration" action
    Then the eligible rows are only those with status "Imported" or "No longer eligible"

  Scenario: Confirm "Invite for registration" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "Invite for registration"
    Then the "changed data" is that the "Invited" timestamp is filled for the selected rows
    And the "status" is updated to "Invited"
    And if the custom message option is used, a WhatsApp message is sent to the "phoneNumber" (see View_and_Manage_people_affected.feature)
    And if the "phoneNumber" has a WhatsApp account, then the message arrives
    And the "phoneNumber" is now also stored as "whatsappPhoneNumber" in the PA's registration
    And if the "phoneNumber" does not have a WhatsApp account, then instead an SMS is sent 
