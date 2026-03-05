"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, Calendar, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    due_date?: string;
    company_id: string;
    assignees?: string[];
}

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, userData } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id || !userData?.company_id) return;

        const fetchProject = async () => {
            try {
                const docRef = doc(db, "projects", id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().company_id === userData.company_id) {
                    setProject({ id: docSnap.id, ...docSnap.data() } as Project);
                } else {
                    router.push("/dashboard/projects");
                }
            } catch (error) {
                console.error("Error fetching project:", error);
                router.push("/dashboard/projects");
            }
        };

        fetchProject();

        // Listen for tasks
        const qTasks = query(
            collection(db, "tasks"),
            where("company_id", "==", userData.company_id),
            where("project_id", "==", id)
        );

        const unsubscribe = onSnapshot(qTasks, (snapshot) => {
            setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, userData, router]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) return null;

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "active": return { label: "En cours", bg: "bg-indigo-100", text: "text-indigo-700" };
            case "planning": return { label: "Planification", bg: "bg-amber-100", text: "text-amber-700" };
            case "completed": return { label: "Terminé", bg: "bg-emerald-100", text: "text-emerald-700" };
            case "on_hold": return { label: "En pause", bg: "bg-slate-100", text: "text-slate-700" };
            default: return { label: status, bg: "bg-slate-100", text: "text-slate-700" };
        }
    };
    const sConf = getStatusConfig(project.status);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";
    const isTeamMember = project.assignees?.includes(user?.uid || "") || isManagerOrAdmin;

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        if (!isTeamMember) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        if (!isTeamMember) return;

        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;

        // Verify if status actually changed
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status === newStatus) return;

        // Optimistic UI Update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await updateDoc(doc(db, "tasks", taskId), {
                status: newStatus,
                completed_at: newStatus === "completed" ? new Date() : null
            });

            // Update user daily points if status moves to/from completed
            if ((newStatus === "completed" || task?.status === "completed") && task?.assignee_id) {
                const focusQuery = query(
                    collection(db, "daily_focus"),
                    where("user_id", "==", task.assignee_id),
                    where("status", "==", "active")
                );
                const focusDocs = await getDocs(focusQuery);
                if (!focusDocs.empty) {
                    const focusDoc = focusDocs.docs[0];
                    const currentCompleted = focusDoc.data().total_points_completed || 0;

                    let newPoints = currentCompleted;
                    if (newStatus === "completed") newPoints += (Number(task?.points) || 1);
                    else if (task?.status === "completed") newPoints -= (Number(task?.points) || 1);

                    await updateDoc(doc(db, "daily_focus", focusDoc.id), {
                        total_points_completed: Math.max(0, newPoints)
                    });
                }
            }

            toast.success("Statut de la tâche mis à jour");
        } catch (error) {
            console.error("Error updating task status:", error);
            toast.error("Erreur lors de la mise à jour");
            // Revert optimistically if fetch/update fails
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task?.status } : t));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const openEdit = () => {
        if (!project) return;
        setEditName(project.name);
        setEditDesc(project.description);
        setEditDueDate(project.due_date || "");
        setIsEditOpen(true);
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !editName.trim()) return;
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "projects", project.id), {
                name: editName.trim(),
                description: editDesc.trim(),
                due_date: editDueDate || null
            });
            setProject(prev => prev ? { ...prev, name: editName.trim(), description: editDesc.trim(), due_date: editDueDate || undefined } : null);
            setIsEditOpen(false);
            toast.success("Projet mis à jour !");
        } catch (err) {
            console.error(err);
            toast.error("Erreur de mise à jour");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce projet ? Cette action supprimera également toutes les tâches associées.")) {
            try {
                // Delete tasks linked
                const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("project_id", "==", project.id)));
                const deletePromises = tasksSnapshot.docs.map(tDoc => deleteDoc(doc(db, "tasks", tDoc.id)));
                await Promise.all(deletePromises);

                await deleteDoc(doc(db, "projects", project.id));
                toast.success("Projet supprimé avec succès !");
                router.push("/dashboard/projects");
            } catch (err) {
                console.error(err);
                toast.error("Erreur lors de la suppression du projet");
            }
        }
    };

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const inProgressTasks = tasks.filter(t => t.status === "in_focus");
    const doneTasks = tasks.filter(t => t.status === "completed");

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
            <Button variant="ghost" className="w-fit mb-6 text-slate-500 hover:text-slate-900" onClick={() => router.push("/dashboard/projects")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux projets
            </Button>

            <header className="mb-8 border-b pb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
                            <Badge className={`${sConf.bg} ${sConf.text} hover:${sConf.bg} border-none`}>{sConf.label}</Badge>
                        </div>
                        <p className="text-slate-600 max-w-2xl">{project.description}</p>
                    </div>
                    {isManagerOrAdmin && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={openEdit}>Modifier</Button>
                            <Button variant="destructive" size="sm" onClick={handleDeleteProject}>Supprimer</Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-6 mt-6 pt-6 border-t font-medium text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {project.due_date ? format(new Date(project.due_date), "dd MMMM yyyy", { locale: fr }) : "Aucune échéance"}
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {tasks.length} Tâches ({progress}% achevé)
                    </div>
                </div>
            </header>

            <div className="flex-1 mt-6">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 border rounded-xl border-dashed">
                        <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune tâche assignée</h3>
                        <p className="text-slate-500 text-center max-w-sm">
                            Ce projet est actuellement vide. Liez des tâches à ce projet lors de leur création.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
                        {/* Column: À Faire (Pending) */}
                        <div
                            className="flex flex-col bg-slate-100/50 rounded-xl border border-slate-200 p-4"
                            onDrop={(e) => handleDrop(e, "pending")}
                            onDragOver={handleDragOver}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-700 font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div> À Faire
                                </h3>
                                <Badge variant="secondary" className="bg-slate-200 text-slate-600">{pendingTasks.length}</Badge>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto">
                                {pendingTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} isTeamMember={isTeamMember} />
                                ))}
                            </div>
                        </div>

                        {/* Column: En Cours (In Focus) */}
                        <div
                            className="flex flex-col bg-amber-50/50 rounded-xl border border-amber-200/50 p-4"
                            onDrop={isTeamMember ? (e) => handleDrop(e, "in_focus") : undefined}
                            onDragOver={handleDragOver}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-amber-700 font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div> En Cours
                                </h3>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">{inProgressTasks.length}</Badge>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto">
                                {inProgressTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} isTeamMember={isTeamMember} />
                                ))}
                            </div>
                        </div>

                        {/* Column: Terminé (Completed) */}
                        <div
                            className="flex flex-col bg-emerald-50/50 rounded-xl border border-emerald-200/50 p-4"
                            onDrop={isTeamMember ? (e) => handleDrop(e, "completed") : undefined}
                            onDragOver={handleDragOver}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-emerald-700 font-medium text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Terminé
                                </h3>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{doneTasks.length}</Badge>
                            </div>
                            <div className="flex-1 space-y-3 overflow-y-auto">
                                {doneTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} isTeamMember={isTeamMember} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le projet</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProject} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nom du projet</Label>
                            <Input required value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date d'échéance</Label>
                            <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TaskCard({ task, onDragStart, isTeamMember }: { task: any, onDragStart: (e: React.DragEvent, id: string) => void, isTeamMember: boolean }) {
    return (
        <div
            draggable={isTeamMember}
            onDragStart={(e) => onDragStart(e, task.id)}
            className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm ${isTeamMember ? 'cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md' : 'opacity-80 cursor-default'} transition-all group`}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-medium text-slate-900 text-sm leading-tight">{task.title}</h4>
            </div>
            {task.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {task.points} pts
                </span>
                {task.priority === "high" && <span className="text-[10px] font-bold text-red-500">Urgent</span>}
                {task.priority === "critical" && <span className="text-[10px] font-bold text-red-600">Critique</span>}
            </div>
        </div>
    );
}
