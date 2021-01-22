# PA-App

The front-end of the application _People Affected_ use to interact with the 121-platform.

## Configuration

Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.

## Dependencies in use

Next to the 'generic' dependencies/libraries/components [used by all interfaces](../README.md#Dependencies-in-use), the PA-app also uses:

- [`angularx-qrcode`](https://github.com/cordobo/angularx-qrcode)
  A component to render QR-codes with custom data.

  - Documentation: <https://github.com/cordobo/angularx-qrcode#basic-usage>

- [Howler](https://howlerjs.com/)
  A component to play, (pre-)load and handle audio-files.
  - Documentation: <https://github.com/goldfire/howler.js#documentation>

## Assets

### Audio files

The PA-App uses audio-files to make the [interface-text](./src/assets/i18n/en.json) accessible in spoken form.

Audio-file creation/processing:

- Add the audio-file(s) to `./src/assets/i18n/<locale>/` where:

  - `locale` is an [IETF BCP47](https://tools.ietf.org/html/bcp47) language-string; like `en` or `fr-BE`, etc.

- Set the audio files' filenames to: `<translation.string.key>.mp3` where:

  - `translation.string.key` is the path used in the text-translation file, see [`en.json`](./src/assets/i18n/en.json)

- If source-audio is only available in `*.m4a`-files, convert to `*.mp3` first, by running the script:  
  `npm run generate-assets-audio -- <locale> --convertFrom m4a`

- Convert the audio files to the specified format(s) by running the script:  
  `npm run generate-assets-audio -- <locale>`  
   Or provide the locale/language-code at the prompt.

### NGO logo's

Use of NGO-logo's is currently hard-coded. When either of the following changes:

- A new NGO is participating in the 121-system
- The logo (name) of an NGO changes
- The NGO name (used in the 121-service program-object) changes

... then this should be reflected in code-changes in:

- `./src/app/shared/dialogue-turn/dialogue-turn.component.html`
- and `./src/app/shared/dialogue-turn/dialogue-turn.component.ts`

## Deployment / Building

To deploy a native build of this app, see the generic instructions in [/interfaces/README](../README.md#Deployment).

After that, run: (with `<type>` as `--prod` or `--debug`)

    npm run build:native -- <type>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
