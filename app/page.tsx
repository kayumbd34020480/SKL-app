"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Wallet, ClipboardCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <span className="text-lg md:text-xl font-bold text-emerald-900">NK TECH ZONE</span>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 bg-transparent px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-3">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="w-full text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-900 mb-6 leading-tight text-balance">
            NK Tech Zone
          </h1>
          <p className="text-lg md:text-xl text-emerald-700 mb-8 max-w-3xl mx-auto text-pretty">
            NK Tech Zone হলো এমন একটি আধুনিক প্লাটফর্ম যেইখানে ওয়ার্কারদের কাজ ম্যানেজমেন্ট, কাজ জমা, অ্যাডমিন approval, এবং পেমেন্ট সবকিছু একজায়গা থেকে স্মার্টভাবে কন্ট্রোল করা হয়।
          </p>
          <p className="text-sm text-emerald-600 mb-8">
            Developer: Md Kayum Islam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 text-center mb-12">
            Why Choose NK TECH ZONE?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-3">Simple Tasks</h3>
                <p className="text-gray-600">
                  Complete easy tasks and earn rewards instantly. No experience required.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-3">Secure Platform</h3>
                <p className="text-gray-600">
                  Your data and earnings are protected with enterprise-grade security.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-3">Easy Withdrawals</h3>
                <p className="text-gray-600">
                  Withdraw your earnings anytime via multiple payment methods.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-emerald-50">
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Sign up in less than a minute" },
              { step: "2", title: "Browse Tasks", desc: "Find tasks that match your skills" },
              { step: "3", title: "Complete & Submit", desc: "Do the task and submit proof" },
              { step: "4", title: "Get Paid", desc: "Receive rewards after approval" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-6">
                Start Building Your Income Today
              </h2>
              <div className="space-y-4">
                {[
                  "No investment required to start",
                  "Flexible working hours",
                  "Instant reward crediting",
                  "24/7 customer support",
                  "Multiple withdrawal options",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link href="/register">
                <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Join Now - It&apos;s Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white">
              <div className="text-center">
                <p className="text-emerald-100 mb-2">Start Earning</p>
                <p className="text-5xl font-bold mb-4">৳10,000+</p>
                <p className="text-emerald-100">Per month potential earnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-emerald-900">
        <div className="w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-emerald-200 text-lg mb-8">
            Join thousands of users who are already earning with NK TECH ZONE
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 px-8 py-6 text-lg">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-emerald-100 bg-white">
        <div className="w-full flex flex-col items-center gap-3 text-center">
          <span className="font-semibold text-emerald-900">NK TECH ZONE</span>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} NK TECH ZONE. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Developer: MD KAYUM ISLAM
          </p>
        </div>
      </footer>
    </div>
  );
}
