@swagger-ui
Feature: Add EspoCRM webhook

  Background:
    Given a logged-in "admin" user in the Swagger UI

  Scenario: Successfully add EspoCRM webhook
    Given the user is using the '/espocrm/webhooks' endpoint
    And the following body properties are filled in: 'referenceId', 'actionType', 'entityType', 'secretKey'
    And 'actionType' is a known 'actionType' (e.g. 'update' or 'delete')
    And 'entityType' is a known 'entityType' (e.g. 'registration')
    And 'referenceId' and 'secretKey' are the identifier and password of the Espo-webhook (not technically needed to be correct for this endpoint to succeed)
    When the user calls the endpoint
    Then a record of type "EspocrmWebhookEntity" is created
    And it returns a 201 status code