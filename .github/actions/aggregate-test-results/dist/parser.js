"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResultParser = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TestResultParser {
    /**
     * Parse Jest JSON output file
     */
    static parseJestResults(filePath, shard) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const jestResult = JSON.parse(content);
            const results = [];
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
        }
        catch (error) {
            console.warn(`Failed to parse Jest results from ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Parse Playwright JSON output file
     */
    static parsePlaywrightResults(filePath, shard) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const pwResult = JSON.parse(content);
            const results = [];
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
        }
        catch (error) {
            console.warn(`Failed to parse Playwright results from ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Parse Karma JSON output file
     */
    static parseKarmaResults(filePath, shard) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const karmaResult = JSON.parse(content);
            const results = [];
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
        }
        catch (error) {
            console.warn(`Failed to parse Karma results from ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Auto-detect test result file format and parse accordingly
     */
    static parseTestResultFile(filePath, shard) {
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
        }
        catch (error) {
            console.warn(`Failed to parse test result file ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Parse all test result files in a directory
     */
    static parseDirectory(dirPath, shard) {
        const results = [];
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
            }
            else if (file.endsWith('.json') &&
                (file.includes('test') || file.includes('result'))) {
                results.push(...this.parseTestResultFile(fullPath, shard));
            }
        }
        return results;
    }
    /**
     * Aggregate test results into a summary
     */
    static aggregateResults(allResults) {
        const summary = {
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
exports.TestResultParser = TestResultParser;
//# sourceMappingURL=parser.js.map