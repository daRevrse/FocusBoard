"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            await sendPasswordResetEmail(auth, email);
            setStatus("success");
        } catch (error: any) {
            console.error("Password reset error:", error);
            setStatus("error");
            if (error.code === 'auth/user-not-found') {
                setErrorMessage("Aucun compte ne correspond à cette adresse e-mail.");
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage("L'adresse e-mail est invalide.");
            } else {
                setErrorMessage("Une erreur est survenue lors de l'envoi de l'e-mail de réinitialisation.");
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden text-center sm:text-left">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                            F
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 text-xl">FocusBoard</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Mot de passe oublié ?</h1>

                    {status === "success" ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center space-y-4 my-8">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-medium text-emerald-900">E-mail envoyé !</h2>
                            <p className="text-sm text-emerald-700">
                                Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation vous a été envoyé.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full mt-4 bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                                asChild
                            >
                                <Link href="/login">Retour à la connexion</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                                Entrez l'adresse e-mail associée à votre compte, et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                            </p>

                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 text-left block">Adresse E-mail Professionnelle</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="vous@entreprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                    {status === "error" && (
                                        <p className="text-sm text-red-500 mt-2 text-left">{errorMessage}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                    disabled={status === "loading" || !email}
                                >
                                    {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Envoyer le lien
                                </Button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour à la page de connexion
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
