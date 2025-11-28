import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/ThemeContext";
import { PhotosProvider } from "./lib/PhotosContext";
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

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <PhotosProvider>
            <BrowserRouter>
              <Routes>
                {/* Public auth routes (no layout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </PhotosProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
