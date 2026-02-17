# 项目清理与重构计划

&gt; **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 系统地识别并移除项目中所有冗余、无效或不再使用的测试样例、相关代码文件及配套文档，同时重构以移除ai-model-architecture依赖。

**架构:** 
1. 重构chat.js store，使用现有的zhipuClient.js替代ai-model-architecture
2. 删除完整的ai-model-architecture目录
3. 清理冗余的测试文件
4. 清理冗余的文档文件
5. 验证项目功能完整性

**技术栈:** Vue 3 + Vite + Tailwind CSS + Element Plus

---

## 已识别的冗余内容

### 1. 废弃代码目录
- `src/ai-model-architecture/` - 完整目录（包含多个子目录和文件）

### 2. 冗余测试文件
- `tests/LOCATION_TEST_GUIDE.md` - 测试指南文档
- `tests/location-comprehensive-report.md` - 测试报告模板
- `tests/location-test-tool.html` - 浏览器测试工具
- `tests/location-comprehensive-test.js` - 综合测试脚本
- `tests/location-weather-automation.js` - 自动化测试脚本
- `tests/apiConnectivityTest.js` - API连通性测试
- `tests/performanceOptimizer.spec.js` - 性能优化测试
- `tests/tencent-api-simple-test.js` - 腾讯API简单测试
- `tests/zhipu-api-check.mjs` - 智谱API检查
- `tests/zhipu-comprehensive-test.js` - 智谱综合测试
- `tests/zhipu-integration-test.js` - 智谱集成测试
- `tests/comprehensive-api-check.mjs` - 综合API检查
- `tests/autoLocationWeatherService.test.mjs` - 自动定位天气服务测试
- `tests/unit/model-module.test.js` - 单元测试

### 3. 冗余文档文件
- `docs/bugfix_report_browser_location_timeout.md` - 浏览器定位超时修复报告
- `docs/incident_report_20260206.md` - 事件报告
- `docs/功能影响矩阵.md` - 功能影响矩阵
- `docs/回滚方案.md` - 回滚方案
- `docs/数据存储与隐私说明.md` - 数据存储说明
- `docs/回归测试清单.md` - 回归测试清单
- `docs/浏览器存储机制详解.md` - 浏览器存储机制
- `docs/监控配置.md` - 监控配置
- `docs/需求规格说明书-自然语言日程创建.md` - 需求规格说明
- `docs/风险评估报告.md` - 风险评估报告
- `docs/测试报告.md` - 测试报告
- `docs/UI_CHECKLIST.md` - UI检查清单
- `docs/TEST_CASES_BACKGROUND_UPLOAD.md` - 测试用例背景上传
- `docs/MISSING_RESOURCES_REPORT.md` - 缺失资源报告
- `docs/PROJECT_REPORT_20260206.md` - 项目报告
- `docs/troubleshooting_guide.md` - 故障排除指南
- `docs/文档归类报告.md` - 文档归类报告
- `docs/文档索引.md` - 文档索引（部分过时）

---

## 任务列表

### Task 1: 重构 chat.js Store - 移除 ai-model-architecture 依赖

**文件:**
- Modify: `src/stores/chat.js`

**步骤:**
1. 将 ai-model-architecture 的导入替换为使用 zhipuClient.js
2. 重构所有使用 ModelManager 的代码
3. 确保所有功能保持完整
4. 测试应用是否正常运行

**代码变更:**
```javascript
// 原导入
import { modelManager } from '@/ai-model-architecture/manager/ModelManager.js';
import {
  ModelType,
  SystemModel,
  createUserMessage,
  createAssistantMessage,
  createSystemMessage
} from '@/ai-model-architecture/types/modelTypes.js';

// 新导入
import ZhipuClient from '@/api/zhipuClient.js';
```

### Task 2: 删除 ai-model-architecture 目录

**文件:**
- Delete: `src/ai-model-architecture/` 完整目录

**步骤:**
1. 确认重构完成后删除整个目录
2. 检查是否还有其他文件引用该目录

### Task 3: 删除冗余测试文件

**文件:**
- Delete: `tests/LOCATION_TEST_GUIDE.md`
- Delete: `tests/location-comprehensive-report.md`
- Delete: `tests/location-test-tool.html`
- Delete: `tests/location-comprehensive-test.js`
- Delete: `tests/location-weather-automation.js`
- Delete: `tests/apiConnectivityTest.js`
- Delete: `tests/performanceOptimizer.spec.js`
- Delete: `tests/tencent-api-simple-test.js`
- Delete: `tests/zhipu-api-check.mjs`
- Delete: `tests/zhipu-comprehensive-test.js`
- Delete: `tests/zhipu-integration-test.js`
- Delete: `tests/comprehensive-api-check.mjs`
- Delete: `tests/autoLocationWeatherService.test.mjs`
- Delete: `tests/unit/model-module.test.js`

### Task 4: 删除冗余文档文件

**文件:**
- Delete: `docs/bugfix_report_browser_location_timeout.md`
- Delete: `docs/incident_report_20260206.md`
- Delete: `docs/功能影响矩阵.md`
- Delete: `docs/回滚方案.md`
- Delete: `docs/数据存储与隐私说明.md`
- Delete: `docs/回归测试清单.md`
- Delete: `docs/浏览器存储机制详解.md`
- Delete: `docs/监控配置.md`
- Delete: `docs/需求规格说明书-自然语言日程创建.md`
- Delete: `docs/风险评估报告.md`
- Delete: `docs/测试报告.md`
- Delete: `docs/UI_CHECKLIST.md`
- Delete: `docs/TEST_CASES_BACKGROUND_UPLOAD.md`
- Delete: `docs/MISSING_RESOURCES_REPORT.md`
- Delete: `docs/PROJECT_REPORT_20260206.md`
- Delete: `docs/troubleshooting_guide.md`
- Delete: `docs/文档归类报告.md`
- Delete: `docs/文档索引.md`

### Task 5: 验证项目功能完整性

**步骤:**
1. 运行 npm run dev 启动开发服务器
2. 检查应用是否正常启动
3. 验证聊天功能是否正常
4. 验证API调用是否正常
5. 运行 npm run build 确保构建成功
6. 运行 npm run lint 确保代码规范检查

---

## 执行顺序

1. 重构 chat.js store
2. 验证重构后功能正常
3. 删除 ai-model-architecture 目录
4. 删除冗余测试文件
5. 删除冗余文档文件
6. 最终验证项目完整性
