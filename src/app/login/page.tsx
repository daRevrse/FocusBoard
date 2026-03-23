"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Target } from "lucide-react";
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
        <div className="flex min-h-screen bg-[#FDFBF7] selection:bg-slate-200 selection:text-black font-sans text-black">
            {/* Left Side - Presentation */}
            <div className="hidden w-1/2 lg:flex flex-col justify-between p-12 relative overflow-hidden bg-black text-white">
                <div className="absolute inset-0 z-0 opacity-50">
                    <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" alt="Office Background" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay grayscale" />
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight">Faucus</span>
                </div>

                <div className="relative z-10 max-w-lg mb-24">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        La plateforme <br />d'exécution de<br />votre équipe.
                    </h1>
                    <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                        Levez le brouillard. Gérez vos projets, optimisez les performances, sécurisez vos données dans un QG central.
                    </p>
                    {/* <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <img key={i} className="w-10 h-10 rounded-full border-2 border-black" src={`https://api.dicebear.com/7.x/initials/svg?seed=User${i}`} alt="user" />
                            ))}
                        </div>
                        <p>Des PME plus connectées</p>
                    </div> */}
                </div>

                <div className="relative z-10 text-sm font-bold text-slate-500">
                    &copy; {new Date().getFullYear()} Faucus. Le framework d'exécution.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FDFBF7] relative">
                {/* Mobile logo fallback */}
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-black">Faucus</span>
                </div>

                <div className="w-full max-w-md space-y-8 bg-white p-10 sm:p-12 rounded-[40px] shadow-sm border border-[#EBE6E0]">
                    <div className="text-center sm:text-left">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyName || "Company Logo"} className="h-12 mb-6 object-contain mx-auto sm:mx-0 rounded-lg" />
                        ) : companyName ? (
                            <div className="text-2xl font-extrabold tracking-tight text-black mb-6">{companyName}</div>
                        ) : (
                            <div className="h-4 mb-2 flex items-center justify-center sm:justify-start">
                                {/* Placeholder height to prevent layout shift */}
                            </div>
                        )}
                        <h2 className="text-3xl font-extrabold tracking-tight text-black">Connexion</h2>
                        <p className="mt-2 text-base text-slate-500 font-medium">
                            Entrez vos identifiants pour accéder au QG.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="rounded-[16px] bg-red-50 p-4 text-sm text-red-600 font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold text-black">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="vous@entreprise.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={handleEmailBlur}
                                required
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-bold text-black">Mot de passe</Label>
                                <Link href="/forgot-password" className="text-sm font-bold text-slate-500 hover:text-black">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                                required
                            />
                        </div>

                        <Button className="w-full h-14 text-base font-extrabold transition-all bg-black hover:bg-slate-800 text-white rounded-full mt-4" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Se connecter"}
                        </Button>
                    </form>

                    <div className="pt-8 border-t border-[#EBE6E0]">
                        <div className="text-center sm:text-left text-sm text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between">
                            <span>Pas encore d'espace ?</span>
                            <Link href="/register" className="inline-flex items-center font-bold text-black hover:text-slate-600 mt-2 sm:mt-0 transition-colors">
                                Créer une entreprise <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
