# Tailored Process for Managing Critical Production Issues for the 121 Platform

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Definitions](#2-definitions)
3. [Incident Reporting and Classification](#3-incident-reporting-and-classification)
4. [Incident Response and Firefighting](#4-incident-response-and-firefighting)
5. [Communication Protocols](#5-communication-protocols)
6. [Resolution and Recovery](#6-resolution-and-recovery)
7. [Post-Incident Review](#7-post-incident-review)
8. [Process Flow Summary](#8-process-flow-summary)

---

## 1. Introduction

This document outlines a tailored process for managing critical production issues for the **121 Platform**. The goal is to establish a clear, efficient, and effective approach to handle incidents from initial reporting through resolution and post-incident analysis. This process is designed to accommodate the unique aspects of our platform, team structure, and existing tools, ensuring minimal disruption to services and continuous improvement over time.

## 2. Definitions

- **Critical Production Issue**: An incident that significantly impacts the core functionalities of the 121 Platform, particularly those affecting the "critical paths" such as payment distribution and recipient registration.

- **Critical Paths**: Key functionalities whose failure would severely impact users or core services. (XXX: Tijs or Piotr should probably have a definition of critical paths somewhere?) For the 121 Platform, these include:

  - Payment distribution processes
  - Recipient registration and management
  - Data integrity and availability

- **Severity Levels**:

  - **Severity 1 (Critical)**: Complete outage or failure of critical paths with no workaround.
  - **Severity 2 (High)**: Significant degradation of service affecting critical paths with limited workaround.
  - **Severity 3 (Medium)**: Issues affecting non-critical functionalities or with viable workarounds.
  - **Severity 4 (Low)**: Minor issues, cosmetic errors, or general inquiries.

- **Daily Log Checker**:

  - Team member assigned daily to monitor logs and alerts for any incidents.
  - Responsible for confirming if an incident is severe.
  - Assigns the Incident Manager in accordance with the team after confirming the severity.
  - Ensures that a bug item is created and prioritized in Dev Ops.

- **Incident Manager**:
  - Role assigned per incident by the Daily Log Checker after severity confirmation.
  - Coordinates the incident response effort.
  - Ensures communication protocols are followed.
  - Responsible for escalation if needed.

## 3. Incident Reporting and Classification

- **Reporting Channels**:

  - **Primary**: Microsoft Teams — For immediate communication and alerts.
  - **Secondary**: Dev Ops — For incident tracking and documentation.

- **Who Can Report**:

  - Any team member, Cash IM team member, or client who identifies an issue.

- **Reporting Procedure**:

  1. **Immediate Notification**:

     - (XXX: Below is IMHO what happens now - not necessarily what we desire in the long run)
     - The incident reporter sends a message in the **121 Team chat**, informing the team that there is a production critical issue.
     - Provide as much information as possible about the issue.

  2. **Severity Confirmation**:

     - The **Daily Log Checker** verifies whether the issue is severe.
     - Determines if the issue affects critical paths.

  3. **Assign Incident Manager**:

     - If confirmed as severe, the Daily Log Checker assigns an Incident Manager in accordance with the team.
     - Informs the team about the assignment.

  4. **Incident Logging**:
     - The Daily Log Checker ensures that a bug item has been created in **Dev Ops**.
     - Brings the bug item to the top of the sprint backlog.
     - At a minimum, the Dev Ops bug item for a severe production issue should have the following tasks:
       - Fix production issue
       - Release hotfix
       - Schedule post-mortem

  - XXX: should this be a dedicated / new Dev Ops type?
    - Ideally we should have an easy way to look at all past critical production issues at a glance. Could also be achieved with tags, but less easy to maintain / enforce.

- **Severity Level Guidelines**:
  - **Severity 1**:
    - Immediate action required.
    - Full resources allocated until resolution.
  - **Severity 2**:
    - Prompt action required.
    - Resources allocated as necessary.
  - **Severity 3 & 4**:
    - Scheduled into regular sprint cycles.

## 4. Incident Response and Firefighting

When a critical incident is reported and confirmed as severe, the team enters **firefighting mode**, which remains in effect until the issue is resolved in production.

- **Initial Response**:

  - Incident Manager assembles a response team, prioritizing availability and expertise.
  - Create an ad-hoc chat in Microsoft Teams (which allows for video calls if needed).
  - Notify the team that we are in firefighting mode. XXX: maybe there is a way to flag this also on the status page, and link to an ongoing production issue on Dev Ops.

- **Diagnosis**:

  - Collect logs, error messages, and any relevant data.
  - Identify the root cause using available tools (Application Insights, logs, database inspection).
  - **Use of Playbooks**:
    - Refer to [existing playbooks](/docs/playbooks/) for guidance on diagnosing common issues.
    - If a playbook does not exist for the issue, consider creating one during the post-incident review.

- **Resolution**:

  - Develop a fix or workaround.
  - Review and test the solution in the test environment.

- **Deployment**:
  - Prepare a hotfix if necessary.
  - Follow the existing CI/CD pipeline for deployment to production.
  - Ensure that the hotfix does not introduce new issues (pass all tests).

## 5. Communication Protocols

- **Internal Communication**:

  - Use the ad-hoc Microsoft Teams chat for real-time updates among the response team.
  - Update the Dev Ops incident ticket with progress notes.

- **Stakeholder Communication**:

  - Product Manager (PM) informs internal stakeholders (Cash IM team, leadership) about the incident and expected resolution time.
  - If clients are affected, prepare a communication plan.

- **External Communication**:
  - Since we have direct contact with clients, the PM or designated team member communicates updates directly.

## 6. Resolution and Recovery

- **Verification**:

  - Confirm that the issue is resolved in production.
  - Monitor the system for any anomalies post-deployment.

- **Closure**:
  - Update the Dev Ops ticket with resolution details.
  - Change the status of the incident to "Resolved".
  - Exit firefighting mode and inform the team.

## 7. Post-Incident Review

Refer to the [Post-Mortem Process](/docs/processes/post_mortem.md) documentation.

## 8. Process Flow Summary

1. **Detection**:

   - Incident detected via monitoring tools, daily log checker, or reports from team/clients.

2. **Reporting and Classification**:

   - Incident reporter sends a message in the **121 Team chat**, informing the team of the production critical issue.
   - Daily Log Checker verifies the severity and determines if it's severe.
   - If severe, Daily Log Checker assigns Incident Manager in accordance with the team and informs everyone.
   - Daily Log Checker ensures a bug item is created in **Dev Ops** and brought to the top of the sprint backlog.
   - The Dev Ops bug item should include tasks to fix the issue, release hotfix, and schedule post-mortem.

3. **Response and Firefighting**:

   - Enter firefighting mode.
   - Incident Manager assembles response team.
   - Begin diagnosis and troubleshooting.

4. **Communication**:

   - Keep internal stakeholders updated.
   - Communicate with clients if affected.

5. **Resolution**:

   - Implement fix.
   - Deploy hotfix following CI/CD protocols.

6. **Verification**:

   - Confirm issue is resolved.
   - Monitor for any residual effects.
   - Exit firefighting mode.

7. **Post-Incident Review**:

   - Conduct post-mortem meeting.
   - Document findings and lessons learned.

8. **Follow-Up**:
   - Implement action items.
   - Update documentation and processes as needed.
