Feature: SSO Multi-Tenant Authentication
  As a user of the 121 Platform
  I want to be able to log in using Single Sign-On with various Microsoft account types
  So that I can access the platform securely with my existing accounts

  Background:
    Given the 121 Platform is running
    And SSO (Single Sign-On) is enabled in the system

  @manual @login @external-user
  Scenario: Log in with invited external user (hotmail/outlook)
    Given the Admin has access to Swagger
    When the Admin executes "POST: /users/UserController_login" with his username and password
    And the Admin invites an external user with hotmail/outlook email
    And the invited user opens a new incognito browser tab
    And the user attempts to log in with their hotmail/outlook account
    Then the user should be successfully authenticated
    And the user should have access to the 121 Platform

  @manual @login @organization-user
  Scenario: Log in with invited user from the organisation
    Given there is at least one Admin user with permission to add new members
    And the Admin has invited a user from the organization
    When the user opens a new incognito tab
    And the user attempts to log in with their organization credentials
    Then the user should be successfully authenticated
    And the user should have access to the 121 Platform

  @manual @login @unregistered-account
  Scenario: Log in without registered Microsoft Account
    Given there is not any external Microsoft account created
    When the user opens a new incognito tab
    And the user attempts to log in without a registered Microsoft account
    Then the login should fail
    And the user should see an appropriate error message

  @manual @login @external-user @gmail
  Scenario: Log in with invited external user (Gmail)
    Given there is at least one Admin user with permission to add new members
    And the Admin has access to Swagger
    When the user creates a new Microsoft account from their existing Google account using https://www.microsoft.com/
    And the user logs in to Swagger
    And the Admin executes "POST: /users/UserController_login" with his username and password
    And the Admin invites the external Gmail user
    Then the user should be able to log in successfully
    And the user should have access to the 121 Platform

  @manual @iframe @login @external-user
  Scenario: Iframe - Log in with invited external user (hotmail/outlook)
    Given there is at least one Admin user with permission to add new members
    And the Admin has access to Swagger
    And SSO is enabled
    And there is already an external Microsoft account created
    When the Admin executes "POST: /users/UserController_login" with his username and password
    And the user accesses the platform through an iframe
    And the user attempts to log in with their hotmail/outlook account
    Then the user should be successfully authenticated through the iframe
    And the user should have access to the 121 Platform

  @manual @iframe @login @organization-user
  Scenario: Iframe - Log in with invited user from the organisation
    Given there is at least one Admin user with permission to add new members
    And the Admin has invited a user from the organization
    When the user opens a new incognito tab
    And the user accesses the platform through an iframe
    And the user attempts to log in with their organization credentials
    Then the user should be successfully authenticated through the iframe
    And the user should have access to the 121 Platform

  @manual @iframe @login @unregistered-account
  Scenario: Iframe - Log in without registered Microsoft Account
    Given there is not any external Microsoft account created
    When the user opens a new incognito tab
    And the user accesses the platform through an iframe
    And the user attempts to log in without a registered Microsoft account
    Then the login should fail
    And the user should see an appropriate error message

  @manual @iframe @login @external-user @gmail
  Scenario: Iframe - Log in with invited external user (Gmail)
    Given there is at least one Admin user with permission to add new members
    And the Admin has access to Swagger
    And SSO is enabled
    And there is a Google or Hotmail account available
    When the user creates a new Microsoft account from their existing Google account using https://www.microsoft.com/
    And the user accesses the platform through an iframe
    And the user attempts to log in with their new Microsoft account
    Then the user should be successfully authenticated through the iframe
    And the user should have access to the 121 Platform

  @manual @login @uninvited-user @organization
  Scenario: Log in with un-invited user from organisation
    Given there is not any external Microsoft account created
    And there is an organization user who has not been invited to the platform
    When the uninvited organization user attempts to log in
    Then the login should fail
    And the user should see an appropriate error message indicating they are not authorized

  @manual @login @uninvited-user @external-hotmail
  Scenario: Log in with un-invited external user (hotmail/outlook)
    Given there is not any external Microsoft account created
    And there is an external hotmail/outlook user who has not been invited to the platform
    When the uninvited external user attempts to log in
    Then the login should fail
    And the user should see an appropriate error message indicating they are not authorized

  @manual @login @uninvited-user @external-gmail
  Scenario: Log in with un-invited external user (gmail)
    Given there is not any external Microsoft account created
    And there is an external Gmail user who has not been invited to the platform
    When the uninvited external user attempts to log in
    Then the login should fail
    And the user should see an appropriate error message indicating they are not authorized

  @manual @login @pre-existing-account
  Scenario: Log in with pre-existing 121-account
    Given there is a pre-existing user in the database
    And SSO is enabled after creating this user
    And the email for their SSO login and 121 user account match exactly
    When the user opens a new incognito tab
    And the user successfully logs in with SSO
    Then the response should be 2xx
    And the 121 user account should be marked as an Entra user (isEntraUser: true)
    And the user should have access to their existing 121 Platform account

  @manual @iframe @login @popup-blocked
  Scenario: Iframe - Log in without browser popups allowed
    Given the user is viewing the login page from an iframe (like Twilio Flex)
    And browser popups are blocked or not allowed
    When the user tries to log in by clicking the 'Log in' button
    Then the user should see an error in the login form: "Please allow pop-up windows in your browser settings to login"
    And the login process should not complete successfully
