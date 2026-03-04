"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [companyLogo, setCompanyLogo] = useState("");
    const [companyName, setCompanyName] = useState("");

    const router = useRouter();

    const handleEmailBlur = async () => {
        if (!email || !email.includes("@")) return;
        try {
            const res = await fetch(`/api/public/company?email=${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                setCompanyLogo(data.logo_url || "");
                setCompanyName(data.name || "");
            }
        } catch (err) {
            console.error("Error fetching company details:", err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError("Identifiants incorrects ou compte inexistant.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Presentation */}
            <div className="hidden w-1/2 lg:flex flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-900/40 z-0"></div>
                <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-blue-500/30 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">
                        F
                    </div>
                    <span className="text-xl font-bold tracking-tight">FocusBoard</span>
                </div>

                <div className="relative z-10 max-w-lg mb-24">
                    <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        La plateforme de gestion de tâches pour les équipes performantes.
                    </h1>
                    <p className="text-lg text-slate-300 mb-8">
                        Centralisez vos projets, suivez vos objectifs et facilitez la collaboration au sein de votre entreprise avec une interface pensée pour la productivité.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <img key={i} className="w-8 h-8 rounded-full border-2 border-slate-900" src={`https://api.dicebear.com/7.x/initials/svg?seed=User${i}`} alt="user" />
                            ))}
                        </div>
                        <p>Rejoignez plus de 10,000 équipes</p>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} FocusBoard. Tous droits réservés.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative">
                {/* Mobile logo fallback */}
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                        F
                    </div>
                    <span className="font-bold tracking-tight text-slate-900">FocusBoard</span>
                </div>

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center sm:text-left">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyName || "Company Logo"} className="h-12 mb-6 object-contain mx-auto sm:mx-0" />
                        ) : companyName ? (
                            <div className="text-2xl font-bold tracking-tight text-slate-900 mb-6">{companyName}</div>
                        ) : (
                            <div className="h-12 mb-6 flex items-center justify-center sm:justify-start">
                                {/* Placeholder height to prevent layout shift */}
                            </div>
                        )}
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Connexion</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Entrez vos identifiants pour accéder à votre espace de travail.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="vous@entreprise.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={handleEmailBlur}
                                required
                                className="h-12 bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</Label>
                                <Link href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-white"
                            />
                        </div>

                        <Button className="w-full h-12 text-base font-medium shadow-sm transition-all bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Se connecter"}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-slate-200">
                        <div className="text-center sm:text-left text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between">
                            <span>Pas encore d'espace entreprise ?</span>
                            <Link href="/register" className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500 mt-2 sm:mt-0 transition-colors">
                                Créer une entreprise <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
