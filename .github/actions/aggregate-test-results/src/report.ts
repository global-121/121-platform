import { TestSummary, TestResult } from './types';

interface ReportOptions {
  includePassing?: boolean;
  unifiedSummary?: boolean;
}

export class ReportGenerator {
  constructor(
    private summary: TestSummary,
    private options: ReportOptions = {}
  ) {}

  /**
   * Generate a markdown report
   */
  generateMarkdownReport(): string {
    const { totalTests, passedTests, failedTests: failedCount, skippedTests, shards } = this.summary;
    
    let markdown = this.options.unifiedSummary 
      ? '## 🧪 Unified Test Results Summary\n\n'
      : '## 🧪 Test Results Summary\n\n';
    
    // Overall stats
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    const statusEmoji = failedCount === 0 ? '✅' : '❌';
    
    markdown += `${statusEmoji} **Overall**: ${passedTests}/${totalTests} tests passed (${successRate}%)\n\n`;
    
    if (failedCount > 0 || skippedTests > 0) {
      markdown += '### 📊 Results Breakdown\n\n';
      markdown += `- ✅ **Passed**: ${passedTests}\n`;
      if (failedCount > 0) {
        markdown += `- ❌ **Failed**: ${failedCount}\n`;
      }
      if (skippedTests > 0) {
        markdown += `- ⏭️ **Skipped**: ${skippedTests}\n`;
      }
      markdown += '\n';
    }
    
    // Workflow breakdown for unified summaries
    if (this.options.unifiedSummary) {
      markdown += this.generateWorkflowBreakdown();
    }
    
    // Shard breakdown
    markdown += this.generateShardBreakdown();
    
    // Failed tests details
    if (failedCount > 0) {
      markdown += this.generateFailedTestsSection();
    }
    
    return markdown;
  }

  /**
   * Generate workflow breakdown for unified summaries
   */
  private generateWorkflowBreakdown(): string {
    const workflowGroups = this.groupResultsByWorkflow();
    
    if (Object.keys(workflowGroups).length <= 1) {
      return ''; // No need for workflow breakdown if only one workflow
    }
    
    let markdown = '### 🔀 Results by Workflow\n\n';
    markdown += '| Workflow | Passed | Failed | Skipped | Status |\n';
    markdown += '|----------|--------|--------|---------|--------|\n';
    
    for (const [workflowName, results] of Object.entries(workflowGroups)) {
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const status = failed > 0 ? '❌' : '✅';
      
      markdown += `| ${workflowName} | ${passed} | ${failed} | ${skipped} | ${status} |\n`;
    }
    
    markdown += '\n';
    return markdown;
  }

  /**
   * Generate shard breakdown
   */
  private generateShardBreakdown(): string {
    const { shards } = this.summary;
    
    if (Object.keys(shards).length <= 1) {
      return ''; // No shard breakdown if no shards or only one
    }
    
    let markdown = '### 🔀 Results by Shard/Job\n\n';
    markdown += '| Shard | Runner | Passed | Failed | Skipped | Status |\n';
    markdown += '|-------|--------|--------|--------|---------|--------|\n';
    
    for (const [shardName, shardData] of Object.entries(shards)) {
      const status = shardData.failed > 0 ? '❌' : '✅';
      markdown += `| ${shardName} | ${shardData.runner} | ${shardData.passed} | ${shardData.failed} | ${shardData.skipped} | ${status} |\n`;
    }
    
    markdown += '\n';
    return markdown;
  }

  /**
   * Generate failed tests section
   */
  private generateFailedTestsSection(): string {
    const failedTests = this.summary.results.filter(r => r.status === 'failed');
    
    if (failedTests.length === 0) {
      return '';
    }
    
    let markdown = '### ❌ Failed Tests\n\n';
    
    // Group failed tests by file
    const fileGroups = this.groupResultsByFile(failedTests);
    
    for (const [file, tests] of Object.entries(fileGroups)) {
      markdown += `#### 📄 \`${file}\`\n`;
      
      for (const test of tests) {
        const shardInfo = test.shard ? ` [Shard: ${test.shard}]` : '';
        const workflowInfo = this.options.unifiedSummary && test.artifactName 
          ? ` [${this.getWorkflowNameFromArtifact(test.artifactName)}]` 
          : '';
        
        markdown += `- **${test.name}** (${test.suiteName || 'Unknown'})${shardInfo}${workflowInfo}\n`;
        
        if (test.error) {
          // Truncate long error messages
          const errorMessage = test.error.length > 200 
            ? `${test.error.substring(0, 200)}...` 
            : test.error;
          markdown += `  \`\`\`\n  ${errorMessage}\n  \`\`\`\n`;
        }
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(): any {
    return {
      summary: {
        totalTests: this.summary.totalTests,
        passedTests: this.summary.passedTests,
        failedTests: this.summary.failedTests,
        skippedTests: this.summary.skippedTests,
        duration: this.summary.duration,
      },
      shards: this.summary.shards,
      workflows: this.options.unifiedSummary ? this.groupResultsByWorkflow() : undefined,
      failedTests: this.summary.results.filter(r => r.status === 'failed'),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Group results by workflow
   */
  private groupResultsByWorkflow(): Record<string, TestResult[]> {
    const groups: Record<string, TestResult[]> = {};
    
    for (const result of this.summary.results) {
      const workflowName = this.getWorkflowNameFromArtifact(result.artifactName || 'Unknown');
      
      if (!groups[workflowName]) {
        groups[workflowName] = [];
      }
      
      groups[workflowName].push(result);
    }
    
    return groups;
  }

  /**
   * Group results by file
   */
  private groupResultsByFile(results: TestResult[]): Record<string, TestResult[]> {
    const groups: Record<string, TestResult[]> = {};
    
    for (const result of results) {
      if (!groups[result.file]) {
        groups[result.file] = [];
      }
      
      groups[result.file].push(result);
    }
    
    return groups;
  }

  /**
   * Extract workflow name from artifact name
   */
  private getWorkflowNameFromArtifact(artifactName: string): string {
    if (artifactName.includes('unit') || artifactName.includes('integration')) {
      return 'Service Tests';
    } else if (artifactName.includes('portal')) {
      return 'Portal Tests';
    } else if (artifactName.includes('e2e')) {
      return 'E2E Tests';
    } else if (artifactName.includes('mock')) {
      return 'Mock Service Tests';
    }
    
    return 'Unknown';
  }

  /**
   * Legacy method for backward compatibility
   */
  static generateMarkdownSummary(summary: TestSummary, includePassing: boolean = false): string {
    const generator = new ReportGenerator(summary, { includePassing });
    return generator.generateMarkdownReport();
  }
}
    if (Object.keys(shards).length > 1) {
      markdown += '### 🔀 Results by Shard/Job\n\n';
      markdown += '| Shard | Runner | Passed | Failed | Skipped | Status |\n';
      markdown += '|-------|--------|--------|--------|---------|--------|\n';
      
      for (const [shardName, shardData] of Object.entries(shards)) {
        const shardTotal = shardData.passed + shardData.failed + shardData.skipped;
        const shardSuccess = shardData.failed === 0 ? '✅' : '❌';
        
        markdown += `| ${shardName} | ${shardData.runner} | ${shardData.passed} | ${shardData.failed} | ${shardData.skipped} | ${shardSuccess} |\n`;
      }
      markdown += '\n';
    }
    
    // Failed tests details
    const failedTestResults = summary.results.filter(r => r.status === 'failed');
    if (failedTestResults.length > 0) {
      markdown += '### ❌ Failed Tests\n\n';
      
      const groupedByFile = this.groupTestsByFile(failedTestResults);
      
      for (const [file, tests] of Object.entries(groupedByFile)) {
        markdown += `#### 📄 \`${this.getRelativePath(file)}\`\n\n`;
        
        for (const test of tests) {
          const suiteName = test.suiteName ? ` (${test.suiteName})` : '';
          const shardInfo = test.shard ? ` [Shard: ${test.shard}]` : '';
          const retryInfo = test.retries && test.retries > 0 ? ` [Retries: ${test.retries}]` : '';
          
          markdown += `- **${test.name}**${suiteName}${shardInfo}${retryInfo}\n`;
          
          if (test.error) {
            // Truncate long error messages
            const errorLines = test.error.split('\n');
            const truncatedError = errorLines.slice(0, 5).join('\n');
            const hasMore = errorLines.length > 5;
            
            markdown += '  ```\n';
            markdown += `  ${truncatedError}\n`;
            if (hasMore) {
              markdown += `  ... (${errorLines.length - 5} more lines)\n`;
            }
            markdown += '  ```\n';
          }
          markdown += '\n';
        }
      }
    }
    
    // Passed tests (if requested)
    if (includePassing && passedTests > 0) {
      const passedTestsList = summary.results.filter(r => r.status === 'passed');
      markdown += '### ✅ Passed Tests\n\n';
      
      const groupedByRunner = this.groupTestsByRunner(passedTestsList);
      
      for (const [runner, tests] of Object.entries(groupedByRunner)) {
        markdown += `#### ${runner.toUpperCase()} (${tests.length} tests)\n\n`;
        markdown += '<details>\n<summary>View passed tests</summary>\n\n';
        
        const groupedByFile = this.groupTestsByFile(tests);
        for (const [file, fileTests] of Object.entries(groupedByFile)) {
          markdown += `**\`${this.getRelativePath(file)}\`**: ${fileTests.length} tests\n`;
        }
        
        markdown += '\n</details>\n\n';
      }
    }
    
    // Add metadata
    markdown += '---\n';
    markdown += `<sub>Generated by Test Aggregator • Total duration: ${this.formatDuration(summary.duration)}</sub>\n`;
    
    return markdown;
  }
  
  /**
   * Generate a compact status for GitHub checks
   */
  static generateStatusMessage(summary: TestSummary): string {
    const { totalTests, passedTests, failedTests: failedCount } = summary;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    if (failedCount === 0) {
      return `✅ All ${totalTests} tests passed (${successRate}%)`;
    } else {
      return `❌ ${failedCount} of ${totalTests} tests failed (${successRate}% passed)`;
    }
  }
  
  /**
   * Group tests by file
   */
  private static groupTestsByFile(tests: TestResult[]): Record<string, TestResult[]> {
    return tests.reduce((acc, test) => {
      if (!acc[test.file]) {
        acc[test.file] = [];
      }
      acc[test.file].push(test);
      return acc;
    }, {} as Record<string, TestResult[]>);
  }
  
  /**
   * Group tests by runner
   */
  private static groupTestsByRunner(tests: TestResult[]): Record<string, TestResult[]> {
    return tests.reduce((acc, test) => {
      if (!acc[test.runner]) {
        acc[test.runner] = [];
      }
      acc[test.runner].push(test);
      return acc;
    }, {} as Record<string, TestResult[]>);
  }
  
  /**
   * Get relative path for cleaner display
   */
  private static getRelativePath(filePath: string): string {
    // Remove common prefixes to make paths more readable
    return filePath
      .replace(/^.*\/node_modules\//, 'node_modules/')
      .replace(/^.*\/services\//, 'services/')
      .replace(/^.*\/interfaces\//, 'interfaces/')
      .replace(/^.*\/e2e\//, 'e2e/')
      .replace(/^.*\/dist\//, 'dist/')
      .replace(/^.*\/src\//, 'src/');
  }
  
  /**
   * Format duration in a human-readable way
   */
  private static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}