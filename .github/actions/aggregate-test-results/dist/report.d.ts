import { TestSummary } from './types';
export declare class ReportGenerator {
    /**
     * Generate a markdown summary of test results
     */
    static generateMarkdownSummary(summary: TestSummary, includePassing?: boolean): string;
    /**
     * Generate a compact status for GitHub checks
     */
    static generateStatusMessage(summary: TestSummary): string;
    /**
     * Group tests by file
     */
    private static groupTestsByFile;
    /**
     * Group tests by runner
     */
    private static groupTestsByRunner;
    /**
     * Get relative path for cleaner display
     */
    private static getRelativePath;
    /**
     * Format duration in a human-readable way
     */
    private static formatDuration;
}
//# sourceMappingURL=report.d.ts.map