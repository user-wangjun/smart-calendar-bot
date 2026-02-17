<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
    <header class="mb-8">
      <h1 class="text-3xl font-bold" style="color: var(--text-primary); display: flex; align-items: center; gap: 0.75rem;">
        <Settings class="w-8 h-8" style="color: var(--primary-color);" />
        系统设置
      </h1>
      <p class="mt-2" style="color: var(--text-tertiary);">
        管理您的个人资料、外观偏好和系统配置
      </p>
    </header>
    
    <!-- 用户资料卡片 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 0.5rem;">
            <User class="w-6 h-6" style="color: var(--primary-color);" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">用户资料</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">管理您的基本信息</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium" style="color: var(--text-secondary);">昵称</label>
          <input
            v-model="nicknameInput"
            type="text"
            placeholder="2-20个字符"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); color: var(--text-primary); transition: box-shadow 0.2s ease; position: relative; z-index: 10;"
            :style="{ borderColor: nicknameError ? 'var(--error-color)' : '' }"
            @input="handleNicknameInput"
          />
          <div class="flex justify-between text-xs" style="color: var(--text-muted);">
            <span>方便AI助手称呼您</span>
            <span>{{ nicknameInput?.length || 0 }}/20</span>
          </div>
          <p v-if="nicknameError" class="text-xs" style="color: var(--error-color);">{{ nicknameError }}</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-medium" style="color: var(--text-secondary);">生日</label>
            <input
              v-model="birthdayInput"
              type="date"
              style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); color: var(--text-primary);"
              @change="saveBirthday"
            />
            <p class="text-xs" style="color: var(--text-muted);">方便生日提醒</p>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium" style="color: var(--text-secondary);">性别</label>
            <select v-model="genderInput" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-primary); color: var(--text-primary);" @change="saveGender">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="secret">保密</option>
            </select>
            <p class="text-xs" style="color: var(--text-muted);">方便穿搭推荐</p>
          </div>
        </div>
        
        <div class="pt-2">
          <BaseButton variant="primary" @click="saveProfile">
            保存个人信息
          </BaseButton>
        </div>
      </div>
    </BaseCard>
    
    <!-- 外观设置卡片 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(168, 85, 247, 0.1); border-radius: 0.5rem;">
            <Palette class="w-6 h-6" style="color: #9333ea;" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">外观设置</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">自定义界面风格</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 主题模式 -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium" style="color: var(--text-primary);">主题模式</h4>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="mode in ['light', 'dark', 'system', 'transparent']"
              :key="mode"
              @click="settingsStore.setThemeMode(mode)"
              class="theme-mode-button"
              :class="{ 'theme-mode-button-active': settingsStore.themeMode === mode }"
            >
              <Sun v-if="mode === 'light'" class="w-4 h-4" />
              <Moon v-else-if="mode === 'dark'" class="w-4 h-4" />
              <Monitor v-else-if="mode === 'system'" class="w-4 h-4" />
              <Layers v-else class="w-4 h-4" />
              <span class="capitalize">{{ getThemeModeText(mode) }}</span>
            </button>
          </div>
        </div>
        
        <!-- 字体设置 -->
        <div class="space-y-3">
           <h4 class="text-sm font-medium" style="color: var(--text-primary);">字体大小</h4>
           <div class="flex items-center gap-4">
             <div class="flex gap-2">
                <button
                  v-for="size in ['small', 'medium', 'large']"
                  :key="size"
                  class="font-size-button"
                  :class="{ 'font-size-button-active': settingsStore.fontSize === size }"
                  @click="settingsStore.setFontSize(size)"
                >
                  {{ size === 'small' ? '小' : (size === 'medium' ? '中' : '大') }}
                </button>
             </div>
             <div class="flex-1 flex items-center gap-2" style="background: var(--bg-secondary); padding: 0.5rem; border-radius: 0.5rem;">
               <span class="text-xs" style="color: var(--text-muted);">自定义: {{ customFontSize }}px</span>
               <input
                  v-model.number="customFontSize"
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  @input="updateCustomFontSize"
                  class="flex-1 h-1.5 appearance-none cursor-pointer"
                  style="background: var(--border-color); border-radius: 9999px; accent-color: var(--primary-color);"
                />
             </div>
           </div>
        </div>

        <!-- 文字颜色设置 - 仅在使用背景时显示 -->
        <div v-if="settingsStore.backgroundType !== 'default'" class="space-y-3">
           <h4 class="text-sm font-medium" style="color: var(--text-primary);">文字颜色</h4>
           <div class="space-y-3">
             <!-- 预设颜色 -->
             <div class="space-y-2">
               <label class="text-xs" style="color: var(--text-muted);">预设颜色</label>
               <div class="flex gap-2 flex-wrap">
                 <button
                   v-for="color in presetTextColors"
                   :key="color"
                   @click="settingsStore.setTextColor(color)"
                   class="text-color-button"
                   :class="{ 'text-color-button-active': settingsStore.textColor === color }"
                   :style="{ backgroundColor: color }"
                   :title="getColorName(color)"
                 />
               </div>
             </div>
             <!-- 自定义颜色 -->
             <div class="space-y-2">
               <label class="text-xs" style="color: var(--text-muted);">自定义颜色</label>
               <div class="flex gap-2">
                 <input
                   type="color"
                   v-model="customTextColor"
                   @input="settingsStore.setTextColor(customTextColor)"
                   class="w-12 h-8 rounded-lg cursor-pointer"
                   style="border: 1px solid var(--border-color);"
                 />
                 <input
                   type="text"
                   v-model="customTextColor"
                   @input="settingsStore.setTextColor(customTextColor)"
                   placeholder="#ffffff"
                   class="flex-1 px-3 py-2 border rounded-lg text-sm"
                   style="border-color: var(--border-color); background: var(--bg-primary); color: var(--text-primary);"
                 />
               </div>
             </div>
             <!-- 恢复默认按钮 -->
             <div>
               <BaseButton
                 size="sm"
                 variant="outline"
                 @click="settingsStore.setTextColor('#ffffff')"
               >
                 恢复默认（白色）
               </BaseButton>
             </div>
           </div>
        </div>
        
        <!-- 背景设置 -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium" style="color: var(--text-primary);">背景图片</h4>
          
          <!-- 预设主题背景 -->
          <div class="space-y-2">
            <label class="text-xs" style="color: var(--text-muted);">预设主题</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="theme in presetBackgrounds"
                :key="theme.id"
                @click="applyPresetBackground(theme)"
                class="preset-background-button"
                :class="{ 'preset-background-button-active': currentBackgroundId === theme.id }"
              >
                <img 
                  :src="theme.thumbnail" 
                  class="w-full h-full object-cover" 
                  style="image-rendering: high-quality; image-rendering: crisp-edges;"
                />
                <div class="preset-background-overlay">
                  <span class="text-white text-xs font-medium drop-shadow-md">{{ theme.name }}</span>
                </div>
                <!-- 动态主题标识 -->
                <div v-if="theme.type === 'dynamic'" class="preset-background-dynamic-badge">
                  动态
                </div>
                <div v-if="currentBackgroundId === theme.id" class="preset-background-check">
                  <Check class="w-3 h-3 text-white" />
                </div>
              </button>
            </div>
          </div>

          <!-- 用户背景（统一管理静态和动态） -->
          <div class="space-y-2">
            <label class="text-xs" style="color: var(--text-muted);">我的背景</label>
            <div class="grid grid-cols-4 gap-2">
              <!-- 用户背景1-6（统一管理） -->
              <template v-for="(background, index) in 6" :key="index">
                <button
                  v-if="settingsStore.userBackgrounds[index]"
                  @click="applyUserBackground(settingsStore.userBackgrounds[index])"
                  class="preset-background-button relative"
                  :class="{ 'preset-background-button-active': currentUserBackgroundId === settingsStore.userBackgrounds[index].id }"
                >
                  <!-- 根据文件类型选择渲染方式 -->
                  <img 
                    v-if="!settingsStore.userBackgrounds[index].isDynamic || !settingsStore.userBackgrounds[index].format?.includes('video')"
                    :src="settingsStore.userBackgrounds[index].url" 
                    class="w-full h-full object-cover" 
                    style="image-rendering: high-quality; image-rendering: crisp-edges;"
                  />
                  <video 
                    v-else
                    :src="settingsStore.userBackgrounds[index].url" 
                    class="w-full h-full object-cover"
                    muted
                    loop
                    autoplay
                    playsinline
                  ></video>
                  <div class="preset-background-overlay">
                    <span class="text-white text-xs font-medium drop-shadow-md">{{ settingsStore.userBackgrounds[index].name }}</span>
                  </div>
                  <!-- 动态背景标识 -->
                  <div v-if="settingsStore.userBackgrounds[index].isDynamic" class="preset-background-dynamic-badge">
                    动
                  </div>
                  <div v-if="currentUserBackgroundId === settingsStore.userBackgrounds[index].id" class="preset-background-check">
                    <Check class="w-3 h-3 text-white" />
                  </div>
                  <div 
                    @click.stop="deleteUserBackground(settingsStore.userBackgrounds[index].id)"
                    class="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    ×
                  </div>
                </button>
                <!-- 上传占位 -->
                <div v-else class="preset-background-button border-2 border-dashed border-purple-300 flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 hover:border-purple-500 transition-colors cursor-pointer" @click="triggerUnifiedBackgroundUpload">
                  <div class="text-center">
                    <Upload class="w-4 h-4 mx-auto mb-1" style="color: #a855f7;" />
                    <span class="text-purple-500 text-xs">上传</span>
                  </div>
                </div>
              </template>
            </div>
            <p class="text-xs" style="color: var(--text-muted);">
              支持格式：JPG、PNG、GIF、WebP、视频（最多保存6个）
            </p>
          </div>
          
          <div class="flex gap-3 pt-2">
            <BaseButton 
              size="sm" 
              :variant="!settingsStore.backgroundImage ? 'primary' : 'outline'" 
              @click="clearBackgroundAndPreset"
            >
              默认
            </BaseButton>
            <BaseButton 
              size="sm" 
              variant="secondary" 
              @click="showAIBackgroundDialog"
              :icon="Sparkles"
            >
              AI生成
            </BaseButton>
            <BaseButton 
              size="sm" 
              variant="secondary" 
              @click="triggerBackgroundUpload"
              :icon="Upload"
              :loading="isUploading"
            >
              {{ isUploading ? `上传中 ${uploadProgress}%` : '本地上传' }}
            </BaseButton>
          </div>
          
          <!-- 上传进度条 -->
          <div v-if="isUploading" class="mt-2 w-full h-1.5" style="background: var(--border-color); border-radius: 9999px; overflow: hidden;">
             <div 
               class="h-full transition-all duration-300" 
               :style="{ width: `${uploadProgress}%`, backgroundColor: 'var(--primary-color)' }"
             ></div>
          </div>
          
          <div v-if="settingsStore.backgroundImage" class="relative group mt-2 rounded-lg overflow-hidden border" style="border-color: var(--border-color); height: 8rem; width: 100%;">
             <img :src="settingsStore.backgroundImage" class="w-full h-full object-cover" />
             <div v-if="isOfflineMode || settingsStore.backgroundImage.startsWith('blob:')" class="absolute top-2 right-2">
                <BaseBadge variant="warning">离线模式</BaseBadge>
             </div>
             <div class="absolute inset-0 group-hover:opacity-100" style="background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
               <BaseButton size="sm" variant="danger" @click="clearBackgroundAndPreset">清除背景</BaseButton>
             </div>
          </div>
        </div>
      </div>
    </BaseCard>
    
    <!-- 铃声设置卡片 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(34, 197, 94, 0.1); border-radius: 0.5rem;">
            <Bell class="w-6 h-6" style="color: #22c55e;" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">铃声设置</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">自定义提醒铃声</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 铃声开关 -->
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium" style="color: var(--text-primary);">使用自定义铃声</h4>
            <p class="text-xs" style="color: var(--text-muted);">开启后将使用您上传的铃声</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              v-model="useCustomRingtone" 
              @change="toggleCustomRingtone" 
              class="sr-only peer"
              :disabled="!settingsStore.ringtoneSettings.customRingtone"
            >
            <div class="ollama-toggle-track peer"></div>
          </label>
        </div>

        <!-- 当前铃声信息 -->
        <div v-if="settingsStore.ringtoneSettings.customRingtone" class="p-3" style="background: var(--bg-secondary); border-radius: 0.5rem;">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🔊</span>
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary);">{{ settingsStore.ringtoneSettings.ringtoneName }}</p>
                <p class="text-xs" style="color: var(--text-muted);">已上传的自定义铃声</p>
              </div>
            </div>
            <div class="flex gap-2">
              <BaseButton size="sm" variant="secondary" @click="previewRingtone">
                预览
              </BaseButton>
              <BaseButton size="sm" variant="danger" @click="clearRingtone">
                删除
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- 上传按钮 -->
        <div class="flex gap-3">
          <BaseButton 
            variant="primary" 
            @click="triggerRingtoneUpload"
            :icon="Upload"
          >
            上传铃声
          </BaseButton>
          <BaseButton 
            variant="outline" 
            @click="testDefaultRingtone"
          >
            测试默认铃声
          </BaseButton>
        </div>

        <!-- 铃声格式说明 -->
        <div class="text-xs" style="color: var(--text-muted);">
          <p>支持格式：MP3, WAV, OGG, M4A</p>
          <p>建议文件大小不超过 5MB</p>
        </div>
      </div>
    </BaseCard>

    <!-- 隐藏的铃声上传输入 -->
    <input
      ref="ringtoneUploadInput"
      type="file"
      accept="audio/*"
      @change="handleRingtoneUpload"
      class="hidden"
    />

    <!-- Ollama本地服务设置卡片 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(249, 115, 22, 0.1); border-radius: 0.5rem;">
            <Server class="w-6 h-6" style="color: #ea580c;" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">Ollama 本地服务</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">连接本地运行的 LLM 模型</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-3" style="background: var(--bg-secondary); border-radius: 0.5rem;">
           <div class="flex items-center gap-3">
             <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="ollamaEnabled" @change="toggleOllamaEnabled" class="sr-only peer">
                <div class="ollama-toggle-track peer"></div>
             </label>
             <span class="text-sm font-medium" style="color: var(--text-secondary);">启用 Ollama 支持</span>
           </div>
           <a href="https://ollama.com" target="_blank" class="text-xs" style="color: var(--primary-color); text-decoration: underline; display: flex; align-items: center; gap: 0.25rem;">
             未安装? <ExternalLink class="w-3 h-3" />
           </a>
        </div>
          
        <div v-if="ollamaEnabled" class="space-y-3 pl-1" style="border-left: 2px solid rgba(59, 130, 246, 0.2); margin-left: 0.5rem;">
           <div class="space-y-1">
             <label class="text-sm font-medium" style="color: var(--text-secondary);">服务地址</label>
             <div class="flex gap-2">
                <input
                  v-model="ollamaUrl"
                  type="text"
                  placeholder="http://localhost:11434"
                  class="flex-1 px-3 py-2 border rounded-lg"
                  style="border-color: var(--border-color); background: var(--bg-primary); color: var(--text-primary);"
                  @blur="saveOllamaUrl"
                />
                <BaseButton variant="secondary" :loading="isTestingOllama" @click="testOllamaConnection">
                  测试连接
                </BaseButton>
             </div>
           </div>
           
           <div v-if="ollamaTestResult" class="p-3 rounded-lg text-sm" :class="ollamaTestResult.success ? 'ollama-test-success' : 'ollama-test-error'">
             {{ ollamaTestResult.message }}
           </div>
           
           <div class="mt-4">
             <OllamaModelPanel />
           </div>
        </div>
      </div>
    </BaseCard>

    <!-- API密钥管理卡片 - 使用增强版组件 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(234, 179, 8, 0.1); border-radius: 0.5rem;">
            <Key class="w-6 h-6" style="color: #ca8a04;" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">API 密钥管理</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">配置第三方 AI 服务凭证</p>
          </div>
        </div>
      </template>

      <!-- 增强版API管理器 -->
      <EnhancedApiManager />
    </BaseCard>
    
    <!-- 数据管理卡片 -->
    <BaseCard>
      <template #header>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="padding: 0.5rem; background: rgba(37, 99, 235, 0.1); border-radius: 0.5rem;">
            <Database class="w-6 h-6" style="color: #2563eb;" />
          </div>
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">数据管理</h3>
            <p class="text-sm" style="color: var(--text-tertiary);">备份与恢复</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 存储空间概览 -->
        <div class="p-4" style="background: var(--bg-secondary); border-radius: 0.75rem; border: 1px solid var(--border-color);">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium" style="color: var(--text-secondary);">存储空间使用</span>
            <span class="text-xs" style="color: var(--text-muted);">{{ backupStatus.totalSizeFormatted }} / 10 MB</span>
          </div>
          <div class="h-2 mb-4" style="background: var(--border-color); border-radius: 9999px; overflow: hidden;">
            <div 
              class="h-full rounded-full transition-all duration-300" 
              :style="{ width: backupStatus.storageUsed, backgroundColor: storageBarColor }"
            ></div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="(info, type) in backupStatus.dataTypes" :key="type" class="flex justify-between p-2 rounded text-xs" style="background: var(--bg-primary);">
              <span style="color: var(--text-muted);">{{ getDataTypeLabel(type) }}</span>
              <span class="font-medium" style="color: var(--text-primary);">{{ info.exists ? info.sizeFormatted : '-' }}</span>
            </div>
          </div>
        </div>
        
        <!-- 数据操作按钮 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BaseButton variant="outline" :icon="Download" @click="openExportDialog">导出数据</BaseButton>
          <BaseButton variant="outline" :icon="Upload" @click="openImportDialog">导入数据</BaseButton>
          <BaseButton variant="secondary" :icon="Zap" @click="showQuickExport">快速导出</BaseButton>
          <BaseButton variant="danger" :icon="RefreshCcw" @click="resetAllSettings">重置所有</BaseButton>
        </div>
        
        <!-- 数据安全提示 -->
        <div class="p-4" style="background: rgba(37, 99, 235, 0.1); border-left: 4px solid #2563eb; border-radius: 0 0.5rem 0.5rem 0;">
          <h5 class="text-sm font-medium mb-2 flex items-center gap-2" style="color: #1e40af;">
            <ShieldCheck class="w-4 h-4" /> 数据安全提示
          </h5>
          <ul class="list-disc list-inside text-xs space-y-1" style="color: #1e3a8a;">
            <li>建议定期导出数据作为备份</li>
            <li>API密钥默认不包含在导出文件中</li>
            <li>导入操作前建议先备份当前数据</li>
          </ul>
        </div>
      </div>
    </BaseCard>
    
    <!-- 数据导入导出对话框 -->
    <DataTransferDialog ref="dataTransferDialog" @data-imported="onDataImported" @data-exported="onDataExported" />
    
    <!-- AI背景生成对话框 -->
    <div v-if="showAIDialog" class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0, 0, 0, 0.5);" @click.self="showAIDialog = false">
      <div class="bg-white dark:bg-surface-800 rounded-xl max-w-md w-full p-6 shadow-xl" style="background: var(--bg-elevated);" @click.stop>
        <h3 class="text-lg font-bold mb-2" style="color: var(--text-primary);">AI生成背景</h3>
        <p class="text-xs mb-4" style="color: var(--text-tertiary);">
          使用智谱AI CogView-3-Flash免费模型生成背景图片
        </p>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" style="color: var(--text-secondary);">图像描述</label>
            <textarea
              v-model="aiPrompt"
              placeholder="描述您想要的背景，例如：&#10;• 宁静的森林，阳光透过树叶&#10;• 现代城市夜景，霓虹灯光&#10;• 浩瀚星空，银河横跨天际"
              class="w-full px-3 py-2 border rounded-lg resize-none text-sm"
              style="border-color: var(--border-color); background: var(--bg-primary); color: var(--text-primary); height: 7rem;"
            ></textarea>
            <p class="text-xs" style="color: var(--text-muted);">
              提示：描述越详细，生成效果越好
            </p>
          </div>
          <div class="flex justify-end gap-3">
            <BaseButton variant="ghost" @click="showAIDialog = false">取消</BaseButton>
            <BaseButton variant="primary" :loading="isGenerating" @click="generateAIBackground">
              {{ isGenerating ? '生成中...' : '生成背景' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 隐藏的文件上传输入 -->
    <input
      ref="backgroundUploadInput"
      type="file"
      accept="image/*"
      @change="handleBackgroundUpload"
      class="hidden"
    />
    <!-- 隐藏的统一背景上传输入 -->
    <input
      ref="unifiedBackgroundUploadInput"
      type="file"
      accept="image/*,video/*,image/gif,image/webp"
      @change="handleUnifiedBackgroundUpload"
      class="hidden"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useUserProfileStore } from '@/stores/userProfile';
import apiKeyManager from '@/config/apiKeyManager.js';
import backgroundService from '@/services/backgroundService';
import { getBackupStatus } from '@/services/dataTransferService';
import DataTransferDialog from '@/components/DataTransferDialog.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import EnhancedApiManager from '@/components/settings/EnhancedApiManager.vue';
import OllamaModelPanel from '@/components/settings/OllamaModelPanel.vue';
import {
  Settings, User, Palette, Server, Key, Database,
  Sun, Moon, Monitor, Layers, Upload, Sparkles, ExternalLink,
  Download, Zap, RefreshCcw, ShieldCheck, Check, Bell
} from 'lucide-vue-next';
import { notificationService } from '@/services/notificationService';

// 预设背景主题 - 使用更高分辨率的缩略图和高质量图片
const presetBackgrounds = [
  {
    id: 'starry-dynamic',
    name: '星空动态',
    thumbnail: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800&h=450&fit=crop&q=90',
    type: 'dynamic',
    theme: 'starry'
  },
  {
    id: 'ocean-dynamic',
    name: '海洋动态',
    thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=450&fit=crop&q=90',
    type: 'dynamic',
    theme: 'ocean'
  },
  {
    id: 'fireworks-dynamic',
    name: '烟花动态',
    thumbnail: 'https://images.unsplash.com/photo-1504598318550-17eba1008a68?w=800&h=450&fit=crop&q=90',
    type: 'dynamic',
    theme: 'fireworks'
  },
  {
    id: 'starry',
    name: '星空',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&h=450&fit=crop&q=90',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=3840&q=100',
    type: 'static'
  },
  {
    id: 'nature',
    name: '山水',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&q=90',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=3840&q=100',
    type: 'static'
  },
  {
    id: 'city',
    name: '城市',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop&q=90',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=3840&q=100',
    type: 'static'
  },
  {
    id: 'desert',
    name: '沙漠',
    thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=450&fit=crop&q=90',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=3840&q=100',
    type: 'static'
  }
];

// 当前选中的背景ID
const currentBackgroundId = ref('');
// 当前选中的用户背景ID
const currentUserBackgroundId = ref('');

/**
 * 获取主题模式的中文显示文本
 * @param {string} mode - 主题模式
 * @returns {string} 中文显示文本
 */
const getThemeModeText = (mode) => {
  const modeMap = {
    'light': '浅色',
    'dark': '深色',
    'system': '跟随系统',
    'transparent': '透明'
  };
  return modeMap[mode] || mode;
};

// 预设文字颜色
const presetTextColors = [
  '#ffffff',  // 白色
  '#fef3c7',  // 浅黄
  '#dcfce7',  // 浅绿
  '#dbeafe',  // 浅蓝
  '#fce7f3',  // 浅粉
  '#e9d5ff',  // 浅紫
  '#fef2c0',  // 金色
  '#e5e7eb',  // 浅灰
  '#000000',  // 黑色
  '#374151'   // 深灰
];

// 自定义文字颜色
const customTextColor = ref('#ffffff');

const settingsStore = useSettingsStore();
const userProfileStore = useUserProfileStore();

// 用户资料输入 - 直接绑定 store 状态，添加本地输入缓存用于验证
const nicknameInput = ref(userProfileStore.nickname || '');
const nicknameError = ref('');
const birthdayInput = ref(userProfileStore.birthday || '');
const genderInput = ref(userProfileStore.gender || '');
const customFontSize = ref(settingsStore.customFontSize);
const showAIDialog = ref(false);
const aiPrompt = ref('');
const isGenerating = ref(false);
const backgroundUploadInput = ref(null);
const unifiedBackgroundUploadInput = ref(null);

// 铃声设置
const useCustomRingtone = ref(false);
const ringtoneUploadInput = ref(null);

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// Ollama设置
const ollamaEnabled = ref(settingsStore.ollamaEnabled);
const ollamaUrl = ref(settingsStore.ollamaUrl);
const isTestingOllama = ref(false);
const ollamaTestResult = ref(null);

// 数据管理
const dataTransferDialog = ref(null);
const backupStatus = ref({
  totalSize: 0,
  totalSizeFormatted: '0 B',
  storageUsed: '0%',
  dataTypes: {}
});

// 数据类型标签映射
const dataTypeLabels = {
  events: '日程事件',
  chat: '聊天记录',
  settings: '应用设置',
  preferences: '用户偏好',
  profile: '用户档案'
};

// 计算属性
const storageBarColor = computed(() => {
  const used = parseFloat(backupStatus.value.storageUsed || 0);
  if (used > 90) return '#ef4444';
  if (used > 70) return '#eab308';
  return '#22c55e';
});

const getDataTypeLabel = (type) => {
  return dataTypeLabels[type] || type;
};

/**
 * 获取颜色名称
 * @param {string} color - 颜色值
 * @returns {string} 颜色名称
 */
const getColorName = (color) => {
  const colorNames = {
    '#ffffff': '白色',
    '#fef3c7': '浅黄',
    '#dcfce7': '浅绿',
    '#dbeafe': '浅蓝',
    '#fce7f3': '浅粉',
    '#e9d5ff': '浅紫',
    '#fef2c0': '金色',
    '#e5e7eb': '浅灰',
    '#000000': '黑色',
    '#374151': '深灰'
  };
  return colorNames[color] || color;
};

const refreshBackupStatus = () => {
  backupStatus.value = getBackupStatus();
};

const openExportDialog = () => {
  dataTransferDialog.value?.showExportDialog();
};

const openImportDialog = () => {
  dataTransferDialog.value?.showImportDialog();
};

const showQuickExport = () => {
  dataTransferDialog.value?.showQuickExport();
};

const onDataImported = (result) => {
  refreshBackupStatus();
};

const onDataExported = (result) => {
  refreshBackupStatus();
};

const updateCustomFontSize = () => {
  settingsStore.setCustomFontSize(customFontSize.value);
};



/**
 * 切换Ollama启用状态
 */
const toggleOllamaEnabled = () => {
  settingsStore.setOllamaEnabled(ollamaEnabled.value);
  ollamaTestResult.value = null;
};

/**
 * 保存Ollama服务地址
 */
const saveOllamaUrl = () => {
  if (ollamaUrl.value && ollamaUrl.value.trim()) {
    settingsStore.setOllamaUrl(ollamaUrl.value.trim());
  }
};

/**
 * 测试Ollama连接
 */
const testOllamaConnection = async () => {
  isTestingOllama.value = true;
  ollamaTestResult.value = null;
  
  try {
    const response = await fetch(`${ollamaUrl.value}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const modelCount = data.models ? data.models.length : 0;
      ollamaTestResult.value = {
        success: true,
        message: `✅ 连接成功！发现 ${modelCount} 个本地模型`
      };
    } else {
      ollamaTestResult.value = {
        success: false,
        message: `❌ 连接失败：HTTP ${response.status}`
      };
    }
  } catch (error) {
    ollamaTestResult.value = {
      success: false,
      message: `❌ 连接失败：${error.message}`
    };
  } finally {
    isTestingOllama.value = false;
  }
};

/**
 * 处理昵称输入事件
 * 确保输入值正确更新并防抖自动保存
 */
const handleNicknameInput = (event) => {
  nicknameInput.value = event.target.value;
  debouncedSaveNickname();
};

// 防抖保存昵称
const debouncedSaveNickname = debounce(() => {
  const validation = userProfileStore.validateNickname(nicknameInput.value);
  if (validation.valid) {
    nicknameError.value = '';
    userProfileStore.setNickname(nicknameInput.value);
  }
}, 500);

/**
 * 保存用户资料
 * 保存所有用户资料字段到本地存储（作为手动确认的保存方式）
 */
const saveProfile = () => {
  // 保存昵称
  const nicknameResult = userProfileStore.setNickname(nicknameInput.value);
  if (!nicknameResult.success) {
    nicknameError.value = nicknameResult.message;
    return;
  }

  // 保存生日
  const birthdayResult = userProfileStore.setBirthday(birthdayInput.value);
  if (!birthdayResult.success) {
    alert(birthdayResult.message);
    birthdayInput.value = userProfileStore.birthday || '';
    return;
  }

  // 保存性别
  const genderResult = userProfileStore.setGender(genderInput.value);
  if (!genderResult.success) {
    alert(genderResult.message);
    genderInput.value = userProfileStore.gender || '';
    return;
  }

  // 所有字段保存成功
  nicknameError.value = '';
  alert('个人信息保存成功！');
};

/**
 * 保存生日
 */
const saveBirthday = () => {
  const result = userProfileStore.setBirthday(birthdayInput.value);
  if (!result.success) {
    alert(result.message);
    birthdayInput.value = userProfileStore.birthday || '';
  }
};

/**
 * 保存性别
 */
const saveGender = () => {
  const result = userProfileStore.setGender(genderInput.value);
  if (!result.success) {
    alert(result.message);
    genderInput.value = userProfileStore.gender || '';
  }
};

const showAIBackgroundDialog = () => {
  showAIDialog.value = true;
};

/**
 * 生成AI背景图片
 * 使用智谱AI CogView-3-Flash模型生成背景
 * 直接使用.env文件中的智谱API密钥
 */
const generateAIBackground = async () => {
  if (!aiPrompt.value.trim()) {
    alert('请输入图像描述，例如：宁静的森林、现代城市夜景');
    return;
  }

  isGenerating.value = true;
  try {
    const result = await backgroundService.generateAIBackground(aiPrompt.value);

    if (result.success) {
      showAIDialog.value = false;
      aiPrompt.value = '';
      currentBackgroundId.value = '';
      
      // 添加到用户背景列表
      const bgName = aiPrompt.value.trim().substring(0, 8) || 'AI生成';
      settingsStore.addUserBackground(result.url, 'ai-generated', bgName, 'image/png');
      
      // 选中刚生成的背景
      if (settingsStore.userBackgrounds.length > 0) {
        currentUserBackgroundId.value = settingsStore.userBackgrounds[0].id;
      }

      if (result.isOnline) {
        console.log('背景使用在线图片URL');
      }
    } else {
      alert('生成失败：' + result.message);
    }
  } catch (error) {
    console.error('AI背景生成异常:', error);
    alert('生成失败：' + error.message);
  } finally {
    isGenerating.value = false;
  }
};

const triggerBackgroundUpload = () => {
  backgroundUploadInput.value.click();
};

/**
 * 应用预设背景
 * @param {Object} theme - 预设主题对象
 */
const applyPresetBackground = (theme) => {
  currentBackgroundId.value = theme.id;
  currentUserBackgroundId.value = '';
  
  if (theme.type === 'dynamic') {
    // 动态主题
    settingsStore.setBackgroundTheme(theme.theme);
  } else {
    // 静态图片主题
    settingsStore.setBackgroundImage(theme.url, 'preset');
  }
};

/**
 * 应用用户自定义背景
 * @param {Object} background - 用户背景对象
 */
const applyUserBackground = (background) => {
  currentUserBackgroundId.value = background.id;
  currentBackgroundId.value = '';
  settingsStore.setBackgroundImage(background.url, background.type, background.format);
};

/**
 * 删除用户自定义背景
 * @param {string} id - 背景ID
 */
const deleteUserBackground = (id) => {
  if (currentUserBackgroundId.value === id) {
    currentUserBackgroundId.value = '';
    clearBackgroundAndPreset();
  }
  settingsStore.deleteUserBackground(id);
};

/**
 * 清除背景和预设选择
 */
const clearBackgroundAndPreset = () => {
  currentBackgroundId.value = '';
  isOfflineMode.value = false;
  settingsStore.clearBackground();
};

const isUploading = ref(false);
const uploadProgress = ref(0);
const isOfflineMode = ref(false);

const handleBackgroundUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    isUploading.value = true;
    uploadProgress.value = 0;
    isOfflineMode.value = false;
    
    try {
      const result = await backgroundService.uploadLocalBackground(file, (percent) => {
        uploadProgress.value = percent;
      });
      
      if (result.success) {
        // 添加到用户背景列表
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // 去掉扩展名
        const bgName = fileName.substring(0, 8) || '本地上传';
        settingsStore.addUserBackground(result.url, 'custom', bgName, file.type);
        
        // 选中刚上传的背景
        if (settingsStore.userBackgrounds.length > 0) {
          currentUserBackgroundId.value = settingsStore.userBackgrounds[0].id;
        }
        
        if (result.isOffline) {
          isOfflineMode.value = true;
          setTimeout(() => alert('网络连接失败，图片已保存到本地存储'), 100);
        } else {
          alert('背景上传成功！');
        }
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert('上传异常');
    } finally {
      // 延迟关闭进度条，让用户看到 100%
      setTimeout(() => {
        isUploading.value = false;
        uploadProgress.value = 0;
      }, 1000);
      
      // 清除 input value 允许重复上传同一文件
      event.target.value = '';
    }
  }
};

/**
 * 触发统一背景上传
 */
const triggerUnifiedBackgroundUpload = () => {
  unifiedBackgroundUploadInput.value.click();
};

/**
 * 处理统一背景上传（支持静态和动态格式）
 * @param {Event} event - 文件上传事件
 */
const handleUnifiedBackgroundUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      // 读取文件为URL
      const url = URL.createObjectURL(file);
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const bgName = fileName.substring(0, 8) || '我的背景';
      const format = file.type;
      const type = format.includes('video') ? 'video' : (format.includes('gif') || format.includes('webp') ? 'dynamic' : 'custom');
      
      // 添加到统一的用户背景列表
      settingsStore.addUserBackground(url, type, bgName, format);
      
      alert('背景上传成功！');
    } catch (e) {
      console.error('背景上传异常:', e);
      alert('上传异常');
    } finally {
      // 清除 input value 允许重复上传同一文件
      event.target.value = '';
    }
  }
};

const resetAllSettings = () => {
  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
    settingsStore.resetSettings();
    userProfileStore.resetProfile();
    alert('所有设置已重置');
  }
};

onMounted(async () => {
  // 同步用户资料输入框与 store 数据
  // 注意：store 中的值是 ref 对象，需要使用 .value 访问
  nicknameInput.value = userProfileStore.nickname || '';
  birthdayInput.value = userProfileStore.birthday || '';
  genderInput.value = userProfileStore.gender || '';

  // 同步自定义文字颜色
  customTextColor.value = settingsStore.textColor || '#ffffff';

  // 同步铃声设置
  useCustomRingtone.value = settingsStore.ringtoneSettings.useCustomRingtone;

  // 初始化当前背景ID
  if (settingsStore.backgroundType === 'dynamic' && settingsStore.backgroundTheme) {
    // 动态主题
    const matchedTheme = presetBackgrounds.find(t => t.type === 'dynamic' && t.theme === settingsStore.backgroundTheme);
    if (matchedTheme) {
      currentBackgroundId.value = matchedTheme.id;
    }
  } else if (settingsStore.backgroundType === 'preset' && settingsStore.backgroundImage) {
    // 静态预设图片
    const matchedTheme = presetBackgrounds.find(t => t.url === settingsStore.backgroundImage);
    if (matchedTheme) {
      currentBackgroundId.value = matchedTheme.id;
    }
  } else if ((settingsStore.backgroundType === 'custom' || settingsStore.backgroundType === 'ai-generated' || settingsStore.backgroundType === 'dynamic' || settingsStore.backgroundType === 'video') && settingsStore.backgroundImage) {
    // 用户背景（统一管理）
    const matchedBg = settingsStore.userBackgrounds.find(bg => bg.url === settingsStore.backgroundImage);
    if (matchedBg) {
      currentUserBackgroundId.value = matchedBg.id;
    }
  }

  refreshBackupStatus();
});

// 铃声相关方法

/**
 * 触发铃声上传
 */
const triggerRingtoneUpload = () => {
  ringtoneUploadInput.value.click();
};

/**
 * 处理铃声上传
 */
const handleRingtoneUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB');
      return;
    }

    // 读取文件为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      settingsStore.setCustomRingtone(base64Data, file.name);
      useCustomRingtone.value = true;
      alert('铃声上传成功！');
    };
    reader.onerror = () => {
      alert('文件读取失败');
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('铃声上传失败:', error);
    alert('铃声上传失败');
  } finally {
    event.target.value = '';
  }
};

/**
 * 切换自定义铃声开关
 */
const toggleCustomRingtone = () => {
  settingsStore.setUseCustomRingtone(useCustomRingtone.value);
};

/**
 * 预览铃声
 */
const previewRingtone = () => {
  if (settingsStore.ringtoneSettings.customRingtone) {
    const audio = new Audio(settingsStore.ringtoneSettings.customRingtone);
    audio.volume = 0.8;
    audio.play().catch((error) => {
      console.error('预览铃声失败:', error);
      alert('预览铃声失败');
    });
  }
};

/**
 * 清除铃声
 */
const clearRingtone = () => {
  if (confirm('确定要删除自定义铃声吗？')) {
    settingsStore.clearCustomRingtone();
    useCustomRingtone.value = false;
    alert('铃声已删除');
  }
};

/**
 * 测试默认铃声
 */
const testDefaultRingtone = () => {
  if (notificationService.playDefaultRingtone) {
    notificationService.playDefaultRingtone('default');
  } else {
    // 如果方法不存在，尝试使用通用的播放方法
    notificationService.playReminderSound('default');
  }
};

// 监听 store 变化，同步输入框（防止从其他地方修改了用户资料）
watch(() => userProfileStore.nickname, (newVal) => {
  if (nicknameInput.value !== newVal) {
    nicknameInput.value = newVal || '';
  }
});

watch(() => userProfileStore.birthday, (newVal) => {
  if (birthdayInput.value !== newVal) {
    birthdayInput.value = newVal || '';
  }
});

watch(() => userProfileStore.gender, (newVal) => {
  if (genderInput.value !== newVal) {
    genderInput.value = newVal || '';
  }
});

// 监听输入框变化，自动保存生日和性别
watch(birthdayInput, (newVal) => {
  if (newVal) {
    const result = userProfileStore.validateBirthday?.(newVal) || { valid: true };
    if (result.valid) {
      userProfileStore.setBirthday(newVal);
    }
  }
});

watch(genderInput, (newVal) => {
  if (newVal) {
    const result = userProfileStore.validateGender?.(newVal) || { valid: true };
    if (result.valid) {
      userProfileStore.setGender(newVal);
    }
  }
});
</script>

<style scoped>
/* 主题模式按钮样式 */
.theme-mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.theme-mode-button:hover {
  border-color: var(--primary-light);
}

.theme-mode-button-active {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
}

.dark .theme-mode-button-active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-light);
}

/* 字体大小按钮样式 */
.font-size-button {
  padding: 0.375rem 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.font-size-button:hover {
  border-color: var(--border-hover);
}

.font-size-button-active {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
}

/* 文字颜色按钮样式 */
.text-color-button {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;
}

.text-color-button:hover {
  transform: scale(1.1);
}

.text-color-button-active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 预设背景按钮样式 */
.preset-background-button {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.preset-background-button:hover {
  transform: scale(1.05);
  border-color: var(--primary-light);
}

.preset-background-button-active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.preset-background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.5rem;
}

.preset-background-dynamic-badge {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: linear-gradient(to right, #a855f7, #3b82f6);
  border-radius: 0.25rem;
  color: white;
  font-size: 0.625rem;
  font-weight: 500;
}

.preset-background-check {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1rem;
  height: 1rem;
  background: var(--primary-color);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ollama 开关样式 */
.ollama-toggle-track {
  width: 2.75rem;
  height: 1.5rem;
  background: var(--border-color);
  border-radius: 9999px;
  transition: all 0.3s ease;
  position: relative;
}

.ollama-toggle-track::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.peer:checked + .ollama-toggle-track {
  background: var(--primary-color);
}

.peer:checked + .ollama-toggle-track::after {
  transform: translateX(1.25rem);
  border-color: white;
}

.peer:focus-visible + .ollama-toggle-track {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}

.dark .ollama-toggle-track {
  background: var(--dark-border-color);
}

.dark .ollama-toggle-track::after {
  border-color: var(--dark-border-color);
  background: var(--dark-bg-primary);
}

.dark .peer:checked + .ollama-toggle-track::after {
  border-color: white;
  background: white;
}

/* Ollama 测试结果样式 */
.ollama-test-success {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.ollama-test-error {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
