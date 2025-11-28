import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MailCheck, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignup, resendConfirmationCode, isLoading, isConfigured } = useAuth();

  // Get email from location state or URL params
  const emailFromState = (location.state as { email?: string })?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !code) {
      setError("Please enter both email and verification code");
      return;
    }

    try {
      await confirmSignup({ email, code });
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed. Please try again.";

      if (message.includes("CodeMismatchException")) {
        setError("Invalid verification code. Please check and try again.");
        return;
      }

      if (message.includes("ExpiredCodeException")) {
        setError("Verification code has expired. Please request a new one.");
        return;
      }

      if (message.includes("NotAuthorizedException")) {
        setError("Account is already verified. Please sign in.");
        return;
      }

      setError(message);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await resendConfirmationCode(email);
      setResendSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code. Please try again.";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Not Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Authentication is not configured.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Email Verified!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your email has been verified successfully. You can now sign in to your account.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <MailCheck className="h-6 w-6" />
            Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>A new verification code has been sent to your email.</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Enter the verification code we sent to your email address.
            </p>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading || !!emailFromState}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                disabled={isLoading}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center text-sm space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend verification code"}
              </button>
              <p className="text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
