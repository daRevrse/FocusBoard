"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, Save, UploadCloud, X, CreditCard, Calendar } from "lucide-react";
import { uploadFile, ALLOWED_IMAGE_TYPES } from "@/lib/upload-utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const { userData } = useAuth();
    const router = useRouter();

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";
    const isAdmin = userData?.role === "admin";

    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [logoUrl, setLogoUrl] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [emailDomain, setEmailDomain] = useState("");
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState("");
    const [smtpUser, setSmtpUser] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");

    const [autoFocusEnabled, setAutoFocusEnabled] = useState(false);
    const [autoFocusStartTime, setAutoFocusStartTime] = useState("08:00");
    const [autoFocusEndTime, setAutoFocusEndTime] = useState("18:00");

    useEffect(() => {
        if (userData && !isManagerOrAdmin) {
            router.replace("/dashboard");
        }
    }, [userData, isManagerOrAdmin, router]);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!userData?.company_id) return;
            try {
                const docRef = doc(db, "companies", userData.company_id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setLogoUrl(data.logo_url || "");
                    setEmailDomain(data.email_domain || "");
                    setSmtpHost(data.smtp_host || "");
                    setSmtpPort(data.smtp_port ? String(data.smtp_port) : "");
                    setSmtpUser(data.smtp_user || "");
                    setSmtpPassword(data.smtp_password || "");

                    setAutoFocusEnabled(data.auto_focus_enabled || false);
                    setAutoFocusStartTime(data.auto_focus_start_time || "08:00");
                    setAutoFocusEndTime(data.auto_focus_end_time || "18:00");
                }
            } catch (err) {
                console.error("Error fetching company settings:", err);
            } finally {
                setLoadingData(false);
            }
        };

        if (userData?.company_id) {
            fetchCompanyData();
        }
    }, [userData]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        toast.info("Upload d'images temporairement désactivé (Storage non initialisé).");
        return;
    };

    const handleCancelLogo = () => {
        setLogoFile(null);
        // We'd ideally fetch the old logo URL again, but for now we'll just clear it or rely on a refresh
        setLogoUrl("");
    };

    if (!userData || !isManagerOrAdmin) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;

        setError("");
        setMessage("");
        setSaving(true);

        try {
            const docRef = doc(db, "companies", userData.company_id);
            let finalLogoUrl = logoUrl;

            if (logoFile) {
                finalLogoUrl = await uploadFile(logoFile, `logos/${userData.company_id}`, ALLOWED_IMAGE_TYPES, 5);
                setLogoUrl(finalLogoUrl); // Update local state with the permanent URL
                setLogoFile(null);
            }

            await updateDoc(docRef, {
                logo_url: finalLogoUrl,
                email_domain: emailDomain,
                smtp_host: smtpHost,
                smtp_port: smtpPort ? parseInt(smtpPort, 10) : null,
                smtp_user: smtpUser,
                smtp_password: smtpPassword,
                auto_focus_enabled: autoFocusEnabled,
                auto_focus_start_time: autoFocusStartTime,
                auto_focus_end_time: autoFocusEndTime,
            });
            setMessage("Paramètres de l'entreprise mis à jour avec succès.");
            toast.success("Paramètres enregistrés");
        } catch (err) {
            console.error("Error saving company settings:", err);
            setError("Erreur lors de l'enregistrement des paramètres.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Paramètres de l'entreprise
                        </h1>
                        <p className="text-slate-500">Configurez votre espace de travail Faucus.</p>
                    </div>
                </header>

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Identité Visuelle et Domaine</h2>
                            {logoUrl && (
                                <img src={logoUrl} alt="Company Logo" className="h-10 object-contain max-w-[150px]" />
                            )}
                        </div>
                        <div className="p-6 space-y-6">
                            {message && <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-200">{message}</div>}
                            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">{error}</div>}

                            {loadingData ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label>Logo de l'entreprise</Label>
                                            <div className="flex flex-col gap-3">
                                                {!logoFile && !logoUrl ? (
                                                    <div className="h-16 w-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                                        Aucun
                                                    </div>
                                                ) : (
                                                    <div className="relative inline-block w-fit">
                                                        <img src={logoUrl} alt="Logo preview" className="h-16 object-contain rounded-md border p-1 bg-white" />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3">
                                                    {!logoFile ? (
                                                        <>
                                                            <Input
                                                                type="file"
                                                                id="logoFile"
                                                                className="hidden"
                                                                accept={ALLOWED_IMAGE_TYPES.join(',')}
                                                                onChange={handleLogoChange}
                                                                disabled={!isAdmin}
                                                            />
                                                            <Label
                                                                htmlFor="logoFile"
                                                                className={`inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none ${isAdmin ? 'cursor-pointer bg-white text-slate-700 hover:bg-slate-50' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                                                            >
                                                                <UploadCloud className="mr-2 h-4 w-4" />
                                                                {logoUrl ? "Changer" : "Uploader un logo"}
                                                            </Label>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-emerald-600 truncate max-w-[150px]">Fichier prêt</span>
                                                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelLogo} className="h-8 px-2 text-slate-500">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500">PNG, JPG, WebP. 5MB max. Idéalement avec fond transparent.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emailDomain">Domaine Email de l'entreprise</Label>
                                            <Input
                                                id="emailDomain"
                                                placeholder="acme.com"
                                                value={emailDomain}
                                                onChange={(e) => setEmailDomain(e.target.value)}
                                                disabled={!isAdmin}
                                            />
                                            <p className="text-xs text-slate-500">Permet d'afficher votre logo sur la page de connexion.</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* BLOC FACTURATION (Mock préparatoire) */}
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Facturation et Forfaits</h2>
                                <p className="text-sm text-slate-500">Gérez votre abonnement, moyens de paiement et factures.</p>
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[10px] font-bold">Pro</Badge>
                        </div>
                        <div className="p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-start">
                                    <h3 className="font-semibold text-slate-900 mb-1">Moyen de paiement</h3>
                                    <p className="text-sm text-slate-500 mb-4">Carte utilisée pour le renouvellement.</p>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700 mb-6 bg-white p-3 rounded-lg border w-full">
                                        <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                                        <span>Visa terminant par •••• 4242</span>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="w-full mt-auto">Mettre à jour la carte</Button>
                                </div>
                                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-start">
                                    <h3 className="font-semibold text-slate-900 mb-1">Prochaine facture</h3>
                                    <p className="text-sm text-slate-500 mb-4">Détails du prochain prélèvement.</p>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700 mb-6 bg-white p-3 rounded-lg border w-full">
                                        <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                                        <div className="flex justify-between w-full">
                                            <span>24 Avril 2026</span>
                                            <span className="font-bold text-slate-900">49,00 €</span>
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="w-full mt-auto">Historique des factures</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50">
                            <h2 className="text-lg font-semibold">Configuration Serveur Email (SMTP)</h2>
                            <p className="text-sm text-slate-500">Paramètres pour l'envoi d'emails transactionnels.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {!loadingData && (
                                <div className="grid gap-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpHost">Serveur SMTP</Label>
                                            <Input
                                                id="smtpHost"
                                                placeholder="smtp.example.com"
                                                value={smtpHost}
                                                onChange={(e) => setSmtpHost(e.target.value)}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPort">Port SMTP</Label>
                                            <Input
                                                id="smtpPort"
                                                type="number"
                                                placeholder="587 ou 465"
                                                value={smtpPort}
                                                onChange={(e) => setSmtpPort(e.target.value)}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpUser">Utilisateur</Label>
                                            <Input
                                                id="smtpUser"
                                                placeholder="apikey ou contact@acme.com"
                                                value={smtpUser}
                                                onChange={(e) => setSmtpUser(e.target.value)}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPassword">Mot de passe</Label>
                                            <Input
                                                id="smtpPassword"
                                                type={"password"}
                                                placeholder="Clé secrète ou mot de passe..."
                                                value={smtpPassword}
                                                onChange={(e) => setSmtpPassword(e.target.value)}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-b bg-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Focus du Jour Automatique</h2>
                                <p className="text-sm text-slate-500">Configurez les horaires de contrôle du focus quotidien.</p>
                            </div>
                            <Switch
                                checked={autoFocusEnabled}
                                onCheckedChange={setAutoFocusEnabled}
                                disabled={!isAdmin}
                            />
                        </div>

                        {autoFocusEnabled && !loadingData && (
                            <div className="p-6 space-y-6 bg-white border-b">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="autoFocusStartTime">Heure de début (Ouverture)</Label>
                                        <Input
                                            id="autoFocusStartTime"
                                            type="time"
                                            value={autoFocusStartTime}
                                            onChange={(e) => setAutoFocusStartTime(e.target.value)}
                                            disabled={!isAdmin}
                                        />
                                        <p className="text-xs text-slate-500">Heure à partir de laquelle les collaborateurs peuvent démarrer leur journée.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="autoFocusEndTime">Heure de fin (Clôture)</Label>
                                        <Input
                                            id="autoFocusEndTime"
                                            type="time"
                                            value={autoFocusEndTime}
                                            onChange={(e) => setAutoFocusEndTime(e.target.value)}
                                            disabled={!isAdmin}
                                        />
                                        <p className="text-xs text-slate-500">Heure à partir de laquelle la clôture est attendue.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAdmin && (
                            <div className="p-6 bg-slate-50 flex justify-end">
                                <Button type="submit" disabled={saving || loadingData}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Enregistrer les modifications
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
