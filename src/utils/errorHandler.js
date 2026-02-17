/**
 * 错误处理模块
 * 负责识别、分类和处理OpenRouter API调用中的各种错误
 */

/**
 * 错误类型枚举
 */
const ErrorType = {
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED', // 认证失败（401）
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED', // 速率限制（429）
  INVALID_REQUEST: 'INVALID_REQUEST', // 请求无效（4xx）
  NETWORK_ERROR: 'NETWORK_ERROR', // 网络错误
  TIMEOUT: 'TIMEOUT', // 超时错误
  SERVER_ERROR: 'SERVER_ERROR', // 服务器错误（5xx）
  UNKNOWN_ERROR: 'UNKNOWN_ERROR' // 未知错误
};

/**
 * 错误处理器类
 */
class ErrorHandler {
  constructor () {
    this.errorLogs = [];
    this.maxLogSize = 100;
  }

  /**
   * 识别错误类型
   * 根据错误对象判断错误类型
   * @param {Error} error - 错误对象
   * @returns {string} 错误类型
   */
  identifyError (error) {
    // 检查HTTP响应错误
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        return ErrorType.AUTHENTICATION_FAILED;
      } else if (status === 429) {
        return ErrorType.RATE_LIMIT_EXCEEDED;
      } else if (status >= 400 && status < 500) {
        return ErrorType.INVALID_REQUEST;
      } else if (status >= 500) {
        return ErrorType.SERVER_ERROR;
      }
    }

    // 检查网络错误
    if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      return ErrorType.TIMEOUT;
    } else if (error.code === 'ERR_NETWORK' ||
               error.code === 'ENOTFOUND' ||
               error.code === 'ECONNREFUSED') {
      return ErrorType.NETWORK_ERROR;
    }

    // 默认为未知错误
    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * 处理错误
   * 将原始错误转换为格式化的错误对象
   * @param {Error} error - 原始错误
   * @returns {Object} 格式化的错误对象
   */
  handleError (error) {
    const errorType = this.identifyError(error);
    const errorInfo = this.getErrorInfo(errorType);

    // 获取详细的错误信息
    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    // 构建更详细的错误消息
    let detailedMessage = errorInfo.message;
    let detailedUserMessage = errorInfo.userMessage;

    if (statusCode) {
      detailedMessage = `${errorInfo.message} (HTTP ${statusCode})`;

      // 根据状态码提供更具体的用户提示
      if (statusCode === 401) {
        detailedUserMessage = 'API密钥无效或已过期，请检查您的API密钥是否正确';
      } else if (statusCode === 403) {
        detailedUserMessage = '没有权限访问该API，请检查您的账户状态或API密钥权限';
      } else if (statusCode === 404) {
        detailedUserMessage = '请求的模型不存在或已下线，请尝试选择其他模型';
      } else if (statusCode === 400) {
        // 尝试获取服务器返回的具体错误信息
        if (errorData?.error?.message) {
          detailedUserMessage = `请求格式错误: ${errorData.error.message}`;
        } else if (typeof errorData === 'string') {
          detailedUserMessage = `请求格式错误: ${errorData}`;
        }
      }
    }

    // 记录错误日志
    this.logError(error, { ...errorInfo, message: detailedMessage });

    // 返回格式化的错误对象
    return {
      type: errorType,
      message: detailedMessage,
      userMessage: detailedUserMessage,
      shouldRetry: errorInfo.shouldRetry,
      retryDelay: this.calculateRetryDelay(error, errorType),
      originalError: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: statusCode,
        data: errorData
      }
    };
  }

  /**
   * 获取错误信息
   * 根据错误类型返回对应的错误信息
   * @param {string} errorType - 错误类型
   * @returns {Object} 错误信息
   */
  getErrorInfo (errorType) {
    const errorMap = {
      [ErrorType.AUTHENTICATION_FAILED]: {
        message: 'API密钥无效或已过期',
        userMessage: '认证失败，请检查API密钥配置',
        shouldRetry: false
      },
      [ErrorType.RATE_LIMIT_EXCEEDED]: {
        message: '请求频率超限',
        userMessage: '请求过于频繁，请稍后重试',
        shouldRetry: true
      },
      [ErrorType.INVALID_REQUEST]: {
        message: '请求参数无效',
        userMessage: '请求格式错误，请检查输入内容',
        shouldRetry: false
      },
      [ErrorType.NETWORK_ERROR]: {
        message: '网络连接失败',
        userMessage: '网络连接异常，请检查网络设置',
        shouldRetry: true
      },
      [ErrorType.TIMEOUT]: {
        message: '请求超时',
        userMessage: '请求超时，请稍后重试',
        shouldRetry: true
      },
      [ErrorType.SERVER_ERROR]: {
        message: '服务器错误',
        userMessage: '服务器暂时不可用，请稍后重试',
        shouldRetry: true
      },
      [ErrorType.UNKNOWN_ERROR]: {
        message: '未知错误',
        userMessage: '发生未知错误，请联系技术支持',
        shouldRetry: false
      }
    };

    return errorMap[errorType] || errorMap[ErrorType.UNKNOWN_ERROR];
  }

  /**
   * 计算重试延迟
   * 根据错误类型和重试次数计算延迟时间
   * @param {Error} error - 错误对象
   * @param {string} errorType - 错误类型
   * @returns {number} 延迟时间（毫秒）
   */
  calculateRetryDelay (error, errorType) {
    // 速率限制错误：从响应头获取重试时间
    if (errorType === ErrorType.RATE_LIMIT_EXCEEDED) {
      const retryAfter = error.response?.headers?.['retry-after'];
      if (retryAfter) {
        return parseInt(retryAfter) * 1000;
      }
      return 60000; // 默认60秒
    }

    // 网络错误：2秒
    if (errorType === ErrorType.NETWORK_ERROR) {
      return 2000;
    }

    // 超时错误：3秒
    if (errorType === ErrorType.TIMEOUT) {
      return 3000;
    }

    // 服务器错误：5秒
    if (errorType === ErrorType.SERVER_ERROR) {
      return 5000;
    }

    // 其他错误：不重试
    return 0;
  }

  /**
   * 记录错误日志
   * 将错误信息保存到内存中
   * @param {Error} error - 原始错误
   * @param {Object} errorInfo - 错误信息
   */
  logError (error, errorInfo) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: errorInfo.type,
      message: errorInfo.message,
      originalError: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.response?.status
      }
    };

    // 输出到控制台
    console.error('[ErrorHandler]', logEntry);

    // 添加到日志数组
    this.errorLogs.push(logEntry);

    // 限制日志大小
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs.shift();
    }
  }

  /**
   * 获取错误日志
   * @param {number} limit - 返回的日志数量
   * @returns {Array} 错误日志数组
   */
  getErrorLogs (limit = 10) {
    return this.errorLogs.slice(-limit);
  }

  /**
   * 清空错误日志
   */
  clearErrorLogs () {
    this.errorLogs = [];
  }

  /**
   * 导出错误日志
   * @returns {string} JSON格式的错误日志
   */
  exportErrorLogs () {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

/**
 * 重试策略类
 * 实现智能重试机制，包括指数退避和随机抖动
 */
class RetryStrategy {
  constructor (options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retryableErrors = options.retryableErrors || [
      ErrorType.RATE_LIMIT_EXCEEDED,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT,
      ErrorType.SERVER_ERROR
    ];
  }

  /**
   * 判断是否应该重试
   * @param {Object} error - 错误对象
   * @returns {boolean} 是否应该重试
   */
  shouldRetry (error) {
    return this.retryableErrors.includes(error.type);
  }

  /**
   * 计算重试延迟
   * 使用指数退避算法，并添加随机抖动
   * @param {number} attempt - 当前尝试次数
   * @param {Object} error - 错误对象
   * @returns {number} 延迟时间（毫秒）
   */
  calculateDelay (attempt, error) {
    // 如果错误有特定的重试延迟，使用它
    if (error.retryDelay && error.retryDelay > 0) {
      return Math.min(error.retryDelay, this.maxDelay);
    }

    // 指数退避：baseDelay * 2^attempt
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    // 添加随机抖动（避免多个客户端同时重试）
    const jitter = Math.random() * 0.3 * exponentialDelay;

    return exponentialDelay + jitter;
  }

  /**
   * 执行带重试的函数
   * @param {Function} fn - 要执行的异步函数
   * @returns {Promise} 函数执行结果
   */
  async executeWithRetry (fn) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // 执行函数
        return await fn();
      } catch (error) {
        // 处理错误
        const errorHandler = new ErrorHandler();
        lastError = errorHandler.handleError(error);

        // 检查是否应该重试
        if (!this.shouldRetry(lastError) || attempt === this.maxRetries) {
          throw lastError;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt, lastError);

        console.log(
          `请求失败，${Math.round(delay / 1000)}秒后重试 ` +
          `(${attempt + 1}/${this.maxRetries})`
        );

        // 等待延迟时间
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise} 延迟Promise
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 断路器类
 * 防止连续失败导致系统雪崩
 */
class CircuitBreaker {
  constructor (options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1分钟
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttemptTime = 0;
  }

  /**
   * 执行函数（带断路器保护）
   * @param {Function} fn - 要执行的异步函数
   * @returns {Promise} 函数执行结果
   */
  async execute (fn) {
    // 检查断路器状态
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('断路器开启，请求被拒绝');
      } else {
        // 尝试恢复
        this.state = 'HALF_OPEN';
        console.log('断路器进入半开状态，尝试恢复...');
      }
    }

    try {
      // 执行函数
      const result = await fn();

      // 成功：重置断路器
      this.onSuccess();
      return result;
    } catch (error) {
      // 失败：增加失败计数
      this.onFailure();
      throw error;
    }
  }

  /**
   * 成功时的处理
   */
  onSuccess () {
    this.failures = 0;
    this.state = 'CLOSED';
    console.log('断路器已关闭');
  }

  /**
   * 失败时的处理
   */
  onFailure () {
    this.failures++;

    console.log(`失败次数: ${this.failures}/${this.failureThreshold}`);

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      console.warn(`断路器已开启，${this.resetTimeout / 1000}秒后尝试恢复`);
    }
  }

  /**
   * 重置断路器
   */
  reset () {
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttemptTime = 0;
    console.log('断路器已重置');
  }

  /**
   * 获取断路器状态
   * @returns {Object} 状态信息
   */
  getState () {
    return {
      state: this.state,
      failures: this.failures,
      nextAttemptTime: this.nextAttemptTime
    };
  }
}

// 导出
export default ErrorHandler;
export { ErrorType, RetryStrategy, CircuitBreaker };
