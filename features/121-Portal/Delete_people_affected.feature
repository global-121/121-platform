@ho-portal
Feature: Delete people affected (extension of View_and_Manage_people_affected.feature)

  Background:
    Given a logged-in user with "RegistrationDELETE" permission
    And the "active phase" is "registration"

  Scenario: Use bulk-action "delete PA"
    Given the generic "select bulk action" scenario (see View_and_Manage_people_affected.feature)
    When user selects the "delete PA" action
    Then all rows should be eligible as any status should be deleteable.

  Scenario: Confirm "delete PA" action
    Given the generic "confirm apply action" scenario (see View_and_Manage_people_affected.feature)
    When the "bulk action" is "delete PA"
    Then the "Pop up" to confirm will open
    And it mentions the selected number of PAs to delete
    When the user confirms
    Then the selected registrations will be deleted (or anonymized)
    And all related entities will be deleted: "transactions", "twilio-messages", "registration-data", "registration-status-changes", "try-whatsapp" and "imagecode-export-vouchers", "whatsapp-pending-messages", "people_affected_app_data"
    And if present the related "user" account will be deleted (not present if PA is imported)
