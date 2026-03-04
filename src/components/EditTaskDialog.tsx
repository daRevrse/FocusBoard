"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { jobBus } from "@/lib/job-events";

interface Task {
    id: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
    points: number;
    assignee_id: string;
}

interface EditTaskDialogProps {
    task: Task;
}

export function EditTaskDialog({ task }: EditTaskDialogProps) {
    const { user, userData } = useAuth();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [category, setCategory] = useState(task.category);
    const [priority, setPriority] = useState(task.priority);
    const [assigneeId, setAssigneeId] = useState(task.assignee_id);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (userData?.company_id && open) {
                const q = query(collection(db, "users"), where("company_id", "==", userData.company_id));
                const snapshot = await getDocs(q);
                setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };
        fetchUsers();
    }, [userData, open]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setOpen(false);

        const jobId = `edit-task-${task.id}-${Date.now()}`;
        jobBus.addJob({ id: jobId, title: "Modification de tâche", description: `Mise à jour de "${title}"`, status: "pending" });

        (async () => {
            try {
                const points = priority === "critical" ? 5 : priority === "high" ? 3 : 1;
                const updates: any = {
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    priority,
                    points,
                    assignee_id: assigneeId,
                    updated_at: serverTimestamp()
                };

                await updateDoc(doc(db, "tasks", task.id), updates);

                jobBus.updateJob(jobId, { status: "success", description: "Modifications enregistrées" });

                // If assignee changed, send email in background
                if (assigneeId !== task.assignee_id && assigneeId !== user?.uid && userData?.company_id) {
                    fetch("/api/tasks/assign", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            taskId: task.id,
                            title: title.trim(),
                            assigneeId,
                            assignerId: user?.uid,
                            companyId: userData.company_id,
                        }),
                    }).catch(emailErr => {
                        console.error("Failed to send assignment email:", emailErr);
                    });
                }
            } catch (err) {
                console.error("Error updating task:", err);
                jobBus.updateJob(jobId, { status: "error", error: "Échec de la modification" });
                toast.error("Erreur lors de la modification de la tâche.");
            } finally {
                setSubmitting(false);
            }
        })();
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteDoc(doc(db, "tasks", task.id));
            setOpen(false);
        } catch (error) {
            console.error("Error deleting task:", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleUpdate}>
                    <DialogHeader>
                        <DialogTitle>Modifier la tâche</DialogTitle>
                        <DialogDescription>
                            Modifiez les détails de cette tâche. Les changements seront visibles instantanément.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titre de la tâche</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Priorité (Points)</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Basse (1 pt)</SelectItem>
                                        <SelectItem value="high">Haute (3 pts)</SelectItem>
                                        <SelectItem value="critical">Critique (5 pts)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Pôle / Catégorie</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="Sales">Sales</SelectItem>
                                        <SelectItem value="Tech">Tech</SelectItem>
                                        <SelectItem value="Design">Design</SelectItem>
                                        <SelectItem value="Product">Product</SelectItem>
                                        <SelectItem value="Support">Support</SelectItem>
                                        <SelectItem value="Opérations">Opérations</SelectItem>
                                        <SelectItem value="Autre">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Assigné à</Label>
                            {userData?.role === "collaborator" ? (
                                <Select value={assigneeId} disabled>
                                    <SelectTrigger><SelectValue placeholder="Moi" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={assigneeId}>
                                            {users.find(u => u.id === assigneeId)?.full_name || "Assigné actuel"}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Select value={assigneeId} onValueChange={setAssigneeId}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionnez un membre" /></SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.full_name} {u.id === user?.uid && "(Moi)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="icon" disabled={deleting}>
                                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action supprimera définitivement la tâche. Les sous-tâches liées ne sont pas automatiquement supprimées dans cette version MVP.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Continuer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mettre à jour
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
