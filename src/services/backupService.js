import { reactive, computed } from 'vue';
import CryptoJS from 'crypto-js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useSettingsStore } from '@/stores/settings';
import { useUserProfileStore } from '@/stores/userProfile';
import { useUserPreferencesStore } from '@/stores/userPreferences';

/**
 * 数据备份服务
 * 提供完整的数据备份、恢复和导出功能
 */
class BackupService {
  constructor () {
    this.settingsStore = useSettingsStore();
    this.userProfileStore = useUserProfileStore();
    this.userPreferencesStore = useUserPreferencesStore();

    this.backupStatus = reactive({
      isBackingUp: false,
      isRestoring: false,
      progress: 0,
      message: '',
      lastBackupTime: null,
      backupHistory: []
    });

    this.encryptionKey = computed(() =>
      this.settingsStore.apiKeys.backup?.key || 'default-backup-key'
    );
  }

  /**
   * 创建完整数据备份
   */
  async createFullBackup (options = {}) {
    const {
      includeSettings = true,
      includeProfile = true,
      includePreferences = true,
      includeApiKeys = true,
      includeCalendar = true,
      encrypt = true,
      compression = true
    } = options;

    try {
      this.backupStatus.isBackingUp = true;
      this.backupStatus.progress = 0;
      this.backupStatus.message = '正在收集数据...';

      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        metadata: {
          appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          backupType: 'full'
        },
        data: {}
      };

      // 收集设置数据
      if (includeSettings) {
        this.backupStatus.message = '正在备份设置...';
        this.backupStatus.progress = 10;
        backupData.data.settings = this.settingsStore.exportSettings();
      }

      // 收集用户资料
      if (includeProfile) {
        this.backupStatus.message = '正在备份用户资料...';
        this.backupStatus.progress = 30;
        backupData.data.profile = this.userProfileStore.exportProfile();
      }

      // 收集用户偏好
      if (includePreferences) {
        this.backupStatus.message = '正在备份用户偏好...';
        this.backupStatus.progress = 50;
        backupData.data.preferences = this.userPreferencesStore.exportPreferences();
      }

      // 收集API密钥（需要特殊处理）
      if (includeApiKeys) {
        this.backupStatus.message = '正在备份API密钥...';
        this.backupStatus.progress = 70;
        backupData.data.apiKeys = this._secureExportApiKeys();
      }

      // 收集日历数据
      if (includeCalendar) {
        this.backupStatus.message = '正在备份日历数据...';
        this.backupStatus.progress = 85;
        backupData.data.calendar = await this._exportCalendarData();
      }

      this.backupStatus.message = '正在处理数据...';
      this.backupStatus.progress = 90;

      let finalData = backupData;

      // 加密数据
      if (encrypt) {
        finalData = await this._encryptData(backupData);
      }

      // 压缩数据
      if (compression) {
        finalData = await this._compressData(finalData);
      }

      this.backupStatus.message = '备份完成';
      this.backupStatus.progress = 100;
      this.backupStatus.lastBackupTime = new Date();

      // 添加到备份历史
      this._addToBackupHistory({
        timestamp: backupData.timestamp,
        size: JSON.stringify(finalData).length,
        type: 'full',
        encrypted: encrypt,
        compressed: compression
      });

      return {
        success: true,
        data: finalData,
        filename: `smart-calendar-backup-${new Date().toISOString().split('T')[0]}.json`,
        size: JSON.stringify(finalData).length
      };
    } catch (error) {
      console.error('备份失败:', error);
      this.backupStatus.message = `备份失败: ${error.message}`;
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.backupStatus.isBackingUp = false;
    }
  }

  /**
   * 从备份文件恢复数据
   */
  // eslint-disable-next-line complexity
  async restoreFromBackup (file, options = {}) {
    const {
      includeSettings = true,
      includeProfile = true,
      includePreferences = true,
      includeApiKeys = true,
      includeCalendar = true,
      overwriteExisting = true
    } = options;

    try {
      this.backupStatus.isRestoring = true;
      this.backupStatus.progress = 0;
      this.backupStatus.message = '正在读取备份文件...';

      const fileContent = await this._readBackupFile(file);
      let backupData = fileContent;

      // 如果是压缩文件，先解压
      if (backupData.compressed) {
        this.backupStatus.message = '正在解压数据...';
        this.backupStatus.progress = 20;
        backupData = await this._decompressData(backupData);
      }

      // 如果加密了，先解密
      if (backupData.encrypted) {
        this.backupStatus.message = '正在解密数据...';
        this.backupStatus.progress = 40;
        backupData = await this._decryptData(backupData);
      }

      // 验证备份文件格式
      if (!this._validateBackupData(backupData)) {
        throw new Error('无效的备份文件格式');
      }

      this.backupStatus.message = '正在恢复数据...';
      this.backupStatus.progress = 60;

      // 恢复设置
      if (includeSettings && backupData.data.settings) {
        await this.settingsStore.importSettings(backupData.data.settings, overwriteExisting);
      }

      // 恢复用户资料
      if (includeProfile && backupData.data.profile) {
        await this.userProfileStore.importProfile(backupData.data.profile, overwriteExisting);
      }

      // 恢复用户偏好
      if (includePreferences && backupData.data.preferences) {
        await this.userPreferencesStore.importPreferences(backupData.data.preferences, overwriteExisting);
      }

      // 恢复API密钥
      if (includeApiKeys && backupData.data.apiKeys) {
        await this._secureImportApiKeys(backupData.data.apiKeys, overwriteExisting);
      }

      // 恢复日历数据
      if (includeCalendar && backupData.data.calendar) {
        await this._importCalendarData(backupData.data.calendar, overwriteExisting);
      }

      this.backupStatus.message = '恢复完成';
      this.backupStatus.progress = 100;

      return {
        success: true,
        restoredItems: {
          settings: includeSettings && !!backupData.data.settings,
          profile: includeProfile && !!backupData.data.profile,
          preferences: includePreferences && !!backupData.data.preferences,
          apiKeys: includeApiKeys && !!backupData.data.apiKeys,
          calendar: includeCalendar && !!backupData.data.calendar
        }
      };
    } catch (error) {
      console.error('恢复失败:', error);
      this.backupStatus.message = `恢复失败: ${error.message}`;
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.backupStatus.isRestoring = false;
    }
  }

  /**
   * 导出数据到文件
   */
  async exportToFile (data, filename) {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      saveAs(blob, filename);
      return { success: true };
    } catch (error) {
      console.error('导出失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 自动备份
   */
  async autoBackup () {
    const lastBackup = this.backupStatus.lastBackupTime;
    const now = new Date();

    // 检查是否需要自动备份（每天一次）
    if (lastBackup && (now - lastBackup) < 24 * 60 * 60 * 1000) {
      return { success: true, skipped: true, reason: '距离上次备份时间太短' };
    }

    try {
      const result = await this.createFullBackup({
        encrypt: true,
        compression: true
      });

      if (result.success) {
        // 保存到本地存储
        localStorage.setItem('lastAutoBackup', JSON.stringify({
          timestamp: now.toISOString(),
          size: result.size
        }));
      }

      return result;
    } catch (error) {
      console.error('自动备份失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取备份历史
   */
  getBackupHistory () {
    return [...this.backupStatus.backupHistory];
  }

  /**
   * 清理旧备份
   */
  async cleanupOldBackups (daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.backupStatus.backupHistory = this.backupStatus.backupHistory.filter(
      backup => new Date(backup.timestamp) > cutoffDate
    );

    return {
      success: true,
      remainingBackups: this.backupStatus.backupHistory.length
    };
  }

  /**
   * 加密数据
   */
  async _encryptData (data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey.value).toString();

      return {
        encrypted: true,
        algorithm: 'AES-256-GCM',
        data: encrypted,
        originalSize: jsonString.length
      };
    } catch (error) {
      throw new Error(`加密失败: ${error.message}`);
    }
  }

  /**
   * 解密数据
   */
  async _decryptData (encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.encryptionKey.value);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`解密失败: ${error.message}`);
    }
  }

  /**
   * 压缩数据
   */
  async _compressData (data) {
    try {
      const zip = new JSZip();
      zip.file('backup.json', JSON.stringify(data));

      const compressed = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      return {
        compressed: true,
        algorithm: 'DEFLATE',
        data: compressed,
        originalSize: JSON.stringify(data).length
      };
    } catch (error) {
      throw new Error(`压缩失败: ${error.message}`);
    }
  }

  /**
   * 解压数据
   */
  async _decompressData (compressedData) {
    try {
      const zip = await JSZip.loadAsync(compressedData.data, { base64: true });
      const content = await zip.file('backup.json').async('string');

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`解压失败: ${error.message}`);
    }
  }

  /**
   * 安全导出API密钥
   */
  _secureExportApiKeys () {
    const apiKeys = this.settingsStore.getAllApiKeys();

    // 对密钥进行额外加密
    const encryptedKeys = {};
    Object.keys(apiKeys).forEach(platform => {
      if (apiKeys[platform]) {
        encryptedKeys[platform] = CryptoJS.AES.encrypt(
          apiKeys[platform],
          this.encryptionKey.value + '-api-keys'
        ).toString();
      }
    });

    return encryptedKeys;
  }

  /**
   * 安全导入API密钥
   */
  async _secureImportApiKeys (encryptedKeys, overwriteExisting) {
    const decryptedKeys = {};

    Object.keys(encryptedKeys).forEach(platform => {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          encryptedKeys[platform],
          this.encryptionKey.value + '-api-keys'
        );
        decryptedKeys[platform] = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.warn(`无法解密 ${platform} 的API密钥`);
      }
    });

    if (overwriteExisting || Object.keys(decryptedKeys).length > 0) {
      await this.settingsStore.importApiKeys(decryptedKeys, overwriteExisting);
    }
  }

  /**
   * 导出日历数据
   */
  async _exportCalendarData () {
    // 这里需要从实际的日历服务中获取数据
    // 暂时返回模拟数据
    return {
      events: JSON.parse(localStorage.getItem('calendarEvents') || '[]'),
      categories: JSON.parse(localStorage.getItem('calendarCategories') || '[]'),
      reminders: JSON.parse(localStorage.getItem('calendarReminders') || '[]')
    };
  }

  /**
   * 导入日历数据
   */
  async _importCalendarData (calendarData, overwriteExisting) {
    if (calendarData.events) {
      const storageKey = overwriteExisting ? 'calendarEvents' : 'calendarEvents_backup';
      localStorage.setItem(storageKey, JSON.stringify(calendarData.events));
    }

    if (calendarData.categories) {
      const storageKey = overwriteExisting ? 'calendarCategories' : 'calendarCategories_backup';
      localStorage.setItem(storageKey, JSON.stringify(calendarData.categories));
    }

    if (calendarData.reminders) {
      const storageKey = overwriteExisting ? 'calendarReminders' : 'calendarReminders_backup';
      localStorage.setItem(storageKey, JSON.stringify(calendarData.reminders));
    }
  }

  /**
   * 读取备份文件
   */
  async _readBackupFile (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('无效的备份文件格式'));
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * 验证备份数据
   */
  _validateBackupData (data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.version || !data.timestamp || !data.metadata) {
      return false;
    }

    if (!data.data || typeof data.data !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * 添加到备份历史
   */
  _addToBackupHistory (backupInfo) {
    this.backupStatus.backupHistory.unshift({
      ...backupInfo,
      id: Date.now().toString()
    });

    // 限制历史记录数量
    if (this.backupStatus.backupHistory.length > 50) {
      this.backupStatus.backupHistory = this.backupStatus.backupHistory.slice(0, 50);
    }
  }

  /**
   * 获取备份统计信息
   */
  getBackupStats () {
    const history = this.backupStatus.backupHistory;

    return {
      totalBackups: history.length,
      lastBackupTime: this.backupStatus.lastBackupTime,
      averageSize: history.length > 0
        ? history.reduce((sum, backup) => sum + backup.size, 0) / history.length
        : 0,
      encryptedCount: history.filter(b => b.encrypted).length,
      compressedCount: history.filter(b => b.compressed).length
    };
  }
}

// 创建单例实例
export const backupService = new BackupService();
export default backupService;
