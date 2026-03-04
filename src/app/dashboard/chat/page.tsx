"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, addDoc, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";
import { CompanyChat } from "@/components/CompanyChat";
import { Loader2, Hash, Users, MessageSquare, Plus, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
    const { user, userData } = useAuth();
    const [channels, setChannels] = useState<any[]>([]);
    const [channelReads, setChannelReads] = useState<Record<string, any>>({});
    const [companyUsers, setCompanyUsers] = useState<any[]>([]);
    const [isNewDMOpen, setIsNewDMOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creatingDM, setCreatingDM] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);

    useEffect(() => {
        if (!userData?.company_id || !user) return;

        const q = query(collection(db, "channels"), where("company_id", "==", userData.company_id));

        const unsubscribe = onSnapshot(q, async (snap) => {
            const fetched: any[] = [];
            let hasGeneral = false;

            snap.forEach(doc => {
                const data = doc.data();
                if (data.type === "general") {
                    hasGeneral = true;
                    fetched.push({ id: doc.id, ...data });
                } else if (data.members?.includes(user.uid)) {
                    fetched.push({ id: doc.id, ...data });
                }
            });

            if (!hasGeneral) {
                // Auto-create general channel if first time
                try {
                    const generalRef = await addDoc(collection(db, "channels"), {
                        company_id: userData.company_id,
                        name: "Général",
                        type: "general",
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });
                    fetched.unshift({
                        id: generalRef.id,
                        company_id: userData.company_id,
                        name: "Général",
                        type: "general"
                    });
                } catch (err) {
                    console.error("Error creating general channel", err);
                }
            }

            // Sort to put General first, then alphabetically
            fetched.sort((a, b) => {
                if (a.type === 'general') return -1;
                if (b.type === 'general') return 1;
                const nameA = a.name || "";
                const nameB = b.name || "";
                return nameA.localeCompare(nameB);
            });

            setChannels(fetched);
            if (fetched.length > 0 && !selectedChannel) {
                setSelectedChannel(fetched[0]);
            }
            setLoading(false);
        });

        // Track channel reads for badges
        const qReads = query(collection(db, "channel_reads"), where("user_id", "==", user.uid));
        const unsubReads = onSnapshot(qReads, (snap) => {
            const reads: Record<string, any> = {};
            snap.forEach(doc => {
                const data = doc.data();
                reads[data.channel_id] = data.last_read_at;
            });
            setChannelReads(reads);
        });

        // Fetch all company users for DM list
        const fetchUsers = async () => {
            if (!userData?.company_id) return;
            const usersQ = query(collection(db, "users"), where("company_id", "==", userData.company_id));
            const usersSnap = await getDocs(usersQ);
            const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCompanyUsers(usersData);
        };
        fetchUsers();

        return () => {
            unsubscribe();
            unsubReads();
        };
    }, [userData?.company_id, user?.uid]);

    const handleCreateDM = async (targetUserId: string) => {
        if (!userData?.company_id || !user) return;
        setCreatingDM(true);

        try {
            // Check if DM already exists
            const existingDM = channels.find(c =>
                c.type === "direct" &&
                c.members?.includes(user.uid) &&
                c.members?.includes(targetUserId)
            );

            if (existingDM) {
                setSelectedChannel(existingDM);
                setIsNewDMOpen(false);
                setCreatingDM(false);
                return;
            }

            // Create new DM
            const dmRef = await addDoc(collection(db, "channels"), {
                company_id: userData.company_id,
                type: "direct",
                members: [user.uid, targetUserId],
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            const newDM = {
                id: dmRef.id,
                company_id: userData.company_id,
                type: "direct",
                members: [user.uid, targetUserId],
            };

            setChannels(prev => [...prev, newDM]);
            setSelectedChannel(newDM);
            setIsNewDMOpen(false);
        } catch (err) {
            console.error("Error creating DM", err);
        } finally {
            setCreatingDM(false);
        }
    };

    if (loading) {
        return <div className="h-[calc(100vh-theme(spacing.16))] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    const hasUnread = (channel: any) => {
        if (!channel.updated_at) return false;
        const lastRead = channelReads[channel.id];
        if (!lastRead) return true; // Never read
        return channel.updated_at.toMillis() > lastRead.toMillis();
    };

    const getOtherUserInDM = (channel: any) => {
        const otherUserId = channel.members?.find((m: string) => m !== user?.uid);
        return companyUsers.find(u => u.id === otherUserId);
    };

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] md:h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white">

            {/* Sidebar */}
            <div className="w-full md:w-64 border-r bg-slate-50 flex flex-col h-1/3 md:h-full shrink-0">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-slate-800">Canaux</h2>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Entreprise
                    </div>
                    {channels.filter(c => c.type === 'general').map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedChannel(c)}
                            className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${selectedChannel?.id === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <Hash className="w-4 h-4 mr-2 opacity-50" />
                            <span className="flex-1 text-left truncate">{c.name}</span>
                            {hasUnread(c) && selectedChannel?.id !== c.id && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                        </button>
                    ))}

                    <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Vos Équipes
                    </div>
                    {channels.filter(c => c.type === 'team').map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedChannel(c)}
                            className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${selectedChannel?.id === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <Users className="w-4 h-4 mr-2 opacity-50" />
                            <span className="flex-1 text-left truncate">{c.name}</span>
                            {hasUnread(c) && selectedChannel?.id !== c.id && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                        </button>
                    ))}

                    {channels.filter(c => c.type === 'team').length === 0 && (
                        <div className="px-4 py-2 text-xs text-slate-400 italic">Aucune équipe rejointe.</div>
                    )}

                    <div className="px-3 mt-6 mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span>Messages Directs</span>
                        <button onClick={() => setIsNewDMOpen(true)} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    {channels.filter(c => c.type === 'direct').map(c => {
                        const otherUser = getOtherUserInDM(c);
                        const chatName = otherUser?.full_name || "Utilisateur";
                        return (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChannel(c)}
                                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${selectedChannel?.id === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                {otherUser?.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt="" className="w-5 h-5 rounded-full mr-2" />
                                ) : (
                                    <UserIcon className="w-4 h-4 mr-2 opacity-50" />
                                )}
                                <span className="flex-1 text-left truncate">{chatName}</span>
                                {hasUnread(c) && selectedChannel?.id !== c.id && (
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 h-2/3 md:h-full bg-white flex flex-col">
                {selectedChannel ? (
                    <CompanyChat channel={{
                        ...selectedChannel,
                        name: selectedChannel.type === 'direct'
                            ? getOtherUserInDM(selectedChannel)?.full_name || "Trame privée"
                            : selectedChannel.name
                    }} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Sélectionnez un canal pour discuter
                    </div>
                )}
            </div>

            {/* New DM Dialog */}
            <Dialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau Message Direct</DialogTitle>
                        <DialogDescription>Sélectionnez un membre de votre entreprise pour démarrer une discussion privée.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 py-4 px-1">
                        {companyUsers.filter(u => u.id !== user?.uid).map(u => (
                            <button
                                key={u.id}
                                disabled={creatingDM}
                                onClick={() => handleCreateDM(u.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-slate-50 transition-all text-left"
                            >
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`} className="w-8 h-8 rounded-full bg-slate-100" alt="" />
                                <div>
                                    <div className="font-medium text-sm text-slate-900">{u.full_name}</div>
                                    <div className="text-xs text-slate-500 capitalize">{u.role}</div>
                                </div>
                            </button>
                        ))}
                        {companyUsers.filter(u => u.id !== user?.uid).length === 0 && (
                            <div className="text-center text-sm text-slate-500 py-4">Aucun autre membre dans l'entreprise.</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewDMOpen(false)}>Annuler</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
