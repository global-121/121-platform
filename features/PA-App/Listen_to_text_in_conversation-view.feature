@pa-app
Feature: Listen to text in conversation-view

  Scenario: Show "Speak text"-button next to text in speech-bubble
    Given an audio-file is available for the given text-message
    When the text-message by 'the 121 system' is shown
    Then a "speak text button" is shown at the end of the line
    And the icon "play" is shown on the button

  Scenario: Show "Speak text"-button next to a submit/more-info-button
    Given an audio-file is available for the given button-label
    When the "submit/more-info-button" is shown
    Then a "speak text button" is shown 'attached' next to the button
    And the icon "play" is shown on the button

  Scenario: Show "Speak text"-button for the title of a more-info-popup
    Given an audio-file is available for the given title
    When the "more-info popup" is shown
    Then a "speak text button" is shown in front of the title
    And the icon "play" is shown on the button

  Scenario: Hide "Speak text"-button when audio is not available
    Given an audio-file is not available for the given text-message/button-label/popup-title
    When the "text-message/button-label/popup-title" is shown
    Then nothing is shown of the "speak text"-button

  Scenario: Play audio of visible text (start)
    Given an audio-file is available for the visible text
    When the PA presses the "play" button
    Then the audio starts playing
    And the "pause" icon is shown on the button

  Scenario: Play audio of visible text (end)
    Given an audio-file is available for the visible text
    Given the PA presses the "play" button
    When the audio is played till the end
    Then the audio stops playing
    And the "play" icon is shown on the button

  Scenario: Pause audio while playing
    Given an audio-file is available for the visible text
    Given the PA presses the "play" button
    Given the audio is playing
    When the PA presses the "pause" button
    Then the audio is paused
    And the "play" icon is shown on the button
    When the PA presses the "play" button again
    Then the audio resumes playing
    And the "play" icon is shown on the button
