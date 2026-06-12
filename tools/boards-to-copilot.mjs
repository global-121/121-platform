#!/usr/bin/env node

/**
 * Fetches Azure DevOps board items with a "Ready" state, then creates
 * GitHub issues and assigns Copilot coding agent to generate PRs.
 *
 * Prerequisites:
 *   - Azure CLI with the azure-devops extension: `az extension add --name azure-devops`
 *   - Logged in: `az login`
 *   - GitHub CLI: `brew install gh` and `gh auth login`
 *   - Copilot coding agent enabled on the target GitHub repo
 *
 * Usage:
 *   node --env-file-if-exists=.env boards-to-copilot.mjs [--dry-run] [--work-item=12345]
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─── Configuration (from env) ────────────────────────────────────────────────

const AZURE_DEVOPS_ORG = process.env.AZURE_DEVOPS_ORG;
const AZURE_DEVOPS_PROJECT = process.env.AZURE_DEVOPS_PROJECT;
const WORK_ITEM_STATE = process.env.WORK_ITEM_STATE ?? 'Ready';
const COPILOT_TAG = 'copilot-assigned';
const DRY_RUN = process.argv.includes('--dry-run');
const WORK_ITEM_ID = (() => {
  const arg = process.argv.find((a) => a.startsWith('--work-item='));
  return arg ? Number(arg.split('=')[1]) : null;
})();
let GITHUB_REPO;

// ─── CLI helpers ─────────────────────────────────────────────────────────────

async function runJson(cmd, args) {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    maxBuffer: 10 * 1024 * 1024,
  });
  if (!stdout.trim()) {
    return []; // Empty output means no results
  }
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(
      `Failed to parse JSON from: ${cmd} ${args.join(' ')}\nOutput: ${stdout.slice(0, 500)}`,
    );
  }
}

async function run(cmd, args) {
  const { stdout } = await execFileAsync(cmd, args, {
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

/**
 * Detect the GitHub owner/repo from the git remote origin URL.
 */
async function detectGitHubRepo() {
  const remoteUrl = await run('git', ['remote', 'get-url', 'origin']);
  const match = remoteUrl.match(/github\.com[/:](.*?)(\.git)?$/);
  if (!match) {
    throw new Error(
      `Could not detect GitHub repo from remote URL: ${remoteUrl}`,
    );
  }
  return match[1];
}

function checkPrerequisites() {
  const missing = [];
  if (!AZURE_DEVOPS_ORG) missing.push('AZURE_DEVOPS_ORG');
  if (!AZURE_DEVOPS_PROJECT) missing.push('AZURE_DEVOPS_PROJECT');
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'See .env.example for configuration.',
    );
    process.exit(1);
  }
}

// ─── Azure DevOps (az boards) ────────────────────────────────────────────────

async function queryWorkItems() {
  const wiql = [
    `SELECT [System.Id], [System.Title], [System.WorkItemType],`,
    `[System.Description], [System.Tags]`,
    `FROM WorkItems`,
    `WHERE [System.TeamProject] = '${AZURE_DEVOPS_PROJECT}'`,
    `AND [System.WorkItemType] = 'Product Backlog Item'`,
    `AND [System.State] = '${WORK_ITEM_STATE}'`,
    `AND [Microsoft.VSTS.Scheduling.Effort] > 0`,
    `AND NOT [System.Tags] CONTAINS '${COPILOT_TAG}'`,
    `ORDER BY [Microsoft.VSTS.Common.BacklogPriority] ASC`,
  ].join(' ');

  const orgUrl = `https://dev.azure.com/${AZURE_DEVOPS_ORG}`;

  return await runJson('az', [
    'boards',
    'query',
    '--wiql',
    wiql,
    '--org',
    orgUrl,
    '--project',
    AZURE_DEVOPS_PROJECT,
    '--output',
    'json',
  ]);
}

/**
 * Fetch full work item details including all fields and relations.
 */
async function getFullWorkItem(workItemId) {
  const orgUrl = `https://dev.azure.com/${AZURE_DEVOPS_ORG}`;
  return await runJson('az', [
    'boards',
    'work-item',
    'show',
    '--id',
    String(workItemId),
    '--expand',
    'all',
    '--org',
    orgUrl,
    '--output',
    'json',
  ]);
}

/**
 * Fetch comments/discussion for a work item.
 */
async function getWorkItemComments(workItemId) {
  const url = `https://dev.azure.com/${AZURE_DEVOPS_ORG}/${encodeURIComponent(AZURE_DEVOPS_PROJECT)}/_apis/wit/workItems/${workItemId}/comments?api-version=7.1-preview.4`;
  try {
    const result = await runJson('az', [
      'rest',
      '--method',
      'GET',
      '--url',
      url,
      '--resource',
      '499b84ac-1321-427f-aa17-267ca6975798',
      '--output',
      'json',
    ]);
    return result.comments ?? [];
  } catch (err) {
    console.log(`      ⚠️  Could not fetch comments: ${err.message}`);
    return [];
  }
}

// ─── GitHub Issues + Copilot coding agent ───────────────────────────────────

/**
 * Create a GitHub issue and assign Copilot coding agent to it.
 * Returns the issue URL.
 */
async function createIssueWithCopilot(title, body, labels) {
  const args = [
    'issue',
    'create',
    '--title',
    title,
    '--body',
    body,
    '--repo',
    GITHUB_REPO,
  ];
  for (const label of labels) {
    args.push('--label', label);
  }

  const issueUrl = await run('gh', args);

  const issueNumber = issueUrl.split('/').pop();
  // await run('gh', [
  //   'api',
  //   `repos/${GITHUB_REPO}/issues/${issueNumber}/assignees`,
  //   '--method',
  //   'POST',
  //   '--field',
  //   'assignees[]=copilot-swe-agent[bot]',
  // ]);

  return issueUrl;
}

/**
 * Tag a work item in Azure DevOps with 'copilot-assigned' to prevent duplicates.
 * Retries with backoff to handle concurrent edits (e.g. from AB# linking).
 */
async function tagWorkItem(workItemId, retries = 3) {
  const orgUrl = `https://dev.azure.com/${AZURE_DEVOPS_ORG}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    // Fresh read to get current revision
    const wi = await runJson('az', [
      'boards',
      'work-item',
      'show',
      '--id',
      String(workItemId),
      '--org',
      orgUrl,
      '--output',
      'json',
    ]);

    const currentTags = wi.fields?.['System.Tags'] ?? '';
    if (currentTags.includes(COPILOT_TAG)) {
      return; // Already tagged
    }
    const newTags = currentTags
      ? `${currentTags}; ${COPILOT_TAG}`
      : COPILOT_TAG;

    try {
      await run('az', [
        'boards',
        'work-item',
        'update',
        '--id',
        String(workItemId),
        '--fields',
        `System.Tags=${newTags}`,
        '--org',
        orgUrl,
        '--output',
        'none',
      ]);
      return; // Success
    } catch (err) {
      if (attempt < retries && err.message.includes('TF26071')) {
        const delay = attempt * 2000;
        console.log(
          `      ⏳ Tagging conflict, retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Fields to skip when collecting additional HTML/text content.
 * These are either already handled explicitly or not useful as prompt content.
 */
const SKIP_FIELDS = new Set([
  'System.Id',
  'System.Title',
  'System.Description',
  'Microsoft.VSTS.Common.AcceptanceCriteria',
  'System.Tags',
  'Microsoft.VSTS.Scheduling.Effort',
  'Microsoft.VSTS.Common.Priority',
  'System.AreaPath',
  'System.IterationPath',
  'System.State',
  'System.Reason',
  'System.CreatedBy',
  'System.ChangedBy',
  'System.AssignedTo',
  'System.CreatedDate',
  'System.ChangedDate',
  'System.BoardColumn',
  'System.BoardColumnDone',
  'System.TeamProject',
  'System.WorkItemType',
  'System.Rev',
  'System.AuthorizedDate',
  'System.RevisedDate',
  'System.Watermark',
  'System.CommentCount',
  'System.NodeName',
  'System.AreaId',
  'System.IterationId',
  'System.AuthorizedAs',
  'System.PersonId',
  'Microsoft.VSTS.Common.StateChangeDate',
  'Microsoft.VSTS.Common.ActivatedDate',
  'Microsoft.VSTS.Common.ActivatedBy',
  'Microsoft.VSTS.Common.BacklogPriority',
]);

/**
 * Build a prompt for Copilot from a full Azure DevOps work item + comments.
 */
function buildPrompt(workItem, comments) {
  const fields = workItem.fields;
  const workItemId = fields['System.Id'];
  const title = fields['System.Title'];
  const description = fields['System.Description'] ?? '';
  const acceptanceCriteria =
    fields['Microsoft.VSTS.Common.AcceptanceCriteria'] ?? '';
  const tags = fields['System.Tags'] ?? '';
  const effort = fields['Microsoft.VSTS.Scheduling.Effort'];
  const priority = fields['Microsoft.VSTS.Common.Priority'];
  const areaPath = fields['System.AreaPath'] ?? '';
  const iterationPath = fields['System.IterationPath'] ?? '';
  const workItemUrl = `https://dev.azure.com/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_workitems/edit/${workItemId}`;

  const sections = [
    `# Azure DevOps Work Item AB#${workItemId}: ${title}`,
    `Source: ${workItemUrl}`,
    tags ? `Tags: ${tags}` : null,
    effort ? `Effort: ${effort}` : null,
    priority ? `Priority: ${priority}` : null,
    areaPath ? `Area: ${areaPath}` : null,
    iterationPath ? `Iteration: ${iterationPath}` : null,
  ];

  // Description
  const cleanDescription = stripHtml(description);
  if (cleanDescription) {
    sections.push('', '## Description', cleanDescription);
  }

  // Acceptance Criteria
  const cleanCriteria = stripHtml(acceptanceCriteria);
  if (cleanCriteria) {
    sections.push('', '## Acceptance Criteria', cleanCriteria);
  }

  // Linked work items (parent, child, related)
  const relations = workItem.relations ?? [];
  const linkedItems = relations
    .filter((r) => r.rel?.startsWith('System.LinkTypes'))
    .map((r) => {
      const linkType = r.rel.replace('System.LinkTypes.Hierarchy-', '');
      const idMatch = r.url?.match(/workItems\/(\d+)/);
      return idMatch ? `- [${linkType}] Work Item #${idMatch[1]}` : null;
    })
    .filter(Boolean);
  if (linkedItems.length > 0) {
    sections.push('', '## Linked Work Items', ...linkedItems);
  }

  // Include any additional HTML/text fields (e.g. Design, Notes, custom fields)
  for (const [key, value] of Object.entries(fields)) {
    if (SKIP_FIELDS.has(key)) continue;
    if (typeof value !== 'string') continue;
    // Only include fields that look like HTML content (have tags) or are multi-line
    if (!value.includes('<') && !value.includes('\n')) continue;
    const cleaned = stripHtml(value);
    if (cleaned.length > 0) {
      // Create a readable section name from the field key
      const label = key
        .split('.')
        .pop()
        .replace(/([A-Z])/g, ' $1')
        .trim();
      sections.push('', `## ${label}`, cleaned);
    }
  }

  // Comments / Discussion
  if (comments.length > 0) {
    sections.push('', '## Discussion');
    for (const comment of comments) {
      const author = comment.createdBy?.displayName ?? 'Unknown';
      const date = comment.createdDate?.split('T')[0] ?? '';
      const text = stripHtml(comment.text ?? '');
      if (text) {
        sections.push(``, `**${author}** (${date}):`, text);
      }
    }
  }

  return [
    '> **Priority of sections when implementing:**',
    '> 1. Refinement 2. Pre-refinement 3. Design 4. Discussion (latest comments are most important) 5. The rest',
    '',
    '> **Label this issue:** After reading the work item, update this issue with the most appropriate label',
    '> by running: `gh issue edit <issue-number> --add-label <label>`',
    '> Choose exactly one of: `bugfix`, `chore`, `enhancement`, `dependencies`, `github actions`',
    '',
    ...sections.filter((line) => line !== null),
  ].join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  checkPrerequisites();

  GITHUB_REPO = await detectGitHubRepo();
  console.log(`\nDetected GitHub repo: ${GITHUB_REPO}`);
  console.log(
    `  Org: ${AZURE_DEVOPS_ORG} / Project: ${AZURE_DEVOPS_PROJECT}\n`,
  );

  let workItemIds;

  if (WORK_ITEM_ID) {
    console.log(`Processing single work item: AB#${WORK_ITEM_ID}\n`);
    workItemIds = [WORK_ITEM_ID];
  } else {
    console.log(
      `Querying Azure DevOps for work items in "${WORK_ITEM_STATE}" state...`,
    );

    const workItems = await queryWorkItems();
    console.log(
      `Found ${workItems.length} work item(s) in "${WORK_ITEM_STATE}" state.`,
    );

    if (workItems.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    console.log(
      '\n─── Work Items ───────────────────────────────────────────\n',
    );
    for (const wi of workItems) {
      const f = wi.fields;
      console.log(
        `  #${f['System.Id']}  [${f['System.WorkItemType']}]  ${f['System.Title']}`,
      );
    }
    console.log('');

    if (DRY_RUN) {
      console.log('[DRY RUN] Would create Copilot agent tasks for the above.');
      console.log('[DRY RUN] Re-run without --dry-run to execute.');
      return;
    }
  }

  console.log(`Creating GitHub issues in ${GITHUB_REPO}...\n`);

  for (const workItemId of workItemIds) {
    // Fetch full details and comments
    console.log(`  Fetching details for AB#${workItemId}...`);
    const [fullItem, comments] = await Promise.all([
      getFullWorkItem(workItemId),
      getWorkItemComments(workItemId),
    ]);
    const title = fullItem.fields['System.Title'];
    console.log(
      `      ${Object.keys(fullItem.fields).length} fields, ${comments.length} comment(s)`,
    );

    const body = buildPrompt(fullItem, comments);
    const issueTitle = `AB#${workItemId}: ${title}`;

    const labels = ['copilot'];

    const issueUrl = await createIssueWithCopilot(issueTitle, body, labels);
    console.log(`  ✅ AB#${workItemId} "${title}"`);
    console.log(`      → ${issueUrl}`);

    // Wait for AB# linking to settle before tagging
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Tag the work item to prevent duplicate processing
    await tagWorkItem(workItemId);
    console.log(`      → Tagged AB#${workItemId} with '${COPILOT_TAG}'`);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\nDone! Check GitHub for Copilot-generated PRs.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
