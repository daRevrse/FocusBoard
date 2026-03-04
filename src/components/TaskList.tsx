"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, SplitSquareVertical, UploadCloud, X, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { toast } from "sonner";
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "@/lib/upload-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobBus } from "@/lib/job-events";

interface Task {
    id: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
    points: number;
    status: string;
    assignee_id: string;
    creator_id: string;
    company_id: string;
    parent_task_id?: string | null;
    requires_deliverable?: boolean;
    deliverable_url?: string | null;
    deadline?: any;
    subtasks?: Task[];
}

export function TaskList() {
    const { user, userData } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Subdivision State
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [subTasks, setSubTasks] = useState([{ title: "", points: 1 }]);
    const [subdividing, setSubdividing] = useState(false);

    // Deliverable State
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [deliverableUrl, setDeliverableUrl] = useState("");
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
    const [deliverableTab, setDeliverableTab] = useState("file"); // "file" or "link"

    // View Details State
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const [filterStatus, setFilterStatus] = useState<"pending" | "completed">("pending");

    useEffect(() => {
        if (!user || !userData?.company_id) return;

        // Fetch tasks depending on role
        // Admin: sees all company tasks.
        // Manager: sees all company tasks (simpler to manage team).
        // Collaborator: sees ONLY tasks assigned to them OR created by them (e.g., self-assigned).
        let q;
        if (userData.role === "admin" || userData.role === "manager") {
            q = query(
                collection(db, "tasks"),
                where("company_id", "==", userData.company_id),
                where("status", "in", filterStatus === "completed" ? ["completed"] : ["pending", "in_focus"])
            );
        } else {
            q = query(
                collection(db, "tasks"),
                where("assignee_id", "==", user.uid),
                where("status", "in", filterStatus === "completed" ? ["completed"] : ["pending", "in_focus"])
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Task[];

            // Ensure we strictly filter locally based on exact statuses because 'in' query might overlap if there are data consistency issues
            const filteredLocally = tasksList.filter(t =>
                filterStatus === "completed"
                    ? t.status === "completed"
                    : (t.status === "pending" || t.status === "in_focus")
            );

            // Sort parent tasks first, then subtasks
            const parents = filteredLocally.filter(t => !t.parent_task_id);
            const subs = filteredLocally.filter(t => t.parent_task_id);

            // Group them logically (simplified for MVP)
            const organized = parents.map(p => ({
                ...p,
                // Only attach subtasks that match the current filter view
                subtasks: subs.filter(s => s.parent_task_id === p.id)
            }));

            // Include floating subtasks if their parent isn't in this view (e.g. subtask is completed but parent is pending)
            const parentIds = new Set(parents.map(p => p.id));
            const orphanedSubs = subs.filter(s => !parentIds.has(s.parent_task_id!));

            setTasks([...organized, ...orphanedSubs]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData, filterStatus]);

    const handleSubdivide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;

        // Validate points sum
        const totalSubPoints = subTasks.reduce((acc, curr) => acc + curr.points, 0);
        if (totalSubPoints !== selectedTask.points) {
            alert(`La somme des points (${totalSubPoints}) doit être égale aux points de la tâche parente (${selectedTask.points}).`);
            return;
        }

        setSubdividing(true);
        try {
            // Create sub-tasks
            const promises = subTasks.map(sub =>
                addDoc(collection(db, "tasks"), {
                    title: sub.title,
                    description: `Sous-tâche de: ${selectedTask.title}`,
                    category: selectedTask.category,
                    priority: selectedTask.priority, // Inherit priority but with new points
                    points: sub.points,
                    status: "pending",
                    assignee_id: selectedTask.assignee_id,
                    creator_id: user?.uid,
                    company_id: selectedTask.company_id,
                    parent_task_id: selectedTask.id,
                    deadline: selectedTask.deadline,
                    created_at: serverTimestamp(),
                    completed_at: null,
                })
            );

            await Promise.all(promises);

            // Mark parent task as functionally replaced/hidden or "completed" structurally so it doesn't double-count.
            // For MVP: we just leave it as 'pending' but hide it from the morning check-in if it has subtasks.

            setSelectedTask(null);
            setSubTasks([{ title: "", points: 1 }]);
        } catch (error) {
            console.error("Error subdividing:", error);
        } finally {
            setSubdividing(false);
        }
    };

    const handleCompleteTask = async (task: Task, manualUrl?: string, manualFile?: File | null) => {
        if (!user || !userData?.company_id) return;

        // Either an explicit URL was given or a file
        const needsInput = task.requires_deliverable && !manualUrl && !manualFile;

        if (needsInput) {
            setCompletingTask(task);
            return; // Open dialog instead
        }

        // Optimistic UI & background processing
        setCompletingTask(null);
        setDeliverableUrl("");
        const fileToUpload = manualFile;
        setDeliverableFile(null);

        const jobId = `complete-task-${task.id}-${Date.now()}`;
        jobBus.addJob({
            id: jobId,
            title: `Validation: ${task.title}`,
            description: fileToUpload ? "Upload du livrable en cours..." : "Mise à jour du statut",
            status: "pending"
        });

        (async () => {
            try {
                // Upload file if that's what was provided
                let finalDeliverableUrl = manualUrl;
                if (fileToUpload) {
                    finalDeliverableUrl = await uploadFile(
                        fileToUpload,
                        `deliverables/${userData.company_id}/${task.id}_${Date.now()}`,
                        [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
                        15
                    );
                }

                // 1. Mark task as completed (and save URL if provided)
                const updatePayload: any = {
                    status: "completed",
                    completed_at: serverTimestamp()
                };

                if (finalDeliverableUrl) {
                    updatePayload.deliverable_url = finalDeliverableUrl;
                }

                await updateDoc(doc(db, "tasks", task.id), updatePayload);

                // 2. Fetch Active Daily Focus and Update score
                const today = new Date().toISOString().split('T')[0];
                const focusQuery = query(
                    collection(db, "daily_focus"),
                    where("user_id", "==", user.uid),
                    where("date", "==", today),
                    where("status", "==", "active")
                );
                const focusDocs = await getDocs(focusQuery);

                if (!focusDocs.empty) {
                    const focusDoc = focusDocs.docs[0];
                    const currentCompletedPoints = focusDoc.data().total_points_completed || 0;
                    await updateDoc(doc(db, "daily_focus", focusDoc.id), {
                        total_points_completed: currentCompletedPoints + task.points
                    });
                }

                // 3. Log Activity
                await addDoc(collection(db, "activity_feed"), {
                    company_id: userData.company_id,
                    user_id: user.uid,
                    event_type: "task_completed",
                    details: { taskId: task.id, title: task.title, points: task.points, hasDeliverable: !!finalDeliverableUrl },
                    created_at: serverTimestamp(),
                });

                // Also update local state so UI reflects immediately without waiting for snapshopt if complex parent/child
                if (viewingTask) {
                    // Check if the completing task was a subtask
                    const isSubtask = viewingTask.subtasks?.some(s => s.id === task.id);
                    if (isSubtask) {
                        const allOthersCompleted = viewingTask.subtasks!.filter(s => s.id !== task.id).every(s => s.status === "completed");
                        if (allOthersCompleted) {
                            setViewingTask(null); // Close modal if last subtask was completed
                        } else {
                            // Optimistically update
                            setViewingTask({
                                ...viewingTask,
                                subtasks: viewingTask.subtasks!.map(s => s.id === task.id ? { ...s, status: "completed" } : s)
                            });
                        }
                    } else if (task.id === viewingTask.id) {
                        setViewingTask(null);
                    }
                }

                jobBus.updateJob(jobId, { status: "success", description: "Tâche terminée !" });
            } catch (error) {
                console.error("Error completing task:", error);
                jobBus.updateJob(jobId, { status: "error", error: "Erreur lors de la validation." });
            }
        })();
    };

    if (loading) {
        return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b pb-4 mb-4 overflow-x-auto">
                <Button
                    variant={filterStatus === "pending" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterStatus("pending")}
                    className="whitespace-nowrap"
                >
                    En attente
                </Button>
                <Button
                    variant={filterStatus === "completed" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterStatus("completed")}
                    className="whitespace-nowrap"
                >
                    Terminées
                </Button>
            </div>

            {tasks.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-slate-500">
                    Aucune tâche {filterStatus === "completed" ? "terminée" : "en attente"}.
                </div>
            ) : (
                tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer" onClick={() => setViewingTask(task)}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex items-center gap-2 sm:hidden mb-2" onClick={(e) => e.stopPropagation()}>
                                {userData?.role === "collaborator" && (task.status === "in_focus" || task.status === "pending") && (!task.subtasks || task.subtasks.length === 0) && (
                                    <Checkbox
                                        className="h-5 w-5 rounded-full border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                        onCheckedChange={(checked) => {
                                            if (checked) handleCompleteTask(task);
                                        }}
                                    />
                                )}
                                <Badge variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                                    {task.priority.toUpperCase()} ({task.points} pts)
                                </Badge>
                                <Badge variant="outline" className="text-xs text-slate-500">
                                    {task.category}
                                </Badge>
                            </div>

                            <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                                {userData?.role === "collaborator" && (task.status === "in_focus" || task.status === "pending") && (!task.subtasks || task.subtasks.length === 0) && (
                                    <Checkbox
                                        className="mt-1 h-5 w-5 rounded-full border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                        onCheckedChange={(checked) => {
                                            if (checked) handleCompleteTask(task);
                                        }}
                                    />
                                )}
                            </div>
                            <div className="flex-1 w-full relative pr-8">
                                <div className="flex items-start mb-1">
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Badge variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                                            {task.priority.toUpperCase()} ({task.points} pts)
                                        </Badge>
                                        <Badge variant="outline" className="text-xs text-slate-500">
                                            {task.category}
                                        </Badge>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-900 line-clamp-1">{task.title}</h3>
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <p className="mt-1 text-xs text-slate-500">{task.subtasks.length} sous-tâche(s)</p>
                                )}

                                <div className="absolute right-0 top-0" onClick={(e) => e.stopPropagation()}>
                                    {/* Edit permissions: Admins can edit anything. Managers can edit anything. Collaborators can only edit tasks assigned to them IF needed, but standardly we restrict to creator/admin/manager. For MVP, allowing collab to update their own sub-details is okay, but we restricted the Assignee dropdown already in EditTaskDialog. */}
                                    {(userData?.role === "admin" || userData?.role === "manager" || task.assignee_id === user?.uid) && (
                                        <EditTaskDialog task={task} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Task Details Dialog */}
            <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-start justify-between gap-4">
                            <span className="text-xl">{viewingTask?.title}</span>
                            <div className="flex gap-2 shrink-0">
                                <Badge variant={viewingTask?.priority === "critical" ? "destructive" : viewingTask?.priority === "high" ? "default" : "secondary"}>
                                    {viewingTask?.priority.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{viewingTask?.points} pts</Badge>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            {viewingTask?.category}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {/* Description */}
                        {viewingTask?.description ? (
                            <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-md border">
                                {viewingTask.description}
                            </div>
                        ) : (
                            <div className="text-sm italic text-slate-400">Aucune description fournie.</div>
                        )}

                        {/* Deadlines and Deliverables */}
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                            {viewingTask?.deadline && (
                                <div><strong className="text-slate-900">Échéance :</strong> {format(viewingTask.deadline.toDate(), "d MMMM yyyy", { locale: fr })}</div>
                            )}
                            <div>
                                <strong className="text-slate-900">Preuve de travail (Livrable) :</strong> {viewingTask?.requires_deliverable ? "Obligatoire" : "Non requis"}
                            </div>
                            {viewingTask?.deliverable_url && (
                                <div>
                                    <strong className="text-slate-900">Lien fourni :</strong>{" "}
                                    <a href={viewingTask.deliverable_url} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">
                                        {viewingTask.deliverable_url}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Subtasks */}
                        {viewingTask?.subtasks && viewingTask.subtasks.length > 0 && (
                            <div className="space-y-2 pt-2 border-t text-sm">
                                <strong className="text-slate-900 mb-2 block">Sous-tâches</strong>
                                {viewingTask.subtasks.map((sub: any) => (
                                    <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded border">
                                        <div className="flex items-center gap-3 flex-1">
                                            {userData?.role === "collaborator" && (sub.status === "in_focus" || sub.status === "pending") && (
                                                <Checkbox
                                                    className="h-5 w-5 rounded-full border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            handleCompleteTask(sub);
                                                            // Close details modal smoothly if everything is complete
                                                            setViewingTask(null);
                                                        }
                                                    }}
                                                />
                                            )}
                                            <span className="text-slate-700 font-medium">{sub.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                            {sub.status === "completed" && <Badge className="bg-emerald-500 hover:bg-emerald-600">Terminée</Badge>}
                                            <Badge variant="secondary" className="shrink-0">{sub.points} pts</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subdivide Action */}
                        {userData?.role === "collaborator" && viewingTask && (viewingTask.points === 3 || viewingTask.points === 5) && (!viewingTask.subtasks || viewingTask.subtasks.length === 0) && (
                            <div className="pt-4 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedTask(viewingTask);
                                        setViewingTask(null);
                                        if (viewingTask.points === 5) {
                                            setSubTasks([{ title: "Partie 1", points: 3 }, { title: "Partie 2", points: 2 }]);
                                        } else {
                                            setSubTasks([{ title: "Partie 1", points: 2 }, { title: "Partie 2", points: 1 }]);
                                        }
                                    }}
                                >
                                    <SplitSquareVertical className="h-4 w-4 mr-2" />
                                    Subdiviser (Étape par étape)
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Subdivision Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent>
                    <form onSubmit={handleSubdivide}>
                        <DialogHeader>
                            <DialogTitle>Subdiviser la tâche</DialogTitle>
                            <DialogDescription>
                                Découpez "{selectedTask?.title}" en plus petites étapes.
                                Le total doit faire <strong>{selectedTask?.points} points</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            {subTasks.map((sub, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>Sous-tâche {index + 1}</Label>
                                        <Input
                                            value={sub.title}
                                            onChange={(e) => {
                                                const newSubs = [...subTasks];
                                                newSubs[index].title = e.target.value;
                                                setSubTasks(newSubs);
                                            }}
                                            required
                                            placeholder="Nom de l'étape"
                                        />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label>Points</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="4"
                                            value={sub.points}
                                            onChange={(e) => {
                                                const newSubs = [...subTasks];
                                                newSubs[index].points = parseInt(e.target.value) || 0;
                                                setSubTasks(newSubs);
                                            }}
                                            required
                                        />
                                    </div>
                                    {index > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="text-destructive mb-0.5"
                                            onClick={() => setSubTasks(subTasks.filter((_, i) => i !== index))}
                                        >
                                            X
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full border-dashed"
                                onClick={() => setSubTasks([...subTasks, { title: "", points: 1 }])}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ligne
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setSelectedTask(null)}>Annuler</Button>
                            <Button type="submit" disabled={subdividing}>
                                {subdividing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Valider la découpe
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Deliverable Dialog */}
            <Dialog open={!!completingTask} onOpenChange={(open) => {
                if (!open) {
                    setCompletingTask(null);
                    setDeliverableUrl("");
                    setDeliverableFile(null);
                }
            }}>
                <DialogContent>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (completingTask) {
                            if (deliverableTab === "file" && !deliverableFile) {
                                toast.error("Veuillez sélectionner un fichier.");
                                return;
                            }
                            if (deliverableTab === "link" && !deliverableUrl) {
                                toast.error("Veuillez saisir un lien valide.");
                                return;
                            }
                            handleCompleteTask(completingTask, deliverableTab === "link" ? deliverableUrl : undefined, deliverableTab === "file" ? deliverableFile : null);
                        }
                    }}>
                        <DialogHeader>
                            <DialogTitle>Livrable requis</DialogTitle>
                            <DialogDescription>
                                Cette tâche nécessite une preuve de travail. Vous pouvez soit uploader un fichier, soit fournir un lien externe (Drive, Figma, etc.).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Tabs value={deliverableTab} onValueChange={setDeliverableTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="file">
                                        <UploadCloud className="w-4 h-4 mr-2" /> Fichier
                                    </TabsTrigger>
                                    <TabsTrigger value="link">
                                        <LinkIcon className="w-4 h-4 mr-2" /> Lien
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="file" className="space-y-4">
                                    <div className="flex justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
                                        {!deliverableFile ? (
                                            <div className="text-center">
                                                <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                                <Label
                                                    htmlFor="deliverableFile"
                                                    className="inline-flex cursor-pointer items-center justify-center rounded-md bg-white border px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 focus:outline-none"
                                                >
                                                    Parcourir
                                                </Label>
                                                <Input
                                                    id="deliverableFile"
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const file = e.target.files[0];
                                                            if (file.size > 15 * 1024 * 1024) {
                                                                toast.error("Le fichier ne doit pas dépasser 15mo.");
                                                                return;
                                                            }
                                                            setDeliverableFile(file);
                                                        }
                                                    }}
                                                    accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].join(',')}
                                                />
                                                <p className="mt-2 text-xs text-slate-500">PDF, Docs, Images, Zip. Max 15MB.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-emerald-600 truncate max-w-[200px]">
                                                    {deliverableFile.name}
                                                </span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setDeliverableFile(null)} className="h-8 px-2 text-slate-500">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="link" className="space-y-4">
                                    <Label htmlFor="url">Lien externe</Label>
                                    <Input
                                        id="url"
                                        type="url"
                                        placeholder="https://..."
                                        value={deliverableUrl}
                                        onChange={(e) => setDeliverableUrl(e.target.value)}
                                        className="mt-2"
                                    />
                                    <p className="text-xs text-slate-500">Collez un lien Google Drive, Figma, Notion, etc.</p>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => {
                                setCompletingTask(null);
                                setDeliverableUrl("");
                                setDeliverableFile(null);
                            }}>Annuler</Button>
                            <Button type="submit">
                                Terminer la tâche
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
