import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { I18nProvider } from './contexts/I18nContext';
import { theme } from './theme';
import './i18n';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <I18nProvider>
              <AuthProvider>
                <SocketProvider>
                  <SnackbarProvider 
                    maxSnack={3}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <App />
                  </SnackbarProvider>
                </SocketProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
); 