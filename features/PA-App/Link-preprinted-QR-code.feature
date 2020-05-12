@pa-app
Feature: Link preprinted QR-code

  Background:
    Given the PA is at the "preprinted qr-code"-step in the conversation
    Given the PA has a QR-code with enough data available


  Scenario: Allow access to device camera(s)
    When the PA presses "yes" at the first question
    Then a "start scanner" button is shown and the "Scan QR-code" window is shown
    And the browser asks for permissions to use the device's camera(s)
    When the PA allows access to the camera(s)
    Then a camera preview is shown

  Scenario: No access to device camera(s)
    When the PA presses "yes" at the first question
    Then a "start scanner" button is shown and the "Scan QR-code" window is shown
    And the browser asks for permissions to use the device's camera(s)
    When the PA does not allow access to the camera(s)
    Then a warning message is shown

  Scenario: Wrong default camera is selected
    Given the device has multiple camera's
    When the PA presses "yes" at the first question
    Then a "start scanner" button is shown and the "Scan QR-code" window is shown
    And a "switch camera" button is shown
    And sometimes the wrong camera is selected, resulting in a waiting screen
    When the PA clicks the "switch camera" button
    Then a camera preview is shown
    
  Scenario: Successful scanning of QR-code
    Given the PA presses "yes" at the first question
    Given a "start scanner" button is shown and the "Scan QR-code" window is shown
    Given the PA allows access to the camera(s)
    Given a camera preview is shown
    When the PA moves the QR-code (sufficiently) into view
    Then "Scan QR-code" window is closed
    And a positive feedback message is shown

  Scenario: Cancel scanning of QR-code
    Given the PA presses "yes" at the first question
    Given a "start scanner" button is shown and the "Scan QR-code" window is shown
    Given the PA allows access to the camera(s)
    Given a camera preview is shown
    When the PA closes the "Scan QR-code" window
    Then a "start Scanner" button is shown

  Scenario: Scanning of already used QR-code
    Given the PA presses "yes" at the first question
    Given a "start scanner" button is shown and the "Scan QR-code" window is shown
    Given the PA allows access to the camera(s)
    Given a camera preview is shown
    Given the PA has a QR-code with data already registerd in the system
    When the PA moves the QR-code (sufficiently) into view
    Then "Scan QR-code" window is closed
    And a negative feedback message is shown
    And a "try again" button is shown

  Scenario: Scanning of QR-code with insufficient data
    Given the PA presses "yes" at the first question
    Given a "start scanner" button is shown and the "Scan QR-code" window is shown
    Given the PA allows access to the camera(s)
    Given a camera preview is shown
    Given the PA has a QR-code with insufficcient data (nr of characters is less then 10)
    When the PA moves the QR-code (sufficiently) into view
    Then "Scan QR-code" window is closed
    And a negative feedback message is shown
    And a "try again" button is shown

  Scenario: Retry scanning of QR-code after error
    Given the PA presses "yes" at the first question
    Given a "start scanner" button is shown and the "Scan QR-code" window is shown
    Given the PA allows access to the camera(s)
    Given the PA has previously scanned a QR-code with insufficcient data
    Given a "try again" button is shown
    When the PA presses the "try again" button
    Then the "Scan QR-code" window is shown
    And  a camera preview is shown
