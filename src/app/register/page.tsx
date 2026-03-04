"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
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
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Presentation */}
            <div className="hidden w-1/2 lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Team Collaboration" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">
                        F
                    </div>
                    <span className="text-xl font-bold tracking-tight">FocusBoard</span>
                </div>

                <div className="relative z-10 max-w-lg mb-24">
                    <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                        Construisez une équipe plus alignée et performante.
                    </h1>
                    <p className="text-lg text-slate-300 mb-8">
                        Rejoignez FocusBoard et offrez à votre entreprise un outil conçu pour maximiser le focus quotidien, clarifier les objectifs et dynamiser la productivité.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                        <div className="flex -space-x-2">
                            {[5, 6, 7].map(i => (
                                <img key={i} className="w-8 h-8 rounded-full border-2 border-slate-900" src={`https://api.dicebear.com/7.x/initials/svg?seed=UX${i}`} alt="user" />
                            ))}
                        </div>
                        <p>Plébiscité par les managers innovants</p>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-slate-400">
                    &copy; {new Date().getFullYear()} FocusBoard. Tous droits réservés.
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative overflow-y-auto">
                {/* Mobile logo fallback */}
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                        F
                    </div>
                    <span className="font-bold tracking-tight text-slate-900">FocusBoard</span>
                </div>

                <div className="w-full max-w-md space-y-8 my-auto">
                    <div className="text-center sm:text-left mt-12 lg:mt-0">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Créer un espace</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Inscrivez votre entreprise et commencez à gérer le focus de votre équipe.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Nom de l'entreprise</Label>
                            <Input
                                id="companyName"
                                placeholder="Acme Corp"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-12 bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Votre nom complet</Label>
                            <Input
                                id="fullName"
                                placeholder="Jean Dupont"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="h-12 bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="j.dupont@acme.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-12 bg-white"
                            />
                        </div>

                        <Button className="w-full h-12 text-base font-medium shadow-sm transition-all bg-indigo-600 hover:bg-indigo-700 mt-2" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Créer mon compte"}
                        </Button>
                    </form>

                    <div className="pt-6 border-t border-slate-200">
                        <div className="text-center sm:text-left text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between">
                            <span>Déjà un compte ?</span>
                            <Link href="/login" className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500 mt-2 sm:mt-0 transition-colors">
                                Se connecter <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
