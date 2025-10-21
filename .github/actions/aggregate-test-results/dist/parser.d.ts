import { TestResult, TestSummary } from './types';
export declare class TestResultParser {
    /**
     * Parse Jest JSON output file
     */
    static parseJestResults(filePath: string, shard?: string): TestResult[];
    /**
     * Parse Playwright JSON output file
     */
    static parsePlaywrightResults(filePath: string, shard?: string): TestResult[];
    /**
     * Parse Karma JSON output file
     */
    static parseKarmaResults(filePath: string, shard?: string): TestResult[];
    /**
     * Auto-detect test result file format and parse accordingly
     */
    static parseTestResultFile(filePath: string, shard?: string): TestResult[];
    /**
     * Parse all test result files in a directory
     */
    static parseDirectory(dirPath: string, shard?: string): TestResult[];
    /**
     * Aggregate test results into a summary
     */
    static aggregateResults(allResults: TestResult[]): TestSummary;
}
//# sourceMappingURL=parser.d.ts.map