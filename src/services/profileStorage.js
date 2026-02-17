/**
 * 个人信息存储服务
 * 提供用户资料的存储、验证和管理功能
 */

import storageManager from '../storage/storageManager.js';

class ProfileStorage {
  constructor () {
    this.storageKey = 'user_profile';
    this.storageType = 'localStorage'; // 使用localStorage存储用户资料

    // 数据模型
    this.dataModel = {
      id: 'UUID',
      nickname: { type: 'string', required: true, minLength: 2, maxLength: 20 },
      avatar: { type: 'string', required: false },
      birthday: { type: 'date', required: false },
      gender: { type: 'string', required: false, enum: ['male', 'female', 'secret'] },
      email: { type: 'string', required: false, format: 'email' },
      phone: { type: 'string', required: false },
      preferences: { type: 'object', required: false },
      createdAt: { type: 'datetime', required: true },
      updatedAt: { type: 'datetime', required: true }
    };

    this.currentProfile = null;
    this.init();
  }

  /**
   * 初始化存储服务
   */
  async init () {
    console.log('初始化个人信息存储...');

    // 加载保存的用户资料
    await this.loadProfile();
  }

  /**
   * 保存用户资料
   * @param {Object} profile - 用户资料对象
   * @returns {Promise<Object>} - 保存结果
   */
  async saveProfile (profile) {
    try {
      // 验证数据
      const validation = this.validateProfile(profile);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 添加时间戳
      const now = new Date().toISOString();
      const profileToSave = {
        ...profile,
        id: profile.id || this.generateUUID(),
        createdAt: profile.createdAt || now,
        updatedAt: now
      };

      // 保存到localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(profileToSave));

      // 更新当前资料
      this.currentProfile = profileToSave;

      // 触发更新事件
      storageManager.emit('profile:updated', {
        profile: profileToSave
      });

      console.log('用户资料已保存:', profileToSave.nickname);

      return {
        success: true,
        profile: profileToSave
      };
    } catch (error) {
      console.error('保存用户资料失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户资料
   * @returns {Promise<Object|null>} - 用户资料对象
   */
  async getProfile () {
    try {
      const profileData = localStorage.getItem(this.storageKey);

      if (!profileData) {
        // 返回默认资料
        const defaultProfile = this.getDefaultProfile();
        this.currentProfile = defaultProfile;
        return defaultProfile;
      }

      const profile = JSON.parse(profileData);

      // 验证数据完整性
      const validation = this.validateProfile(profile);
      if (!validation.valid) {
        console.warn('用户资料数据验证失败:', validation.errors);
      }

      this.currentProfile = profile;
      return profile;
    } catch (error) {
      console.error('获取用户资料失败:', error);
      return null;
    }
  }

  /**
   * 更新用户资料
   * @param {Object} updates - 更新字段
   * @returns {Promise<Object>} - 更新结果
   */
  async updateProfile (updates) {
    try {
      const currentProfile = await this.getProfile();

      if (!currentProfile) {
        return {
          success: false,
          error: '用户资料不存在'
        };
      }

      // 合并更新
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        id: currentProfile.id,
        updatedAt: new Date().toISOString()
      };

      // 验证更新后的数据
      const validation = this.validateProfile(updatedProfile);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 保存更新后的资料
      localStorage.setItem(this.storageKey, JSON.stringify(updatedProfile));

      // 更新当前资料
      this.currentProfile = updatedProfile;

      // 触发更新事件
      storageManager.emit('profile:updated', {
        profile: updatedProfile,
        updates
      });

      console.log('用户资料已更新:', updatedProfile.nickname);

      return {
        success: true,
        profile: updatedProfile
      };
    } catch (error) {
      console.error('更新用户资料失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除用户资料
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async deleteProfile () {
    try {
      localStorage.removeItem(this.storageKey);
      this.currentProfile = null;

      // 触发删除事件
      storageManager.emit('profile:deleted', {});

      console.log('用户资料已删除');

      return true;
    } catch (error) {
      console.error('删除用户资料失败:', error);
      return false;
    }
  }

  /**
   * 验证用户资料
   * @param {Object} profile - 用户资料对象
   * @returns {Object>} - 验证结果
   */
  // eslint-disable-next-line complexity
  validateProfile (profile) {
    const errors = [];
    const warnings = [];

    // 验证昵称
    if (profile.nickname !== undefined && profile.nickname !== null) {
      const nickname = profile.nickname.trim();

      if (nickname.length === 0) {
        errors.push('昵称不能为空');
      } else if (nickname.length < 2) {
        errors.push('昵称至少需要2个字符');
      } else if (nickname.length > 20) {
        errors.push('昵称不能超过20个字符');
      } else {
        // 检查特殊字符
        const specialChars = /[<>{}\\|;:'"\\[\]`]/;
        if (specialChars.test(nickname)) {
          warnings.push('昵称包含特殊字符，可能影响显示');
        }
      }
    }

    // 验证生日
    if (profile.birthday) {
      const birthDate = new Date(profile.birthday);
      const today = new Date();

      // 检查是否为未来日期
      if (birthDate > today) {
        errors.push('生日不能是未来日期');
      }

      // 检查年份范围
      if (birthDate.getFullYear() < 1900) {
        errors.push('生日年份不能早于1900年');
      }

      // 检查是否过于久远
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        warnings.push('生日年份过于久远，请确认');
      }
    }

    // 验证性别
    if (profile.gender && !['male', 'female', 'secret'].includes(profile.gender)) {
      errors.push('性别必须是 male、female 或 secret');
    }

    // 验证邮箱
    if (profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        errors.push('邮箱格式不正确');
      }
    }

    // 验证手机号（中国大陆）
    if (profile.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(profile.phone)) {
        errors.push('手机号格式不正确（中国大陆）');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取默认用户资料
   * @returns {Object>} - 默认资料
   */
  getDefaultProfile () {
    return {
      id: this.generateUUID(),
      nickname: '用户昵称',
      avatar: '',
      birthday: '',
      gender: 'secret',
      email: '',
      phone: '',
      preferences: {
        theme: 'dark',
        language: 'zh-CN',
        notifications: {
          enabled: true,
          sound: true,
          popup: true
        },
        privacy: {
          shareData: false,
          allowAnalytics: true
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取用户昵称
   * @returns {string|null>} - 用户昵称
   */
  getNickname () {
    return this.currentProfile?.nickname || null;
  }

  /**
   * 获取用户头像
   * @returns {string|null>} - 用户头像URL
   */
  getAvatar () {
    return this.currentProfile?.avatar || null;
  }

  /**
   * 获取用户生日
   * @returns {string|null>} - 用户生日
   */
  getBirthday () {
    return this.currentProfile?.birthday || null;
  }

  /**
   * 获取用户年龄
   * @returns {number|null>} - 用户年龄
   */
  getAge () {
    const birthday = this.getBirthday();
    if (!birthday) return null;

    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * 检查是否已设置昵称
   * @returns {boolean>} - 是否已设置
   */
  hasNickname () {
    return !!this.currentProfile?.nickname;
  }

  /**
   * 检查是否已设置生日
   * @returns {boolean>} - 是否已设置
   */
  hasBirthday () {
    return !!this.currentProfile?.birthday;
  }

  /**
   * 获取用户偏好设置
   * @returns {Object>} - 用户偏好
   */
  getPreferences () {
    return this.currentProfile?.preferences || {};
  }

  /**
   * 更新用户偏好
   * @param {Object} preferences - 偏好设置
   * @returns {Promise<Object>} - 更新结果
   */
  async updatePreferences (preferences) {
    const currentProfile = await this.getProfile();

    if (!currentProfile) {
      return {
        success: false,
        error: '用户资料不存在'
      };
    }

    const updatedProfile = {
      ...currentProfile,
      preferences: {
        ...currentProfile.preferences,
        ...preferences
      },
      updatedAt: new Date().toISOString()
    };

    return await this.saveProfile(updatedProfile);
  }

  /**
   * 获取用户资料统计
   * @returns {Promise<Object>} - 统计信息
   */
  async getProfileStats () {
    const profile = await this.getProfile();

    const stats = {
      hasProfile: !!profile,
      hasNickname: this.hasNickname(),
      hasBirthday: this.hasBirthday(),
      hasAvatar: !!profile?.avatar,
      hasEmail: !!profile?.email,
      hasPhone: !!profile?.phone,
      age: this.getAge(),
      profileCompleteness: this.calculateCompleteness(profile)
    };

    return stats;
  }

  /**
   * 计算资料完整度
   * @param {Object} profile - 用户资料
   * @returns {number} - 完整度百分比
   */
  calculateCompleteness (profile) {
    if (!profile) return 0;

    let completedFields = 0;
    const totalFields = 6; // 昵称、头像、生日、性别、邮箱、手机、偏好

    if (profile.nickname && profile.nickname.trim().length > 0) {
      completedFields++;
    }

    if (profile.avatar && profile.avatar.trim().length > 0) {
      completedFields++;
    }

    if (profile.birthday) {
      completedFields++;
    }

    if (profile.gender) {
      completedFields++;
    }

    if (profile.email && profile.email.trim().length > 0) {
      completedFields++;
    }

    if (profile.phone && profile.phone.trim().length > 0) {
      completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * 导出用户资料
   * @returns {Promise<Object>} - 导出结果
   */
  async exportProfile () {
    try {
      const profile = await this.getProfile();

      if (!profile) {
        return {
          success: false,
          error: '用户资料不存在'
        };
      }

      // 创建导出数据
      const exportData = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        type: 'user_profile',
        data: profile
      };

      // 转换为JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2);

      // 创建Blob并下载
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `user_profile_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      // 清理URL
      URL.revokeObjectURL(url);

      console.log('用户资料已导出');

      return {
        success: true,
        filename: link.download
      };
    } catch (error) {
      console.error('导出用户资料失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成UUID
   * @returns {string} - UUID字符串
   */
  generateUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// 创建全局单例
const profileStorage = new ProfileStorage();

export default profileStorage;
