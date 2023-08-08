@espocrm-webhook
Feature: Receive webhook events from EspoCRM

  Background:
    Given an environment not in DEBUG-mode

  Scenario: Successfully receive 'update' event
    Given a 'x-signature' header is provided
    And the IP address which is in the 'x-forwarded-for' header is whitelisted
    When the '/espocrm/update-registration' endpoint is called
    And an array of objects is provided, in which each object has atleast: 'id' and 1 key/value pair (for example, 'firstName': 'John')
    And the specified key(s) exist(s) as one of: program question, fsp question, custom attribute
    Then the value is updated in the database
    And a 201 status code is returned

  Scenario: Unsuccessfully receive 'update' event due to missing 'x-signature' header
    Given the IP address which is in the 'x-forwarded-for' header is whitelisted
    When the '/espocrm/update-registration' endpoint is called
    Then a 403 status code is returned

  Scenario: Unsuccessfully receive 'update' event due to unwhitelisted IP address
    Given a 'x-signature' header is provided
    And the IP address which is in the 'x-forwarded-for' header is NOT whitelisted
    When the '/espocrm/update-registration' endpoint is called
    Then a 403 status code is returned

  Scenario: Successfully receive 'delete' event
TODO: This will be implemented in the future.