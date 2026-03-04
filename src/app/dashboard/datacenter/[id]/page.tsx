"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Table2, Plus, Trash2, Search, Save, ArrowLeft, Download, Columns, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataRow {
    id: string;
    file_id: string;
    company_id: string;
    created_at: any;
    [key: string]: any; // Dynamic columns
}

interface FileMetadata {
    id: string;
    name: string;
    columns: { id: string; name: string }[];
}

export default function FileEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const fileId = resolvedParams.id;

    const { user, userData } = useAuth();
    const router = useRouter();

    const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
    const [rows, setRows] = useState<DataRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Column addition
    const [newColName, setNewColName] = useState("");
    const [isAddingCol, setIsAddingCol] = useState(false);

    // Track modified rows for saving
    const [editingRows, setEditingRows] = useState<Record<string, Partial<DataRow>>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Column Renaming
    const [editingColId, setEditingColId] = useState<string | null>(null);
    const [editingColName, setEditingColName] = useState("");

    const fetchData = async () => {
        if (!userData?.company_id || !fileId) return;
        setLoading(true);
        try {
            // 1. Get File Metadata (Columns)
            const fileDoc = await getDoc(doc(db, "datacenter_files", fileId));
            if (!fileDoc.exists() || fileDoc.data().company_id !== userData.company_id) {
                toast.error("Fichier introuvable");
                router.push("/dashboard/datacenter");
                return;
            }
            setFileMeta({ id: fileDoc.id, ...fileDoc.data() } as FileMetadata);

            // 2. Get Records
            const q = query(collection(db, "datacenter_records"), where("file_id", "==", fileId));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as DataRow));

            // Sort by creation time if available
            setRows(data.sort((a, b) => {
                const timeA = a.created_at?.toMillis?.() || 0;
                const timeB = b.created_at?.toMillis?.() || 0;
                return timeA - timeB;
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fileId, userData?.company_id]);

    const handleAddRow = async () => {
        if (!userData?.company_id || !fileMeta) return;

        try {
            const newRow: any = {
                file_id: fileId,
                company_id: userData.company_id,
                created_at: serverTimestamp()
            };

            // Init default empty values for known columns
            fileMeta.columns.forEach(c => {
                newRow[c.id] = "";
            });

            const docRef = await addDoc(collection(db, "datacenter_records"), newRow);
            setRows([...rows, { id: docRef.id, ...newRow } as DataRow]);

            // Auto focus could be added here by setting editingRows, but simpler to just append
            toast.success("Ligne ajoutée");
        } catch (error) {
            console.error("Error adding row:", error);
            toast.error("Erreur lors de l'ajout");
        }
    };

    const handleDeleteRow = async (id: string) => {
        if (!confirm("Supprimer cette ligne définitivement ?")) return;

        try {
            await deleteDoc(doc(db, "datacenter_records", id));
            setRows(rows.filter(r => r.id !== id));
            const newEdits = { ...editingRows };
            delete newEdits[id];
            setEditingRows(newEdits);
            toast.success("Ligne supprimée");
        } catch (error) {
            console.error("Error deleting row:", error);
            toast.error("Erreur de suppression");
        }
    };

    const handleCellChange = (id: string, colId: string, value: string) => {
        setEditingRows(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [colId]: value
            }
        }));
    };

    const handleSaveEdits = async () => {
        const idsToSave = Object.keys(editingRows);
        if (idsToSave.length === 0) return;

        setIsSaving(true);
        try {
            for (const id of idsToSave) {
                const updates = editingRows[id];
                await updateDoc(doc(db, "datacenter_records", id), updates);
            }

            setRows(prevRows => prevRows.map(row => {
                if (editingRows[row.id]) {
                    return { ...row, ...editingRows[row.id] };
                }
                return row;
            }));

            setEditingRows({});
            toast.success(`${idsToSave.length} modification(s) enregistrée(s)`);
        } catch (error) {
            console.error("Error saving edits:", error);
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColName.trim() || !fileMeta) return;

        const newColId = `col_${Date.now()}`;
        const newCols = [...fileMeta.columns, { id: newColId, name: newColName.trim() }];

        try {
            await updateDoc(doc(db, "datacenter_files", fileId), {
                columns: newCols,
                updated_at: serverTimestamp()
            });

            setFileMeta({ ...fileMeta, columns: newCols });
            setNewColName("");
            setIsAddingCol(false);
            toast.success("Colonne ajoutée");
        } catch (error) {
            console.error("Error adding column:", error);
            toast.error("Erreur lors de l'ajout de colonne");
        }
    };

    const handleRenameColumn = async (colId: string) => {
        if (!editingColName.trim() || !fileMeta) {
            setEditingColId(null);
            return;
        }

        try {
            const newCols = fileMeta.columns.map(c =>
                c.id === colId ? { ...c, name: editingColName.trim() } : c
            );

            await updateDoc(doc(db, "datacenter_files", fileId), {
                columns: newCols,
                updated_at: serverTimestamp()
            });

            setFileMeta({ ...fileMeta, columns: newCols });
            toast.success("Colonne renommée");
        } catch (error) {
            console.error("Error renaming column:", error);
            toast.error("Erreur lors du renommage");
        } finally {
            setEditingColId(null);
        }
    };

    const handleExport = (format: "csv" | "xlsx" | "json") => {
        if (!fileMeta || rows.length === 0) return;

        // Prepare array of objects matching columns
        const exportData = rows.map(row => {
            const mappedObj: any = {};
            fileMeta.columns.forEach(col => {
                // Merge saved row data and currently editing data
                const val = editingRows[row.id]?.[col.id] !== undefined ? editingRows[row.id][col.id] : (row[col.id] || "");
                mappedObj[col.name] = val;
            });
            return mappedObj;
        });

        const fileName = `${fileMeta.name}_${new Date().toISOString().split('T')[0]}`;

        if (format === "json") {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Export JSON réussi");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Données");

        if (format === "csv") {
            XLSX.writeFile(wb, `${fileName}.csv`);
            toast.success("Export CSV réussi");
        } else {
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            toast.success("Export Excel réussi");
        }
    };

    if (!fileMeta && !loading) return null;

    const filteredRows = rows.filter(row => {
        if (!fileMeta) return true;
        // Check all displayed columns
        const searchTarget = fileMeta.columns.map(c => row[c.id] || "").join(" ").toLowerCase();
        return searchTarget.includes(searchQuery.toLowerCase());
    });

    const hasUnsavedChanges = Object.keys(editingRows).length > 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button
                        variant="ghost"
                        className="mb-2 -ml-2 text-slate-500 hover:text-slate-900"
                        onClick={() => router.push("/dashboard/datacenter")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour aux fichiers
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Table2 className="w-8 h-8 text-indigo-500" />
                        {fileMeta ? fileMeta.name : "Chargement..."}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Columns Addition */}
                    {!isAddingCol ? (
                        <Button variant="outline" onClick={() => setIsAddingCol(true)} className="gap-2">
                            <Columns className="w-4 h-4" />
                            + Colonne
                        </Button>
                    ) : (
                        <form onSubmit={handleAddColumn} className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border">
                            <Input
                                placeholder="Nom de la colonne"
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                className="h-8 w-36 text-xs"
                                autoFocus
                            />
                            <Button type="submit" size="sm" className="h-8">OK</Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setIsAddingCol(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </form>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 text-slate-700">
                                <Download className="w-4 h-4" />
                                Exporter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Format de fichier</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExport("xlsx")} className="cursor-pointer">
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer">
                                CSV (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer">
                                JSON (.json)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant={hasUnsavedChanges ? "default" : "secondary"}
                        onClick={handleSaveEdits}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={cn(
                            "transition-all w-full sm:w-auto",
                            hasUnsavedChanges ? "bg-indigo-600 hover:bg-indigo-700 animate-pulse text-white shadow-md" : "bg-slate-100 text-slate-400"
                        )}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Sauvegarder {hasUnsavedChanges && `(${Object.keys(editingRows).length})`}
                    </Button>
                    <Button onClick={handleAddRow} className="gap-2 bg-slate-900 hover:bg-slate-800 w-full sm:w-auto">
                        <Plus className="w-4 h-4" />
                        Nouvelle Ligne
                    </Button>
                </div>
            </header>

            <div className="bg-white border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-3 border-b bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher dans les données..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {filteredRows.length > 0 && (
                        <div className="text-xs font-mono text-slate-400">
                            {filteredRows.length} ligne(s) affichée(s)
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/30">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse min-w-max">
                            <thead className="text-xs text-slate-500 bg-slate-100 sticky top-0 z-10 shadow-sm border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium border-r border-slate-200 w-12 text-center bg-slate-100">#</th>
                                    {fileMeta?.columns.map(col => (
                                        <th key={col.id} className="px-4 py-3 font-medium border-r border-slate-200 min-w-[150px] max-w-[300px] bg-slate-100 group">
                                            {editingColId === col.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        value={editingColName}
                                                        onChange={(e) => setEditingColName(e.target.value)}
                                                        className="h-7 text-xs flex-1 px-2 py-0 border-indigo-200 focus-visible:ring-1"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRenameColumn(col.id);
                                                            if (e.key === 'Escape') setEditingColId(null);
                                                        }}
                                                        onBlur={() => handleRenameColumn(col.id)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="truncate">{col.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingColId(col.id);
                                                            setEditingColName(col.name);
                                                        }}
                                                        className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 font-medium text-center w-16 bg-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={(fileMeta?.columns.length || 0) + 2} className="px-6 py-12 text-center text-slate-500">
                                            Aucune donnée trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => {
                                        const isEditingObj = editingRows[row.id] || {};

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/50 group">
                                                <td className="px-2 py-2 border-r border-slate-200 text-center text-xs text-slate-400 font-mono">
                                                    {index + 1}
                                                </td>
                                                {fileMeta?.columns.map(col => {
                                                    const val = typeof isEditingObj[col.id] !== 'undefined'
                                                        ? isEditingObj[col.id]
                                                        : row[col.id] || "";

                                                    return (
                                                        <td key={col.id} className="border-r border-slate-200 p-0 group-hover:bg-indigo-50/30 transition-colors">
                                                            <input
                                                                type="text"
                                                                value={val as string}
                                                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                className={cn(
                                                                    "w-full h-full min-h-[44px] px-4 py-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-700",
                                                                    typeof isEditingObj[col.id] !== 'undefined' && "bg-amber-50/50 text-indigo-900 font-medium"
                                                                )}
                                                                placeholder="-"
                                                                title={val as string}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-2 py-2 text-center h-full">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteRow(row.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
