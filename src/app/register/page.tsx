"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Target, CheckCircle2, ChevronLeft, Building2, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";

const COMPANY_SIZES = [
    { id: "1-10", label: "1-10 employés" },
    { id: "11-50", label: "11-50 employés" },
    { id: "51-200", label: "51-200 employés" },
    { id: "201+", label: "201+ employés" },
];

const JOB_ROLES = [
    "CEO / Fondateur",
    "Manager / Directeur",
    "Chef de projet",
    "Employé / Collaborateur",
    "Indépendant / Freelance",
    "Autre"
];

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [jobRole, setJobRole] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companySize, setCompanySize] = useState("");

    const router = useRouter();

    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 25;
        if (pass.match(/[A-Z]/)) score += 25;
        if (pass.match(/[a-z]/)) score += 25;
        if (pass.match(/[^A-Za-z0-9]/) || pass.match(/[0-9]/)) score += 25;
        return score;
    };

    const passwordScore = calculatePasswordStrength(password);

    const getPasswordBarColor = () => {
        if (passwordScore <= 25) return "bg-red-500";
        if (passwordScore <= 50) return "bg-orange-500";
        if (passwordScore <= 75) return "bg-yellow-500";
        return "bg-green-500";
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.includes("@")) {
            setError("Veuillez entrer une adresse email valide.");
            return;
        }
        if (passwordScore < 50) {
            setError("Votre mot de passe est trop faible.");
            return;
        }

        // Si le compte est déjà créé pendant la session (back/forth), on avance sans recréer
        if (auth.currentUser && auth.currentUser.email === email) {
            setStep(2);
            return;
        }

        setLoading(true);
        try {
            // Création immédiate du compte et envoi de l'email de vérification (Priorité)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            setStep(2);
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Cet email est déjà utilisé par un autre compte.");
            } else {
                setError("Une erreur est survenue lors de la création du compte.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!fullName.trim() || !jobRole) {
            setError("Veuillez remplir tous les champs du profil.");
            return;
        }
        setStep(3);
    };

    const handlePrevStep = () => {
        setError("");
        setStep(step - 1);
    };

    const handleFinalSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");

        if (!companyName.trim() || !companySize) {
            setError("Veuillez remplir toutes les informations sur l'entreprise.");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            setError("Votre session a expiré. Veuillez vous reconnecter.");
            return;
        }

        setLoading(true);

        try {
            // 3. Create Company in Firestore
            const companyId = uuidv4();
            await setDoc(doc(db, "companies", companyId), {
                name: companyName,
                size: companySize,
                created_at: new Date(),
            });

            // 4. Create User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                full_name: fullName,
                job_role: jobRole,
                role: "admin",
                company_id: companyId,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
                created_at: new Date(),
            });

            // Transition to success/verification step
            setStep(4);
        } catch (err: any) {
            console.error(err);
            setError("Une erreur est survenue lors de la configuration finale de l'espace.");
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
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                    La première étape vers l'alignement.
                                </h1>
                                <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                                    Sécurisez votre compte et recevez immédiatement votre lien de vérification.
                                </p>
                            </motion.div>
                        )}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                    Qui êtes-vous ?
                                </h1>
                                <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                                    Personnalisons votre profil au sein du QG de votre équipe. (Nous avons envoyé un lien à {email}).
                                </p>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                    Le QG de votre entreprise.
                                </h1>
                                <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                                    Créez l'espace collaboratif où votre équipe viendra s'aligner chaque semaine.
                                </p>
                            </motion.div>
                        )}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                                    Plus qu'une dernière étape.
                                </h1>
                                <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed">
                                    Nous sommes intransigeants sur la sécurité des données de votre entreprise.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative z-10 text-sm font-bold text-slate-500">
                    &copy; {new Date().getFullYear()} Faucus. Le framework d'exécution.
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-[#FDFBF7] relative overflow-y-auto">
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-black">Faucus</span>
                </div>

                <div className="w-full max-w-md my-auto mt-20 sm:mt-auto">
                    {/* Stepper Header */}
                    {step < 4 && (
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step >= i ? "bg-black" : "bg-[#EBE6E0]"}`} />
                                ))}
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-500">
                                <span>Compte</span>
                                <span>Profil</span>
                                <span>Entreprise</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-[#EBE6E0] overflow-hidden relative" suppressHydrationWarning>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] bg-red-50 p-4 text-sm text-red-600 font-bold border border-red-100 mb-6" suppressHydrationWarning>
                                {error}
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* STEP 1: ACCOUNT */}
                            {step === 1 && (
                                <motion.form onSubmit={handleStep1Submit} key="form-step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} suppressHydrationWarning>
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-extrabold tracking-tight text-black">Vos identifiants</h2>
                                        <p className="mt-2 text-base text-slate-500 font-medium">Pour protéger votre espace d'exécution.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-bold text-black flex items-center gap-2"><Mail className="w-4 h-4" /> Email professionnel</Label>
                                            <Input id="email" type="email" placeholder="jane@theagency.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors" suppressHydrationWarning />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-bold text-black flex items-center gap-2"><Lock className="w-4 h-4" /> Mot de passe</Label>
                                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors" suppressHydrationWarning />
                                            {/* Password Strength Indicator */}
                                            {password.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    <div className="flex gap-1 h-1.5 w-full">
                                                        <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore > 0 ? getPasswordBarColor() : 'bg-slate-200'}`} />
                                                        <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore > 25 ? getPasswordBarColor() : 'bg-slate-200'}`} />
                                                        <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore > 50 ? getPasswordBarColor() : 'bg-slate-200'}`} />
                                                        <div className={`flex-1 rounded-full transition-colors duration-300 ${passwordScore > 75 ? getPasswordBarColor() : 'bg-slate-200'}`} />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 text-right">
                                                        {passwordScore <= 25 && "Très faible"}
                                                        {passwordScore > 25 && passwordScore <= 50 && "Faible"}
                                                        {passwordScore > 50 && passwordScore <= 75 && "Bon"}
                                                        {passwordScore > 75 && "Excellent"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <Button type="submit" disabled={loading} className="w-full h-14 text-base font-extrabold transition-all bg-black hover:bg-slate-800 text-white rounded-full mt-8" suppressHydrationWarning>
                                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Créer mon compte <ArrowRight className="ml-2 w-5 h-5" /></>}
                                        </Button>
                                    </div>
                                    <div className="mt-8 text-center text-sm font-bold text-slate-500">
                                        Déjà un compte ? <Link href="/login" className="text-black hover:underline">Connexion</Link>
                                    </div>
                                </motion.form>
                            )}

                            {/* STEP 2: PROFILE */}
                            {step === 2 && (
                                <motion.form onSubmit={handleStep2Submit} key="form-step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} suppressHydrationWarning>
                                    {/* Pas de bouton retour car le compte est déjà créé dans Firebase auth */}
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-extrabold tracking-tight text-black">Votre profil</h2>
                                        <p className="mt-2 text-base text-slate-500 font-medium">L'email de vérification vient d'être envoyé ! Complétons votre profil.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-bold text-black flex items-center gap-2"><User className="w-4 h-4" /> Nom complet</Label>
                                            <Input id="fullName" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors" suppressHydrationWarning />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="jobRole" className="text-sm font-bold text-black">Rôle dans l'entreprise</Label>
                                            <select
                                                id="jobRole"
                                                value={jobRole}
                                                onChange={(e) => setJobRole(e.target.value)}
                                                required
                                                className="h-14 w-full px-4 appearance-none outline-none bg-[#FDFBF7] border border-[#EBE6E0] rounded-2xl focus:bg-white focus:border-slate-400 text-base transition-colors text-black"
                                            >
                                                <option value="" disabled className="text-slate-400">Sélectionnez un rôle</option>
                                                {JOB_ROLES.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button type="submit" className="w-full h-14 text-base font-extrabold transition-all bg-black hover:bg-slate-800 text-white rounded-full mt-8" suppressHydrationWarning>
                                            Continuer <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </motion.form>
                            )}

                            {/* STEP 3: COMPANY */}
                            {step === 3 && (
                                <motion.div key="form-step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} suppressHydrationWarning>
                                    <button onClick={handlePrevStep} className="mb-6 flex items-center text-sm font-bold text-slate-500 hover:text-black transition-colors" suppressHydrationWarning>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Retour au profil
                                    </button>
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-extrabold tracking-tight text-black">L'Entreprise</h2>
                                        <p className="mt-2 text-base text-slate-500 font-medium">Une fois finalisé, vous pourrez inviter votre équipe.</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName" className="text-sm font-bold text-black flex items-center gap-2"><Building2 className="w-4 h-4" /> Nom de l'entreprise</Label>
                                            <Input id="companyName" placeholder="The Agency" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-14 bg-[#FDFBF7] border-[#EBE6E0] rounded-2xl focus:bg-white text-base transition-colors" suppressHydrationWarning />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold text-black">Taille de l'équipe</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {COMPANY_SIZES.map((size) => (
                                                    <div
                                                        key={size.id}
                                                        onClick={() => setCompanySize(size.id)}
                                                        className={`cursor-pointer border-2 rounded-2xl p-4 transition-all duration-200 ${companySize === size.id ? 'border-black bg-slate-50 shadow-sm' : 'border-[#EBE6E0] hover:border-slate-300 bg-white'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${companySize === size.id ? 'border-black bg-black' : 'border-slate-300'}`}>
                                                                {companySize === size.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                            </div>
                                                        </div>
                                                        <div className={`font-bold text-sm ${companySize === size.id ? 'text-black' : 'text-slate-600'}`}>{size.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Button onClick={handleFinalSubmit} disabled={loading} className="w-full h-14 text-base font-extrabold transition-all bg-black hover:bg-slate-800 text-white rounded-full mt-8" suppressHydrationWarning>
                                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Déployer le framework"}
                                            {!loading && <CheckCircle2 className="ml-2 w-5 h-5" />}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: SUCCESS / VERIFY EMAIL */}
                            {step === 4 && (
                                <motion.div key="form-step-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Mail className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-black mb-4">Vérifiez votre boîte mail</h2>
                                    <p className="text-base text-slate-500 font-medium mb-8 leading-relaxed">
                                        N'oubliez pas ! Nous vous avons envoyé un lien de vérification à l'étape 1 sur <br /><span className="text-black font-bold">{email}</span>. <br /><br />
                                        La vérification de votre adresse est requise pour accéder à votre espace <span className="text-black font-bold">{companyName}</span>.
                                    </p>
                                    <Button onClick={() => router.push("/login")} className="w-full h-14 text-base font-extrabold transition-all bg-[#FDFBF7] border-2 border-[#EBE6E0] hover:bg-slate-50 text-black rounded-full" suppressHydrationWarning>
                                        Aller à la page de connexion
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
