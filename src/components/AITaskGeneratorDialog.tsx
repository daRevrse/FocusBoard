"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Wand2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { jobBus } from "@/lib/job-events";

type GeneratedTask = {
    id: string;
    title: string;
    description: string;
    category: string;
    points: number;
    priority: string;
    selected: boolean;
};

export function AITaskGeneratorDialog({ users = [], projects = [], onSuccess }: { users?: any[], projects?: any[], onSuccess?: () => void }) {
    const { user, userData } = useAuth();
    const [open, setOpen] = useState(false);

    const [step, setStep] = useState<"prompt" | "generating" | "review">("prompt");
    const [prompt, setPrompt] = useState("");
    const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);

    const [globalAssigneeId, setGlobalAssigneeId] = useState<string>("unassigned");
    const [globalProjectId, setGlobalProjectId] = useState<string>("none");

    // Reset state on open
    useEffect(() => {
        if (open) {
            setStep("prompt");
            setPrompt("");
            setGeneratedTasks([]);
            setGlobalAssigneeId(user?.uid || "unassigned");
            setGlobalProjectId("none");
        }
    }, [open, user]);

    const handleGenerate = () => {
        if (!prompt.trim()) {
            toast.error("Veuillez décrire votre projet.");
            return;
        }

        setStep("generating");

        // Simulation d'une attente réseau et d'une réponse IA
        setTimeout(() => {
            const mockTasks: GeneratedTask[] = [
                { id: "1", title: "Analyser le contexte", description: "Extraire les besoins principaux depuis la description fournie.", category: "Analyse", points: 1, priority: "low", selected: true },
                { id: "2", title: "Définir l'architecture technique", description: "Identifier les bases de données et les flux d'API nécessaires.", category: "Backend", points: 3, priority: "medium", selected: true },
                { id: "3", title: "Maquetter l'interface utilisateur", description: "Design et ergonomie de la fonctionnalité.", category: "Design", points: 3, priority: "medium", selected: true },
                { id: "4", title: "Intégration et développement", description: "Coder la solution en React/Next.js.", category: "Frontend", points: 5, priority: "high", selected: true },
                { id: "5", title: "Tests et validation", description: "Vérifier l'absence de bugs avant le déploiement.", category: "QA", points: 2, priority: "low", selected: true }
            ];
            setGeneratedTasks(mockTasks);
            setStep("review");
        }, 2500);
    };

    const handleConfirm = async () => {
        const selectedTasks = generatedTasks.filter(t => t.selected);
        if (selectedTasks.length === 0) {
            toast.error("Veuillez sélectionner au moins une tâche.");
            return;
        }

        if (!user || !userData?.company_id) return;

        setStep("generating"); // Pour utiliser le design de chargement
        const jobId = `ai-tasks-${Date.now()}`;
        jobBus.addJob({ id: jobId, title: "Génération de tâches", description: `${selectedTasks.length} tâches en cours de création`, status: "pending" });

        try {
            for (const t of selectedTasks) {
                await addDoc(collection(db, "tasks"), {
                    title: t.title.trim(),
                    description: t.description.trim(),
                    category: t.category,
                    priority: t.priority,
                    points: Number(t.points),
                    status: "pending",
                    assignee_id: globalAssigneeId === "unassigned" ? "" : globalAssigneeId,
                    creator_id: user.uid,
                    company_id: userData.company_id,
                    project_id: globalProjectId === "none" ? null : globalProjectId,
                    parent_task_id: null,
                    deadline: null,
                    requires_deliverable: false,
                    is_recurring: false,
                    created_at: serverTimestamp(),
                    completed_at: null,
                });
            }

            jobBus.updateJob(jobId, { status: "success", description: `${selectedTasks.length} tâches créées` });
            toast.success("Tâches créées avec succès !");
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Erreur création batch", err);
            jobBus.updateJob(jobId, { status: "error", error: "La création a échoué" });
            toast.error("Veuillez réessayer.");
            setStep("review");
        }
    };

    const toggleTaskSelection = (id: string) => {
        setGeneratedTasks(tasks => tasks.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générateur IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Générateur de tâches IA (Bêta)
                    </DialogTitle>
                    <DialogDescription>
                        {step === "prompt" && "Décrivez votre projet, l'IA se charge de le découper en tâches."}
                        {step === "generating" && "L'IA analyse votre demande..."}
                        {step === "review" && "Vérifiez et validez les tâches proposées par l'IA."}
                    </DialogDescription>
                </DialogHeader>

                {step === "prompt" && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="prompt">Contexte du projet</Label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: On doit créer une nouvelle page d'accueil avec un formulaire de contact, relier tout ça au backend et prévoir la phase de tests..."
                                rows={5}
                                className="resize-none"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button onClick={handleGenerate} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white">
                                <Wand2 className="mr-2 h-4 w-4" />
                                Générer les tâches
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === "generating" && (
                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                        <p className="text-sm text-slate-500 animate-pulse">L'intelligence artificielle découpe votre projet...</p>
                    </div>
                )}

                {step === "review" && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                            <div className="grid gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase">Assigner tout à</Label>
                                <Select value={globalAssigneeId} onValueChange={setGlobalAssigneeId}>
                                    <SelectTrigger className="h-8 text-sm bg-white">
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned" className="font-bold text-amber-600">Non assignée</SelectItem>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {projects && projects.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">Projet lié</Label>
                                    <Select value={globalProjectId} onValueChange={setGlobalProjectId}>
                                        <SelectTrigger className="h-8 text-sm bg-white">
                                            <SelectValue placeholder="Aucun projet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun projet</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border rounded-md p-2">
                            {generatedTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${task.selected ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-transparent opacity-60'}`}
                                >
                                    <div className="pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleTaskSelection(task.id)}
                                            className="text-amber-500 hover:text-amber-600"
                                        >
                                            {task.selected ? <CheckSquare className="h-5 w-5" /> : <div className="h-5 w-5 border-2 rounded-sm border-slate-300"></div>}
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-900">{task.title}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{task.category}</span>
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{task.points} pts</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-50 text-red-700' : task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                                {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="mt-2">
                            <Button variant="ghost" onClick={() => setStep("prompt")}>Retour</Button>
                            <Button onClick={handleConfirm} disabled={!generatedTasks.some(t => t.selected)}>
                                Importer {generatedTasks.filter(t => t.selected).length} tâches
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
