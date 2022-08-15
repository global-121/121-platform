# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/global-121/121-platform/compare/v1.48.4...master)

---
## [1.48.4](https://github.com/global-121/121-platform/compare/v1.48.3...v1.48.4) - 2022-08-15

### Fixed
- 2022-08-15: Fixed bug in export all People Affected 500 error because of duplicate stored whatsappnumbers.

## [1.48.3](https://github.com/global-121/121-platform/compare/v1.48.2...v1.48.3) - 2022-08-15

### Fixed
- 2022-08-15: Fixed bug in export all People Affected phonenumber of imported not shown.
- 2022-08-15: Fixed bug unable to edit PA transfer value in portal.

## [1.48.2](https://github.com/global-121/121-platform/compare/v1.48.1...v1.48.2) - 2022-08-10

### Fixed
- 2022-08-11: Bug in the PA table; payment history is not shown.

## [1.48.1](https://github.com/global-121/121-platform/compare/v1.48.0...v1.48.1) - 2022-08-10

### Fixed
- 2022-08-10: Bug in the `shortLabel` migration.

## [1.48.0](https://github.com/global-121/121-platform/compare/v1.47.0...v1.48.0) - 2022-08-10

### Changed

- 2022-08-10: Refactored `RegistrationEntity.customData` to `RegistrationDataEntity` as a related table of `RegistrationEntity` to enable querying on that data.
- 2022-08-10: Renamed `FspAttributeEntity` to `FspQuestionEntity`.
- 2022-08-10: Added a `shortLabel` property to `ProgramQuestionEntity` and `FspQuestionEntity` to give these properties a different label in the 121-portal than in the PA-app.
- 2022-08-10: Fixed downloading vouchers of failed payments where the creation of the voucher was succesful but the sending via Whatsapp failed.

## [1.47.0](https://github.com/global-121/121-platform/compare/v1.46.0...v1.47.0) - 2022-06-23

### Changed

- 2022-06-23: Customize which program questions/ fsp attributes/ program custom data attributes are vissible in which phase in the PA-table in the Portal
- 2022-06-23: Customize which program question are editable in the pop-up in the PA table
- 2022-06-23: Fixed fields in PA pop-up not updating after edit

## [1.46.0](https://github.com/global-121/121-platform/compare/v1.45.0...v1.46.0) - 2022-06-07

### Changed

- 2022-06-08: Configure program question as custom attributes for ukraine
- 2022-06-08: Configure which custom attributes get exported in the inclusion list
- 2022-06-08: Automatically calculate transer value based on a formula

## [1.45.0](https://github.com/global-121/121-platform/compare/v1.44.0...1.45.0) - 2022-06-07

## [1.44.0](https://github.com/global-121/121-platform/compare/v1.43.1...1.44.0) - 2022-05-25

## [1.43.1](https://github.com/global-121/121-platform/compare/v1.43.0...1.43.1) - 2022-05-04

## [1.43.0](https://github.com/global-121/121-platform/compare/v1.42.0...1.43.0) - 2022-04-28

## [1.42.0](https://github.com/global-121/121-platform/compare/v1.41.1...1.42.0) - 2022-04-20

## [1.41.1](https://github.com/global-121/121-platform/compare/v1.41.0...1.41.1) - 2022-04-12

## [1.41.0](https://github.com/global-121/121-platform/compare/v1.40.0...1.41.0) - 2022-04-10

## [1.40.0](https://github.com/global-121/121-platform/compare/v1.39.0...1.40.0) - 2022-04-07

## [1.39.0](https://github.com/global-121/121-platform/compare/v1.38.0...1.39.0) - 2022-04-06

## [1.38.0](https://github.com/global-121/121-platform/compare/v1.37.1...1.38.0) - 2022-04-05

## [1.37.1](https://github.com/global-121/121-platform/compare/v1.37.0...1.37.1) - 2022-03-30

## [1.37.0](https://github.com/global-121/121-platform/compare/v1.36.1...1.37.0) - 2022-03-22

## [1.36.1](https://github.com/global-121/121-platform/compare/v1.36.0...1.36.1) - 2022-03-03

## [1.36.0](https://github.com/global-121/121-platform/compare/v1.35.3...1.36.0) - 2022-03-02

### Changed

- 2022-02-18: JWT-tokens for authorization/authentication are now being stored/transported via browser-cookies, no longer via a `Authentication`-header and browser's local/session-storage.
- 2022-02-18: Changes in rules for caching in Apache-config

## [1.35.3](https://github.com/global-121/121-platform/compare/v1.35.2...1.35.3) - 2022-02-16

## [1.35.2](https://github.com/global-121/121-platform/compare/v1.35.1...1.35.2) - 2022-02-16

## [1.35.1](https://github.com/global-121/121-platform/compare/v1.35.0...1.35.1) - 2022-02-15

## [1.35.0](https://github.com/global-121/121-platform/compare/v1.34.3...1.35.0) - 2022-02-15

## [1.34.3](https://github.com/global-121/121-platform/compare/v1.34.2...1.34.3) - 2022-02-08

## [1.34.2](https://github.com/global-121/121-platform/compare/v1.34.1...1.34.2) - 2022-02-08

## [1.34.1](https://github.com/global-121/121-platform/compare/v1.34.0...1.34.1) - 2022-02-02

## [1.34.0](https://github.com/global-121/121-platform/compare/v1.33.3...1.34.0) - 2022-02-02

### Changed

- 2022-02-01: From Role-based access to Permission-based access

  All access-checks on back-end endpoints and visibility of interface-features is now handled via specific [Permissions](services/121-service/src/user/permission.enum.ts).
  `Permission`s are assigned to `User`s per `Program`.
  Sets of `Permission`s (`Role`s) can be defined per `Program`, to be assigned to `User`s.

  Data-migrations and definitions of existing `User`s and their `Role`s are included in the [TypeORM migration script](migration/1642520954620-roles-permissions.ts).

## [1.33.3](https://github.com/global-121/121-platform/compare/v1.33.2...1.33.3) - 2022-02-01

## [1.33.2](https://github.com/global-121/121-platform/compare/v1.33.1...1.33.2) - 2022-01-31

## [1.33.1](https://github.com/global-121/121-platform/compare/v1.33.0...1.33.1) - 2022-01-19

## [1.33.0](https://github.com/global-121/121-platform/compare/v1.32.0...1.33.0) - 2022-01-19

## [1.32.0](https://github.com/global-121/121-platform/compare/v1.31.1...1.32.0) - 2022-01-05

## [1.31.1](https://github.com/global-121/121-platform/compare/v1.31.0...1.31.1) - 2022-01-04

## [1.31.0](https://github.com/global-121/121-platform/compare/v1.30.4...1.31.0) - 2022-01-04

### Added

- 2021-12-23: Conditional Maintenance-mode with status-check for deploy-script
  Make sure to define `GLOBAL_121_STATUS_URL` in `./tools/.env` when using a custom hostname/port-number for the 121-service
- 2021-12-22: Add configuration flags for `webhook.js`-script:
  `DEPLOY_PRE_RELEASE` and `DEPLOY_RELEASE` to enable auto-deployment of these type of (pre-)release payloads.
- 2021-12-28: Added 'manual deployment' via the `webhook.js`-script. See [tools/README](./tools/README.md#webhook-script).
- 2021-12-29: Added `whatsappGenericMessage` to the NL program notifications.

## Changed

- 2021-12-28: "Automatic hotfix deployment" is now an opt-in behavior by setting the ENV-variable `DEPLOY_PATCH=1`. See [tools/README](./tools/README.md#webhook-script).

## [1.30.4](https://github.com/global-121/121-platform/compare/v1.30.3...v1.30.4) - 2021-12-22

- Test release

## [1.30.3](https://github.com/global-121/121-platform/compare/v1.30.2...v1.30.3) - 2021-12-22

- Test release

## [1.30.2](https://github.com/global-121/121-platform/compare/v1.30.1...v1.30.2) - 2021-12-22

### Added

- 2021-12-22: Added pre-release option to webhook-script

## [1.30.1](https://github.com/global-121/121-platform/compare/v1.30.0...v1.30.1) - 2021-12-22

- Test release

## [1.30.0](https://github.com/global-121/121-platform/compare/v1.29.3...v1.30.0) - 2021-12-22

## [1.29.3](https://github.com/global-121/121-platform/compare/v1.29.2...v1.29.3) - 2021-12-17

## [1.29.2](https://github.com/global-121/121-platform/compare/v1.29.1...v1.29.2) - 2021-12-15

## [1.29.1](https://github.com/global-121/121-platform/compare/v1.29.0...v1.29.1) - 2021-12-14

### Changed

- 2021-12-14: Phone-number validation/sanitization set the same in front- and back-end.

## [1.29.0](https://github.com/global-121/121-platform/compare/v1.28.0...v1.29.0) - 2021-12-13

## [1.28.0](https://github.com/global-121/121-platform/compare/v1.27.0...v1.28.0) - 2021-12-07

## [1.27.0](https://github.com/global-121/121-platform/compare/v1.26.0...v1.27.0) - 2021-11-30

## [1.26.0](https://github.com/global-121/121-platform/compare/v1.25.0...v1.26.0) - 2021-11-30

## [1.25.0](https://github.com/global-121/121-platform/compare/v1.24.0...v1.25.0) - 2021-11-23

### Added

- 2021-11-23: Added service worker header and registration strategy

## [1.24.0](https://github.com/global-121/121-platform/compare/v1.23.0...v1.24.0) - 2021-11-23

## [1.23.0](https://github.com/global-121/121-platform/compare/v1.22.0...v1.23.0) - 2021-11-17

## [1.22.0](https://github.com/global-121/121-platform/compare/v1.21.0...v1.22.0) - 2021-11-16

## [1.21.0](https://github.com/global-121/121-platform/compare/v1.20.0...v1.21.0) - 2021-11-16

## [1.20.0](https://github.com/global-121/121-platform/compare/v1.19.0...v1.20.0) - 2021-11-10

## [1.19.0](https://github.com/global-121/121-platform/compare/v1.18.0...v1.19.0) - 2021-11-09

### Changed

- 2021-11-09: Renamed "HO-Portal" to "121 Portal" or "Portal"

## [1.18.0](https://github.com/global-121/121-platform/compare/v1.17.0...v1.18.0) - 2021-11-09

### Added

- 2021-11-09: BelCash as FSP
- 2021-11-09: BoB-finance as FSP
- 2021-11-09: `BELCASH_API_URL`, `BELCASH_LOGIN`, `BELCASH_API_TOKEN`, `BELCASH_SYSTEM` to `services/.env`

## [1.17.0](https://github.com/global-121/121-platform/compare/v1.16.0...v1.17.0) - 2021-10-27

### Changed

- 2021-10-20: Upgrade PA-App to Angular v9 + Ionic v5
- 2021-10-20: Upgrade HO-Portal to Angular v9 + Ionic v5
- 2021-10-20: Upgrade AW-App to Angular v9 + Ionic v5

## [1.16.0](https://github.com/global-121/121-platform/compare/v1.15.0...v1.16.0) - 2021-10-13

### Changed

Nothing. Dummy release upgrade to test automatic deploy through webhook on minor versions.

## [1.15.0](https://github.com/global-121/121-platform/compare/v1.14.4...v1.15.0) - 2021-10-13

## [1.14.4](https://github.com/global-121/121-platform/compare/v1.14.3...v1.14.4) - 2021-10-12

## [1.14.3](https://github.com/global-121/121-platform/compare/v1.14.2...v1.14.3) - 2021-10-08

## [1.14.2](https://github.com/global-121/121-platform/compare/v1.14.1...v1.14.2) - 2021-10-06

## [1.14.1](https://github.com/global-121/121-platform/compare/v1.14.0...v1.14.1) - 2021-10-06

## [1.14.0](https://github.com/global-121/121-platform/compare/v1.13.0...v1.14.0) - 2021-10-04

### Changed

- 2021-09-15: Upgrade PA-App to Angular v8
- 2021-09-15: Upgrade HO-Portal to Angular v8
- 2021-09-15: Upgrade AW-App to Angular v8

## [1.13.0](https://github.com/global-121/121-platform/compare/v1.12.2...v1.13.0) - 2021-09-15

## [1.12.2](https://github.com/global-121/121-platform/compare/v1.12.1...v1.12.2) - 2021-09-07

## [1.12.1](https://github.com/global-121/121-platform/compare/v1.12.0...v1.12.1) - 2021-09-03

## [1.12.0](https://github.com/global-121/121-platform/compare/v1.11.0...v1.12.0) - 2021-09-03

## [1.11.0](https://github.com/global-121/121-platform/compare/v1.10.2...v1.11.0) - 2021-08-30

## [1.10.2](https://github.com/global-121/121-platform/compare/v1.10.1...v1.10.2) - 2021-08-04

## [1.10.1](https://github.com/global-121/121-platform/compare/v1.10.0...v1.10.1) - 2021-08-04

## [1.10.0](https://github.com/global-121/121-platform/compare/v1.9.0...v1.10.0) - 2021-08-04

## [1.9.0](https://github.com/global-121/121-platform/compare/v1.8.0...v1.9.0) - 2021-07-20

## [1.8.0](https://github.com/global-121/121-platform/compare/v1.7.3...v1.8.0) - 2021-07-05

### Added

- Import data: "as registered"

### Changed

- Import data: "as imported"
- Export data (more data added)
- Incoming messages: improved error-handling/logging and status-management

## [1.7.3](https://github.com/global-121/121-platform/compare/v1.7.2...v1.7.3) - 2021-06-26

- 2021-06-26: uuid lib PA-app suddenly failing in build prod-mode, replaced by random string function

## [1.7.2](https://github.com/global-121/121-platform/compare/v1.7.1...v1.7.2) - 2021-06-23

## [1.7.1](https://github.com/global-121/121-platform/compare/v1.7.0...v1.7.1) - 2021-06-23

## [1.7.0](https://github.com/global-121/121-platform/compare/v1.6.1...v1.7.0) - 2021-06-23

### Added

- 2021-06-23: `MOCK_INTERSOLVE`, `MOCK_TWILIO`, `DISABLE_GROUPING_ON_PHONENUMBER` to `services/.env`.

## [1.6.1](https://github.com/global-121/121-platform/compare/v1.6.0...v1.6.1) - 2021-06-09

## [1.6.0](https://github.com/global-121/121-platform/compare/v1.5.5...v1.6.0) - 2021-06-09

## [1.5.5](https://github.com/global-121/121-platform/compare/v1.5.4...v1.5.5) - 2021-06-09

### Added

- 2021-06-09: Portuguese translations

## [1.5.4](https://github.com/global-121/121-platform/compare/v1.5.3...v1.5.4) - 2021-06-02

## [1.5.3](https://github.com/global-121/121-platform/compare/v1.5.2...v1.5.3) - 2021-06-02

## [1.5.2](https://github.com/global-121/121-platform/compare/v1.5.1...v1.5.2) - 2021-06-02

### Changed

- 2021-06-01: Changes to local development-environment setup

## [1.5.1](https://github.com/global-121/121-platform/compare/v1.5.0...v1.5.1) - 2021-05-28

### Fixed

- 2021-05-28: Automatic installing of changed dependencies
- 2021-05-28: `tsconfig` settings optimized for Node v12

## [1.5.0](https://github.com/global-121/121-platform/compare/v1.4.1...v1.5.0) - 2021-05-27

### Changed

- 2021-05-25: Upgraded Node.js version to v12
- 2021-05-26: Updated dependencies of 121-service and PA-accounts-service;
  To add/update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`
  To add/update manually: `docker-compose exec PA-accounts-service npm install --no-save --no-fund --no-audit`

## [1.4.1](https://github.com/global-121/121-platform/compare/v1.4.0...v1.4.1) - 2021-05-12

## [1.4.0](https://github.com/global-121/121-platform/compare/v1.3.0...v1.4.0) - 2021-05-12

### Added

- 2021-05-12: Add custom note per PA in HO-Portal

## [1.3.0](https://github.com/global-121/121-platform/compare/v1.2.3...v1.3.0) - 2021-05-05

### Removed

- 2021-04-14: Removed native Android build from PA-App
- 2021-04-14: Removed "local storage"-features from PA-App
  Make sure to update any ENV-variables no longer in use from [interfaces/PA-App/.env](interfaces/PA-App/.env.example)
- 2021-04-20: Removed all components related to Sovrin

### Changed

- 2021-05-05: Updated test scenarios in /features folder

### Added

- 2021-05-05: Added endpoint to upload registered PA's via CSV-file for testing purposes

## [1.2.3](https://github.com/global-121/121-platform/compare/v1.2.2...v1.2.3) - 2021-04-20

## [1.2.2](https://github.com/global-121/121-platform/compare/v1.2.1...v1.2.2) - 2021-04-14

## [1.2.1](https://github.com/global-121/121-platform/compare/v1.2.0...v1.2.1) - 2021-04-13

## [1.2.0](https://github.com/global-121/121-platform/compare/v1.1.0...v1.2.0) - 2021-04-13

### Removed

- 2021-04-01: Removed all code of Referral-app + related code/documentation

## [1.1.1](https://github.com/global-121/121-platform/compare/v1.1.0...v1.1.1) - 2021-04-06

Hotfix for query-complexity.

## [1.1.0](https://github.com/global-121/121-platform/compare/v1.0.0...v1.1.0) - 2021-03-30

### Changed

- 2021-03-30: Updated dependency `y18n` to 121-service and PA-accounts-service;
  To add/update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`
  To add/update manually: `docker-compose exec PA-accounts-service npm install --no-save --no-fund --no-audit`

---

## v[1.0.0](https://github.com/global-121/121-platform/compare/v0.21.1...v1.0.0) - 2021-03-18

This version contains a working version of the full system, including:

- Self-registration by People Affected (PA) using a web-app
- (Offline) validation by Aid-Workers (AW) using a web-app
- Publishing of a (single) aid-program by a Humanitarian Organization (HO)
- Including/Rejecting PAs based on pre-set conditions of manually by HO
- Initiating pay-outs using multiple financial service providers (FSP)
- Publishing "Information as Aid" using a stand-alone web-app

---

## [0.21.2](https://github.com/global-121/121-platform/compare/v0.21.1...v0.21.2) - 2021-03-17

## [0.21.1](https://github.com/global-121/121-platform/compare/v0.21.0...v0.21.1) - 2021-03-17

## [0.21.0](https://github.com/global-121/121-platform/compare/v0.20.1...v0.21.0) - 2021-03-17

## [0.20.1](https://github.com/global-121/121-platform/compare/v0.20.0...v0.20.1) - 2021-03-08

Hotfix: To run initial start-up without manual intervention.

## [0.20.0](https://github.com/global-121/121-platform/compare/v0.19.1...v0.20.0) - 2021-03-08

### Added

- 2021-03-01: Add "read-only" user-role: `view`. See: [`services/.env`](services/.env.example)

  To use/add this role in an existing environment, a manual migration-step is required:
  Run `docker-compose exec 121-service npm run seed:dev` (See: [`seed-dev.ts`](services/121-service/src/scripts/seed-dev.ts) )

### Added

- 2021-03-09: Added new dependency `csv-parser` to 121-service;
  To add/update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`

## [0.19.1](https://github.com/global-121/121-platform/compare/v0.19.0...v0.19.1) - 2021-02-24

## [0.19.0](https://github.com/global-121/121-platform/compare/v0.18.0...v0.19.0) - 2021-02-23

### Added

- 2021-02-17: Option to define a human-readable name for the current environment.
  - Set a value with `ENV_NAME` in [`services/.env`](services/.env.example)
  - Optional: Set the url to a specific icon/`favicon` with: `ENV_ICON`
  - For each interface, define the name with `NG_ENV_NAME` in its own `.env`-file

### Changed

- 2021-02-17: Setting the URL-scheme of all back-end services, via `SCHEME` variable in [`services/.env`](services/.env.example)

## [0.18.0](https://github.com/global-121/121-platform/compare/v0.17.4...v0.18.0) - 2021-02-10

### Changed

- 2021-02-09: Users in the `121-service` changed from single-role to multi-role.

  To retain the existing users' roles a manual migration-step is required.

- 2021-02-09: Default user-accounts changed
  The values defined in `services/.env` need to be updated according to: [`services/.env.example`](services/.env.example).

## [0.17.4](https://github.com/global-121/121-platform/compare/v0.17.3...v0.17.4) - 2021-02-03

## [0.17.3](https://github.com/global-121/121-platform/compare/v0.17.2...v0.17.3) - 2021-02-02

## [0.17.2](https://github.com/global-121/121-platform/compare/v0.17.1...v0.17.2) - 2021-02-02

## [0.17.1](https://github.com/global-121/121-platform/compare/v0.17.0...v0.17.1) - 2021-01-26

## [0.17.0](https://github.com/global-121/121-platform/compare/v0.16.0...v0.17.0) - 2021-01-19

## [0.16.0](https://github.com/global-121/121-platform/compare/v0.15.4...v0.16.0) - 2021-01-13

## [0.15.4](https://github.com/global-121/121-platform/compare/v0.15.3...v0.15.4) - 2021-01-12

## [0.15.3](https://github.com/global-121/121-platform/compare/v0.15.2...v0.15.3) - 2021-01-11

## [0.15.2](https://github.com/global-121/121-platform/compare/v0.15.1...v0.15.2) - 2021-01-06

### Changed

- 2021-01-06: Use pre-built image for `tykn_indy_pool`/`indypool`-service from Docker Hub: <https://hub.docker.com/r/rodekruis510/121-indypool>

## [0.15.1](https://github.com/global-121/121-platform/compare/v0.15.0...v0.15.1) - 2021-01-06

## [0.15.0](https://github.com/global-121/121-platform/compare/v0.14.0...v0.15.0) - 2021-01-06

### Added

- 2020-12-30: Add Docker cleanup/prune-step to deploy-script for images >1 week old

### Changed

- 2020-12-30: Use named-volumes for `node_modules` in `docker-compose.yml`
  This fixes/enables automatic installation of new dependencies of the back-end services (when pulling newer code).
  It is recommended to fully remove the `node_modules`-folders in the `121-service` and the `PA-accounts-service` folders before deploying this version.
  They will be recreated/updated by the build-steps in their `Dockerfile`'s and/or the `docker-compose`-file when running `npm run start:services` from the root-folder.

## [0.14.0](https://github.com/global-121/121-platform/compare/v0.13.6...v0.14.0) - 2020-12-09

## [0.13.6](https://github.com/global-121/121-platform/compare/v0.13.5...v0.13.6) - 2020-12-08

### Changed

- 2020-12-08: Changed `AFRICASTALKING_PROVIDER_CHANNEL` in [services/.env](services/.env.example) to empty value in servers that use Africa's Talking sandbox account.

## [0.13.5](https://github.com/global-121/121-platform/compare/v0.13.4...v0.13.5) - 2020-12-07

### Added

- 2020-12-07: Added `AFRICASTALKING_PROVIDER_CHANNEL` to [services/.env](services/.env.example)

## [0.13.4](https://github.com/global-121/121-platform/compare/v0.13.3...v0.13.4) - 2020-12-04

## [0.13.3](https://github.com/global-121/121-platform/compare/v0.13.2...v0.13.3) - 2020-11-27

## [0.13.2](https://github.com/global-121/121-platform/compare/v0.13.1...v0.13.2) - 2020-11-26

## [0.13.1](https://github.com/global-121/121-platform/compare/v0.13.0...v0.13.1) - 2020-11-19

### Changed

- 2020-11-19: Updated/fixed dependencies of PA-accounts-service;
  To update manually: `docker-compose exec PA-accounts-service npm install --no-save --no-fund --no-audit`

## [0.13.0](https://github.com/global-121/121-platform/compare/v0.12.2...v0.13.0) - 2020-11-18

Release for Acceptance test 2 Kenya Pilot

## [0.12.2](https://github.com/global-121/121-platform/compare/v0.12.1...v0.12.2) - 2020-11-17

Hotfix to fix Intersolve integration for NL-pilot.

## [0.12.1](https://github.com/global-121/121-platform/compare/v0.12.0...v0.12.1) - 2020-11-16

### Changed

- 2020-11-12: Updated/fixed dependencies of 121-service;
  To update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`

## [0.12.0](https://github.com/global-121/121-platform/compare/v0.11.0...v0.12.0) - 2020-11-12

### Added

- 2020-11-11: Functionality to send self-scan instructions. For this to work an image-file needs to be uploaded to `/api/fsp/intersolve/instruction` on environment with the FSP "Intersolve" enabled.

## [0.11.0](https://github.com/global-121/121-platform/compare/v0.10.0...v0.11.0) - 2020-11-11

### Added

- 2020-10-29: `deploy.sh` can log to a file, when defined with `GLOBAL_121_DEPLOY_LOG_FILE`-variable in [tools/.env](tools/.env.example).
- 2020-11-03: Added new dependency `jimp` to 121-service;
  To add/update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`

### Changed

- 2020-11-11: Updated dependency `find-my-way` in 121-service;
  To add/update manually: `docker-compose exec 121-service npm install --no-save --no-fund --no-audit`
- 2020-11-11: Updated dependency `find-my-way` in PA-accounts-service;
  To add/update manually: `docker-compose exec PA-accounts-service npm install --no-save --no-fund --no-audit`
- 2020-11-11: Updated dependency `bl` in PA-accounts-service;
  To add/update manually: `docker-compose exec PA-accounts-service npm install --no-save --no-fund --no-audit`

## [0.10.0](https://github.com/global-121/121-platform/compare/v0.9.0...v0.10.0) - 2020-10-28

### Notes

- 2020-10-21: Sources updated up to [commit `b977df9...`](https://github.com/global-121/121-platform/commit/b977df994ceac254bb1d007a9f5087b3f42cb31a) in [Transifex](https://www.transifex.com/redcrossnl/121-platform/content/)
- 2020-10-27: Sources updated up to [commit `15a2c44...`](https://github.com/global-121/121-platform/commit/15a2c442655e7fa02cff65917b9e67adaffeb4c2) in [Transifex](https://www.transifex.com/redcrossnl/121-platform/content/)

### Added

- 2020-10-21: Added `TWILIO_SID`, `TWILIO_PROGRAM_TOKEN_SID`, `TWILIO_PROGRAM_TOKEN_SECRET` `TWILIO_WHATSAPP_NUMBER` `TWILIO_MESSAGING_SID` to `.env` to `services/.env`
- 2020-10-21: Removed `TWILIO_TEST_TO_NUMBER`, `TWILIO_TEST_FROM_NUMBER_VOICE` ,`TWILIO_TEST_FROM_NUMBER_SMS` from `services/.env`
- 2020-10-21: Added package to 121-service; To add manually: `docker-compose exec 121-service npm install bwip-js@^2.0.10 --no-save`

## [0.9.0](https://github.com/global-121/121-platform/compare/v0.8.6...v0.9.0) - 2020-10-13

### Added

- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of PA-App
- 2020-10-07: Added `PA_API_KEY` to `services/.env`
- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of AW-App
- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of HO-Portal
- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of Referral-App
- 2020-10-13: Added `APPLICATION_INSIGHT_IKEY` and `APPLICATION_INSIGHT_ENDPOINT` to `services/.env`-file

## [0.8.6](https://github.com/global-121/121-platform/compare/v0.8.5...v0.8.6) - 2020-09-30

### Changed

- 2020-09-30: Input-placeholder for phone-number question as FSP custom-data
- 2020-09-30: Update UI-text/program-questions for Kenya-pilot in seed-script

## [0.8.5](https://github.com/global-121/121-platform/compare/v0.8.4...v0.8.5) - 2020-09-30

### Changed

- 2020-09-30: Input-validation for phone-number/date questions
- 2020-09-30: Update UI-text/program-questions for Kenya-pilot in seed-script

## [0.8.4](https://github.com/global-121/121-platform/compare/v0.8.3...v0.8.4) - 2020-09-28

### Fixed

- 2020-09-28: Hotfix/Patch-Releases can now be deployed automatically (again) by `webhook.js`

## [0.8.3](https://github.com/global-121/121-platform/compare/v0.8.2...v0.8.3) - 2020-09-28

### Changed

- 2020-09-28: Update program-questions for Kenya-pilot in seed-script

## [0.8.2](https://github.com/global-121/121-platform/compare/v0.8.1...v0.8.2) - 2020-09-24

### Changed

- 2020-09-24: `deploy.sh` only builds/deploys interfaces defined with a `GLOBAL_121_*_DIR`-variable in [tools/.env](tools/.env.example).

### Security

- 2020-09-24: Re-enabled TypeORM-logging by running `121-service` and `PA-accounts-service` as user `root` instead of `node`.

## [0.8.1](https://github.com/global-121/121-platform/compare/v0.8.0...v0.8.1) - 2020-09-23

### Changed

- 2020-09-23: Disable TypeORM-logging to file because of node-permissions issue

## [0.8.0](https://github.com/global-121/121-platform/compare/v0.7.1...v0.8.0) - 2020-09-23

### Added

- 2020-08-19: Added `GLOBAL_121_REF_DIR` to `tools/.env`
- 2020-09-01: `GLOBAL_121_WEB_ROOT` now also used by `webhook.service`; Needs update + restart.
- 2020-09-09: Added `INTERSOLVE.username`, `INTERSOLVE.password`, `INTERSOLVE.ean`, `INTERSOLVE.url` in `121-service/src/secrets.ts`

### Changed

- 2020-08-19: Deploy script & apache2 conf changed, so possibly need to restart
- 2020-09-03: Corrected "Samburu" language-code, need to update `NG_LOCALES` value for PA-App.
- 2020-09-07: Add "Turkana" as language, need to update `NG_LOCALES` value for PA-App.
- 2020-09-08: Change `AFRICASTALKING.productName` in `121-service/src/secrets.ts` to appropriate value (KRCS-staging server only!)
- 2020-09-12: Changed `docker-compose/Dockerfile` set-up of 121-service and PA-accounts-service to use Node.js base-image
- 2020-09-23: Refactored `secrets.ts` and `ormconfig.json` into the central `services/.env`-file

### Removed

- 2020-09-01: Remove `VERSION`-env variable used by `webhook.service`; Needs update + restart.

## [0.7.2](https://github.com/global-121/121-platform/compare/v0.7.1...v0.7.2) - 2020-08-27

### Changed

- 2020-08-27: Update program-data for Kenya pilot environment + required fixes to display it correctly

## [0.7.1](https://github.com/global-121/121-platform/compare/v0.7.0...v0.7.1) - 2020-08-18

- 2020-08-18: Fixes for input-validation in both PA-app and AW-app

## [0.7.0](https://github.com/global-121/121-platform/compare/v0.6.3...v0.7.0) - 2020-08-18

### Added

- 2020-08-12: Added `AFRICASTALKING` API-key to `services/121-service/src/secrets.ts`
- 2020-08-11: Added `INTERSOLVE` API-key to `services/121-service/src/secrets.ts`

### Changed

- 2020-08-12: Changed languages `ny_MW`, `et_OM` by `sa_KE` and `la2_KE`

## [0.6.3](https://github.com/global-121/121-platform/compare/v0.6.2...v0.6.3) - 2020-08-05

### Changed

- 2020-08-05: Fixes for input-validation in both PA-app and AW-app

## [0.6.2](https://github.com/global-121/121-platform/compare/v0.6.1...v0.6.2) - 2020-08-04

### Added

- 2020-08-04: Added initial seed-script for Kenya pilot

## [0.6.1](https://github.com/global-121/121-platform/compare/v0.6.0...v0.6.1) - 2020-08-04

- 2020-08-04: Fixed a bug, which prevented correctly running the NL-seed script
- 2020-08-04: Changed URL from `staging.121.global` to `nlrc-staging.121.global` in `services/.env` & `interfaces/*/.env`

## [0.6.0](https://github.com/global-121/121-platform/compare/v0.5.0...v0.6.0) - 2020-08-04

### Changed

- 2020-07-21: Value of `NODE_ENV` on `Test-VM` is renamed from 'staging' to 'test', as there is now a separate `Staging-VM`, which uses the value 'staging'. This is both about `services/.env` and about the value in `webhook.service`.

## [0.5.0](https://github.com/global-121/121-platform/compare/v0.4.0...v0.5.0) - 2020-07-16

### Changed

- 2020-07-14: Moved `NODE_ENV` variable from respective `Dockerfile`s of 121-service and PA-accounts-service to `services/docker-compose.yml` and `services/.env`

### Removed

- 2020-07-07: Removed Android build of AW-App, including all Cordova dependencies
- 2020-07-08: Removed everything appointment-related from PA-app, AW-app and 121-service. The latter requires dropping the database (e.g. through `dropSchema: true` in `ormconfig.json`) before it's (automatically) recreated by restarting 121-service.

## [0.4.0](https://github.com/global-121/121-platform/compare/v0.3.1...v0.4.0) - 2020-06-16

### Changed

- 2020-06-09: Add `IPV4_121_SERVICE`, `PORT_121_SERVICE`, `SUBDOMAIN_121_SERVICE`, `EXTERNAL_121_SERVICE_URL`, `URL_PA_ACCOUNTS_SERVICE_API`, `IPV4_PA_ACCOUNTS_SERVICE` , `PORT_PA_ACCOUNTS_SERVICE`, `SUBDOMAIN_PA_ACCOUNTS_SERVICE` and `URL_121_SERVICE_API` to `services/.env` AB#1965
- 2020-05-26 - Webhook in production-mode triggers deploy-script only once per published release

## [0.3.1](https://github.com/global-121/121-platform/compare/v0.3.0...v0.3.1) - 2020-05-26

Hotfix to add missing variable/parameter in AW-App validation-flow.

## [0.3.0](https://github.com/global-121/121-platform/compare/v0.2.1...v0.3.0) - 2020-05-26

### Added

- 2020-05-20: Add `RESET_SECRET` to `services/.env` AB#1921

### Changed

- 2020-05-20: Renamed `program-manager` to `project-officer` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1938
- 2020-05-20: Renamed `privacy-officer` to `program-manager` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1939

### Removed

- 2020-04-23: Remove `tools/secrets.json`, set `GITHUB_WEBHOOK_SECRET` in `webhook.service`

## [0.2.1](https://github.com/global-121/121-platform/compare/v0.2.0...v0.2.1) - 2020-04-22

Test hotfix-release to test automatic deployment of patch-releases.

## [0.2.0](https://github.com/global-121/121-platform/compare/v0.1.1...v0.2.0) - 2020-04-22

### Added

- 2020-04-22: Add `tools/.env`-file for `tools/deploy.sh`-script AB#1640

## [0.1.1](https://github.com/global-121/121-platform/compare/v0.1.0...v0.1.1) - 2020-04-21

### Fixed

- 2020-04-21: Fix playText-button disappears when switching to other language then english

## [0.1.0](https://github.com/global-121/121-platform/releases/tag/v0.1.0) - 2020-04-15

### Added

- 2020-04-08: Add `EXTERNAL_121_SERVICE_URL` to `services/.env`
- 2020-03-25: Add `NG_LOCALES` to `interfaces/PA-App/.env` AB#1680
- 2020-03-19: Add `NG_ALWAYS_SHOW_TEXT_PLAYER` to `interfaces/PA-App/.env` AB#823

### Removed

- 2020-03-11: Remove usernames from `services/121-service/src/secrets.ts` AB#1641
