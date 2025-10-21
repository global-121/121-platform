import * as fs from 'fs';
import * as path from 'path';
import { TestResult, TestSummary, JestTestResult, PlaywrightTestResult, KarmaTestResult } from './types';

export class TestResultParser {
  /**
   * Parse Jest JSON output file
   */
  static parseJestResults(filePath: string, shard?: string): TestResult[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const jestResult: JestTestResult = JSON.parse(content);
      
      const results: TestResult[] = [];
      
      for (const testFile of jestResult.testResults) {
        for (const assertion of testFile.assertionResults) {
          const suiteName = assertion.ancestorTitles.join(' > ');
          const testName = assertion.title;
          
          results.push({
            name: testName,
            status: assertion.status === 'passed' ? 'passed' : 
                   assertion.status === 'failed' ? 'failed' : 'skipped',
            file: testFile.name,
            suiteName,
            duration: assertion.duration,
            error: assertion.failureMessages?.join('\n'),
            shard,
            runner: 'jest'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.warn(`Failed to parse Jest results from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Parse Playwright JSON output file
   */
  static parsePlaywrightResults(filePath: string, shard?: string): TestResult[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const pwResult: PlaywrightTestResult = JSON.parse(content);
      
      const results: TestResult[] = [];
      
      for (const suite of pwResult.suites) {
        for (const spec of suite.specs) {
          for (const test of spec.tests) {
            const latestResult = test.results[test.results.length - 1];
            
            results.push({
              name: test.title,
              status: latestResult.status === 'passed' ? 'passed' :
                     latestResult.status === 'failed' ? 'failed' : 'skipped',
              file: suite.file,
              suiteName: suite.title,
              duration: latestResult.duration,
              error: latestResult.error?.message,
              retries: latestResult.retry,
              shard,
              runner: 'playwright'
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.warn(`Failed to parse Playwright results from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Parse Karma JSON output file
   */
  static parseKarmaResults(filePath: string, shard?: string): TestResult[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const karmaResult: KarmaTestResult = JSON.parse(content);
      
      const results: TestResult[] = [];
      
      for (const [browserId, browser] of Object.entries(karmaResult.browsers)) {
        const browserResult = browser.lastResult;
        
        // Karma doesn't provide individual test details in the summary JSON
        // We'll create aggregate entries per browser
        if (browserResult.success > 0) {
          results.push({
            name: `${browserResult.success} tests passed`,
            status: 'passed',
            file: 'karma-tests',
            suiteName: browser.fullName,
            duration: browserResult.totalTime,
            shard,
            runner: 'karma'
          });
        }
        
        if (browserResult.failed > 0) {
          results.push({
            name: `${browserResult.failed} tests failed`,
            status: 'failed',
            file: 'karma-tests',
            suiteName: browser.fullName,
            duration: browserResult.totalTime,
            shard,
            runner: 'karma'
          });
        }
        
        if (browserResult.skipped > 0) {
          results.push({
            name: `${browserResult.skipped} tests skipped`,
            status: 'skipped',
            file: 'karma-tests',
            suiteName: browser.fullName,
            duration: browserResult.totalTime,
            shard,
            runner: 'karma'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.warn(`Failed to parse Karma results from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Auto-detect test result file format and parse accordingly
   */
  static parseTestResultFile(filePath: string, shard?: string): TestResult[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Detect Jest format
      if (data.testResults && Array.isArray(data.testResults)) {
        return this.parseJestResults(filePath, shard);
      }
      
      // Detect Playwright format
      if (data.config && data.suites && Array.isArray(data.suites)) {
        return this.parsePlaywrightResults(filePath, shard);
      }
      
      // Detect Karma format
      if (data.summary && data.browsers) {
        return this.parseKarmaResults(filePath, shard);
      }
      
      console.warn(`Unknown test result format in ${filePath}`);
      return [];
    } catch (error) {
      console.warn(`Failed to parse test result file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Parse all test result files in a directory
   */
  static parseDirectory(dirPath: string, shard?: string): TestResult[] {
    const results: TestResult[] = [];
    
    if (!fs.existsSync(dirPath)) {
      return results;
    }
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively parse subdirectories
        results.push(...this.parseDirectory(fullPath, shard));
      } else if (file.endsWith('.json') && 
                 (file.includes('test') || file.includes('result'))) {
        results.push(...this.parseTestResultFile(fullPath, shard));
      }
    }
    
    return results;
  }

  /**
   * Aggregate test results into a summary
   */
  static aggregateResults(allResults: TestResult[]): TestSummary {
    const summary: TestSummary = {
      totalTests: allResults.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      results: allResults,
      shards: {}
    };
    
    for (const result of allResults) {
      switch (result.status) {
        case 'passed':
          summary.passedTests++;
          break;
        case 'failed':
          summary.failedTests++;
          break;
        case 'skipped':
          summary.skippedTests++;
          break;
      }
      
      if (result.duration) {
        summary.duration += result.duration;
      }
      
      // Aggregate by shard
      const shardKey = result.shard || 'main';
      if (!summary.shards[shardKey]) {
        summary.shards[shardKey] = {
          passed: 0,
          failed: 0,
          skipped: 0,
          runner: result.runner
        };
      }
      
      switch (result.status) {
        case 'passed':
          summary.shards[shardKey].passed++;
          break;
        case 'failed':
          summary.shards[shardKey].failed++;
          break;
        case 'skipped':
          summary.shards[shardKey].skipped++;
          break;
      }
    }
    
    return summary;
  }
}