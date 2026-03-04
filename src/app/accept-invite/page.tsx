"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AcceptInvitePage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAcceptInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Check if the email exists in the `users` collection as a `pending_invite`
            const usersRef = collection(db, "users");
            const q = query(
                usersRef,
                where("email", "==", email.toLowerCase()),
                where("status", "==", "pending_invite")
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Aucune invitation en attente trouvée pour cet email.");
                setLoading(false);
                return;
            }

            const pendingDoc = querySnapshot.docs[0];
            const pendingData = pendingDoc.data();

            // 2. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Create the ACTUAL User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                full_name: pendingData.full_name,
                role: pendingData.role,
                company_id: pendingData.company_id,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${pendingData.full_name}`,
                status: "active",
                created_at: serverTimestamp(),
            });

            // 4. Delete the temporary pending document
            await deleteDoc(doc(db, "users", pendingDoc.id));

            toast.success("Compte créé avec succès ! Bienvenue.");
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Error accepting invite:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Cette adresse email est déjà liée à un compte existant.");
            } else {
                setError("Une erreur est survenue lors de la création du compte.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Accepter l'invitation</CardTitle>
                    <CardDescription>
                        Entrez l'adresse email sur laquelle vous avez été invité(e) et choisissez un mot de passe.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAcceptInvite}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="votre.email@entreprise.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer mon compte
                        </Button>
                        <div className="text-center text-sm text-slate-500">
                            Vous n'avez pas d'invitation ?{" "}
                            <Link href="/register" className="font-medium text-primary hover:underline">
                                Créer un espace
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
