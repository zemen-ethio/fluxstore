import React, { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export const Auth = () => {
    const [error, setError] = useState<string | null>(null);

    const signIn = async () => {
        try {
            setError(null);
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "Failed to sign in. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <h1 className="text-2xl font-bold mb-8">Welcome to Fluxstore AI</h1>
            
            <button 
                onClick={signIn}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
            >
                Sign in with Google to use Fluxstore
            </button>

            {error && (
                <div className="text-red-500 text-sm max-w-md text-center bg-red-50 p-3 rounded-md border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
};
