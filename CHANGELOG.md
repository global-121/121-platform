# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/global-121/121-platform/compare/v0.7.1...master)

### Added
- 2020-08-19: Added GLOBAL_121_REF_DIR=Referral-app to tools/.env

### Changed
- 2020-08-19: Deploy script & apache2 conf changed, so possibly need to restart

---

## [0.7.1](https://github.com/global-121/121-platform/compare/v0.7.0...v0.7.1) - 2020-08-18
-2020-08-18: Fixes for input-validation in both PA-app and AW-app

## [0.7.0](https://github.com/global-121/121-platform/compare/v0.6.3...v0.7.0) - 2020-08-18

### Added
- 2020-08-12: Added AFRICASTALKING API-key to services/121-service/src/secrets.ts
- 2020-08-11: Added INTERSOLVE API-key to services/121-service/src/secrets.ts

### Changed
- 2020-08-12: Changed languages ny_MW, et_OM by sa_KE and la2_KE

---

## [0.6.3](https://github.com/global-121/121-platform/compare/v0.6.2...v0.6.3) - 2020-08-05

### Changed
- 2020-08-05: Fixes for input-validation in both PA-app and AW-app

## [0.6.2](https://github.com/global-121/121-platform/compare/v0.6.1...v0.6.2) - 2020-08-04

### Added
- 2020-08-04: Added initial seed-script for Kenya pilot

## [0.6.1](https://github.com/global-121/121-platform/compare/v0.6.0...v0.6.1) - 2020-08-04
- 2020-08-04: Fixed a bug, which prevented correctly running the NL-seed script
- 2020-08-04: Changed URL from staging.121.global to nlrc-staging.121.global in services/.env & interfaces/*/.env

## [0.6.0](https://github.com/global-121/121-platform/compare/v0.5.0...v0.6.0) - 2020-08-04

### Changed
- 2020-07-21: Value of `NODE_ENV` on `Test-VM` is renamed from 'staging' to 'test', as there is now a separate `Staging-VM`, which uses the value 'staging'. This is both about `services/.env` and about the value in `webhook.service`.

---

## [0.5.0](https://github.com/global-121/121-platform/compare/v0.4.0...v0.5.0) - 2020-07-16

### Changed
- 2020-07-14: Moved `NODE_ENV` variable from respective `Dockerfile`s of 121-service and PA-accounts-service to `services/docker-compose.yml` and `services/.env`

### Removed
- 2020-07-07: Removed Android build of AW-App, including all Cordova dependencies
- 2020-07-08: Removed everything appointment-related from PA-app, AW-app and 121-service. The latter requires dropping the database (e.g. through `dropSchema: true` in `ormconfig.json`) before it's (automatically) recreated by restarting 121-service.

---

## [0.4.0](https://github.com/global-121/121-platform/compare/v0.3.1...v0.4.0) - 2020-06-16

### Changed
- 2020-06-09: Add `IPV4_121_SERVICE`, `PORT_121_SERVICE`, `SUBDOMAIN_121_SERVICE`, `EXTERNAL_121_SERVICE_URL`, `URL_PA_ACCOUNTS_SERVICE_API`, `IPV4_PA_ACCOUNTS_SERVICE` , `PORT_PA_ACCOUNTS_SERVICE`, `SUBDOMAIN_PA_ACCOUNTS_SERVICE` and `URL_121_SERVICE_API`  to `services/.env` AB#1965 
- 2020-05-26 - Webhook in production-mode triggers deploy-script only once per published release

---

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

---

## [0.2.1](https://github.com/global-121/121-platform/compare/v0.2.0...v0.2.1) - 2020-04-22
Test hotfix-release to test automatic deployment of patch-releases.


## [0.2.0](https://github.com/global-121/121-platform/compare/v0.1.1...v0.2.0) - 2020-04-22

### Added
- 2020-04-22: Add `tools/.env`-file for `tools/deploy.sh`-script AB#1640

---

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

