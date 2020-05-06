@aw-app
Feature: Get PA attributes for validation

  Background:
    Given a logged-in "aidworker" user
    Given the user successfully scanned a valid QR-code (a qr code with a programId and did)

  Scenario: Scanning a valid QR code online and the validation data is available
    Given a valid qr
    Given the DID and the progam ID are available online
    Given the user did not download the offline data for this user
    Given there is internet
    Given the validation data for that did an program id is available online
    When the scan is complete
    Then the correct validation data is loaded

  Scenario: Scanning a valid QR code offline with the validation data downloaded
    Given a valid qr
    Given the DID and the progam ID are available offline
    Given there is no internet
    When the scan is complete
    Then the correct validation data is loaded

  Scenario: Scanning a valid QR code online and the validation data is not available
    Given a valid qr
    Given the DID and the progam ID are available online
    Given the user did not download the offline data for this user
    Given the validation data for that did an program id is not available online
    Given there is internet
    When the scan is complete
    Then the message: "QR-code not found. You can try scanning another QR-code." is displayed

  Scenario: Scanning a valid QR code online with the validation data not downloaded
    Given a valid qr
    Given the DID and the progam ID are not available offline
    Given there is no internet
    When the scan is complete
    Then the message: "QR-code not found. You can try scanning another QR-code." is displayed



  Scenario: Scanning a valid QR code online and the data
