# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/global-121/121-platform/compare/v1.116.0...main)

---

## [1.116.0](https://github.com/global-121/121-platform/compare/v1.115.5...v1.116.0)- 2024-04-10

### Added

- Single Sign-on with Microsoft Entra ID
- Multi column filtering
- Mass update through CSV
- ENV-variable `KOBO_CONNECT_API_URL` for Kobo-Connect API URL needs to be set for the 121-service.

### Changed

- FSP name is now a translatable string & configurable per program

### Removed

- "Assigned aid workers" from Design tab
- ENV-variable `CREATE_PROGRAM_ENDPOINT` for Kobo-Connect API URL is removed from the Portal.

## [1.115.5](https://github.com/global-121/121-platform/compare/v1.115.4...v1.115.5)- 2024-04-08

### Removed

- Service-worker(offline/caching) features for the Portal from ALL instances.

## [1.115.4](https://github.com/global-121/121-platform/compare/v1.115.3...v1.115.4)- 2024-04-08

### Removed

- Service-worker(offline/caching) features for the Portal of NLRC. To prevent (some) issues when rolling out SSO.

## [1.115.3](https://github.com/global-121/121-platform/compare/v1.115.2...v1.115.3)- 2024-04-03

### Fixed

- firstName is empty string if it does not exist when creating visa debit

## [1.115.2](https://github.com/global-121/121-platform/compare/v1.115.1...v1.115.2)- 2024-03-30

### Fixed

- Security policy rwanda

## [1.115.1](https://github.com/global-121/121-platform/compare/v1.115.0...v1.115.1)- 2024-03-20

## [1.115.0](https://github.com/global-121/121-platform/compare/v1.114.1...v1.115.0)- 2024-03-20

### Added

- Payment amount multiplier to export report
- Vodacash made working again
- Create program from kobo form

## [1.114.1](https://github.com/global-121/121-platform/compare/v1.114.0...v1.114.1)- 2024-03-18

### Fixed

- Handle 204 response from Intersolve

## [1.114.0](https://github.com/global-121/121-platform/compare/v1.113.1...v1.114.0)- 2024-03-07

### Fixed

- Export instructions breaks if waiting < total
- Pressing enter saves data without asking a reason

### Added

- See user who changed the status of a PA
- Add new FSP to existing instance (migration & endpoint)

## [1.113.1](https://github.com/global-121/121-platform/compare/v1.113.0...v1.113.1)- 2024-03-01

### Fixed

- Performance of payment logs in PA profile page

## [1.113.0](https://github.com/global-121/121-platform/compare/v1.112.2...v1.113.0)- 2024-02-29

### Added

- Program FSP config for visa
- See user who did payment
- Log and see FSP change and related data changes
- Reconciliation with generic excel FSP
- See status of messages in PA profile page
- Remove progress bar from program over page

## [1.112.2](https://github.com/global-121/121-platform/compare/v1.112.1...v1.112.2)- 2024-02-19

### Fixed

- Single retry gives no response on success
- Limit characters of errorMessage field in export

## [1.112.1](https://github.com/global-121/121-platform/compare/v1.112.0...v1.112.1)- 2024-02-12

### Changed

- Go from 'Declined' status to 'Validated' (to correct a mistake)

## [1.112.0](https://github.com/global-121/121-platform/compare/v1.111.1...v1.112.0)- 2024-02-09

### Added

- Manual generic FSP 'Excel Payment Instructions'
- Bulk actions 'Mark as validated' and 'Mark as declined'

### Removed

- Removed 'selected for validation' status/bulk-action/export

## [1.111.1](https://github.com/global-121/121-platform/compare/v1.111.0...v1.111.1) - 2024-02-02

- Fix failing migration script on test/staging

## [1.111.0](https://github.com/global-121/121-platform/compare/v1.110.1...v1.111.0) - 2024-02-02

- Renamed 'twilio-mock-service' to 'mock-service' and MOCK_TWILIO_URL to MOCK_SERVICE_URL
- Migration to enable scope for NLRC PV program and set scope of all current PAs
- Queue payments for Intersolve Voucher, Safaricom and CBE
- Final performance improvements for facilitating 100,000 PAs
- Store exchange rates daily

## [1.110.1](https://github.com/global-121/121-platform/compare/v1.110.0...v1.110.1) - 2024-01-30

- Fix error handling and unneeded API-calls on Limit Visa top-up
- Missing translation keys on status change result alerts

## [1.110.0](https://github.com/global-121/121-platform/compare/v1.109.2...v1.110.0) - 2024-01-26

- Renamed `master`-branch to `main`.
- Limit Visa top-up dependent on current balance and spent
- Support PA with empty phonenumber
- Improve performance of registration status change
- Improve performance of incoming message handling
- End inclusion from pause state

## [1.109.2](https://github.com/global-121/121-platform/compare/v1.109.1...v1.109.2) - 2024-01-22

### Fixed

- Double voucher PV data migration and bug-fix

## [1.109.1](https://github.com/global-121/121-platform/compare/v1.109.0...v1.109.1) - 2024-01-16

### Fixed

- Doing a payment blocked by translation-issue in Portal

## [1.109.0](https://github.com/global-121/121-platform/compare/v1.108.3...v1.109.0) - 2024-01-11

### Added

- Multiple translations of the Portal (Arabic, French, Spanish, Dutch) + language-switcher in the UI.  
  From now on, make sure to:
  - Watch the outcome of the `lint:translations`-task, when adding/removing/updating English text-strings.
  - When possible, also add translations by hand matching existing translations (i.e. use the same terms/verbs/etc.).
  - When showing/formatting a `Date`, Currency-amount or `Number`, use the current (`this.`)`locale`. **Don't** hard-code these things into the strings themselves.
- Edit scope of registrations
- Configure funds of program
- Export PAs based on table filter
- Send templated messages through 'send message' action

### Changed

- Editing financial attributes requires a separate permission now
- Voucher images removed from database

## [1.108.3](https://github.com/global-121/121-platform/compare/v1.108.2...v1.108.3) - 2023-12-29

### Fixed

- Sorting of payments in iframe (by refetching the program)

## [1.108.2](https://github.com/global-121/121-platform/compare/v1.108.1...v1.108.2) - 2023-12-29

### Fixed

- Payment amount multiplier in template

## [1.108.1](https://github.com/global-121/121-platform/compare/v1.108.0...v1.108.1) - 2023-12-28

### Fixed

- Order of deleting entities related to registrations

## [1.108.0](https://github.com/global-121/121-platform/compare/v1.107.0...v1.108.0) - 2023-12-21

### Migration

- Migrate LVV and PV data of NLRC program

## [1.107.0](https://github.com/global-121/121-platform/compare/v1.106.3...v1.107.0) - 2023-12-20

### Changed

- User can only manage registrations within its scope
- Upgraded TypeORM to v0.3.17 (from v0.3.6)
- Intersolve Visa payments is queued
- New default roles
- Use placeholders in custom messages
- Import max 1k registrations at once

### Changed

- Docker setup process (for API tests). Some ENV-variables where changed, so compare [`.env.example`](./services/.env.example) with your local `.env`-file.

## [1.106.3](https://github.com/global-121/121-platform/compare/v1.106.2...v1.106.3) - 2023-12-07

## Fixed

- Use andWhere in 'Not yet sent payment' query

## Changed

- Included code of migration-scripts in scope of CI/test-pipeline. See [`.eslintrc.js`](services/121-service/.eslintrc.js)

## [1.106.2](https://github.com/global-121/121-platform/compare/v1.106.1...v1.106.2) - 2023-11-29

## Fixed

- Handle no template found scenario in send voucher flow
- Delete message before inserting in latest message table (to avoid conflicts within then invite flow)

## [1.106.1](https://github.com/global-121/121-platform/compare/v1.106.0...v1.106.1) - 2023-11-28

## Fixed

- Use message property of message template in default reply

## [1.106.0](https://github.com/global-121/121-platform/compare/v1.105.9...v1.106.0) - 2023-11-28

## Added

- Using Redis for queues. See: a step in the "How to set up a new instance"-guide in the wiki.
- Separate tables for message templates

## Changed

- Renamed HO-portal to Portal in code

## Removed

- CORS configuration should be handled via the Azure Portal for each App Service instance.
  See: A step in the "How to set up a new instance"-guide in the wiki.

## [1.105.9](https://github.com/global-121/121-platform/compare/v1.105.8...v1.105.9) - 2023-11-15

### Fixed

- Filter for phonenumber of imported/invited PA

## [1.105.8](https://github.com/global-121/121-platform/compare/v1.105.7...v1.105.8) - 2023-11-15

### Added

- Temporarily added twice-a-day cronjob to bulk update last message status

## [1.105.7](https://github.com/global-121/121-platform/compare/v1.105.6...v1.105.7) - 2023-11-15

### Fixed

- Cannot include completed PA with 0 remaining payments (additional fix)

## [1.105.6](https://github.com/global-121/121-platform/compare/v1.105.5...v1.105.6) - 2023-11-15

### Fixed

- Cannot include completed PA with 0 remaining payments

## [1.105.5](https://github.com/global-121/121-platform/compare/v1.105.4...v1.105.5) - 2023-11-15

### Fixed

- paymentCount in PA popup
- Setting of completed status & paymentCount

## [1.105.4](https://github.com/global-121/121-platform/compare/v1.105.3...v1.105.4) - 2023-11-13

### Fixed

- Don't update last message status (performance issue) (additional places)

## [1.105.3](https://github.com/global-121/121-platform/compare/v1.105.2...v1.105.3) - 2023-11-13

### Fixed

- Don't update last message status (performance issue)

## [1.105.2](https://github.com/global-121/121-platform/compare/v1.105.1...v1.105.2) - 2023-11-07

### Fixed

- Change permissions for GET '/roles' endpoint

## [1.105.1](https://github.com/global-121/121-platform/compare/v1.105.0...v1.105.1) - 2023-11-06

### Added

- Filter registrations in PA-table on 'Registration created date'

## [1.105.0](https://github.com/global-121/121-platform/compare/v1.104.2...v1.105.0) - 2023-11-03

### Fixed

- Improved Commercial Bank of Ethiopia error handling

### Changed

- Upgraded Node.js to v18 for PA-App + Portal.
  Make sure to use your Node version manager to install+run the newest version.
- Upgraded Node.js to v18 for 121-service.
  Make sure to recreate the Docker image using `npm run start:services`.
- Improved performance of 'last payment summary' in payment page
- Refactored API-paths
- Prohibit note-creation for referenceIds of programs you do not have permission for

### Removed

- All audio-features are removed from the PA-App. To prevent a lot of "local changes" during development,
  make sure to remove any previously generated `*.webm`/`*.mp3` audio-files at: `/interfaces/PA-App/src/assets/<language-code>`

## [1.104.2](https://github.com/global-121/121-platform/compare/v1.104.1...v1.104.2) - 2023-11-02

### Fixed

- Permission status change fix

## [1.104.1](https://github.com/global-121/121-platform/compare/v1.104.0...v1.104.1) - 2023-10-31

### Fixed

- Mistake in pagination migration (not run on production yet)

## [1.104.0](https://github.com/global-121/121-platform/compare/v1.103.3...v1.104.0) - 2023-10-30

### Changed

- Load registrations using back-end pagination including filtering & sorting (using [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate))
- Write and see multiple notes per registration
- Improved functionality for configuring roles of users

### Deprecated

- AW-App will no longer receive updates/fixes/changes (until decided otherwise)

## [1.103.3](https://github.com/global-121/121-platform/compare/v1.103.2...v1.103.3) - 2023-10-25

### Fixed

- Prohibit starting a payment in both front-end and back-end, while another is still in progress
- Store CBE full request and response in Azure logs

## [1.103.2](https://github.com/global-121/121-platform/compare/v1.103.1...v1.103.2) - 2023-10-23

### Fixed

- Payment name to fullName for Ethiopia

## [1.103.1](https://github.com/global-121/121-platform/compare/v1.103.0...v1.103.1) - 2023-10-19

### Fixed

- Export duplicates fixed
- Improve error handling on timeout visa payment

## [1.103.0](https://github.com/global-121/121-platform/compare/v1.102.3...v1.103.0) - 2023-10-12

### Added

- Button to export CBE validation report
- Swagger documentation for CBE validation endpoint
- 'Team' page: Add/change team member

## [1.102.3](https://github.com/global-121/121-platform/compare/v1.102.2...v1.102.3) - 2023-10-10

### Fixed

- Added UseGuards to CBE controller to fix permissions

## [1.102.2](https://github.com/global-121/121-platform/compare/v1.102.1...v1.102.2) - 2023-10-09

### Fixed

- Export People Affected: removed payment data & optimized removal of empty columns

### Added

- CBE cronjob to update account enquiries

## [1.102.1](https://github.com/global-121/121-platform/compare/v1.102.0...v1.102.1) - 2023-10-05

### Fixed

- Fixed CBE account-enquiries cannot access `ns4:gEACCOUNTCBEREMITANCEDetailType`

## [1.102.0](https://github.com/global-121/121-platform/compare/v1.101.0...v1.102.0) - 2023-10-05

### Added

- Api for CBE account-enquiries

### Changed

- Default throttle limit

## [1.101.0](https://github.com/global-121/121-platform/compare/v1.100.0...v1.101.0) - 2023-09-26

### Added

- Allow external integrations to update the reference Id using patch

### Fixed

- Solved bug with issuing new Visa card (decimals)

## [1.100.0](https://github.com/global-121/121-platform/compare/v1.99.1...v1.100.0) - 2023-09-21

### Added

- Intersolve Visa: See monthly spending limit

## [1.99.1](https://github.com/global-121/121-platform/compare/v1.99.0...v1.99.1) - 2023-09-19

### Fixed

- Reuse valid Intersolve Visa token instead of constantly creating new one

## [1.99.0](https://github.com/global-121/121-platform/compare/v1.98.1...v1.99.0) - 2023-09-15

### Added

- Registration status paused
- See PA number in profile page

## [1.98.1](https://github.com/global-121/121-platform/compare/v1.98.0...v1.98.1) - 2023-09-13

### Fixed

- Get pa attributes without phase fix

## [1.98.0](https://github.com/global-121/121-platform/compare/v1.97.2...v1.98.0) - 2023-09-13

### Added

- Let recipient page in portal use the profile page
- Api endpoint to post program questions and custom attributes
- Sync with intersolve for registrations that no longer have the Visa FSP but still have a Visa card

## [1.97.2](https://github.com/global-121/121-platform/compare/v1.97.1...v1.97.2) - 2023-09-12

### Fixed

- Merging 2 registrations with registration changelog

## [1.97.1](https://github.com/global-121/121-platform/compare/v1.97.0...v1.97.1) - 2023-09-11

### Fixed

- Fixed reissue inactive blocked wallet

## [1.97.0](https://github.com/global-121/121-platform/compare/v1.97.0...v1.96.0) - 2023-08-24

### Added

- Commercial Bank of Ethiopia integration
- Store and show PA data changes
- Export PA data changes
- See timestamp of transaction in export payment data report
- Show payment "status" without payment create permission

### Changed

- Nest.js upgrade to v10
- Use 'reserved' transactions in lastUsedDate Visa debit card

### Fixed

- Export list of unused voucher button

## [1.96.0](https://github.com/global-121/121-platform/compare/v1.95.1...v1.96.0) - 2023-08-16

### Fixed

- Open voucher from registration page

### Changed

- Moved (CI/Lint) tests from Azure Pipelines to GitHub Actions

## [1.95.1](https://github.com/global-121/121-platform/compare/v1.95.0...v1.95.1) - 2023-08-14

### Added

- Added 1 to 1 relation between Twilio message and transaction to improve performance of handling status updates

## [1.95.0](https://github.com/global-121/121-platform/compare/v1.94.1...v1.95.0) - 2023-08-11

### Added

- KRCS: originatorConversationId added in payment export
- Retry sending WhatsApp messages if it (incorrectly) fails due to a no-template error
- OCW: Add Visa tokenCode in payment history
- OCW: send automatic messages on re-issue/pause/unpause card
- OCW: export report with card usage

### Fixed

- Voucher cannot be opened after changing FSP
- Server crashing during payment

### Changed

- Payment history details also in PA profile page
- Enable updating and deleting PAs from EspoCRM differently

## [1.94.1](https://github.com/global-121/121-platform/compare/v1.94.0...v1.94.1) - 2023-08-07

## [1.94.0](https://github.com/global-121/121-platform/compare/v1.93.1...v1.94.0) - 2023-07-27

### Added

- Re-issue visa card
- Automation of: Update Intersolve Visa phone number & address

### Fixed

- Disappearing columns in PA table
- Going from end inclusion to completed status
- Throttling on image endpoint
- Max payments -1

### Removed

- Get all users endpoint
- Single KRCS program

## [1.93.1](https://github.com/global-121/121-platform/compare/v1.93.0...v1.93.1) - 2023-07-21

### Fixed

- Several Safaricom bugs

## [1.93.0](https://github.com/global-121/121-platform/compare/v1.92.0...v1.93.0) - 2023-07-19

### Added

- See Visa debit card details in PA profile page
- Block/unblock Visa debit card
- Update Intersolve Visa phone number manually

### Fixed

- Safaricom callback

### Changed

- Changed Ethiopia Dorcas to Ethiopia Joint Response

## [1.92.0](https://github.com/global-121/121-platform/compare/v1.91.0...v1.92.0) - 2023-07-13

### Changed

- Updated KRCS program
- Safaricom FSP integration

### Fixed

- Export people affected button

## [1.91.0](https://github.com/global-121/121-platform/compare/v1.90.7...v1.91.0) - 2023-07-04

### Fixed

- Show paymentAmountMultiplier in edit pop-up when value is NULL
- MaxPayments when importing
- Drag & drop upload because of Ionic upgrade

## [1.90.7](https://github.com/global-121/121-platform/compare/v1.90.4...v1.90.7) - 2023-07-04

### Changed

- Added additional logging + removed again

## [1.90.4](https://github.com/global-121/121-platform/compare/v1.90.3...v1.90.4) - 2023-07-03

### Fixed

- Revert limit(1)

## [1.90.3](https://github.com/global-121/121-platform/compare/v1.90.2...v1.90.3) - 2023-07-03

### Fixed

- Missing twilio message indexes

## [1.90.2](https://github.com/global-121/121-platform/compare/v1.90.1...v1.90.2) - 2023-06-29

### Fixed

- Get payment address bug

## [1.90.1](https://github.com/global-121/121-platform/compare/v1.90.0...v1.90.1) - 2023-06-28

### Changed

- New payment history popup

### Fixed

- Single retry bug

## [1.90.0](https://github.com/global-121/121-platform/compare/v1.89.0...v1.90.0) - 2023-06-27

### Added

- FSP Visa debit card
- Intersolve cancel voucher code re-added

### Fixed

- Payment retry amount bug with multiplier > 1

### Removed

- All code/documentation related to running the platform on a VM (`deploy.sh`, `webhook.js`, etc.)

## [1.89.0](https://github.com/global-121/121-platform/compare/v1.88.0...v1.89.0) - 2023-06-06

### Changed

- Dependencies upgraded

### Fixed

- Crashes because of messaging

## [1.88.0](https://github.com/global-121/121-platform/compare/v1.87.6...v1.88.0) - 2023-05-31

### Changed

- Upgrade to Angular v16 & Ionic v7
- Facilitate calling the Intersolve voucher API with different credentials for different programs, for invoicing
- Fixed the lookup-disabling of v1.87.6 by preserving the handling of the '+' in phone numbers
- Fixed 'download voucher' functionality when used from Redline

## [1.87.6](https://github.com/global-121/121-platform/compare/v1.87.5...v1.87.6) - 2023-05-30

### Note

- Temp. disabled the lookup in the registrations import.

## [1.87.5](https://github.com/global-121/121-platform/compare/v1.87.4...v1.87.5) - 2023-05-24

### Note

- The change of 1.87.4 is reversed. Instead this is now solved properly.

## [1.87.4](https://github.com/global-121/121-platform/compare/v1.87.3...v1.87.4) - 2023-05-24

### Note

- The delete self is disabled in this release. It should be enabled again when the User decorator is fixed.

### Fixed

- API-URLs in `NG_URL_121_SERVICE_API` used in interfaces need to match `EXTERNAL_121_SERVICE_URL`.

## [1.87.3](https://github.com/global-121/121-platform/compare/v1.87.2...v1.87.3) - 2023-05-23

### Fixed

- Calculated amount for Jumbo card in message and transaction

## [1.87.2](https://github.com/global-121/121-platform/compare/v1.87.1...v1.87.2) - 2023-05-17

### Fixed

- Allow list espocrm ip with port numbers

## [1.87.1](https://github.com/global-121/121-platform/compare/v1.87.0...v1.87.1) - 2023-05-12

### Fixed

- Calculation for the number of payments already sent

## [1.87.0](https://github.com/global-121/121-platform/compare/v1.86.0...v1.87.0) - 2023-05-11

### Changed

- Everything ready for deployment using GitHub Actions and Azure App Services

## [1.86.0](https://github.com/global-121/121-platform/compare/v1.85.2...v1.86.0) - 2023-05-09

### Added

- Optimization of the getRegistrations query

## [1.85.2](https://github.com/global-121/121-platform/compare/v1.85.1...v1.85.2) - 2023-05-05

### Fixed

- Delay on incoming WhatsApp messages

## [1.85.1](https://github.com/global-121/121-platform/compare/v1.85.0...v1.85.1) - 2023-04-26

### Fixed

- Crash on error in logError
- Login permission issue

## [1.85.0](https://github.com/global-121/121-platform/compare/v1.84.3...v1.85.0) - 2023-04-26

### Added

- Deployment workflow for Portal to Azure Static Web App (test-environment)
- Deployment workflow for PA-App to Azure Static Web App (test-environment)
- Deployment workflow for AW-App to Azure Static Web App (test-environment)

### Fixed

- First name in Intersolve Trade request
- Importing faster
- PII in aidworker assignment
- Readonly PA edit popup

## [1.84.3](https://github.com/global-121/121-platform/compare/v1.84.2...v1.84.3) - 2023-04-19

### Fixed

- Download voucher
- PA id in single payout

## [1.84.2](https://github.com/global-121/121-platform/compare/v1.84.1...v1.84.2) - 2023-04-14

### Fixed

- Not able to log in after changing password

## [1.84.1](https://github.com/global-121/121-platform/compare/v1.84.0...v1.84.1) - 2023-04-14

### Fixed

- Salt leak in program assignments

## [1.84.0](https://github.com/global-121/121-platform/compare/v1.83.0...v1.84.0) - 2023-04-13

### Added

- EspoCRM delete webhook integration

### Fixed

- Several Jumbo intersolve bugs
- Sorting of payments in recipient page

## [1.83.0](https://github.com/global-121/121-platform/compare/v1.82.0...v1.83.0) - 2023-04-06

### Added

- EspoCRM webhook integration
- Angular v14
- Salt passwords

### Changed

- Upgrade AW-App to Angular v15
- Upgrade PA-App to Angular v15
- Upgrade Portal to Angular v15
- Upgrade interfaces to use Node.js v16 LTS
  Make sure to run these commands from the root-folder of the repository:

  - `fnm install` or `nvm install`
  - Verify that:
    `node --version` shows `v16.*`
    `npm --version` shows `v8.*`
  - Run: `npm ci --prefix=interfaces/PA-app && npm ci --prefix=interfaces/AW-app && npm ci --prefix=interfaces/Portal`

## [1.82.0](https://github.com/global-121/121-platform/compare/v1.81.1...v1.82.0) - 2023-03-08

### Added

- EspoCRM webhook integration
- Angular v14
- Salt passwords

## [1.81.1](https://github.com/global-121/121-platform/compare/v1.81.0...v1.81.1) - 2023-02-24

### Fixed

- Get balance voucher

## [1.81.0](https://github.com/global-121/121-platform/compare/v1.80.1...v1.81.0) - 2023-02-23

### Added

- Button in login page to see password while typing
- Visa V-Pay integration with Intersolve FSP

## [1.80.1](https://github.com/global-121/121-platform/compare/v1.80.0...v1.80.1) - 2023-02-01

### Fixed

- Fix: Don't filter on paymentsLeft outside payment phase

## [1.80.0](https://github.com/global-121/121-platform/compare/v1.79.54...v1.80.0) - 2023-02-09

### Added

- Advance filter: Add filter on "x to last payment"
- Create and overwrite program via JSON in 121 Portal
- Empty content of Design phase
- Remember filter options after closing pop-up
- Import People Affected with "title" preferred language
- Send voucher collect reminders max 3 times

## [1.79.5](https://github.com/global-121/121-platform/compare/v1.79.4...v1.79.5) - 2023-02-01

### Fixed

- Fix: Update phonenumber in PA-popup

## [1.79.4](https://github.com/global-121/121-platform/compare/v1.79.3...v1.79.4) - 2023-02-01

### Fixed

- Sanitize phonenumber with `substring` instead of `substr`

## [1.79.3](https://github.com/global-121/121-platform/compare/v1.79.2...v1.79.3) - 2023-01-31

### Changed

- Database is now on a separate database server instead of in a Docker on the VM

## [1.79.2](https://github.com/global-121/121-platform/compare/v1.79.1...v1.79.2) - 2023-01-26

## [1.79.1](https://github.com/global-121/121-platform/compare/v1.79.0...v1.79.1) - 2023-01-26

## [1.79.0](https://github.com/global-121/121-platform/compare/v1.77.2...v1.79.0) - 2023-01-26

### Added

- Functionality to set 'max. payments' per registration
- Export button that exports current (filtered) rows and columns of PA-table

### Changed

- 'forbidUnknownValues' in API is set to 'true' now, which means that all API properties must have some validation

## [1.77.2](https://github.com/global-121/121-platform/compare/v1.77.1...v1.77.2) - 2023-01-19

### Fixed

- Added 'failed' as a final Twilio message status to prevent it from being updated by a late callback

## [1.77.1](https://github.com/global-121/121-platform/compare/v1.77.0...v1.77.1) - 2023-01-18

### Fixed

- Improved speed query registrations

## [1.77.0](https://github.com/global-121/121-platform/compare/v1.76.0...v1.77.0) - 2023-01-13

### Breaking Change

- 121-service uses Node.js v16. Using a different base-image.
- Network-specific settings in the Docker Compose configuration simplified, by using default settings.
- `docker-compose` is replaced by `docker compose` everywhere; See [README / Start services](./README.md#start-services)

### Added

- New component to see history of messages

### Changed

- Improvements to the payment phase by changing the way transactions are handled
- Upgraded NestJS to version 8
- Upgraded TypeORM to version 0.3.6
- Upgraded Typescript to version 4.7.4

### Removed

- Columns 'Rejected' & 'Inclusion ended' in the payment phase

## [1.76.0](https://github.com/global-121/121-platform/compare/v1.75.0...v1.76.0) - 2022-12-27

### Added

- Show last message status in PA-table

## [1.75.0](https://github.com/global-121/121-platform/compare/v1.74.3...v1.75.0) - 2022-12-22

### Added

- HTTPS-certificates will be automatically renewed with `Certbot` by Lets Encrypt. This requires a one-time set-up step, see [Tools README / Hosting / Apache2, step 6](./tools/README.md#apache2).
- The Apache web-server will be restarted by the [`deploy.sh`](./tools/deploy.sh#L261)-script on every deployment.
- Functionality to upload reconciliation data for FSP 'VodaCash'.

### Removed

- Any specific certificates(i.e. `certvqebkt` and `cert2xF5qw`) in the folder`tools/certificates` can be removed, they are replaced by the Lets Encrypt certificates.
- V-number from code and seed script

## [1.74.3](https://github.com/global-121/121-platform/compare/v1.74.2...v1.74.3) - 2022-12-19

### Changed

- Fix: Added 'id' for 'Export people affected'
- Fix: Added several 'where' clauses with 'programId'.

## [1.74.2](https://github.com/global-121/121-platform/compare/v1.74.1...v1.74.2) - 2022-12-16

### Changed

- Fix: Look for MAX payment per program for incoming WhatsApp message
- Fix: Handle reminders per program (also with the above MAX fix)

## [1.74.1](https://github.com/global-121/121-platform/compare/v1.74.0...v1.74.1) - 2022-12-15

### Changed

- Fix hack incoming PV WhatsApp-messages

## [1.74.0](https://github.com/global-121/121-platform/compare/v1.73.0...v1.74.0) - 2022-12-14

### Changed

- URL of PA-app is changed to `/app` instead of `PA-app`
- This release relates to the migration of LVV and PV instances into 1

## [1.73.0](https://github.com/global-121/121-platform/compare/v1.72.0...v1.73.0) - 2022-12-14

### Changed

- All available audio-files will be generated by default. (Unless specified otherwise using `NG_LOCALES`.)
- The build-step for generating audio-files has become non-blocking/breaking. Some audio-files might be missing, but the build finishes with a correct build.

### Removed

- Language/locale data for Amharic (`am_ET`)
- Language/locale data for Russian (`ru`)
- Language/locale data for Ukrainian (`uk`)
- Language/locale data for Tigrinya (`ti`)

## [1.72.0](https://github.com/global-121/121-platform/compare/v1.71.0...v1.72.0) - 2022-12-06

### Added

- First version of iframe-integration with Twilio Flex/Redline project
- Configure PA-app URL for program selection. This will limit the set of visible/available programs (and their languages).

### Changed

- Fixed: DRC xml to new format
- Languages/locales used in the PA-app are now program-based, not set in the build. The ENV-variable `NG_LOCALES` has become an _**optional**_ override only. It can be removed from any deployment that expects default behavior.

## [1.71.0](https://github.com/global-121/121-platform/compare/v1.70.0...v1.71.0) - 2022-11-23

### Added

- A way to configure Apache for a specific environment only.
  Follow the steps 4, 5, and 6 from the [Tools README: Hosting / Apache2](tools/README.md#apache2).

## [1.70.0](https://github.com/global-121/121-platform/compare/v1.69.0...v1.70.0) - 2022-11-16

### Added

- Feat: Portuguese translations in PA-app, LVV instance, LVV program

### Changed

- Feat: PA identifier increments per program instead of across programs

## [1.69.0](https://github.com/global-121/121-platform/compare/v1.68.9...v1.69.0) - 2022-11-14

### Added

- Feat: Delete PAs in the Portal
- Feat: Optimized order of the columns in Export People Affected
- Feat: Added 'updated' column to base entity
- Feat: Preferred language in Import People Affected
- Feat: Change preferred language in Portal
- Feat: Created a multi-program seed script with LVV and PV
- Feat: Spanish translations in PA-app, LVV instance, LVV program

## [1.68.5](https://github.com/global-121/121-platform/compare/v1.68.4...v1.68.5) - 2022-11-12

### Changed

- Changed: Vodacash payment export use `[ID][voter card]` as `fieldname`

## [1.68.4](https://github.com/global-121/121-platform/compare/v1.68.3...v1.68.4) - 2022-11-12

### Changed

- Changed: Vodacash payment export use `Voter Card` instead of `name` as `fieldname`

## [1.68.3](https://github.com/global-121/121-platform/compare/v1.68.2...v1.68.3) - 2022-11-10

### Changed

- Changed: Vodacash payment export KYC info uses voter card number

## [1.68.2](https://github.com/global-121/121-platform/compare/v1.68.1...v1.68.2) - 2022-11-10

### Changed

- Changed: add KYC information to xml export

## [1.68.1](https://github.com/global-121/121-platform/compare/v1.68.0...v1.68.1) - 2022-10-27

### Changed

- Fixed: update voucher image allow decimals
- Fixed: order of multi select options in portal
- Fixed: register after import
- Fixed: add # month and # payment to csv export of portal dashboard

## [1.68.0](https://github.com/global-121/121-platform/compare/v1.67.1...v1.68.0) - 2022-10-27

### Removed

- All QR-code scanning/generating/program-level configuration is no longer used
- Some user-permissions that are not program-specific are moved into a "admin"-property

### Changed

- User-permissions are assigned/used per program
- API URLs are formed to include a program-id in a consistent place

### Added

- Users can be an "admin" (instead of have specific Permissions)
- Added admin validation to certain endpoints

## [1.67.3](https://github.com/global-121/121-platform/compare/v1.67.2...v1.67.3) - 2022-10-27

### Added

- Allow decimals in voucher-amounts.

## [1.67.2](https://github.com/global-121/121-platform/compare/v1.67.1...v1.67.2) - 2022-10-13

## [1.67.1](https://github.com/global-121/121-platform/compare/v1.67.0...v1.67.1) - 2022-10-13

### Changed

- Fix: Error saving monitoring questions

## [1.67.0](https://github.com/global-121/121-platform/compare/v1.66.0...v1.67.0) - 2022-10-10

### Changed

- Fix: Added a default width for columns in PA table.

## [1.66.3](https://github.com/global-121/121-platform/compare/v1.66.2...v1.66.3) - 2022-10-20

### Changed

- Fix Get PA data offline if pa data storage returns undefined

## [1.66.2](https://github.com/global-121/121-platform/compare/v1.66.1...v1.66.2) - 2022-10-14

### Changed

- Fix: added scenarios to checkStatus in registration-summary

## [1.66.1](https://github.com/global-121/121-platform/compare/v1.66.0...v1.66.1) - 2022-10-14

### Changed

- Fix: age divisions in questions are right now
- Fix: added missing french translations
- Fix: don't show multiple "Add another person affected" buttons
- Fix: Use `fullnameNamingConvention` in AW-App to construct name

## [1.66.0](https://github.com/global-121/121-platform/compare/v1.65.2...v1.66.0) - 2022-10-10

### Changed

- Chore: Update DRC program with feedback on french questions

## [1.65.2](https://github.com/global-121/121-platform/compare/v1.65.1...v1.65.2) - 2022-10-06

## [1.65.1](https://github.com/global-121/121-platform/compare/v1.65.0...v1.65.1) - 2022-10-06

### Changed

- Fix: `TryWhatsapp` entity updated on merging of registration. Also added a cascade delete for it.

## [1.65.0](https://github.com/global-121/121-platform/compare/v1.64.1...v1.65.0) - 2022-10-06

### Changed

- Fix: PA-app offline mode
- Feat: Multi select questions
- Removed check for inclusion status in PA-app
- Fix: Zero displaying in PA pop-up

## [1.64.1](https://github.com/global-121/121-platform/compare/v1.64.0...v1.64.1) - 2022-09-30

### Changed

- Fix: Added missing notification text

## [1.64.0](https://github.com/global-121/121-platform/compare/v1.63.0...v1.64.0) - 2022-09-30

### Changed

- The 'demo' seed is now actually a seed for demo purposes
- New seed for testing: 'test' (this was previously 'demo')

## [1.63.0](https://github.com/global-121/121-platform/compare/v1.62.0...v1.63.0) - 2022-09-29

### Changed

- French translations for DRC (program, instance, FSP: VodaCash)
- New question type: multi-select

## [1.62.0](https://github.com/global-121/121-platform/compare/v1.61.1...v1.62.0) - 2022-09-27

### Changed

- Updated and split some questions in DRC program
- Fixed duplication of "do payment" options in bulk actions dropdown

## [1.61.1](https://github.com/global-121/121-platform/compare/v1.61.0...v1.61.1) - 2022-09-23

### Changed

- Fixed FSP in DRC program so the seed-script works again

## [1.61.0](https://github.com/global-121/121-platform/compare/v1.60.0...v1.61.0) - 2022-09-23

### Changed

- Updated & removed some questions in DRC program
- Updated DRC program parameters

## [1.60.0](https://github.com/global-121/121-platform/compare/v1.59.0...v1.60.0) - 2022-09-22

### Changed

- Removed gps questions program DRC

## [1.59.0](https://github.com/global-121/121-platform/compare/v1.58.0...v1.59.0) - 2022-09-20

### Changed

- Add VodaCash xml export
- Numeric values do not show as 0 in PA pop-up

## [1.58.0](https://github.com/global-121/121-platform/compare/v1.57.0...v1.58.0) - 2022-09-16

### Changed

- Updated program questions DRC based on test

## [1.57.0](https://github.com/global-121/121-platform/compare/v1.56.0...v1.57.0) - 2022-09-16

### Changed

- HAC DRC: Prevent undefined fields when importing new csv

## [1.56.0](https://github.com/global-121/121-platform/compare/v1.55.0...v1.56.0) - 2022-09-16

### Changed

- Updated program questions DRC based on feedback

## [1.55.0](https://github.com/global-121/121-platform/compare/v1.54.0...v1.55.0) - 2022-09-15

### Changed

- Updated program questions DRC based on feedback

## [1.54.0](https://github.com/global-121/121-platform/compare/v1.53.1...v1.54.0) - 2022-09-13

### Changed

- Updated program questions DRC based on feedback

## [1.53.1](https://github.com/global-121/121-platform/compare/v1.53.0...v1.53.1) - 2022-09-08

### Fixed

- Program question option in for DRC are now set to French (these commits were forgotten in v1.53.0)

## [1.53.0](https://github.com/global-121/121-platform/compare/v1.52.1...v1.53.0) - 2022-09-08

### Fixed

- Program question option in for DRC are now set to French
- Fix Swagger url test vm
- Fix icons

## [1.52.1](https://github.com/global-121/121-platform/compare/v1.52.0...v1.52.1) - 2022-09-06

### Fixed

- 2022-09-06: Swagger-UI now uses external URL for requests

## [1.52.0](https://github.com/global-121/121-platform/compare/v1.51.0...v1.52.0) - 2022-08-24

### Changed

- 2022-09-01: Upgraded Node version of the 121-service to v14 LTS
- 2022-09-01: Upgraded NestJS version of the 121-service to v7

## [1.51.0](https://github.com/global-121/121-platform/compare/v1.50.0...v1.51.0) - 2022-08-24

### Changed

- 2022-08-24: Intersolve voucher reminders are being send to the current 'whatsappPhoneNumber' of the PA.

## [1.50.0](https://github.com/global-121/121-platform/compare/v1.49.0...v1.50.0) - 2022-08-23

### Changed

- 2022-08-23: Upgrade Node.js to v14 LTS for the interface build-steps + webhook-service on VMs

## [1.49.0](https://github.com/global-121/121-platform/compare/v1.48.4...v1.49.0) - 2022-08-16

### Changed

- 2022-08-16: Added 'registrationStatus' to the result CSV of 'Import People Affected'.
- 2022-08-16: Added mock API for VodaCash.

## [1.48.4](https://github.com/global-121/121-platform/compare/v1.48.3...v1.48.4) - 2022-08-15

### Fixed

- 2022-08-15: Fixed bug in export all People Affected 500 error because of duplicate stored WhatsApp-numbers.

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
- 2022-08-10: Fixed downloading vouchers of failed payments where the creation of the voucher was successful but the sending via WhatsApp failed.

## [1.47.0](https://github.com/global-121/121-platform/compare/v1.46.0...v1.47.0) - 2022-06-23

### Changed

- 2022-06-23: Customize which program questions/ FSP-attributes/ program custom data attributes are visible in which phase in the PA-table in the Portal
- 2022-06-23: Customize which program question are editable in the pop-up in the PA table
- 2022-06-23: Fixed fields in PA pop-up not updating after edit

## [1.46.0](https://github.com/global-121/121-platform/compare/v1.45.0...v1.46.0) - 2022-06-07

### Changed

- 2022-06-08: Configure program question as custom attributes for Ukraine
- 2022-06-08: Configure which custom attributes get exported in the inclusion list
- 2022-06-08: Automatically calculate transfer value based on a formula

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

- 2021-11-09: Renamed "Portal" to "121 Portal" or "Portal"

## [1.18.0](https://github.com/global-121/121-platform/compare/v1.17.0...v1.18.0) - 2021-11-09

### Added

- 2021-11-09: BelCash as FSP
- 2021-11-09: BoB-finance as FSP
- 2021-11-09: `BELCASH_API_URL`, `BELCASH_LOGIN`, `BELCASH_API_TOKEN`, `BELCASH_SYSTEM` to `services/.env`

## [1.17.0](https://github.com/global-121/121-platform/compare/v1.16.0...v1.17.0) - 2021-10-27

### Changed

- 2021-10-20: Upgrade PA-App to Angular v9 + Ionic v5
- 2021-10-20: Upgrade Portal to Angular v9 + Ionic v5
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
- 2021-09-15: Upgrade Portal to Angular v8
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

- 2021-05-12: Add custom note per PA in Portal

## [1.3.0](https://github.com/global-121/121-platform/compare/v1.2.3...v1.3.0) - 2021-05-05

### Removed

- 2021-04-14: Removed native Android build from PA-App
- 2021-04-14: Removed "local storage"-features from PA-App
  Make sure to update any ENV-variables no longer in use from [interfaces/PA-App/.env](interfaces/PA-App/.env.example)
- 2021-04-20: Removed all components related to Sovrin

### Changed

- 2021-05-05: Updated test scenarios in /features folder

### Added

- 2021-05-05: Added endpoint to upload registered PAs via CSV-file for testing purposes

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

## v[1.0.0](https://github.com/global-121/121-platform/compare/v0.21.1...v1.0.0) - 2021-03-18

This version contains a working version of the full system, including:

- Self-registration by People Affected (PA) using a web-app
- (Offline) validation by Aid-Workers (AW) using a web-app
- Publishing of a (single) aid-program by a Humanitarian Organization (HO)
- Including/Rejecting PAs based on pre-set conditions of manually by HO
- Initiating pay-outs using multiple financial service providers (FSP)
- Publishing "Information as Aid" using a stand-alone web-app

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
- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of Portal
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
