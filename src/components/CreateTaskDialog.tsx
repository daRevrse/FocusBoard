"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { jobBus } from "@/lib/job-events";

export function CreateTaskDialog({ users, onSuccess }: { users: any[], onSuccess?: () => void }) {
    const { user, userData } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("low");
    const [points, setPoints] = useState("1");
    const [assigneeId, setAssigneeId] = useState("");
    const [deadline, setDeadline] = useState<Date>();
    const [requiresDeliverable, setRequiresDeliverable] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData?.company_id) return;

        setLoading(true);
        setOpen(false);
        const jobId = `create-task-${Date.now()}`;
        jobBus.addJob({ id: jobId, title: "Création de la tâche", description: `"${title}"`, status: "pending" });

        (async () => {
            try {
                const taskRef = await addDoc(collection(db, "tasks"), {
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    priority,
                    points,
                    status: "pending",
                    assignee_id: assigneeId,
                    creator_id: user.uid,
                    company_id: userData.company_id,
                    parent_task_id: null,
                    deadline: deadline ? deadline : null,
                    requires_deliverable: requiresDeliverable,
                    created_at: serverTimestamp(),
                    completed_at: null,
                });

                jobBus.updateJob(jobId, { status: "success", description: "Tâche créée avec succès." });

                // Send Email Notification if assigning to someone else in background
                if (assigneeId !== user.uid) {
                    fetch("/api/tasks/assign", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            taskId: taskRef.id,
                            title,
                            assigneeId,
                            assignerId: user.uid,
                            companyId: userData.company_id,
                        }),
                    }).catch(emailErr => {
                        console.error("Failed to send assignment email:", emailErr);
                    });
                }

                // Reset form
                setTitle("");
                setDescription("");
                setCategory("");
                setPriority("medium");
                setPoints("1");
                setAssigneeId(user.uid);
                setDeadline(undefined);
                setRequiresDeliverable(false);

                if (onSuccess) onSuccess();
            } catch (err) {
                console.error("Error creating task:", err);
                jobBus.updateJob(jobId, { status: "error", error: "La création a échoué" });
                toast.error("Veuillez réessayer.");
            } finally {
                setLoading(false);
            }
        })();
    };

    useEffect(() => {
        if (open && userData?.role === "collaborator" && user) {
            setAssigneeId(user.uid);
        }
    }, [open, userData, user]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Nouvelle Tâche</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Créer une tâche</DialogTitle>
                        <DialogDescription>
                            Assignez une nouvelle tâche avec des points à un collaborateur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titre</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Refonte de la page d'accueil"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (optionnel)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Détails de la tâche..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Ex: Design, Code, Marketing"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="assignee">Assigné à</Label>
                                {userData?.role === "collaborator" && user ? (
                                    <Select value={user.uid} onValueChange={setAssigneeId} disabled required>
                                        <SelectTrigger id="assignee">
                                            <SelectValue placeholder="Moi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={user.uid}>{userData.full_name || "Moi"}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Select value={assigneeId} onValueChange={setAssigneeId} required>
                                        <SelectTrigger id="assignee">
                                            <SelectValue placeholder="Sélectionner..." />
                                        </SelectTrigger>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priorité & Points</Label>
                                <Select
                                    value={`${priority}-${points}`}
                                    onValueChange={(val) => {
                                        const [prio, pts] = val.split("-");
                                        setPriority(prio);
                                        setPoints(pts);
                                    }}
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low-1">Basse (1 point)</SelectItem>
                                        <SelectItem value="high-3">Haute (3 points)</SelectItem>
                                        <SelectItem value="critical-5">Critique (5 points)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Deadline (optionnelle)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                !deadline && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {deadline ? format(deadline, "PPP") : <span>Choisir une date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={deadline}
                                            onSelect={setDeadline}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="deliverable"
                                checked={requiresDeliverable}
                                onCheckedChange={(val) => setRequiresDeliverable(val)}
                            />
                            <Label htmlFor="deliverable" className="text-sm font-normal">
                                Exiger un livrable (fichier/lien) pour terminer cette tâche
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer la tâche
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
