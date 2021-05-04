@pa-app
Feature: Verify password input


  Scenario: Show "Toggle password" on password-input
    Given the PA is at the "create account"-step in the conversation
    When the PA fills in a username and submits
    Then a password-input with toggle-button is shown
    And the icon "eye open" is shown on the button

  Scenario: Show "Toggle password" on password-input (at login)
    Given the PA is at the "login account"-step in the conversation
    When the PA fills in a username and submits
    Then a password-input with toggle-button is shown
    And the icon "eye open" is shown on the button

  Scenario: Toggle password input to be readable
    Given the PA is at the "create account"-step in the conversation
    Given the PA fills in a username and submits
    Given a password-input with toggle-button is shown
    Given the PA fills in a password: "test-password"
    When the PA presses the "eye open"-button
    Then the value in the input is readable: "test-password"
    And the "eye-icon with a line through it" is shown

  Scenario: Toggle password input to be unreadable again
    Given the PA is at the "create account"-step in the conversation
    Given the PA fills in a username and submits
    Given a password-input with toggle-button is shown
    Given the PA fills in a password("test-password")
    Given the PA presses the "eye open"-button
    When the PA presses the "eye-icon with a line through it"-button
    Then the value in the input is unreadable "*************"
    And the "eye-open" icon is shown

  Scenario: Toggle on disabled password-input
    Given the PA is logged in with an existing account
    Given the "create account"-step is shown in the conversation
    When the password-field is shown
    Then the password-field is "disabled"
    And the value "****************" is shown
    And the toggle-button is not shown
