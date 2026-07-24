import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeModeContext = createContext({ toggleTheme: () => {}, mode: 'light' });
export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('theme_mode') || 'light');

  useEffect(() => { localStorage.setItem('theme_mode', mode); }, [mode]);
  const toggleTheme = () => setMode((p) => (p === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() => {
    const isDark = mode === 'dark';
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#4F46E5',           // deep indigo
          dark: '#3730A3',
          light: '#7C3AED',          // electric violet
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#7C3AED',
          contrastText: '#ffffff',
        },
        success:  { main: '#10B981', light: '#D1FAE5', dark: '#059669' },
        warning:  { main: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
        error:    { main: '#F43F5E', light: '#FFE4E6', dark: '#BE123C' },
        info:     { main: '#F97316', light: '#FFEDD5', dark: '#C2410C' }, // "expiring" orange
        background: {
          default: isDark ? '#0F1117' : '#FAFAFA',
          paper:   isDark ? '#1A1D27' : '#FFFFFF',
        },
        text: {
          primary:   isDark ? '#F1F5F9' : '#0F172A',
          secondary: isDark ? '#94A3B8' : '#64748B',
          disabled:  isDark ? '#475569' : '#CBD5E1',
        },
        divider: isDark ? '#2D3148' : '#E8ECF0',
        // Custom semantic tokens surfaced via palette
        mou: {
          draft:    '#94A3B8',
          active:   '#10B981',
          pending:  '#F59E0B',
          expiring: '#F97316',
          expired:  '#F43F5E',
          renewed:  '#4F46E5',
        },
      },

      typography: {
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        h1: { fontWeight: 800, letterSpacing: '-0.03em' },
        h2: { fontWeight: 800, letterSpacing: '-0.025em' },
        h3: { fontWeight: 700, letterSpacing: '-0.02em' },
        h4: { fontWeight: 700, letterSpacing: '-0.015em' },
        h5: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 700, letterSpacing: '-0.005em' },
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
        body1:  { fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.7 },
        body2:  { fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.6 },
        caption:{ fontFamily: "'Inter', system-ui, sans-serif" },
        button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
      },

      shape: { borderRadius: 14 },

      shadows: [
        'none',
        isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(15,23,42,0.06)',
        isDark ? '0 2px 6px rgba(0,0,0,0.35)' : '0 2px 6px rgba(15,23,42,0.06)',
        isDark ? '0 4px 12px rgba(0,0,0,0.35)' : '0 4px 12px rgba(15,23,42,0.07)',
        isDark ? '0 6px 20px rgba(0,0,0,0.3)'  : '0 6px 20px rgba(15,23,42,0.08)',
        isDark ? '0 8px 28px rgba(0,0,0,0.3)'  : '0 8px 28px rgba(15,23,42,0.09)',
        isDark ? '0 12px 40px rgba(0,0,0,0.28)': '0 12px 40px rgba(15,23,42,0.10)',
        ...Array(18).fill('none'),
        isDark ? '0 20px 60px rgba(0,0,0,0.35)': '0 20px 60px rgba(15,23,42,0.14)',
        ...Array(3).fill('none'),
        isDark ? '0 28px 80px rgba(0,0,0,0.4)' : '0 28px 80px rgba(15,23,42,0.18)',
      ],

      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '*': { boxSizing: 'border-box' },
            '::selection': { background: '#4F46E520' },
            ':focus-visible': {
              outline: '2px solid #4F46E5',
              outlineOffset: '3px',
            },
          },
        },

        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              padding: '8px 20px',
              transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
              boxShadow: 'none',
              '&:active': { transform: 'scale(0.97)' },
              '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
            },
            contained: {
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
              },
            },
            containedError: { background: '#F43F5E', '&:hover': { background: '#BE123C' } },
            containedSuccess: { background: '#10B981', '&:hover': { background: '#059669' } },
          },
        },

        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderRadius: '16px',
              border: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}`,
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.2)'
                : '0 2px 12px rgba(15,23,42,0.05)',
              transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s ease',
            },
          },
        },

        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? 'rgba(15,17,23,0.85)' : 'rgba(250,250,250,0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'none',
              borderBottom: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}`,
            },
          },
        },

        MuiDrawer: {
          styleOverrides: {
            paper: {
              background: isDark ? '#12141E' : '#FFFFFF',
              borderRight: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}`,
            },
          },
        },

        MuiChip: {
          styleOverrides: {
            root: { fontWeight: 700, borderRadius: '8px', fontSize: '0.72rem' },
          },
        },

        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                transition: 'box-shadow 0.18s ease',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(79,70,229,0.15)',
                },
              },
            },
          },
        },

        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: '20px',
              border: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}`,
              backgroundImage: 'none',
            },
          },
        },

        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontFamily: "'Inter', system-ui, sans-serif",
              background: isDark ? '#1E2235' : '#0F172A',
              padding: '6px 10px',
            },
          },
        },

        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableCell-root': {
                background: isDark ? '#14172200' : '#F8FAFC00',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isDark ? '#64748B' : '#94A3B8',
                borderBottom: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}`,
              },
            },
          },
        },

        MuiTableRow: {
          styleOverrides: {
            root: {
              transition: 'background-color 0.15s ease',
              '&:last-child td': { borderBottom: 0 },
            },
          },
        },

        MuiLinearProgress: {
          styleOverrides: {
            root: { borderRadius: 999, height: 6 },
            bar: { borderRadius: 999 },
          },
        },

        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
            },
          },
        },
      },
    });
  }, [mode]);

  const value = useMemo(() => ({ toggleTheme, mode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
