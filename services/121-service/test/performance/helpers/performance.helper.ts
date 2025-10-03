import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

import { env } from '@121-service/src/env';

export interface PerformanceThresholds {
  httpErrorRate?: number; // Max HTTP error rate (0-1)
  maxResponseTime?: number; // Max response time in ms
  minPassRate?: number; // Minimum pass rate percentage for bulk operations
}

export interface PerformanceMetrics {
  responseTime: number;
  success: boolean;
  statusCode: number;
  errorMessage?: string;
}

export class PerformanceTestHelper {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;

  constructor(thresholds: PerformanceThresholds = {}) {
    this.thresholds = {
      httpErrorRate: 0.01, // 1% default
      maxResponseTime: 30000, // 30 seconds default
      minPassRate: 90, // 90% default
      ...thresholds,
    };
  }

  /**
   * Record performance metrics for a request
   */
  recordMetrics(
    startTime: number,
    response: request.Response,
    errorMessage?: string,
  ): PerformanceMetrics {
    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 400;

    const metric: PerformanceMetrics = {
      responseTime,
      success,
      statusCode: response.status,
      errorMessage,
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Assert that a response meets performance expectations
   */
  assertPerformance(
    response: request.Response,
    startTime: number,
    message?: string,
  ): void {
    const metric = this.recordMetrics(startTime, response);

    // Check HTTP status
    if (!metric.success) {
      throw new Error(
        `${message || 'Request failed'}: Status ${metric.statusCode}`,
      );
    }

    // Check response time if threshold is set
    if (
      this.thresholds.maxResponseTime &&
      metric.responseTime > this.thresholds.maxResponseTime
    ) {
      console.warn(
        `Response time ${metric.responseTime}ms exceeded threshold ${this.thresholds.maxResponseTime}ms`,
      );
    }
  }

  /**
   * Get overall performance statistics
   */
  getStatistics() {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter((m) => m.success).length;
    const errorRate =
      totalRequests > 0
        ? (totalRequests - successfulRequests) / totalRequests
        : 0;
    const avgResponseTime =
      totalRequests > 0
        ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) /
          totalRequests
        : 0;
    const maxResponseTime = Math.max(
      ...this.metrics.map((m) => m.responseTime),
      0,
    );
    const minResponseTime = Math.min(
      ...this.metrics.map((m) => m.responseTime),
      0,
    );

    return {
      totalRequests,
      successfulRequests,
      errorRate,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      passRate: (successfulRequests / totalRequests) * 100,
    };
  }

  /**
   * Assert overall performance thresholds
   */
  assertThresholds(): void {
    const stats = this.getStatistics();

    if (
      this.thresholds.httpErrorRate &&
      stats.errorRate > this.thresholds.httpErrorRate
    ) {
      throw new Error(
        `HTTP error rate ${(stats.errorRate * 100).toFixed(2)}% exceeded threshold ${(this.thresholds.httpErrorRate * 100).toFixed(2)}%`,
      );
    }

    if (
      this.thresholds.minPassRate &&
      stats.passRate < this.thresholds.minPassRate
    ) {
      throw new Error(
        `Pass rate ${stats.passRate.toFixed(2)}% below minimum ${this.thresholds.minPassRate}%`,
      );
    }

    console.log('Performance Statistics:', stats);
  }

  /**
   * Reset metrics for a new test
   */
  reset(): void {
    this.metrics = [];
  }
}

/**
 * Wait for a specified duration (replaces K6 sleep)
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Monitor payment progress with retries
 */
export async function monitorPaymentProgress(
  server: request.SuperTest<request.Test>,
  programId: number,
  paymentId: number,
  maxRetryDuration: number,
  minPassRatePercentage: number,
  expectedAmount: number,
  accessToken: string,
): Promise<request.Response> {
  const startTime = Date.now();
  const maxDuration = maxRetryDuration * 1000; // Convert to ms

  let lastResponse: request.Response | undefined;

  while (Date.now() - startTime < maxDuration) {
    lastResponse = await server
      .get(`/api/programs/${programId}/payments/${paymentId}`)
      .set('Cookie', [`Authorization=${accessToken}`]);

    if (lastResponse.status === HttpStatus.OK) {
      const paymentData = lastResponse.body;

      // Check if payment is completed with sufficient pass rate
      if (
        paymentData.success &&
        paymentData.passRate >= minPassRatePercentage
      ) {
        return lastResponse;
      }
    }

    // Wait before next retry
    await waitFor(5000); // 5 seconds
  }

  throw new Error(
    `Payment monitoring timed out after ${maxRetryDuration} seconds. Last status: ${lastResponse?.status || 'none'}`,
  );
}

/**
 * Create bulk mock registrations for performance testing
 */
export async function createBulkMockRegistrations(
  server: request.SuperTest<request.Test>,
  duplicateNumber: number,
  _resetIdentifier: string,
): Promise<request.Response> {
  return server
    .post('/api/scripts/duplicate-registrations')
    .query({
      mockPowerNumberRegistrations: duplicateNumber,
    })
    .send({
      secret: env.RESET_SECRET,
    });
}
