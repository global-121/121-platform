# Summary of all CI Energy consumption

This snapshot covers **14 workflow runs across 12 workflows** associated with PR #9132 and head commit `dc2e8a1da73b127c3feee496a493fd734fb115a0`. Job summaries are grouped by workflow; repeated setup, checkout, and cleanup steps are omitted.

## Workflow: PR linter
From: [`.github/workflows/test_pull_request_formatting.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_pull_request_formatting.yml)

- [Run #21487](https://github.com/global-121/121-platform/actions/runs/43240303812) — **Failed.** `test` failed at “Check PR description and labels”; the XXX/TODO checks were skipped. `Build and test energy total` succeeded.
- [Run #21486](https://github.com/global-121/121-platform/actions/runs/43240130488) — **Cancelled.** The `test` job failed at the same PR description and labels check; `Build and test energy total` succeeded.

---

## Workflow: Test: Workflows
From: [`.github/workflows/test_workflows.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_workflows.yml)

- [Run #4112](https://github.com/global-121/121-platform/actions/runs/43240130431) — **Passed.** Workflow energy-total tests, GitHub Actions workflow lint, and `.env` lint passed. `Build and test energy total` succeeded.

---

## Workflow: Test Mock-Service: Code
From: [`.github/workflows/test_mock-service_code.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_mock-service_code.yml)

- [Run #4379](https://github.com/global-121/121-platform/actions/runs/43240130696) — **Passed.** Install, lint, TypeScript checks, and tests passed. `Build and test energy total` succeeded.

---

## Workflow: Test: E2E (Portal)
From: [`.github/workflows/test_e2e_portal.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_e2e_portal.yml)

- [Run #14669](https://github.com/global-121/121-platform/actions/runs/43240130556) — **Passed.** Path filtering and code lint passed; all 6 E2E shards and shard-resolution checks passed. `Build and test energy total` succeeded.

---

## Workflow: Test Service: Unit & Integration Tests
From: [`.github/workflows/test_service_api.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_service_api.yml)

- [Run #18608](https://github.com/global-121/121-platform/actions/runs/43240130704) — **Passed.** Path filtering and code lint passed; the main test job and all 6 test shards passed. Coverage upload and shard-resolution checks passed. `Build and test energy total` succeeded.

---

## Workflow: Test Service: Migrations Check
From: [`.github/workflows/test_service_check_migrations.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_service_check_migrations.yml)

- [Run #7848](https://github.com/global-121/121-platform/actions/runs/43240130788) — **Passed.** Test environment services started successfully, and the migration check found no new migrations needed. `Build and test energy total` succeeded.

---

## Workflow: Copilot Setup Steps
From: [`.github/workflows/copilot-setup-steps.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/copilot-setup-steps.yml)

- [Push run #95](https://github.com/global-121/121-platform/actions/runs/43240118616) — **Passed.** Root, shared ESLint, E2E, Portal, Service, and Mock-Service dependencies installed; environment preparation and `Build and test energy total` succeeded.
- [Pull request run #96](https://github.com/global-121/121-platform/actions/runs/43240130766) — **Passed.** The same dependency setup and environment preparation passed; `Build and test energy total` succeeded.

---

## Workflow: Test Interface: Portal
From: [`.github/workflows/test_interface_portal.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_interface_portal.yml)

- [Run #13515](https://github.com/global-121/121-platform/actions/runs/43240130682) — **Passed.** Type tests, lint, dead-code checks, deployment configuration, code tests, and translation output checks passed; coverage uploaded and saved. `Build and test energy total` succeeded.

---

## Workflow: Test Service: Restart Service (ONLY)
From: [`.github/workflows/test_service_only_restart.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_service_only_restart.yml)

- [Run #5411](https://github.com/global-121/121-platform/actions/runs/43240130347) — **Passed.** Test services started and the isolated restart-service test passed. `Build and test energy total` succeeded.

---

## Workflow: Deploy [test] Interface: Portal
From: [`.github/workflows/deploy_test_portal.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/deploy_test_portal.yml)

- [Run #8940](https://github.com/global-121/121-platform/actions/runs/43240130557) — **Passed.** Portal build, Azure Static Web App deployment, and deployment verification passed; the preview link was added to the PR. The close-PR job was skipped. `Build and test energy total` succeeded.

---

## Workflow: Test: Formatting (with Prettier)
From: [`.github/workflows/test_formatting.yml`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/.github/workflows/test_formatting.yml)

- [Run #10919](https://github.com/global-121/121-platform/actions/runs/43240130564) — **Passed.** Formatting lint passed. `Build and test energy total` succeeded.

---

## Workflow: Running Copilot Code Review
From: [`dynamic/agents/copilot-pull-request-reviewer`](https://github.com/global-121/121-platform/blob/agents/ci-energy-estimation-workflows-setup/dynamic/agents/copilot-pull-request-reviewer)

- [Run #544](https://github.com/global-121/121-platform/actions/runs/43240154110) — **Passed.** Copilot code review completed successfully. This workflow is not part of the CI energy measurement set.
