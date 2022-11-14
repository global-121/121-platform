@pa-app
Feature: Verify phone number input

  Scenario: Reject an incorrect phone number value
    Given a "phone-number"-input is shown
    When the PA fills in the phone number incorrectly
    Then a message "the phone number is incorrect" is shown

    Examples:
      | Incorrect phone number value | Reason    |
      | 1234567                      | Too short |
      | 12345678901234567            | Too long  |

  Scenario: Accept a correct phone number value
    Given a "phone-number"-input is shown
    When the PA fills in the phone number correctly
    Then the PA is able to proceed

    Examples:
      | Correct phone number value |
      | +15005550006               |
      | 15005550006                |
      | (1) 5005550006             |
      | (1) 500 55 500 06          |

  Scenario: Accept an incorrect phone number value
    Given a "phone-number"-input is shown
    Given the online lookup is not available
    When the PA fills in the phone number incorrectly
    Then the PA is able to proceed
