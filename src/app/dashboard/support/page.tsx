"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    status: "open" | "in_progress" | "resolved";
    priority: "low" | "medium" | "high";
    created_by: string;
    company_id: string;
    created_at: any;
    assigned_to?: string;
    messages?: any[];
}

export default function SupportPage() {
    const { user, userData } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [users, setUsers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Technique");
    const [priority, setPriority] = useState("medium");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active ticket view
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [replyText, setReplyText] = useState("");

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    const fetchTickets = async () => {
        if (!userData?.company_id || !user?.uid) return;
        setLoading(true);
        try {
            // Fetch users mapping
            const qUsers = query(collection(db, "users"), where("company_id", "==", userData.company_id));
            const usersSnap = await getDocs(qUsers);
            const usersMap: Record<string, any> = {};
            usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });
            setUsers(usersMap);

            // Fetch tickets
            let qTickets;
            if (isManagerOrAdmin) {
                // Admins/Managers see all tickets
                qTickets = query(collection(db, "support_tickets"), where("company_id", "==", userData.company_id));
            } else {
                // Collaborators see only their tickets
                qTickets = query(collection(db, "support_tickets"), where("created_by", "==", user.uid));
            }

            const snap = await getDocs(qTickets);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));

            // Sort by newest
            data.sort((a, b) => {
                if (!a.created_at || !b.created_at) return 0;
                return b.created_at.toMillis() - a.created_at.toMillis();
            });

            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, user]);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData?.company_id || !title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(db, "support_tickets"), {
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
                status: "open",
                company_id: userData.company_id,
                created_by: user.uid,
                created_at: serverTimestamp(),
                messages: []
            });

            setIsCreateOpen(false);
            setTitle("");
            setDescription("");
            setCategory("Technique");
            setPriority("medium");
            fetchTickets();
        } catch (error) {
            console.error("Error creating ticket:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !viewingTicket || !user) return;

        const newMessage = {
            id: Date.now().toString(),
            text: replyText.trim(),
            sender_id: user.uid,
            created_at: new Date().toISOString() // Basic timestamp for MVP
        };

        const updatedMessages = [...(viewingTicket.messages || []), newMessage];

        try {
            await updateDoc(doc(db, "support_tickets", viewingTicket.id), {
                messages: updatedMessages
            });

            setViewingTicket({ ...viewingTicket, messages: updatedMessages });
            setTickets(tickets.map(t => t.id === viewingTicket.id ? { ...t, messages: updatedMessages } : t));
            setReplyText("");
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!viewingTicket || !isManagerOrAdmin) return;

        try {
            await updateDoc(doc(db, "support_tickets", viewingTicket.id), { status });
            setViewingTicket({ ...viewingTicket, status: status as any });
            setTickets(tickets.map(t => t.id === viewingTicket.id ? { ...t, status: status as any } : t));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "open": return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Ouvert</span>;
            case "in_progress": return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">En cours</span>;
            case "resolved": return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Résolu</span>;
            default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    const PriorityIcon = ({ priority }: { priority: string }) => {
        switch (priority) {
            case "high": return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "medium": return <Clock className="w-4 h-4 text-amber-500" />;
            case "low": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col items-stretch">
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <LifeBuoy className="w-8 h-8 text-primary" />
                        Support Interne
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isManagerOrAdmin ? "Gérez les demandes de votre équipe." : "Besoin d'aide ? Soumettez un ticket."}
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nouveau Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Soumettre une demande</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Titre (Sujet)</Label>
                                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Problème d'accès à un outil" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Catégorie</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technique">Problème Technique</SelectItem>
                                            <SelectItem value="RH">Ressources Humaines</SelectItem>
                                            <SelectItem value="Matériel">Matériel & Équipement</SelectItem>
                                            <SelectItem value="Autre">Autre demande</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priorité</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Basse</SelectItem>
                                            <SelectItem value="medium">Moyenne</SelectItem>
                                            <SelectItem value="high">Haute (Urgent)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description détaillée</Label>
                                <Textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Veuillez décrire votre problème en détail..." />
                            </div>
                            <DialogFooter className="mt-6">
                                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Soumettre
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Tickets List */}
                <div className={`flex flex-col bg-white border rounded-xl shadow-sm shrink-0 transition-all ${viewingTicket ? 'hidden lg:flex lg:w-1/3' : 'w-full lg:w-1/3'}`}>
                    <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-900">
                            {isManagerOrAdmin ? "Toutes les demandes" : "Mes demandes"}
                        </h2>
                        <Badge variant="secondary">{tickets.length}</Badge>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center p-8 text-slate-500 text-sm">
                                Aucun ticket trouvé.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setViewingTicket(ticket)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${viewingTicket?.id === ticket.id ? 'bg-primary/5 border-primary/20' : 'bg-white hover:bg-slate-50 border-slate-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <PriorityIcon priority={ticket.priority} />
                                                <span className="font-medium text-slate-900 text-sm line-clamp-1">{ticket.title}</span>
                                            </div>
                                            <div className="shrink-0 ml-2">
                                                <StatusBadge status={ticket.status} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                            <span>{ticket.category}</span>
                                            <span>{ticket.created_at ? format(ticket.created_at.toDate(), "dd MMM", { locale: fr }) : "Maintenant"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Details View */}
                {viewingTicket && (
                    <div className="flex-1 flex flex-col bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-6 border-b bg-slate-50/50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-slate-900">{viewingTicket.title}</h2>
                                    <StatusBadge status={viewingTicket.status} />
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-4">
                                    <span>Par <strong>{users[viewingTicket.created_by]?.full_name || "Utilisateur"}</strong></span>
                                    <span>•</span>
                                    <span>{viewingTicket.created_at ? format(viewingTicket.created_at.toDate(), "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : ""}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isManagerOrAdmin && (
                                    <Select value={viewingTicket.status} onValueChange={handleUpdateStatus}>
                                        <SelectTrigger className="w-[140px] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Ouvrir</SelectItem>
                                            <SelectItem value="in_progress">En cours</SelectItem>
                                            <SelectItem value="resolved">Marquer Résolu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setViewingTicket(null)}>
                                    <MessageSquare className="w-4 h-4" /> {/* Or close icon */}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30">
                            {/* Original Message */}
                            <div className="flex gap-4">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${users[viewingTicket.created_by]?.full_name || 'U'}`} alt="Avatar" className="w-10 h-10 rounded-full" />
                                <div className="bg-white border rounded-xl p-4 flex-1 shadow-sm">
                                    <div className="font-semibold text-slate-900 text-sm mb-1">{users[viewingTicket.created_by]?.full_name || "Utilisateur"}</div>
                                    <p className="text-slate-700 whitespace-pre-wrap text-sm">{viewingTicket.description}</p>
                                </div>
                            </div>

                            {/* Replies */}
                            {viewingTicket.messages?.map(msg => (
                                <div key={msg.id} className="flex gap-4">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${users[msg.sender_id]?.full_name || 'U'}`} alt="Avatar" className="w-10 h-10 rounded-full" />
                                    <div className={`border rounded-xl p-4 flex-1 shadow-sm ${msg.sender_id === user?.uid ? 'bg-primary/5 border-primary/10' : 'bg-white'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-semibold text-slate-900 text-sm">{users[msg.sender_id]?.full_name || "Utilisateur"}</div>
                                            <div className="text-xs text-slate-400">{format(new Date(msg.created_at), "dd MMM 'à' HH:mm", { locale: fr })}</div>
                                        </div>
                                        <p className="text-slate-700 whitespace-pre-wrap text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder={viewingTicket.status === "resolved" ? "Ce ticket est résolu. Rouvrir pour répondre." : "Taper votre réponse..."}
                                    className="min-h-[80px] resize-none"
                                    disabled={viewingTicket.status === "resolved"}
                                />
                                <Button
                                    className="sm:self-end h-10 px-8"
                                    onClick={handleReply}
                                    disabled={!replyText.trim() || viewingTicket.status === "resolved"}
                                >
                                    Envoyer
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State when no ticket selected desktop */}
                {!viewingTicket && (
                    <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-slate-50/50 border rounded-xl border-dashed">
                        <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">{tickets.length > 0 ? "Sélectionnez un ticket pour voir les détails" : "Commencez par créer un nouveau ticket"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
