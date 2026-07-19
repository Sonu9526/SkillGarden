"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flower2, Eye, EyeOff, Loader2, Chrome } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("bloom-authenticated");
      if (auth === "true") {
        router.push("/garden");
      }
    }
  }, [router]);

  // Load Google Identity Services SDK script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred during authentication.");
        setLoading(false);
        return;
      }

      localStorage.setItem("bloom-authenticated", "true");
      localStorage.setItem("bloom-user-email", data.email);
      localStorage.setItem("bloom-user-name", data.name || data.email.split("@")[0]);
      if (data.image) {
        localStorage.setItem("bloom-user-picture", data.image);
      } else {
        localStorage.removeItem("bloom-user-picture");
      }
      
      router.push("/garden");
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setError(
        "Google Client ID is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env file."
      );
      return;
    }

    try {
      if (typeof window !== "undefined" && window.google) {
        setLoading(true);
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "openid profile email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                });
                const userInfo = await res.json();
                
                if (userInfo && userInfo.email) {
                  // Authenticate and upsert Google user via database login API
                  const dbRes = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: userInfo.email,
                      name: userInfo.name,
                      image: userInfo.picture,
                      isGoogle: true
                    })
                  });

                  const dbData = await dbRes.json();

                  if (!dbRes.ok) {
                    setError(dbData.error || "Failed to authenticate Google account with database.");
                    setLoading(false);
                    return;
                  }

                  localStorage.setItem("bloom-authenticated", "true");
                  localStorage.setItem("bloom-user-email", dbData.email);
                  localStorage.setItem("bloom-user-name", dbData.name);
                  if (dbData.image) {
                    localStorage.setItem("bloom-user-picture", dbData.image);
                  } else {
                    localStorage.removeItem("bloom-user-picture");
                  }
                  
                  router.push("/garden");
                } else {
                  setError("Failed to retrieve Google user details.");
                  setLoading(false);
                }
              } catch (err) {
                setError("Error fetching Google profile information.");
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err: any) => {
            setError("Google login initialization failed.");
            setLoading(false);
          }
        });
        client.requestAccessToken();
      } else {
        setError("Google Identity Services script is still loading. Please try again in a moment.");
      }
    } catch (err) {
      setError("An unexpected error occurred during Google Sign-in.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f5ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient blurs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#eef6e7] rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#eef6e7] rounded-full blur-3xl opacity-60 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-bold text-ink">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-xl">
            <Flower2 size={24} />
          </span>
          <span className="text-2xl tracking-tight">Bloom</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-ink tracking-tight">
          {isSignUp ? "Create your SkillGarden" : "Sign in to Bloom"}
        </h2>
        <p className="mt-2 text-center text-sm text-ink/60">
          Or{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="font-bold text-leaf hover:text-moss transition duration-150 underline decoration-2 underline-offset-4"
          >
            {isSignUp ? "sign in to existing account" : "create a new account"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-[0_20px_50px_rgba(23,33,27,0.06)] border border-ink/5 sm:rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-ink/10 rounded-2xl shadow-sm placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-leaf focus:border-leaf text-sm transition duration-150"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-ink/10 rounded-2xl shadow-sm placeholder-ink/30 focus:outline-none focus:ring-2 focus:ring-leaf focus:border-leaf text-sm transition duration-150"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-ink/40 hover:text-ink/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-leaf focus:ring-leaf border-ink/10 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 font-medium text-ink/75">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-leaf hover:text-moss transition">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-ink hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-white text-ink/40 font-bold">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-ink/10 rounded-full shadow-sm bg-white hover:bg-ink/5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition duration-200 active:scale-[0.98]"
              >
                <Chrome size={18} className="text-red-500" />
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
