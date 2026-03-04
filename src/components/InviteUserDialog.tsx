"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteUserDialogProps {
    onSuccess?: () => void;
}

export function InviteUserDialog({ onSuccess }: InviteUserDialogProps) {
    const { user, userData } = useAuth();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("collaborator");
    const [password, setPassword] = useState("");

    const isAdmin = userData?.role === "admin";

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData?.company_id || !email || !fullName) return;

        setSubmitting(true);
        try {
            if (isAdmin && (!password || password.length < 6)) {
                toast.error("Le mot de passe doit contenir au moins 6 caractères.");
                setSubmitting(false);
                return;
            }

            const response = await fetch("/api/admin/users/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    fullName,
                    role,
                    password: isAdmin ? password : "",
                    companyId: userData.company_id,
                    inviterId: user.uid,
                    isManagerInvite: !isAdmin
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === "auth/email-already-in-use") {
                    throw new Error("Cette adresse email est déjà liée à un compte.");
                } else {
                    throw new Error(data.error || "Une erreur est survenue lors de l'invitation.");
                }
            }

            if (isAdmin) {
                toast.success(`Le compte pour ${fullName} a été créé avec succès et un email d'accès lui a été envoyé.`);
            } else {
                toast.success(`Invitation envoyée à ${email} par email.`);
            }

            setOpen(false);
            setFullName("");
            setEmail("");
            setPassword("");
            setRole("collaborator");
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Error creating/inviting user:", error);
            toast.error(error.message || "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter un membre
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? "Créer un membre" : "Inviter un membre"}</DialogTitle>
                    <DialogDescription>
                        {isAdmin
                            ? "Créez directement un compte pour un nouveau collaborateur. Un email d'accès lui sera envoyé."
                            : "Ajoutez un nouveau collaborateur à votre équipe. Une invitation lui sera envoyée par email."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Jean Dupont"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Adresse email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jean@entreprise.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rôle</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="collaborator">Collaborateur</SelectItem>
                                    {isAdmin && <SelectItem value="manager">Manager</SelectItem>}
                                    {isAdmin && <SelectItem value="admin">Administrateur</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        {isAdmin && (
                            <div className="grid gap-2">
                                <Label htmlFor="password">Mot de passe provisoire</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe"
                                    required
                                    minLength={6}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Une copie de ce mot de passe sera envoyée à l'utilisateur. Il pourra le modifier plus tard.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isAdmin ? "Créer le compte" : "Envoyer l'invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
