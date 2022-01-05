@ho-portal
Feature: Delete people affected (extension of Manage_people_affected.feature)

  Background:
    Given a logged-in user with "run program" or "personal data" role
    And the "active phase" is "registration"

  Scenario: Use bulk-action "delete PA"
    Given the generic "select bulk action" scenario (see Manage_people_affected.feature)
    When user selects the "delete PA" action
    Then the eligible rows are those with status "imported", "invited", "no longer eligible" and "created"

  Scenario: Confirm "delete PA" action
    Given the generic "confirm apply action" scenario (see Manage_people_affected.feature)
    When the "bulk action" is "delete PA"
    Then the "Pop up" to confirm will open
    And it mentions the selected number of PAs to delete
    When the user conffirms
    Then the selected registrations will be deleted
    And all related entities will be deleted: "transactions", "twilio-messages", "program-answers", "status-changes" and "imagecode-export-vouchers", "whatsapp-pending-messages"
    And if present the relate "user" account will be deleted (not present if PA is imported)
