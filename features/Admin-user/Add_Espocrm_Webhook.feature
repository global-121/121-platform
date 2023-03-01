@swagger-ui
Feature: Add EspoCRM webhook

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully add EspoCRM webhook
    When the user fills in the body properties
    And the user calls the '/espocrm/webhooks' endpoint
    And the following body properties are filled in: 'referenceId', 'actionType', 'entityType', 'secretKey'.
    Then a record of type "EspocrmWebhookEntity" is created
    And it returns a 201 status code