export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  file: string;
  suiteName?: string;
  duration?: number;
  error?: string;
  retries?: number;
  shard?: string;
  runner: 'jest' | 'playwright' | 'karma';
  workflowRun?: number;
  artifactName?: string;
}

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: TestResult[];
  shards: Record<string, {
    passed: number;
    failed: number;
    skipped: number;
    runner: string;
  }>;
}

export interface JestTestResult {
  testResults: Array<{
    name: string;
    status: string;
    startTime: number;
    endTime: number;
    assertionResults: Array<{
      ancestorTitles: string[];
      title: string;
      status: string;
      duration?: number;
      failureMessages?: string[];
      location?: any;
    }>;
  }>;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numTodoTests: number;
  success: boolean;
}

export interface PlaywrightTestResult {
  config: any;
  suites: Array<{
    title: string;
    file: string;
    specs: Array<{
      title: string;
      ok: boolean;
      tests: Array<{
        timeout: number;
        annotations: any[];
        expectedStatus: string;
        projectId: string;
        projectName: string;
        results: Array<{
          workerIndex: number;
          status: string;
          duration: number;
          error?: any;
          retry: number;
          startTime: string;
          steps: any[];
        }>;
        status: string;
        title: string;
      }>;
    }>;
  }>;
  errors: any[];
  stats: {
    startTime: string;
    duration: number;
    passed: number;
    failed: number;
    flaky: number;
    skipped: number;
    interrupted: number;
  };
}

export interface KarmaTestResult {
  summary: {
    success: number;
    failed: number;
    error: number;
    disconnected: number;
    exitCode: number;
  };
  browsers: Record<string, {
    name: string;
    fullName: string;
    state: string;
    lastResult: {
      success: number;
      failed: number;
      skipped: number;
      total: number;
      totalTime: number;
      netTime: number;
      error: boolean;
      disconnected: boolean;
    };
  }>;
}