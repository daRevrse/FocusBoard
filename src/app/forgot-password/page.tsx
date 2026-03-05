"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2, Target } from "lucide-react";
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
                setErrorMessage("Une erreur est survenue lors de l'envoi du lien.");
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] selection:bg-slate-200 selection:text-black font-sans text-black items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-sm border border-[#EBE6E0] p-10 sm:p-12 relative overflow-hidden text-center sm:text-left">

                <div className="relative z-10">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-8">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
                            <Target className="w-6 h-6" />
                        </div>
                        <span className="font-extrabold tracking-tight text-black text-xl">Faucus</span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-black mb-2">Mot de passe oublié ?</h1>

                    {status === "success" ? (
                        <div className="bg-[#EEF7F2] rounded-[24px] p-8 text-center space-y-4 my-8">
                            <div className="w-14 h-14 bg-white text-[#2E8B57] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2E8B57]/20">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-black">Lien envoyé !</h2>
                            <p className="text-base font-medium text-slate-700">
                                Si un compte existe avec <strong>{email}</strong>, un lien a été envoyé.
                            </p>
                            <Button
                                className="w-full mt-4 h-14 bg-white hover:bg-slate-50 text-black border border-[#EBE6E0] rounded-full font-extrabold transition-colors"
                                asChild
                            >
                                <Link href="/login">Retour à la connexion</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 mb-8 leading-relaxed font-medium text-base">
                                Entrez votre adresse, et nous vous enverrons un lien pour relancer la machine.
                            </p>

                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-bold text-black text-left block">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="vous@entreprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors"
                                    />
                                    {status === "error" && (
                                        <p className="text-sm font-bold text-red-600 mt-2 text-left">{errorMessage}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-black hover:bg-slate-800 text-white font-extrabold rounded-full transition-all"
                                    disabled={status === "loading" || !email}
                                >
                                    {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Envoyer le lien
                                </Button>
                            </form>

                            <div className="mt-8 pt-8 border-t border-[#EBE6E0] text-center">
                                <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-black transition-colors">
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
