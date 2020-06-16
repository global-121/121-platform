# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.4.0] - 2020-06-16

### Changed
- 2020-06-09: Add `IPV4_121_SERVICE`, `PORT_121_SERVICE`, `SUBDOMAIN_121_SERVICE`, `EXTERNAL_121_SERVICE_URL`, `URL_PA_ACCOUNTS_SERVICE_API`, `IPV4_PA_ACCOUNTS_SERVICE` , `PORT_PA_ACCOUNTS_SERVICE`, `SUBDOMAIN_PA_ACCOUNTS_SERVICE` and `URL_121_SERVICE_API`  to `services/.env` AB#1965 
- 2020-05-26 - Webhook in production-mode triggers deploy-script only once per published release


## [0.3.1] - 2020-05-26
Hotfix to add missing variable/parameter in AW-App validation-flow.


## [0.3.0] - 2020-05-26

### Added
- 2020-05-20: Add `RESET_SECRET` to `services/.env` AB#1921

### Changed
- 2020-05-20: Renamed `program-manager` to `project-officer` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1938
- 2020-05-20: Renamed `privacy-officer` to `program-manager` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1939

### Removed
- 2020-04-23: Remove `tools/secrets.json`, set `GITHUB_WEBHOOK_SECRET` in `webhook.service`


## [0.2.1] - 2020-04-22
Test hotfix-release to test automatic deployment of patch-releases.


## [0.2.0] - 2020-04-22

### Added
- 2020-04-22: Add `tools/.env`-file for `tools/deploy.sh`-script AB#1640


## [0.1.1] - 2020-04-21

### Fixed
- 2020-04-21: Fix playText-button disappears when switching to other language then english


## [0.1.0] - 2020-04-15

### Added
- 2020-04-08: Add `EXTERNAL_121_SERVICE_URL` to `services/.env`
- 2020-03-25: Add `NG_LOCALES` to `interfaces/PA-App/.env` AB#1680
- 2020-03-19: Add `NG_ALWAYS_SHOW_TEXT_PLAYER` to `interfaces/PA-App/.env` AB#823

### Removed
- 2020-03-11: Remove usernames from `services/121-service/src/secrets.ts` AB#1641


---

[Unreleased]: https://github.com/global-121/121-platform/compare/v0.4.0...master
[0.4.0]: https://github.com/global-121/121-platform/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/global-121/121-platform/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/global-121/121-platform/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/global-121/121-platform/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/global-121/121-platform/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/global-121/121-platform/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/global-121/121-platform/releases/tag/v0.1.0
