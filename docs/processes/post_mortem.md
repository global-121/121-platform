# Post-Mortem Process

This document outlines the agenda and guidelines for conducting post-mortem meetings following a critical production incident. The goal is to analyze the incident in a blameless environment to identify root causes and implement improvements.

## Meeting Details

- **Schedule:** Within 2 business days of incident resolution.
- **Participants:** All team members involved in the incident, including the Incident Manager, developers, Product Manager, and any other relevant stakeholders.

## Agenda

### 1. Introduction (5 minutes)

- **Facilitator:** Incident Manager.
- **Purpose:** Set the tone for a blameless discussion focused on process improvement.

### 2. Incident Summary (10 minutes)

- **Presenter:** Incident Manager or a designated team member.
- **Content:**
  - What happened?
  - When did it happen?
  - Impact on users and systems.

### 3. Timeline Review (15 minutes)

- **Objective:** Go through the sequence of events from detection to resolution.
- **Content:**
  - Detection: How was the incident discovered?
  - Response: Key actions taken and decisions made.
  - Resolution: Steps that led to resolving the issue.

### 4. Root Cause Analysis (20 minutes)

- **Method:** Use the "Five Whys" or other root cause analysis techniques.
- **Objective:** Identify the underlying causes, not just the symptoms.

### 5. What Went Well (10 minutes)

- **Discussion:** Acknowledge effective actions and strategies.
- **Purpose:** Highlight positive aspects to reinforce good practices.

### 6. What Could Be Improved (20 minutes)

- **Discussion:** Identify gaps in processes, tools, or communication.
- **Focus Areas:**
  - Processes that need refinement.
  - Tools or systems that need enhancement.
  - Training or documentation gaps.

### 7. Action Items (15 minutes)

- **Objective:** Define specific tasks to prevent recurrence.
- **Examples:**
  - Update or create playbooks.
  - Improve monitoring and alerting systems.
  - Update documentation.
  - Update tests.
  - Schedule training sessions.

### 8. Assign Responsibilities (5 minutes)

- **Task:** Assign owners and set due dates for each action item.
- **Tracking:** Add action items to the backlog in Dev Ops with appropriate priority.

### 9. Closing Remarks (5 minutes)

- **Facilitator:** Summarize key takeaways.
- **Next Steps:** Outline how the findings will be communicated and implemented.

## Guidelines

- **Blameless Environment:** Focus on processes and systems, not individuals.
- **Open Communication:** Encourage honest and constructive feedback.
- **Documentation:** Record all findings and action items in the post-mortem report.
- **Follow-Up:** Ensure action items are tracked to completion.

## Post-Mortem Report Template

After the meeting, compile a report using the following structure:

```markdown
# Incident name

> Date and time of the incident

### Incident Summary

- Brief description of what happened.
- Impact analysis.

### Timeline of Events

- Detailed sequence from detection to resolution.

### Root Cause(s)

- Primary and contributing factors.

### What Went Well

- Effective actions and strategies.

### What Could Be Improved

- Identified gaps and areas for improvement.

### Action Items

- List of tasks with assigned owners and due dates.

### Additional Notes

- Any other relevant information.
```

## Storage and Accessibility

- Save the post-mortem report in the shared repository (e.g., GitHub Wiki or `docs/post_mortems` folder). (XXX: TBD where we would like to store this)
- Ensure it is accessible to all team members for future reference.

---

By adhering to this agenda, we aim to continuously improve our incident response process and enhance the reliability of the 121 Platform.
