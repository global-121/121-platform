# Portal(icious)

The front-end for the _Humanitarian Organization_ web portal, where users can interact with the 121 Platform.

## Configuration

Set all ENV-variables in a local `.env`-file, based on: [`.env.example`](.env.example)-file. Each allowed/required value is explained in the example file.

## Dependencies in use

- [Angular](https://angular.dev/overview)  
  This front-end framework gives us a structure to create components that can be connected, combined, share data and can be delivered as a web-app.

  - API Documentation: <https://angular.dev/api>

- [PrimeNG](https://primeng.org/)  
  A UI-library for Angular, to quickly build interfaces with a lot of components and features off-the-shelve.

  - Documentation: <https://primeng.org/configuration>

## Development

Run `npm start`. Navigate to <http://localhost:4200>. The application will automatically reload if you change any of the source files.

Run `npm run fix` to automatically fix code-style and syntax issues.

### Code scaffolding

Run `ng generate component <component-name>` to generate a new component.  
Other uses, see: <https://angular.dev/cli/generate>

### Internationalization (i18n)

To support multiple languages, we use the default Angular i18n features, see: <https://angular.dev/guide/i18n>

See all supported/enabled languages at: [`angular.json:.../i18n/locales`](angular.json#L17).

During development, only 1 language can be used.  
See all available languages at: [`angular.json:.../architect/serve/configurations`](angular.json#L199).

To use a different language, run: `npm run start -- --configuration=<language-code>`.

### Translations for other languages

Translations are managed via the [Lokalise TMS-service](https://lokalise.com).  
To create a local build using the latest translations, the translation-files need to be downloaded from the Lokalise-API.

For this, some credentials/variables need to be set in the `.env`-file:

- `NG_LOCALES` Should contain the desired languages (comma-separated)
- `NG_DOWNLOAD_TRANSLATIONS_AT_BUILD=true`
- `LOKALISE_PROJECT_ID` - See in Bitwarden/GitHub-environments
- `LOKALISE_API_TOKEN` - Create one in your Lokalise-account or use the shared Development-token from Bitwarden

After setting these variables, run the following command to download the translations:  
This is only required **_once_** (So not for _every_ build; As long as the translatable text hasn't changed).

```bash
npm run build:download-translations
```

After downloading, the translations will be available to use.

- For local-development, run: `npm run start -- --configuration=<language-code>`
- Or for a production build, run: `npm run start:debug-production`

## Build

Run `npm run build:prod` to build the project in production-mode. The output will be stored in the `www/` directory.

Run `npm run start:debug-production` to run a local server with the production build.

## Tests

Run `npm run test:all` to run code-style, syntax-test and unit-tests combined.

Run `npm test` to execute the unit-tests via [Karma](https://karma-runner.github.io).

## Contributing

### PR Checklist

After making your changes, make sure to:

- Check code-syntax.
  - Use `npm run lint` to check for any issues
  - Use `npm run fix` to auto-fix (some) issues
- Check translatability.
  - Make sure all translatable text-elements have `i18n`/`i18n-*`-attribute(s)
  - Extract all translatable text into `messages`-files:  
    Run: `npm run extract-i18n`
  - Add/remove/update translated text (when applicable)
  - Verify translated version:  
    Run: `npm run start -- --configuration=nl`

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
