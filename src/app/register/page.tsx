"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create Company in Firestore
            const companyId = uuidv4();
            await setDoc(doc(db, "companies", companyId), {
                name: companyName,
                created_at: new Date(),
            });

            // 3. Create User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                full_name: fullName,
                role: "admin",
                company_id: companyId,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
                created_at: new Date(),
            });

            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError("Erreur lors de la création du compte. L'email est peut-être déjà utilisé.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] selection:bg-slate-200 selection:text-black font-sans text-black">
            {/* Left Side - Presentation */}
            <div className="hidden w-1/2 lg:flex flex-col justify-between p-12 relative overflow-hidden bg-black text-white">
                <div className="absolute inset-0 z-0 opacity-50">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Team Collaboration" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay grayscale" />
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight">Faucus</span>
                </div>

                <div className="relative z-10 max-w-lg mb-24">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        Construisez une équipe<br />plus performante.
                    </h1>
                    <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                        Rejoignez Faucus et offrez à votre entreprise le framework conçu pour clarifier les objectifs et détruire les silos.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                        <div className="flex -space-x-2">
                            {[5, 6, 7].map(i => (
                                <img key={i} className="w-10 h-10 rounded-full border-2 border-black" src={`https://api.dicebear.com/7.x/initials/svg?seed=UX${i}`} alt="user" />
                            ))}
                        </div>
                        <p>Des PME plus connectées</p>
                    </div>
                </div>

                <div className="relative z-10 text-sm font-bold text-slate-500">
                    &copy; {new Date().getFullYear()} Faucus. Le framework d'exécution.
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FDFBF7] relative overflow-y-auto">
                {/* Mobile logo fallback */}
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-black">Faucus</span>
                </div>

                <div className="w-full max-w-md space-y-8 my-auto bg-white p-10 sm:p-12 rounded-[40px] shadow-sm border border-[#EBE6E0] mt-16 sm:mt-0">
                    <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-black">Lancer l'entreprise</h2>
                        <p className="mt-2 text-base text-slate-500 font-medium">
                            14 jours offerts pour déployer le framework.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="rounded-[16px] bg-red-50 p-4 text-sm text-red-600 font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-sm font-bold text-black">Nom de l'entreprise</Label>
                            <Input
                                id="companyName"
                                placeholder="The Agency"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-bold text-black">Votre nom complet</Label>
                            <Input
                                id="fullName"
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold text-black">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jane@theagency.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-bold text-black">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                            />
                        </div>

                        <Button className="w-full h-14 text-base font-extrabold transition-all bg-black hover:bg-slate-800 text-white rounded-full mt-4" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Créer l'entreprise"}
                        </Button>
                    </form>

                    <div className="pt-8 border-t border-[#EBE6E0]">
                        <div className="text-center sm:text-left text-sm text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between">
                            <span>Déjà un compte ?</span>
                            <Link href="/login" className="inline-flex items-center font-bold text-black hover:text-slate-600 mt-2 sm:mt-0 transition-colors">
                                Connexion <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
