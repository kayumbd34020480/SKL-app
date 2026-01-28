"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Mail, Lock, User, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName);
      // Show success screen - user stays logged in but will see pending modal
      setRegistrationSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600">Your account has been created</p>
            </div>

            {/* Waiting Message */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Please wait for administrator approval
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Your account is pending review. This usually takes a short time. You will be able to access your dashboard once approved.
                  </p>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm text-gray-600">Awaiting admin approval...</span>
              </div>
            </div>

            {/* Go to Dashboard Button */}
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-xl font-medium">
                Continue to Dashboard
              </Button>
            </Link>

            {/* Help text */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Need help? Contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900">Create Account</CardTitle>
          <CardDescription className="text-emerald-700">
            Start your earning journey with SKL TECH ZONE
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-emerald-800">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-800">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-800">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-emerald-800">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 pt-6">
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-emerald-700 mt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
