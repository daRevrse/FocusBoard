"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Loader2, FileText, UploadCloud, Folder, Search, File, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "@/lib/upload-utils";
import { toast } from "sonner";
import { jobBus } from "@/lib/job-events";

interface SharedFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploaded_by: string;
    company_id: string;
    created_at: any;
}

export default function DocumentsPage() {
    const { user, userData } = useAuth();
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [users, setUsers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchQueryLowerCase = searchQuery.toLowerCase();

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";
    const canUpload = isManagerOrAdmin || userData?.flags?.includes("manage_documents");

    const fetchData = async () => {
        if (!userData?.company_id) return;
        setLoading(true);
        try {
            // Fetch users for uploaded_by mapping
            const qUsers = query(collection(db, "users"), where("company_id", "==", userData.company_id));
            const usersSnap = await getDocs(qUsers);
            const usersMap: Record<string, any> = {};
            usersSnap.docs.forEach(d => { usersMap[d.id] = d.data(); });
            setUsers(usersMap);

            // Fetch files
            const qFiles = query(
                collection(db, "datacenter_files"),
                where("company_id", "==", userData.company_id)
            );
            const filesSnap = await getDocs(qFiles);
            const filesData = filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedFile));

            // Sort by newest
            filesData.sort((a, b) => {
                if (!a.created_at || !b.created_at) return 0;
                return b.created_at.toMillis() - a.created_at.toMillis();
            });

            setFiles(filesData);
        } catch (error) {
            console.error("Error fetching datacenter data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData?.company_id]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData?.company_id || !selectedFile) return;

        setIsUploading(true);
        const jobId = `upload-${Date.now()}`;
        jobBus.addJob({ id: jobId, title: "Data Center", description: `Upload de ${selectedFile.name}`, status: "pending" });

        try {
            const url = await uploadFile(
                selectedFile,
                `datacenter/${userData.company_id}/${Date.now()}_${selectedFile.name}`,
                [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
                50 // 50MB max for data center MVP
            );

            await addDoc(collection(db, "datacenter_files"), {
                name: selectedFile.name,
                url,
                type: selectedFile.type || "application/octet-stream",
                size: selectedFile.size,
                uploaded_by: user.uid,
                company_id: userData.company_id,
                created_at: serverTimestamp(),
            });

            setIsUploadOpen(false);
            setSelectedFile(null);
            jobBus.updateJob(jobId, { status: "success", description: "Fichier ajouté." });
            fetchData();
        } catch (error) {
            console.error("Upload error:", error);
            jobBus.updateJob(jobId, { status: "error", error: "Échec de l'upload." });
            toast.error("Erreur lors de l'upload du fichier.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (file: SharedFile) => {
        if (!isManagerOrAdmin && file.uploaded_by !== user?.uid) {
            toast.error("Vous ne pouvez supprimer que vos propres fichiers.");
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
            try {
                await deleteDoc(doc(db, "datacenter_files", file.id));
                setFiles(files.filter(f => f.id !== file.id));
                toast.success("Fichier supprimé.");
            } catch (error) {
                console.error("Error deleting file:", error);
                toast.error("Erreur de suppression.");
            }
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 octets";
        const k = 1024;
        const sizes = ['octets', 'Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Folder className="w-8 h-8 text-primary" />
                        Documents
                    </h1>
                    <p className="text-slate-500 mt-1">Espace partagé pour les documents et ressources de l'entreprise.</p>
                </div>
                {canUpload && (
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UploadCloud className="w-4 h-4" />
                                Upload
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajouter un document</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpload} className="space-y-4 py-4">
                                <div className="flex justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50">
                                    {!selectedFile ? (
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                            <label
                                                htmlFor="file-upload"
                                                className="cursor-pointer inline-flex items-center justify-center rounded-md bg-white border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                            >
                                                Sélectionner un fichier
                                            </label>
                                            <input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setSelectedFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            <p className="mt-2 text-xs text-slate-500">Max 50 Mo par fichier.</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <File className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                                            <div className="font-medium text-slate-900 truncate max-w-xs">{selectedFile.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">{formatSize(selectedFile.size)}</div>
                                            <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedFile(null)} className="mt-4 text-slate-500">
                                                Changer de fichier
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button variant="outline" type="button" onClick={() => setIsUploadOpen(false)}>Annuler</Button>
                                    <Button type="submit" disabled={isUploading || !selectedFile}>
                                        {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Confirmer l'ajout
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </header>

            <div className="bg-white border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher un fichier..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center bg-slate-50/30">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-12 text-center">
                        <Folder className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun fichier trouvé</h3>
                        <p className="text-slate-500 max-w-sm">
                            {searchQuery ? "Essayez avec d'autres termes de recherche." : "Votre centre de données est vide. Ajoutez des fichiers pour les partager avec votre équipe."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Nom du fichier</th>
                                    <th className="px-6 py-4 font-medium hidden md:table-cell">Ajouté par</th>
                                    <th className="px-6 py-4 font-medium hidden sm:table-cell">Date</th>
                                    <th className="px-6 py-4 font-medium hidden sm:table-cell">Taille</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="font-medium text-slate-900 line-clamp-1 max-w-[200px] md:max-w-xs" title={file.name}>
                                                    {file.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                                            {users[file.uploaded_by]?.full_name || "Utilisateur supprimé"}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-slate-500">
                                            {file.created_at ? format(file.created_at.toDate(), "dd MMM yyyy", { locale: fr }) : "À l'instant"}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-slate-500">
                                            {formatSize(file.size)}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 shadow-sm text-primary"
                                                onClick={() => window.open(file.url, '_blank')}
                                            >
                                                <Download className="w-4 h-4 mr-1.5 hidden sm:block" /> Ouvrir
                                            </Button>

                                            {(isManagerOrAdmin || file.uploaded_by === user?.uid) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(file)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
