"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, ALLOWED_IMAGE_TYPES } from "@/lib/upload-utils";
import Image from "next/image";

export function ProfileForm() {
    const { user, userData, refreshUserData } = useAuth();

    const [fullName, setFullName] = useState(userData?.full_name || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(userData?.avatar_url || "");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                toast.error("Type d'image non supporté.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("L'image ne doit pas dépasser 5mo.");
                return;
            }
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCancelFile = () => {
        setAvatarFile(null);
        setPreviewUrl(userData?.avatar_url || "");
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // Update Firestore Profile
            const userRef = doc(db, "users", user.uid);
            const updates: any = { full_name: fullName };

            if (avatarFile) {
                const downloadUrl = await uploadFile(avatarFile, `avatars/${user.uid}`, ALLOWED_IMAGE_TYPES, 5);
                updates.avatar_url = downloadUrl;
            }

            await updateDoc(userRef, updates);

            // Update Password if provided
            if (newPassword && newPassword.length >= 6) {
                await updatePassword(user, newPassword);
                setNewPassword("");
            }

            await refreshUserData();
            toast.success("Profil mis à jour avec succès");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erreur lors de la mise à jour du profil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations de base et votre mot de passe.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={userData?.email || user?.email || ""}
                            disabled
                            className="bg-slate-50 text-slate-500"
                        />
                        <p className="text-xs text-slate-500">L'email ne peut pas être modifié.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nom complet</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Photo de profil</Label>
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100 flex items-center justify-center relative group">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Aperçu avatar" fill className="object-cover" unoptimized />
                                ) : (
                                    <span className="text-3xl font-bold text-slate-300">
                                        {fullName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                {!avatarFile ? (
                                    <div>
                                        <Input
                                            type="file"
                                            id="avatarFile"
                                            className="hidden"
                                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                                            onChange={handleFileChange}
                                        />
                                        <Label
                                            htmlFor="avatarFile"
                                            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
                                        >
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            Changer la photo
                                        </Label>
                                        <p className="mt-1 text-xs text-slate-500">
                                            JPG, PNG ou WebP. 5MB max.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-emerald-600 truncate max-w-[200px]">
                                            {avatarFile.name} sélectionné
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleCancelFile} className="h-8 px-2 text-slate-500">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Laissez vide pour ne pas modifier"
                            minLength={6}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer les modifications
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
