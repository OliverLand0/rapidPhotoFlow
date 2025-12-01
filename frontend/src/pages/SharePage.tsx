import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Download, Lock, AlertCircle, Image } from "lucide-react";
import { publicShareClient } from "../lib/api/client";
import type { PublicShareResponse } from "../lib/api/types";

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [shareInfo, setShareInfo] = useState<PublicShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadShareInfo = async () => {
      try {
        const info = await publicShareClient.getShareInfo(token);
        setShareInfo(info);
      } catch (err) {
        setError("Failed to load share information");
      } finally {
        setLoading(false);
      }
    };

    loadShareInfo();
  }, [token]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setIsVerifying(true);
    setPasswordError(null);

    try {
      const result = await publicShareClient.verifyPassword(token, password);
      if (result.valid) {
        setIsVerified(true);
      } else {
        setPasswordError(result.error || "Invalid password");
      }
    } catch {
      setPasswordError("Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!token) return;
    window.location.href = publicShareClient.getDownloadUrl(token);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error || !shareInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Share Not Found</h1>
          <p className="text-zinc-400">
            This share link may have been deleted or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (!shareInfo.isAccessible) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-2">
            {shareInfo.isExpired ? "Link Expired" : "Link Unavailable"}
          </h1>
          <p className="text-zinc-400">
            {shareInfo.errorMessage || "This share link is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  // Password gate
  if (shareInfo.requiresPassword && !isVerified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 mx-auto mb-3 text-zinc-400" />
            <h1 className="text-xl font-bold text-white">Password Required</h1>
            <p className="text-zinc-400 text-sm mt-1">
              This photo is password protected
            </p>
          </div>

          <form onSubmit={handleVerifyPassword}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              autoFocus
            />

            {passwordError && (
              <p className="text-sm text-red-500 mb-3">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "View Photo"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Photo viewer
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="h-6 w-6 text-zinc-400" />
            <h1 className="text-white font-medium truncate max-w-xs">
              {shareInfo.name}
            </h1>
          </div>

          {shareInfo.downloadAllowed && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
        </div>
      </header>

      {/* Photo */}
      <main className="flex-1 flex items-center justify-center p-4">
        <img
          src={publicShareClient.getPhotoUrl(token!)}
          alt={shareInfo.name}
          className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg shadow-2xl"
        />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-xs">
          Shared via RapidPhotoFlow
        </div>
      </footer>
    </div>
  );
}
