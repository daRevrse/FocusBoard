"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "@/components/InviteUserDialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Search, Trash2, MailX } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteDoc, serverTimestamp, setDoc, addDoc } from "firebase/firestore";
import { LockKeyhole, UserX, Users, MessageSquarePlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function TeamPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Filter states for members
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending_invite">("all");

    // Details Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Teams state
    const [teams, setTeams] = useState<any[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(true);

    // Create Team Dialog State
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [selectedMembersForTeam, setSelectedMembersForTeam] = useState<string[]>([]);
    const [creatingTeam, setCreatingTeam] = useState(false);

    // Manage Team Dialog State
    const [managingTeam, setManagingTeam] = useState<any>(null);
    const [editTeamName, setEditTeamName] = useState("");
    const [editTeamMembers, setEditTeamMembers] = useState<string[]>([]);
    const [updatingTeam, setUpdatingTeam] = useState(false);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";
    const isAdmin = userData?.role === "admin";

    // RBAC Guard
    useEffect(() => {
        if (userData && !isManagerOrAdmin) {
            router.replace("/dashboard");
        }
    }, [userData, isManagerOrAdmin, router]);

    useEffect(() => {
        const fetchUsersAndTeams = async () => {
            if (userData?.company_id && isManagerOrAdmin) {
                try {
                    // Fetch Users
                    const qUsers = query(
                        collection(db, "users"),
                        where("company_id", "==", userData.company_id)
                    );
                    const usersSnapshot = await getDocs(qUsers);
                    const usersList = usersSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setUsers(usersList);

                    // Fetch Teams
                    const qTeams = query(
                        collection(db, "teams"),
                        where("company_id", "==", userData.company_id)
                    );
                    const teamsSnapshot = await getDocs(qTeams);
                    const teamsList = teamsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setTeams(teamsList);
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoadingUsers(false);
                    setLoadingTeams(false);
                }
            }
        };

        fetchUsersAndTeams();
    }, [userData, isManagerOrAdmin]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!isAdmin) return;
        setUpdatingUserId(userId);
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        if (!isAdmin) return;
        setUpdatingUserId(userId);
        try {
            const newStatus = currentStatus === "inactive" ? "active" : "inactive";

            // Call API to disable/enable Firebase Auth
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, disabled: newStatus === "inactive" })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update auth status");
            }

            // Fallback UI update, the API actually handles the firestore update too but this keeps UI snappy
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            toast.success(`Le compte a été ${newStatus === "inactive" ? "désactivé" : "réactivé"}.`);
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error("Erreur de modification du compte.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleHardDeleteUser = async (userId: string) => {
        if (!isAdmin) return;
        if (!confirm("ATTENTION: Cela supprimera DÉFINITIVEMENT le compte d'authentification et les données Firebase de cet utilisateur. Continuer ?")) return;

        setUpdatingUserId(userId);
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}&companyId=${userData.company_id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to delete user");
            }

            setUsers(users.filter(u => u.id !== userId));
            setSelectedUser(null);
            toast.success("Utilisateur supprimé définitivement du système.");
        } catch (error: any) {
            console.error("Error hard deleting user:", error);
            toast.error(error.message || "Erreur lors de la suppression.");
        } finally {
            setUpdatingUserId(null);
        }
    }

    const handlePasswordReset = async (email: string) => {
        if (!isAdmin) return;
        try {
            const res = await fetch("/api/admin/users/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("Failed to generate link");
            const data = await res.json();

            // In a production app, we would send this via an Email API (Resend, SendGrid)
            // Here we copy it to clipboard for the MVP so the admin can send it manually
            navigator.clipboard.writeText(data.link);
            toast.success("Lien de réinitialisation copié dans le presse-papiers !");
        } catch (error: any) {
            console.error("Error resetting password:", error);
            toast.error("Impossible de générer le lien de réinitialisation.");
        }
    }

    const handleToggleFlag = async (userId: string, flag: string, currentFlags: string[] = []) => {
        if (!isAdmin) return;
        setUpdatingUserId(userId);
        try {
            const newFlags = currentFlags.includes(flag)
                ? currentFlags.filter(f => f !== flag)
                : [...currentFlags, flag];

            await updateDoc(doc(db, "users", userId), { flags: newFlags });

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, flags: newFlags } : u));
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, flags: newFlags });
            }
            toast.success("Privilèges mis à jour.");
        } catch (error) {
            console.error("Error updating flags:", error);
            toast.error("Erreur lors de la mise à jour des privilèges.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleCancelInvite = async (userId: string) => {
        if (!isAdmin && !isManagerOrAdmin) return;

        if (!confirm("Êtes-vous sûr(e) de vouloir annuler cette invitation ?")) return;

        setUpdatingUserId(userId);
        try {
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(u => u.id !== userId));
            if (selectedUser?.id === userId) setSelectedUser(null);
            toast.success("Invitation annulée.");
        } catch (error) {
            console.error("Error cancelling invite:", error);
            toast.error("Erreur lors de l'annulation.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim() || selectedMembersForTeam.length === 0 || !userData?.company_id) return;

        setCreatingTeam(true);
        try {
            // 1. Create the Team in 'teams' collection
            const teamRef = await addDoc(collection(db, "teams"), {
                company_id: userData.company_id,
                name: newTeamName.trim(),
                members: selectedMembersForTeam,
                created_at: serverTimestamp()
            });

            // 2. Create the associated Channel automatically
            const channelRef = await addDoc(collection(db, "channels"), {
                company_id: userData.company_id,
                name: newTeamName.trim(),
                type: "team",
                members: selectedMembersForTeam,
                team_id: teamRef.id,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            // Update local UI state
            setTeams([...teams, {
                id: teamRef.id,
                company_id: userData.company_id,
                name: newTeamName.trim(),
                members: selectedMembersForTeam,
            }]);

            toast.success(`L'équipe "${newTeamName}" et son canal de communication ont été créés.`);
            setIsCreateTeamOpen(false);
            setNewTeamName("");
            setSelectedMembersForTeam([]);
        } catch (error: any) {
            console.error("Error creating team:", error);
            toast.error("Erreur lors de la création de l'équipe.");
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleUpdateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!managingTeam || !editTeamName.trim() || editTeamMembers.length === 0) return;
        setUpdatingTeam(true);
        try {
            await updateDoc(doc(db, "teams", managingTeam.id), {
                name: editTeamName.trim(),
                members: editTeamMembers
            });
            // Update channel as well
            const qChannel = query(collection(db, "channels"), where("team_id", "==", managingTeam.id));
            const snap = await getDocs(qChannel);
            snap.docs.forEach(async (d) => {
                await updateDoc(doc(db, "channels", d.id), {
                    name: editTeamName.trim(),
                    members: editTeamMembers
                });
            });

            setTeams(teams.map(t => t.id === managingTeam.id ? { ...t, name: editTeamName.trim(), members: editTeamMembers } : t));
            setManagingTeam(null);
            toast.success("L'équipe a été mise à jour.");
        } catch (error) {
            console.error("Error updating team:", error);
            toast.error("Erreur lors de la mise à jour.");
        } finally {
            setUpdatingTeam(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette équipe ? Le canal associé sera également supprimé.")) return;
        setUpdatingTeam(true);
        try {
            await deleteDoc(doc(db, "teams", teamId));

            // Delete associated channel
            const qChannel = query(collection(db, "channels"), where("team_id", "==", teamId));
            const snap = await getDocs(qChannel);
            snap.docs.forEach(async (d) => {
                await deleteDoc(doc(db, "channels", d.id));
            });

            setTeams(teams.filter(t => t.id !== teamId));
            setManagingTeam(null);
            toast.success("L'équipe a été supprimée.");
        } catch (error) {
            console.error("Error deleting team:", error);
            toast.error("Erreur lors de la suppression.");
        } finally {
            setUpdatingTeam(false);
        }
    };

    if (!userData || !isManagerOrAdmin) return null; // Prevent flash before redirect

    // Apply filtering logic
    const filteredUsers = users.filter((u) => {
        // Search Filter
        const matchesSearch =
            (u.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        // Status Filter
        let matchesStatus = true;
        if (statusFilter !== "all") {
            // Note: Users might not have an explicit "status" field defined heavily yet, defaulting missing to "active"
            const effectiveStatus = u.status || "active";
            matchesStatus = effectiveStatus === statusFilter;
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Notre Organisation
                        </h1>
                        <p className="text-slate-500">Gérez les membres de votre entreprise et vos équipes de travail.</p>
                    </div>
                </header>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
                        <TabsTrigger value="members">Tous les membres</TabsTrigger>
                        <TabsTrigger value="teams">Équipes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-4">
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                            <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold">Membres Actifs</h2>
                                    <p className="text-sm text-slate-500">Gérez les accès et les rôles de votre équipe.</p>
                                </div>
                                <InviteUserDialog onSuccess={() => window.location.reload()} />
                            </div>

                            <div className="p-4 border-b bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Rechercher par nom ou email..."
                                        className="pl-9 bg-slate-50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Tous
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("active")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Actifs
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("inactive")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === "inactive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Désactivés
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter("pending_invite")}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-2 ${statusFilter === "pending_invite" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        En attente
                                        {users.filter(u => u.status === "pending_invite").length > 0 && (
                                            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                {users.filter(u => u.status === "pending_invite").length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-0">
                                {loadingUsers ? (
                                    <div className="flex justify-center p-8 text-primary"><Loader2 className="animate-spin" /></div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                        <p>Aucun utilisateur trouvé.</p>
                                        {(searchQuery || statusFilter !== "all") && (
                                            <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                                Réinitialiser les filtres
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <ul className="divide-y">
                                        {filteredUsers.map((u) => (
                                            <li
                                                key={u.id}
                                                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 px-4 rounded-lg transition-colors cursor-pointer"
                                                onClick={() => setSelectedUser(u)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                                                        alt={u.full_name}
                                                        className={`h-10 w-10 rounded-full ${u.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-slate-900">{u.full_name}</div>
                                                        <div className="text-sm text-slate-500">{u.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 sm:ml-auto" onClick={(e) => e.stopPropagation()}>
                                                    {updatingUserId === u.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}

                                                    {/* Role Selector */}
                                                    {isAdmin && u.id !== user?.uid ? (
                                                        <Select value={u.role} onValueChange={(val) => handleRoleChange(u.id, val)}>
                                                            <SelectTrigger className="w-[140px] h-8 bg-white">
                                                                <SelectValue placeholder="Rôle" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="collaborator">Collaborateur</SelectItem>
                                                                <SelectItem value="manager">Manager</SelectItem>
                                                                <SelectItem value="admin">Administrateur</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <div className="text-sm font-medium px-3 py-1 bg-slate-100 rounded text-slate-600 capitalize">
                                                            {u.role === 'admin' ? 'Administrateur' : u.role}
                                                        </div>
                                                    )}

                                                    {/* Status/Actions */}
                                                    {u.status === "pending_invite" ? (
                                                        <div className="flex items-center gap-2 pl-4 border-l">
                                                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                Invitation en attente
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive h-8 px-2 hover:bg-destructive/10"
                                                                onClick={() => handleCancelInvite(u.id)}
                                                                title="Annuler l'invitation"
                                                            >
                                                                <MailX className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        isAdmin && u.id !== user?.uid && (
                                                            <div className="flex items-center space-x-2 pl-4 border-l min-w-[120px]">
                                                                <Switch
                                                                    checked={u.status !== "inactive"}
                                                                    onCheckedChange={() => handleStatusToggle(u.id, u.status || "active")}
                                                                />
                                                                <span className={`text-xs ${u.status === 'inactive' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                    {u.status === "inactive" ? "Désactivé" : "Actif"}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* User Details Dialog */}
                        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Profil Utilisateur</DialogTitle>
                                    <DialogDescription>
                                        Détails et informations du compte.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    {selectedUser && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.full_name}`}
                                                    alt={selectedUser.full_name}
                                                    className="h-16 w-16 rounded-full border shadow-sm"
                                                />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">{selectedUser.full_name}</h3>
                                                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                                                    <div className="mt-1 flex gap-2">
                                                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600 capitalize">
                                                            {selectedUser.role}
                                                        </span>
                                                        {selectedUser.status === "pending_invite" ? (
                                                            <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-600 rounded">En attente</span>
                                                        ) : (
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedUser.status === 'inactive' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {selectedUser.status === 'inactive' ? 'Inactif' : 'Actif'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                                                <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Informations Système</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="text-slate-500">ID Unique</div>
                                                    <div className="text-slate-900 font-mono text-xs truncate" title={selectedUser.id}>{selectedUser.id}</div>

                                                    <div className="text-slate-500">Créé le</div>
                                                    <div className="text-slate-900">
                                                        {selectedUser.created_at ? new Date(selectedUser.created_at.toDate()).toLocaleDateString('fr-FR') : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>

                                            {isAdmin && selectedUser.role !== 'admin' && selectedUser.status !== "pending_invite" && (
                                                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                                                    <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Privilèges et Accès</h4>

                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-sm font-medium">Gestion des Documents</Label>
                                                            <p className="text-xs text-slate-500">Autoriser l'upload sur le Data Center.</p>
                                                        </div>
                                                        <Switch
                                                            disabled={updatingUserId === selectedUser.id}
                                                            checked={(selectedUser.flags || []).includes("manage_documents")}
                                                            onCheckedChange={() => handleToggleFlag(selectedUser.id, "manage_documents", selectedUser.flags)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {selectedUser.status === "pending_invite" && (
                                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm text-amber-800">
                                                    Cet utilisateur n'a pas encore accepté son invitation. Il ne peut pas se connecter au tableau de bord.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="sm:justify-between border-t flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
                                    {selectedUser?.status === "pending_invite" ? (
                                        <Button type="button" variant="destructive" onClick={() => handleCancelInvite(selectedUser.id)}>
                                            Annuler l'invitation
                                        </Button>
                                    ) : isAdmin && selectedUser?.id !== user?.uid ? (
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                onClick={() => handlePasswordReset(selectedUser.email)}
                                                title="Réinitialiser le mot de passe"
                                            >
                                                <LockKeyhole className="h-4 w-4 mr-2" />
                                                Mot de passe
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleHardDeleteUser(selectedUser.id)}
                                                title="Supprimer définitivement"
                                            >
                                                <UserX className="h-4 w-4 mr-2" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div /> /* Empty div for flex spacing if no destructive action */
                                    )}
                                    <Button type="button" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0" onClick={() => setSelectedUser(null)}>
                                        Fermer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="teams" className="space-y-4">
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden min-h-[400px]">
                            <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold">Équipes de l'entreprise</h2>
                                    <p className="text-sm text-slate-500">Créez des groupes de collaborateurs pour faciliter le suivi et générer des canaux de discussion.</p>
                                </div>
                                <Button onClick={() => setIsCreateTeamOpen(true)}>
                                    <Users className="w-4 h-4 mr-2" /> Créer une équipe
                                </Button>
                            </div>

                            <div className="p-6">
                                {loadingTeams ? (
                                    <div className="flex justify-center p-8 text-primary"><Loader2 className="animate-spin" /></div>
                                ) : teams.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-500 border-2 border-dashed rounded-lg">
                                        <Users className="w-12 h-12 text-slate-300 mb-4" />
                                        <p className="text-lg font-medium text-slate-900">Aucune équipe configurée</p>
                                        <p className="text-sm">Regroupez vos collaborateurs pour mieux organiser votre travail.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {teams.map((team) => (
                                            <div key={team.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                        {team.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 line-clamp-1" title={team.name}>{team.name}</h3>
                                                        <p className="text-xs text-slate-500">{team.members?.length || 0} membre(s)</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="text-xs font-medium text-slate-500 mb-2 uppercase">Membres</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {team.members?.slice(0, 5).map((memberId: string) => {
                                                            const member = users.find(u => u.id === memberId);
                                                            if (!member) return null;
                                                            return (
                                                                <img
                                                                    key={memberId}
                                                                    src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`}
                                                                    alt={member.full_name}
                                                                    title={member.full_name}
                                                                    className="w-6 h-6 rounded-full border border-white -ml-2 first:ml-0 shadow-sm"
                                                                />
                                                            );
                                                        })}
                                                        {team.members?.length > 5 && (
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-white -ml-2 flex items-center justify-center text-[10px] font-medium text-slate-600 shadow-sm">
                                                                +{team.members.length - 5}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquarePlus className="w-3 h-3" />
                                                        Canal lié
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => {
                                                        setManagingTeam(team);
                                                        setEditTeamName(team.name);
                                                        setEditTeamMembers(team.members || []);
                                                    }}>
                                                        Gérer
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Create Team Dialog */}
                <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                    <DialogContent>
                        <form onSubmit={handleCreateTeam}>
                            <DialogHeader>
                                <DialogTitle>Créer une équipe</DialogTitle>
                                <DialogDescription>
                                    Définissez un nom et assignez des collaborateurs. Un canal de discussion commun sera automatiquement créé pour cette équipe.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="teamName">Nom de l'équipe <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="teamName"
                                        placeholder="ex: Design & UX, Marketing..."
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        required
                                        maxLength={50}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label>Membres de l'équipe <span className="text-destructive">*</span></Label>
                                        <span className="text-xs text-slate-500">{selectedMembersForTeam.length} sélectionné(s)</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 border rounded-lg max-h-[250px] overflow-y-auto space-y-3">
                                        {users.filter(u => u.status !== "pending_invite" && u.status !== "inactive").map(user => (
                                            <div key={user.id} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => {
                                                if (selectedMembersForTeam.includes(user.id)) {
                                                    setSelectedMembersForTeam(prev => prev.filter(id => id !== user.id));
                                                } else {
                                                    setSelectedMembersForTeam(prev => [...prev, user.id]);
                                                }
                                            }}>
                                                <Checkbox
                                                    id={`user-${user.id}`}
                                                    checked={selectedMembersForTeam.includes(user.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedMembersForTeam(prev => [...prev, user.id]);
                                                        } else {
                                                            setSelectedMembersForTeam(prev => prev.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} className="w-6 h-6 rounded-full" alt="" />
                                                    <Label htmlFor={`user-${user.id}`} className="text-sm font-medium cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                        {user.full_name}
                                                    </Label>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">{user.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {users.filter(u => u.status !== "pending_invite" && u.status !== "inactive").length === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">Aucun membre éligible.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsCreateTeamOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={creatingTeam || !newTeamName.trim() || selectedMembersForTeam.length === 0}>
                                    {creatingTeam && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Créer l'équipe
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Manage Team Dialog */}
                <Dialog open={!!managingTeam} onOpenChange={(open) => !open && setManagingTeam(null)}>
                    <DialogContent>
                        <form onSubmit={handleUpdateTeam}>
                            <DialogHeader>
                                <DialogTitle>Gérer l'équipe</DialogTitle>
                                <DialogDescription>
                                    Modifiez le nom et les membres de l'équipe {managingTeam?.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="editTeamName">Nom de l'équipe</Label>
                                    <Input
                                        id="editTeamName"
                                        value={editTeamName}
                                        onChange={(e) => setEditTeamName(e.target.value)}
                                        required
                                        maxLength={50}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label>Membres de l'équipe</Label>
                                        <span className="text-xs text-slate-500">{editTeamMembers.length} sélectionné(s)</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 border rounded-lg max-h-[250px] overflow-y-auto space-y-3">
                                        {users.filter(u => u.status !== "pending_invite" && u.status !== "inactive").map(user => (
                                            <div key={user.id} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm cursor-pointer hover:border-primary transition-colors" onClick={() => {
                                                if (editTeamMembers.includes(user.id)) {
                                                    setEditTeamMembers(prev => prev.filter(id => id !== user.id));
                                                } else {
                                                    setEditTeamMembers(prev => [...prev, user.id]);
                                                }
                                            }}>
                                                <Checkbox
                                                    checked={editTeamMembers.includes(user.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setEditTeamMembers(prev => [...prev, user.id]);
                                                        } else {
                                                            setEditTeamMembers(prev => prev.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} className="w-6 h-6 rounded-full" alt="" />
                                                    <Label className="text-sm font-medium cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                        {user.full_name}
                                                    </Label>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">{user.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <Button type="button" variant="destructive" onClick={() => handleDeleteTeam(managingTeam.id)} className="w-full sm:w-auto">
                                    Supprimer l'équipe
                                </Button>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button type="button" variant="ghost" onClick={() => setManagingTeam(null)}>Annuler</Button>
                                    <Button type="submit" disabled={updatingTeam || !editTeamName.trim() || editTeamMembers.length === 0}>
                                        {updatingTeam && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
