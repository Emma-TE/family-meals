// Shared styles and theme constants
export const theme = {
    colors: {
      primary: '#667eea',
      primaryDark: '#5a67d8',
      primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: '#48bb78',
      secondaryDark: '#38a169',
      danger: '#f56565',
      dangerDark: '#e53e3e',
      warning: '#ecc94b',
      info: '#4299e1',
      background: '#f7fafc',
      cardBg: 'white',
      text: {
        primary: '#1a202c',
        secondary: '#4a5568',
        muted: '#718096',
        light: '#a0aec0'
      },
      border: '#e2e8f0',
      accent: '#9f7aea'
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 25px rgba(0,0,0,0.1)',
      xl: '0 20px 60px rgba(0,0,0,0.3)',
      hover: '0 10px 30px rgba(102, 126, 234, 0.3)'
    },
    borderRadius: {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '20px',
      full: '9999px'
    },
    animations: {
      fadeIn: 'fadeIn 0.5s ease-out',
      slideUp: 'slideUp 0.4s ease-out',
      bounce: 'bounce 2s infinite',
      pulse: 'pulse 2s infinite'
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    typography: {
      fontSizes: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px'
      },
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    }
  }
  
  // Global CSS animations
  export const globalStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    
    * {
      transition: all 0.2s ease;
    }
    
    body {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      min-height: 100vh;
    }
  `