import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Component, type ReactNode } from "react";
import { ThemeProvider } from "./lib/ThemeContext";
import { PhotosProvider } from "./lib/PhotosContext";
import { FoldersProvider } from "./lib/FoldersContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/toast";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { UploadPage } from "./pages/UploadPage";
import { ReviewPage } from "./pages/ReviewPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ConfirmEmailPage } from "./pages/ConfirmEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SharePage } from "./pages/SharePage";
import { SharesPage } from "./pages/SharesPage";

// Error boundary to catch and display errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <PhotosProvider>
            <FoldersProvider>
              <BrowserRouter>
                <Routes>
                {/* Public auth routes (no layout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Public share route (no auth required) */}
                <Route path="/s/:token" element={<SharePage />} />

                {/* Protected app routes (require authentication) */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<UploadPage />} />
                  <Route path="review" element={<ReviewPage />} />
                  <Route path="shares" element={<SharesPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Routes>
              </BrowserRouter>
            </FoldersProvider>
          </PhotosProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
