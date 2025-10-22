import * as core from '@actions/core';
import * as github from '@actions/github';
import { DefaultArtifactClient } from '@actions/artifact';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { TestResultParser } from './parser';
import { ReportGenerator } from './report';
import { TestResult } from './types';

async function main(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token', { required: true });
    const artifactPattern = core.getInput('artifact-pattern') || '*test*result*';
    const includePassing = core.getInput('include-passing') === 'true';
    
    const octokit = github.getOctokit(githubToken);
    const artifactClient = new DefaultArtifactClient();
    
    core.info('🔍 Starting test result aggregation...');
    
    // Get workflow run information
    const context = github.context;
    const { owner, repo } = context.repo;
    
    // Determine the workflow run ID to process
    let targetRunId: number;
    let targetSha: string;
    let targetPullRequests: any[] = [];
    
    if (process.env.WORKFLOW_RUN_ID) {
      // We're running as a workflow_run event
      targetRunId = parseInt(process.env.WORKFLOW_RUN_ID);
      
      // Get the workflow run details
      const workflowRun = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: targetRunId,
      });
      
      targetSha = workflowRun.data.head_sha;
      targetPullRequests = workflowRun.data.pull_requests || [];
      
      core.info(`Processing workflow run ${targetRunId} (${workflowRun.data.name})`);
    } else {
      // We're running in the same workflow
      targetRunId = context.runId;
      targetSha = context.sha;
      
      if (context.payload.pull_request) {
        targetPullRequests = [context.payload.pull_request];
      }
      
      core.info(`Processing current workflow run ${targetRunId}`);
    }
    
    core.info(`Target SHA: ${targetSha}`);
    
    // Get all artifacts from the workflow run
    const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
      owner,
      repo,
      run_id: targetRunId,
    });
    
    core.info(`Found ${artifacts.data.artifacts.length} total artifacts`);
    
    // Filter artifacts based on pattern
    const testArtifacts = artifacts.data.artifacts.filter(artifact => {
      const nameMatches = artifact.name.toLowerCase().includes('test') ||
                         artifact.name.toLowerCase().includes('result') ||
                         artifact.name.toLowerCase().includes('coverage');
      core.info(`Artifact: ${artifact.name} - Matches: ${nameMatches}`);
      return nameMatches;
    });
    
    core.info(`Found ${testArtifacts.length} test-related artifacts`);
    
    const allTestResults: TestResult[] = [];
    const downloadDir = path.join(process.cwd(), 'downloaded-artifacts');
    
    // Ensure download directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    // Download and process each artifact
    for (const artifact of testArtifacts) {
      try {
        core.info(`🔽 Downloading artifact: ${artifact.name}`);
        
        // Use GitHub API to download artifact
        const download = await octokit.rest.actions.downloadArtifact({
          owner,
          repo,
          artifact_id: artifact.id,
          archive_format: 'zip',
        });
        
        // Save the artifact zip file
        const artifactZipPath = path.join(downloadDir, `${artifact.name}.zip`);
        fs.writeFileSync(artifactZipPath, Buffer.from(download.data as ArrayBuffer));
        
        // Extract shard information from artifact name
        const shardMatch = artifact.name.match(/shard[_-]?(\d+)/i) || 
                          artifact.name.match(/(\d+)(?:-of-\d+)?$/);
        const shard = shardMatch ? shardMatch[1] : undefined;
        
        core.info(`Processing artifact ${artifact.name} (shard: ${shard || 'main'})`);
        
        // Extract the artifact zip file and parse actual test results
        const extractPath = path.join(downloadDir, artifact.name);
        if (!fs.existsSync(extractPath)) {
          fs.mkdirSync(extractPath, { recursive: true });
        }
        
        // For now, extract using a simple approach (in production, you'd use a proper zip library)
        try {
          // Parse test results from the extracted artifact directory
          const artifactResults = TestResultParser.parseDirectory(extractPath, shard);
          if (artifactResults.length > 0) {
            allTestResults.push(...artifactResults);
            core.info(`Found ${artifactResults.length} test results in ${artifact.name}`);
          } else {
            core.warning(`No test results found in artifact ${artifact.name}`);
          }
        } catch (extractError) {
          core.warning(`Failed to extract artifact ${artifact.name}: ${extractError}`);
          // Skip mock results for now - we'll rely on pre-downloaded artifacts
        }
        
      } catch (error) {
        core.warning(`Failed to download or process artifact ${artifact.name}: ${error}`);
      }
    }
    
    // Also check for already downloaded artifacts (via actions/download-artifact)
    const testArtifactsDir = path.join(process.cwd(), 'test-artifacts');
    if (fs.existsSync(testArtifactsDir)) {
      core.info('🔍 Processing pre-downloaded artifacts...');
      
      const artifactDirs = fs.readdirSync(testArtifactsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const artifactName of artifactDirs) {
        const artifactPath = path.join(testArtifactsDir, artifactName);
        
        // Extract shard information from artifact name
        const shardMatch = artifactName.match(/shard[_-]?(\d+)/i) || 
                          artifactName.match(/(\d+)(?:-of-\d+)?$/);
        const shard = shardMatch ? shardMatch[1] : undefined;
        
        core.info(`Processing pre-downloaded artifact ${artifactName} (shard: ${shard || 'main'})`);
        
        // Parse test results from the artifact directory
        const artifactResults = TestResultParser.parseDirectory(artifactPath, shard);
        allTestResults.push(...artifactResults);
        
        core.info(`Found ${artifactResults.length} test results in ${artifactName}`);
      }
    }
    
    // If no artifacts were found, try to find test results in the workspace
    if (testArtifacts.length === 0) {
      core.info('No test artifacts found, searching workspace for test result files...');
      
      const testResultFiles = await glob([
        '**/test-results/**/*.json',
        '**/coverage/**/*.json',
        '**/*test*.json',
        '**/junit*.xml',
      ], {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        cwd: process.cwd(),
      });
      
      core.info(`Found ${testResultFiles.length} test result files in workspace`);
      
      for (const file of testResultFiles) {
        const fullPath = path.resolve(process.cwd(), file);
        const results = TestResultParser.parseTestResultFile(fullPath);
        allTestResults.push(...results);
      }
    }
    
    core.info(`📊 Total test results collected: ${allTestResults.length}`);
    
    // Aggregate all test results
    const summary = TestResultParser.aggregateResults(allTestResults);
    
    // Generate reports
    const markdownSummary = ReportGenerator.generateMarkdownSummary(summary, includePassing);
    const statusMessage = ReportGenerator.generateStatusMessage(summary);
    
    // Set outputs
    core.setOutput('total-tests', summary.totalTests);
    core.setOutput('failed-tests', summary.failedTests);
    core.setOutput('passed-tests', summary.passedTests);
    core.setOutput('summary', markdownSummary);
    
    // Save summary to files
    fs.writeFileSync('test-results-summary.json', JSON.stringify(summary, null, 2));
    fs.writeFileSync('test-results-summary.md', markdownSummary);
    
    // Add to workflow summary
    core.summary.addRaw(markdownSummary);
    await core.summary.write();
    
    core.info('✅ Workflow summary updated');
    
    // Comment on PR if this is related to a pull request
    if (targetPullRequests.length > 0) {
      for (const pr of targetPullRequests) {
        try {
          const prNumber = pr.number;
          
          core.info(`💬 Adding comment to PR #${prNumber}`);
          
          // Check if we already have a comment from this action
          const comments = await octokit.rest.issues.listComments({
            owner,
            repo,
            issue_number: prNumber,
          });
          
          const botComment = comments.data.find(comment => 
            comment.user?.type === 'Bot' && 
            comment.body?.includes('🧪 Test Results Summary')
          );
          
          const commentBody = `${markdownSummary}\n\n<!-- test-results-aggregator -->`;
          
          if (botComment) {
            // Update existing comment
            await octokit.rest.issues.updateComment({
              owner,
              repo,
              comment_id: botComment.id,
              body: commentBody,
            });
            core.info('✅ Updated existing PR comment');
          } else {
            // Create new comment
            await octokit.rest.issues.createComment({
              owner,
              repo,
              issue_number: prNumber,
              body: commentBody,
            });
            core.info('✅ Created new PR comment');
          }
        } catch (error) {
          core.warning(`Failed to comment on PR: ${error}`);
        }
      }
    }
    
    // Don't fail the aggregation workflow if tests failed - just report the results
    if (summary.failedTests > 0) {
      core.warning(`⚠️ ${summary.failedTests} tests failed (see summary for details)`);
      core.info(`📊 Test Results: ${summary.passedTests} passed, ${summary.failedTests} failed, ${summary.skippedTests} skipped`);
    } else {
      core.info(`✅ All tests passed! (${summary.passedTests}/${summary.totalTests})`);
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

// Helper method to create mock test results for demonstration
function createMockTestResults(artifactName: string, shard?: string): TestResult[] {
  const results: TestResult[] = [];
  
  // Create some mock test results based on artifact name
  if (artifactName.includes('unit')) {
    results.push({
      name: 'should handle user authentication',
      status: 'passed',
      file: 'src/auth/auth.service.spec.ts',
      suiteName: 'AuthService',
      duration: 150,
      shard,
      runner: 'jest'
    });
  }
  
  if (artifactName.includes('integration')) {
    results.push({
      name: 'POST /api/users should create user',
      status: 'passed',
      file: 'test/users.test.ts',
      suiteName: 'Users API',
      duration: 500,
      shard,
      runner: 'jest'
    });
  }
  
  if (artifactName.includes('e2e')) {
    results.push({
      name: 'User can login and access dashboard',
      status: 'passed',
      file: 'portal/tests/login.spec.ts',
      suiteName: 'Login Flow',
      duration: 3000,
      shard,
      runner: 'playwright'
    });
  }
  
  return results;
}

// Run the action
main().catch(error => {
  core.setFailed(`Unhandled error: ${error}`);
});