/**
 * @fileoverview Commitlint 配置文件
 * 规范提交信息格式，确保提交历史清晰可读
 * @author 智能日历助手团队
 * @version 1.0.0
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 提交类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档更新
        'style', // 代码格式调整
        'refactor', // 代码重构
        'perf', // 性能优化
        'test', // 测试相关
        'chore', // 构建/工具
        'revert', // 回滚提交
        'ci', // CI/CD相关
        'build' // 构建相关
      ]
    ],

    // 提交类型必须小写
    'type-case': [2, 'always', 'lower-case'],

    // 提交类型不能为空
    'type-empty': [2, 'never'],

    // 提交范围格式
    'scope-case': [2, 'always', 'kebab-case'],

    // 提交主题不能为空
    'subject-empty': [2, 'never'],

    // 提交主题不能以句号结尾
    'subject-full-stop': [2, 'never', '.'],

    // 提交主题长度限制
    'subject-max-length': [2, 'always', 100],

    // 提交主题最小长度
    'subject-min-length': [2, 'always', 4],

    // Header长度限制
    'header-max-length': [2, 'always', 120],

    // Body每行最大长度
    'body-max-line-length': [2, 'always', 100],

    // Footer每行最大长度
    'footer-max-line-length': [2, 'always', 100]
  },

  // 提示信息配置
  prompt: {
    messages: {
      skip: '可跳过',
      max: '最多 %d 个字符',
      min: '最少 %d 个字符',
      emptyWarning: '不能为空',
      upperLimitWarning: '超过长度限制',
      lowerLimitWarning: '低于最小长度'
    },
    questions: {
      type: {
        description: '选择提交类型',
        enum: {
          feat: {
            description: '新功能',
            title: 'Features',
            emoji: '✨'
          },
          fix: {
            description: '修复bug',
            title: 'Bug Fixes',
            emoji: '🐛'
          },
          docs: {
            description: '文档更新',
            title: 'Documentation',
            emoji: '📚'
          },
          style: {
            description: '代码格式调整（不影响代码逻辑）',
            title: 'Styles',
            emoji: '💎'
          },
          refactor: {
            description: '代码重构',
            title: 'Code Refactoring',
            emoji: '📦'
          },
          perf: {
            description: '性能优化',
            title: 'Performance Improvements',
            emoji: '🚀'
          },
          test: {
            description: '测试相关',
            title: 'Tests',
            emoji: '🚨'
          },
          chore: {
            description: '构建/工具/依赖',
            title: 'Chores',
            emoji: '⚙️'
          },
          revert: {
            description: '回滚提交',
            title: 'Reverts',
            emoji: '🗑'
          },
          ci: {
            description: 'CI/CD配置',
            title: 'Continuous Integrations',
            emoji: '⚙️'
          },
          build: {
            description: '构建相关',
            title: 'Build System',
            emoji: '🛠'
          }
        }
      },
      scope: {
        description: '选择提交范围（模块或功能区域）'
      },
      subject: {
        description: '填写提交主题（简要描述变更内容）'
      },
      body: {
        description: '填写详细描述（可选，说明变更原因和详细内容）'
      },
      isBreaking: {
        description: '是否为破坏性变更？'
      },
      breakingBody: {
        description: '描述破坏性变更的详细信息'
      },
      breaking: {
        description: '列出破坏性变更'
      },
      isIssueAffected: {
        description: '是否关联Issue？'
      },
      issuesBody: {
        description: '描述关联Issue的详细信息'
      },
      issues: {
        description: '添加Issue引用（如：Fixes #123, Closes #456）'
      }
    }
  }
};
