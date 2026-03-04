"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Camera, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilePage() {
    const { user, userData, refreshUserData } = useAuth();
    const [submittingInfo, setSubmittingInfo] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);

    // Profile Info State
    const [fullName, setFullName] = useState(userData?.full_name || "");
    const [avatarUrl, setAvatarUrl] = useState(userData?.avatar_url || "");

    // Password Update State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    if (!user || !userData) {
        return <div className="p-8">Chargement du profil...</div>;
    }

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingInfo(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                full_name: fullName,
                avatar_url: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
            });
            await refreshUserData();
            toast.success("Profil mis à jour avec succès.");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error("Erreur lors de la mise à jour du profil.");
        } finally {
            setSubmittingInfo(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Le mot de passe doit faire au moins 6 caractères.");
            return;
        }

        setSubmittingPassword(true);
        try {
            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Change password
            await updatePassword(user, newPassword);

            toast.success("Mot de passe mis à jour avec succès.");
            setPasswordDialogOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            if (error.code === 'auth/invalid-credential') {
                toast.error("Mot de passe actuel incorrect.");
            } else {
                toast.error("Erreur lors de la modification du mot de passe.");
            }
        } finally {
            setSubmittingPassword(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mon Profil</h1>
                <p className="text-slate-500 mt-2">Gérez vos informations personnelles et votre sécurité.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Information Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informations Personnelles</CardTitle>
                        <CardDescription>
                            Mettez à jour votre nom et votre photo de profil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateInfo} className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                {/* Avatar Preview & Edit */}
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-sm">
                                        <img
                                            src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName || 'U'}`}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md">
                                        <Camera className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                    <Label htmlFor="avatarUrl">URL de l'avatar (Optionnel)</Label>
                                    <Input
                                        id="avatarUrl"
                                        type="url"
                                        placeholder="https://example.com/mon-avatar.jpg"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-slate-500">Laissez vide pour utiliser vos initiales.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nom complet</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Adresse Email</Label>
                                    <Input
                                        id="email"
                                        value={user.email || ""}
                                        disabled
                                        className="bg-slate-50 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rôle (Lecture seule)</Label>
                                    <Input
                                        id="role"
                                        value={userData.role === "admin" ? "Administrateur" : userData.role === "manager" ? "Manager" : "Collaborateur"}
                                        disabled
                                        className="bg-slate-50 cursor-not-allowed capitalize"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={submittingInfo}>
                                {submittingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer les modifications
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sécurité</CardTitle>
                        <CardDescription>
                            Protégez l'accès à votre compte FocusBoard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
                            <ShieldAlert className="h-5 w-5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium">Mot de passe</p>
                                <p className="mt-1 opacity-90">Il est recommandé de changer votre mot de passe régulièrement.</p>
                            </div>
                        </div>

                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    Changer de mot de passe
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleUpdatePassword}>
                                    <DialogHeader>
                                        <DialogTitle>Modifier le mot de passe</DialogTitle>
                                        <DialogDescription>
                                            Pour des raisons de sécurité, veuillez renseigner votre mot de passe actuel.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current">Mot de passe actuel</Label>
                                            <Input
                                                id="current"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new">Nouveau mot de passe</Label>
                                            <Input
                                                id="new"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
                                            <Input
                                                id="confirm"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setPasswordDialogOpen(false)}>Annuler</Button>
                                        <Button type="submit" disabled={submittingPassword}>
                                            {submittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirmer la modification
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
