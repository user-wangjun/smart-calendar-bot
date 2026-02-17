import { jest } from '@jest/globals';
import { BrowserLocationService, BrowserLocationErrorType } from '../src/services/browserLocationService.js';

describe('BrowserLocationService', () => {
  let service;
  let mockGetCurrentPosition;

  beforeEach(() => {
    // Reset singleton if possible, or just create a new instance for testing
    // Since the module exports a singleton instance as default, we might need to rely on the class export
    service = new BrowserLocationService();

    // Mock navigator.geolocation
    mockGetCurrentPosition = jest.fn();
    global.navigator = {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition
      },
      permissions: {
        query: jest.fn()
      }
    };

    // Mock console to suppress logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getCurrentPosition should resolve on success', async () => {
    const mockPosition = {
      coords: {
        latitude: 10,
        longitude: 20,
        accuracy: 100
      },
      timestamp: 123456789
    };

    mockGetCurrentPosition.mockImplementation((success, error, options) => {
      success(mockPosition);
    });

    const result = await service.getCurrentPosition();
    expect(result.success).toBe(true);
    expect(result.data.latitude).toBe(10);
  });

  test('getCurrentPosition should reject on timeout and log warning', async () => {
    mockGetCurrentPosition.mockImplementation((success, error, options) => {
      error({
        code: 3, // TIMEOUT
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      });
    });

    await expect(service.getCurrentPosition()).rejects.toMatchObject({
      type: BrowserLocationErrorType.TIMEOUT
    });

    expect(console.warn).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled(); // Should not log error for timeout
  });

  test('getCurrentPositionWithRetry should succeed on first try if high accuracy works', async () => {
    const mockPosition = {
      coords: { latitude: 10, longitude: 20 },
      timestamp: Date.now()
    };

    mockGetCurrentPosition.mockImplementation((success, error, options) => {
      if (options.enableHighAccuracy) {
        success(mockPosition);
      } else {
        error({ code: 1, message: 'Should not reach here' });
      }
    });

    const result = await service.getCurrentPositionWithRetry();
    expect(result.success).toBe(true);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentPosition.mock.calls[0][2].enableHighAccuracy).toBe(true);
  });

  test('getCurrentPositionWithRetry should retry with low accuracy on timeout', async () => {
    const mockPositionLowAcc = {
      coords: { latitude: 11, longitude: 21 },
      timestamp: Date.now()
    };

    mockGetCurrentPosition.mockImplementation((success, error, options) => {
      if (options.enableHighAccuracy) {
        // Fail first High Accuracy request with Timeout
        error({
          code: 3,
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        });
      } else {
        // Succeed second Low Accuracy request
        success(mockPositionLowAcc);
      }
    });

    const result = await service.getCurrentPositionWithRetry();

    expect(result.success).toBe(true);
    expect(result.data.latitude).toBe(11);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);

    // First call: High Accuracy
    expect(mockGetCurrentPosition.mock.calls[0][2].enableHighAccuracy).toBe(true);
    // Second call: Low Accuracy
    expect(mockGetCurrentPosition.mock.calls[1][2].enableHighAccuracy).toBe(false);

    expect(console.warn).toHaveBeenCalled(); // Should warn about retry
  });
});
