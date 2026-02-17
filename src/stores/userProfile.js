import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 用户资料状态管理
 * 管理用户基本信息：昵称、生日、性别、头像
 */
export const useUserProfileStore = defineStore('userProfile', () => {
  // 状态
  const nickname = ref('');
  const birthday = ref('');
  const gender = ref(''); // male, female, secret
  const avatar = ref('');

  // 计算属性
  const nicknameLength = computed(() => nickname.value.length);
  const isValidNickname = computed(() => {
    const len = nickname.value.trim().length;
    return len >= 2 && len <= 20;
  });

  const age = computed(() => {
    if (!birthday.value) return null;
    const today = new Date();
    const birthDate = new Date(birthday.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });

  const genderText = computed(() => {
    const genderMap = {
      male: '男',
      female: '女',
      secret: '保密'
    };
    return genderMap[gender.value] || '';
  });

  /**
   * 设置昵称
   * @param {string} name - 昵称（2-20字符）
   * @returns {Object} 验证结果
   */
  const setNickname = (name) => {
    const trimmedName = name.trim();
    const validation = validateNickname(trimmedName);

    if (validation.valid) {
      nickname.value = trimmedName;
      saveToLocalStorage();
      return { success: true, message: '昵称保存成功' };
    } else {
      return { success: false, message: validation.errors[0] };
    }
  };

  /**
   * 验证昵称格式
   * @param {string} name - 昵称
   * @returns {Object} 验证结果
   */
  const validateNickname = (name) => {
    const errors = [];
    const warnings = [];

    if (!name) {
      errors.push('昵称不能为空');
    } else {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        errors.push('昵称至少需要2个字符');
      }
      if (trimmedName.length > 20) {
        errors.push('昵称不能超过20个字符');
      }

      // 检查特殊字符
      const specialChars = /[<>{}\\|;:'"\\[\]`]/;
      if (specialChars.test(trimmedName)) {
        warnings.push('昵称包含特殊字符，可能影响显示');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  };

  /**
   * 设置生日
   * @param {string} date - 生日日期（YYYY-MM-DD格式）
   */
  const setBirthday = (date) => {
    if (!date) {
      birthday.value = '';
      return { success: true, message: '生日已清除' };
    } else {
      const birthDate = new Date(date);
      const today = new Date();

      // 验证生日日期
      if (birthDate > today) {
        return { success: false, message: '生日不能是未来日期' };
      }

      if (birthDate.getFullYear() < 1900) {
        return { success: false, message: '生日年份不能早于1900年' };
      }

      birthday.value = date;
      saveToLocalStorage();
      return { success: true, message: '生日保存成功' };
    }
  };

  /**
   * 验证生日格式
   * @param {string} date - 生日日期
   * @returns {Object} 验证结果
   */
  const validateBirthday = (date) => {
    const errors = [];

    if (!date) {
      return { valid: true, errors: [] };
    }

    const birthDate = new Date(date);
    const today = new Date();

    // 验证生日日期
    if (birthDate > today) {
      errors.push('生日不能是未来日期');
    }

    if (birthDate.getFullYear() < 1900) {
      errors.push('生日年份不能早于1900年');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /**
   * 验证性别选项
   * @param {string} value - 性别值
   * @returns {Object} 验证结果
   */
  const validateGender = (value) => {
    const errors = [];

    if (!value) {
      return { valid: true, errors: [] };
    }

    if (!['male', 'female', 'secret'].includes(value)) {
      errors.push('请选择有效的性别选项');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /**
   * 设置性别
   * @param {string} value - 性别（male, female, secret）
   */
  const setGender = (value) => {
    if (!value || !['male', 'female', 'secret'].includes(value)) {
      return { success: false, message: '请选择有效的性别选项' };
    }

    gender.value = value;
    saveToLocalStorage();
    return { success: true, message: '性别保存成功' };
  };

  /**
   * 设置头像
   * @param {string} url - 头像URL
   */
  const setAvatar = (url) => {
    if (!url) {
      avatar.value = '';
    } else {
      avatar.value = url;
    }
    saveToLocalStorage();
  };

  /**
   * 从本地存储加载用户资料
   */
  const loadFromLocalStorage = () => {
    try {
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        nickname.value = profile.nickname || '';
        birthday.value = profile.birthday || '';
        gender.value = profile.gender || '';
        avatar.value = profile.avatar || '';
      }
    } catch (err) {
      console.error('加载用户资料失败:', err);
    }
  };

  /**
   * 保存用户资料到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      const profile = {
        nickname: nickname.value,
        birthday: birthday.value,
        gender: gender.value,
        avatar: avatar.value
      };
      localStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (err) {
      console.error('保存用户资料失败:', err);
    }
  };

  /**
   * 导出用户资料
   * @returns {Object} 用户资料数据
   */
  const exportProfile = () => {
    return {
      nickname: nickname.value,
      birthday: birthday.value,
      gender: gender.value,
      avatar: avatar.value,
      age: age.value,
      genderText: genderText.value
    };
  };

  /**
   * 导入用户资料
   * @param {Object} data - 用户资料数据
   * @returns {Object} 导入结果
   */
  const importProfile = (data) => {
    try {
      if (data.nickname) {
        const result = setNickname(data.nickname);
        if (!result.success) {
          return { success: false, message: result.message };
        }
      }

      if (data.birthday) {
        const result = setBirthday(data.birthday);
        if (!result.success) {
          return { success: false, message: result.message };
        }
      }

      if (data.gender) {
        const result = setGender(data.gender);
        if (!result.success) {
          return { success: false, message: result.message };
        }
      }

      if (data.avatar) {
        setAvatar(data.avatar);
      }

      return { success: true, message: '用户资料导入成功' };
    } catch (err) {
      console.error('导入用户资料失败:', err);
      return { success: false, message: '导入失败：' + err.message };
    }
  };

  /**
   * 重置用户资料
   */
  const resetProfile = () => {
    nickname.value = '';
    birthday.value = '';
    gender.value = '';
    avatar.value = '';
    saveToLocalStorage();
  };

  /**
   * 检查今天是否是生日
   * @returns {boolean} 是否是生日
   */
  const isBirthdayToday = () => {
    if (!birthday.value) return false;

    const today = new Date();
    const birthDate = new Date(birthday.value);

    return today.getMonth() === birthDate.getMonth() &&
           today.getDate() === birthDate.getDate();
  };

  /**
   * 获取生日祝福语
   * @returns {string} 生日祝福语
   */
  const getBirthdayGreeting = () => {
    if (!isBirthdayToday()) return '';

    const name = nickname.value || '您';
    const ageValue = age.value;
    return `🎂 生日快乐！亲爱的${name}，今天是您的${ageValue}岁生日，祝您生日快乐！`;
  };

  // 初始化时加载用户资料
  loadFromLocalStorage();

  return {
    nickname,
    birthday,
    gender,
    avatar,
    nicknameLength,
    isValidNickname,
    age,
    genderText,
    setNickname,
    validateNickname,
    setBirthday,
    validateBirthday,
    setGender,
    validateGender,
    setAvatar,
    loadFromLocalStorage,
    saveToLocalStorage,
    exportProfile,
    importProfile,
    resetProfile,
    isBirthdayToday,
    getBirthdayGreeting
  };
});
