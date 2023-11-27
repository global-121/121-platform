@portal
Feature: Delete people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationDELETE" permission
    And the "active phase" is "registration" or "inclusion"

  Scenario: Use bulk-action "delete PA"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "delete PA" action
    Then all rows except PAs with status "included", "completed", or "paused" should be eligible

  Scenario: Confirm "delete PA" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "delete PA"
    Then the "Pop up" to confirm will open
    And it mentions the selected number of PAs to delete
    And it mentions an additional explanation sentence
    When the user confirms
    Then the PA will be switched to status "deleted"
    And this means it will no longer be visible in any of the phases, also not through "filter by status: all"
    And the selected registrations will be anonymized in the database (fields "phoneNumber" and "note")
    And some related entities will be deleted: "registration-data", "people_affected_app_data", "twilio-messages", "whatsapp-pending-messages", "try-whatsapp"
    And some related entities will be anonymized: "Intersolve-voucher" (field "whatsappPhoneNumber")
    And some related entities will be untouched: "transactions", "registration-status-changes", "imagecode-export-vouchers", "imagecode"
    And some related entities should be anonymized, but are not yet right now: "at_notification", "belcash_request"
