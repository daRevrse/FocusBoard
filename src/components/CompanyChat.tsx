"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    createdAt: any;
}

export function CompanyChat({ channel }: { channel: any }) {
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    useEffect(() => {
        if (!userData?.company_id || !channel?.id) return;

        const q = query(
            collection(db, "messages"),
            where("channel_id", "==", channel.id),
            orderBy("createdAt", "asc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
        });

        // Update last_read_at badge tracking
        if (user?.uid) {
            import("firebase/firestore").then(({ doc, setDoc, serverTimestamp }) => {
                const readRef = doc(db, "channel_reads", `${channel.id}_${user.uid}`);
                setDoc(readRef, { last_read_at: serverTimestamp(), channel_id: channel.id, user_id: user.uid }, { merge: true }).catch(console.error);
            });
        }

        return () => unsubscribe();
    }, [userData?.company_id, channel?.id, user?.uid]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !userData?.company_id || !channel?.id) return;

        setSending(true);
        try {
            await addDoc(collection(db, "messages"), {
                channel_id: channel.id,
                company_id: userData.company_id,
                text: newMessage.trim(),
                senderId: user.uid,
                senderName: userData.full_name,
                senderAvatar: userData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.full_name}`,
                createdAt: serverTimestamp(),
            });

            // Need to update the channel's updated_at
            import("firebase/firestore").then(({ doc, updateDoc }) => {
                updateDoc(doc(db, "channels", channel.id), { updated_at: serverTimestamp() }).catch(console.error);
            });

            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    if (!userData) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <Card className="flex flex-col h-full w-full shadow-sm border-slate-200 border-0 md:border">
            <CardHeader className="border-b bg-white py-4 flex flex-row items-center gap-3 space-y-0">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        {channel?.type === 'general' ? <span className="text-primary font-bold">#</span> : <span className="text-slate-500 font-bold">#</span>}
                        {channel?.name || "Canal"}
                    </CardTitle>
                    {channel?.type === 'team' && (
                        <CardDescription className="text-xs">{channel.members?.length || 0} membres</CardDescription>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/50">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                            Aucun message pour le moment. Soyez le premier à écrire !
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId === user?.uid;
                            const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>

                                    {!isMe && showAvatar ? (
                                        <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full bg-white object-cover shadow-sm self-end" />
                                    ) : (!isMe && <div className="w-8" />)}

                                    <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                        {showAvatar && !isMe && (
                                            <span className="text-xs text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                                        )}
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        {msg.createdAt && (
                                            <span className="text-[10px] text-slate-400 mt-1">
                                                {format(msg.createdAt.toDate(), 'HH:mm', { locale: fr })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            placeholder="Écrivez votre message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            className="flex-1 rounded-full bg-slate-50 focus-visible:ring-1"
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            size="icon"
                            className="rounded-full h-10 w-10 shrink-0"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
