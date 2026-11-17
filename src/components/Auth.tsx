import React, { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const Auth = () => {
    const [error, setError] = useState<string | null>(null);
    const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

    const signIn = async () => {
        try {
            setError(null);
            setIsUnauthorizedDomain(false);
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Auth error:", err);
            if (err?.code === "auth/unauthorized-domain") {
                setIsUnauthorizedDomain(true);
                setError(
                    `Domain "${window.location.hostname}" is not authorized for Firebase Authentication yet.`
                );
            } else {
                setError(err.message || "Failed to sign in. Please try again.");
            }
        }
    };

    const consoleAuthUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <h1 className="text-2xl font-bold mb-8">Welcome to Fluxstore AI</h1>

            <button
                type="button"
                onClick={signIn}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
            >
                Sign in with Google to use Fluxstore
            </button>

            {error && (
                <div className="text-red-700 text-sm max-w-md text-left bg-red-50 p-4 rounded-lg border border-red-200 space-y-2">
                    <p className="font-medium">{error}</p>
                    {isUnauthorizedDomain && (
                        <p className="text-xs text-red-600 leading-relaxed">
                            Add <code className="font-mono bg-red-100 px-1 py-0.5 rounded">{window.location.hostname}</code> in{" "}
                            <a
                                href={consoleAuthUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                            >
                                Firebase Console → Authentication → Settings → Authorized domains
                            </a>
                            , then try signing in again.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
