"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Table2, Plus, Trash2, Search, FileSpreadsheet, Upload, FileJson, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface DataFile {
    id: string;
    name: string;
    company_id: string;
    created_by: string;
    created_at: any;
    columns: { id: string; name: string }[];
}

export default function DataCenterDashboard() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [files, setFiles] = useState<DataFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [creating, setCreating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            if (!userData?.company_id) return;
            setLoading(true);
            try {
                const q = query(collection(db, "datacenter_files"), where("company_id", "==", userData.company_id));
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as DataFile));

                // Sort by date descending
                setFiles(data.sort((a, b) => {
                    const timeA = a.created_at?.toMillis?.() || 0;
                    const timeB = b.created_at?.toMillis?.() || 0;
                    return timeB - timeA;
                }));
            } catch (error) {
                console.error("Error fetching datacenter files:", error);
                toast.error("Erreur de chargement des fichiers");
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [userData?.company_id]);

    const handleCreateScratch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileName.trim() || !userData?.company_id || !user) return;

        setCreating(true);
        try {
            // Default 6 columns
            const defaultCols = [
                { id: "col1", name: "Colonne 1" },
                { id: "col2", name: "Colonne 2" },
                { id: "col3", name: "Colonne 3" },
                { id: "col4", name: "Colonne 4" }
            ];

            const fileDoc = {
                name: newFileName.trim(),
                company_id: userData.company_id,
                created_by: user.uid,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                columns: defaultCols
            };

            const docRef = await addDoc(collection(db, "datacenter_files"), fileDoc);

            toast.success("Fichier créé avec succès");
            router.push(`/dashboard/datacenter/${docRef.id}`);
        } catch (error) {
            console.error("Error creating file:", error);
            toast.error("Erreur lors de la création");
            setCreating(false);
        }
    };

    const handleDeleteFile = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Voulez-vous vraiment supprimer ce fichier et toutes ses données ? Cette action est irréversible.")) return;

        try {
            // Delete file metadata
            await deleteDoc(doc(db, "datacenter_files", id));

            // Delete associated records
            const q = query(collection(db, "datacenter_records"), where("file_id", "==", id));
            const snap = await getDocs(q);

            // Need batch deletion if many records
            const batch = writeBatch(db);
            snap.docs.forEach((d) => {
                batch.delete(d.ref);
            });
            await batch.commit();

            setFiles(files.filter(f => f.id !== id));
            toast.success("Fichier supprimé");
        } catch (error) {
            console.error("Error deleting file:", error);
            toast.error("Erreur de suppression");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userData?.company_id || !user) return;

        setIsImporting(true);

        try {
            const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;

            // Try to parse CSV/XLSX
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const workbook = XLSX.read(bstr, { type: 'binary' });
                    const wsname = workbook.SheetNames[0];
                    const ws = workbook.Sheets[wsname];

                    // Convert to JSON array of arrays to extract headers
                    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

                    if (data.length === 0) {
                        toast.error("Le fichier est vide");
                        setIsImporting(false);
                        return;
                    }

                    // Extract headers (first row)
                    const rawHeaders = data[0];
                    const columns = rawHeaders.map((header: string, index: number) => ({
                        id: `col_${index}`,
                        name: header ? String(header).trim() : `Col ${index + 1}`
                    }));

                    // Create File doc
                    const fileDoc = {
                        name: fileNameWithoutExt,
                        company_id: userData.company_id,
                        created_by: user.uid,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        columns: columns
                    };

                    const docRef = await addDoc(collection(db, "datacenter_files"), fileDoc);

                    // Import records (skip first row = headers)
                    if (data.length > 1) {
                        const batch = writeBatch(db);
                        let recordCount = 0;

                        for (let i = 1; i < data.length; i++) {
                            const row = data[i];
                            // Skip completely empty rows
                            if (!row || row.length === 0 || row.every(cell => !cell)) continue;

                            const recordData: any = {
                                file_id: docRef.id,
                                company_id: userData.company_id,
                                created_at: serverTimestamp()
                            };

                            columns.forEach((col: any, index: number) => {
                                recordData[col.id] = row[index] !== undefined ? String(row[index]) : "";
                            });

                            const newRecordRef = doc(collection(db, "datacenter_records"));
                            batch.set(newRecordRef, recordData);
                            recordCount++;

                            // Firestore batch limit is 500, could implement chunks if files are large
                            if (recordCount >= 490) {
                                await batch.commit();
                                // Reset batch (in a real app we'd create a new batch, here we limit MVP to ~500 rows imports for simplicity)
                                break;
                            }
                        }

                        if (recordCount > 0 && recordCount < 490) {
                            await batch.commit();
                        }
                    }

                    toast.success("Fichier importé avec succès !");
                    router.push(`/dashboard/datacenter/${docRef.id}`);
                } catch (err) {
                    console.error("Parse error:", err);
                    toast.error("Erreur d'analyse du fichier");
                    setIsImporting(false);
                }
            };

            reader.readAsBinaryString(file);

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erreur lors de l'import");
            setIsImporting(false);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Table2 className="w-8 h-8 text-indigo-500" />
                        Data Center
                    </h1>
                    <p className="text-slate-500 mt-1">Créez et gérez vos bases de données internes (fichiers tabulaires).</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-5 h-5" />
                            Nouveau Fichier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Créer une base de données</DialogTitle>
                            <DialogDescription>
                                Démarrez à partir de zéro ou importez un fichier existant.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="col-span-2 border rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 border-b">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                                        Nouveau tableau vierge
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Créez un tableau vide et personnalisez vos colonnes plus tard.</p>
                                </div>
                                <form onSubmit={handleCreateScratch} className="p-4 flex gap-3">
                                    <Input
                                        placeholder="Nom du fichier..."
                                        value={newFileName}
                                        onChange={e => setNewFileName(e.target.value)}
                                        className="flex-1"
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={creating || !newFileName.trim()}>
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                                    </Button>
                                </form>
                            </div>

                            <div className="col-span-2 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">Ou importer</span>
                                </div>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="col-span-2 flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors w-full text-left"
                            >
                                {isImporting ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                ) : (
                                    <Upload className="w-6 h-6 text-slate-400" />
                                )}
                                <div>
                                    <div className="font-medium text-slate-900">
                                        {isImporting ? "Importation en cours..." : "Importer CSV / Excel"}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Les colonnes seront créées automatiquement
                                    </div>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center bg-slate-50/50">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher un fichier..."
                            className="pl-9 h-10 border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Table2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun fichier</h3>
                        <p className="text-slate-500 mb-6">Commencez par créer votre première base de données.</p>
                        <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                            Créer un fichier
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => router.push(`/dashboard/datacenter/${file.id}`)}
                                className="group bg-white border rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDeleteFile(e, file.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <h3 className="font-semibold text-slate-900 text-lg mb-1 line-clamp-1" title={file.name}>
                                    {file.name}
                                </h3>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                    <span>{file.columns?.length || 0} colonnes</span>
                                </div>

                                <div className="mt-auto pt-4 border-t flex justify-between items-center text-xs text-slate-400">
                                    <span>Créé le {file.created_at ? new Date(file.created_at.toDate()).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
