"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, FolderKanban, Plus, Briefcase, Calendar, Users, MoreVertical, Trash, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    description: string;
    status: "planning" | "active" | "completed" | "on_hold";
    created_by: string;
    company_id: string;
    created_at: any;
    due_date?: string;
    manager_id?: string;
    assignees?: string[]; // Array of user IDs assigned to this project
}

export default function ProjectsPage() {
    const { user, userData } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("planning");
    const [dueDate, setDueDate] = useState("");
    const [assignees, setAssignees] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Users for assignment
    const [users, setUsers] = useState<any[]>([]);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    const fetchProjects = async () => {
        if (!userData?.company_id) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "projects"),
                where("company_id", "==", userData.company_id)
            );
            const snap = await getDocs(q);
            const projData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));

            // Sort active > planning > on_hold > completed
            const statusOrder = { active: 1, planning: 2, on_hold: 3, completed: 4 };
            projData.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

            setProjects(projData);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();

        // Fetch company users for assignees dropdown
        if (userData?.company_id) {
            getDocs(query(collection(db, "users"), where("company_id", "==", userData.company_id))).then(snap => {
                setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        }
    }, [userData?.company_id]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData?.company_id || !name.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "projects"), {
                name: name.trim(),
                description: description.trim(),
                status,
                due_date: dueDate || null,
                company_id: userData.company_id,
                created_by: user.uid,
                manager_id: user.uid, // Default creator as manager
                assignees: assignees,
                created_at: serverTimestamp(),
            });
            setIsCreateOpen(false);
            setName("");
            setDescription("");
            setStatus("planning");
            setDueDate("");
            setAssignees([]);
            fetchProjects();
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!isManagerOrAdmin) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Les tâches liées perdront leur référence.")) {
            try {
                await deleteDoc(doc(db, "projects", id));
                setProjects(projects.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!isManagerOrAdmin) return;
        try {
            await updateDoc(doc(db, "projects", id), { status: newStatus });
            setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
        } catch (error) {
            console.error("Error updating project status:", error);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "active": return { label: "En cours", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" };
            case "planning": return { label: "Planification", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
            case "completed": return { label: "Terminé", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" };
            case "on_hold": return { label: "En pause", bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
            default: return { label: status, bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" };
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <FolderKanban className="w-8 h-8 text-primary" />
                        Projets
                    </h1>
                    <p className="text-slate-500 mt-1">Gérez les initiatives globales de l'entreprise.</p>
                </div>
                {isManagerOrAdmin && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nouveau Projet
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Créer un Nouveau Projet</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateProject} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nom du projet</Label>
                                    <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Refonte Site Web" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Objectifs et détails du projet..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Statut Initial</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="planning">Planification</SelectItem>
                                                <SelectItem value="active">En cours</SelectItem>
                                                <SelectItem value="on_hold">En pause</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date d'échéance</Label>
                                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Équipe de Projet</Label>
                                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50">
                                        {users.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic">Aucun utilisateur trouvé.</p>
                                        ) : (
                                            users.map(u => (
                                                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignees.includes(u.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setAssignees([...assignees, u.id]);
                                                            else setAssignees(assignees.filter(id => id !== u.id));
                                                        }}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`} alt={u.full_name} className="w-5 h-5 rounded-full" />
                                                        <span>{u.full_name}</span>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">Seuls les membres assignés pourront voir et gérer les tâches de ce projet.</p>
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Créer le projet
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : projects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <Briefcase className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun projet</h3>
                    <p className="text-slate-500 max-w-sm mb-6">
                        Commencez par créer votre premier projet pour organiser le travail de votre équipe à grande échelle.
                    </p>
                    {isManagerOrAdmin && (
                        <Button onClick={() => setIsCreateOpen(true)}>Créer le premier projet</Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8">
                    {projects.map(project => {
                        const statusConfig = getStatusConfig(project.status);

                        return (
                            <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                        {statusConfig.label}
                                    </div>
                                    {isManagerOrAdmin && (
                                        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                                            <Select
                                                value={project.status}
                                                onValueChange={(val) => handleUpdateStatus(project.id, val)}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="planning">Planification</SelectItem>
                                                    <SelectItem value="active">En cours</SelectItem>
                                                    <SelectItem value="on_hold">En pause</SelectItem>
                                                    <SelectItem value="completed">Terminé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1" title={project.name}>
                                    {project.name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3">
                                    {project.description || "Aucune description fournie pour ce projet."}
                                </p>

                                <div className="pt-4 border-t flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5" title="Date d'échéance">
                                        <Calendar className="w-4 h-4" />
                                        {project.due_date ? format(new Date(project.due_date), "dd MMM yyyy", { locale: fr }) : "Aucune"}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>{project.assignees?.length || 0} Membre{project.assignees?.length === 1 ? '' : 's'}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
