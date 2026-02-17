export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-out': 'scaleOut 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        shimmer: 'shimmer 1.5s infinite',
        ripple: 'ripple 0.6s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        ripple: {
          to: { transform: 'scale(4)', opacity: '0' }
        }
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: [
    function ({ addUtilities, addComponents, theme }) {
      // 添加自定义工具类
      addUtilities({
        '.text-gradient': {
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        },
        '.bg-gradient-primary': {
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
        },
        '.bg-gradient-secondary': {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
        },
        '.bg-gradient-success': {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        },
        '.bg-gradient-warning': {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        },
        '.bg-gradient-error': {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.35)'
        },
        '.glass-dark': {
          background: 'rgba(30, 41, 59, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        },
        '.glass-container': {
          background: 'rgba(255, 255, 255, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        },
        '.glass-container-dark': {
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        },
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1'
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2'
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3'
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent'
        },
        '.will-change-transform': {
          'will-change': 'transform'
        },
        '.gpu-accelerate': {
          transform: 'translateZ(0)',
          'backface-visibility': 'hidden'
        }
      });

      // 添加自定义组件
      addComponents({
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transitionProperty: 'all',
          transitionDuration: theme('transitionDuration.200'),
          transitionTimingFunction: theme('transitionTimingFunction.in-out'),
          '&:focus-visible': {
            outline: 'none',
            ring: '2px',
            ringOffset: '2px'
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed'
          }
        },
        '.btn-primary': {
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          },
          '&:active': {
            transform: 'translateY(1px)'
          }
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.card'),
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover')
          }
        },
        '.input': {
          width: '100%',
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.surface.200')}`,
          backgroundColor: theme('colors.white'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`
          },
          '&::placeholder': {
            color: theme('colors.surface.400')
          }
        }
      });
    }
  ]
};
