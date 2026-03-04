"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Table2, Plus, Trash2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DataRow {
    id: string;
    company_id: string;
    col1: string;
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6: string;
}

export default function TableEditorDataCenterPage() {
    const { user, userData } = useAuth();
    const [rows, setRows] = useState<DataRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Track modified rows for saving
    const [editingRows, setEditingRows] = useState<Record<string, Partial<DataRow>>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Columns config (can be customized later per company)
    const columns = [
        { id: "col1", name: "Nom / Identifiant" },
        { id: "col2", name: "Catégorie" },
        { id: "col3", name: "Contact principal" },
        { id: "col4", name: "Email" },
        { id: "col5", name: "Statut" },
        { id: "col6", name: "Notes" },
    ];

    const fetchData = async () => {
        if (!userData?.company_id) return;
        setLoading(true);
        try {
            const q = query(collection(db, "datacenter_records"), where("company_id", "==", userData.company_id));
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataRow));

            // Sort to keep order consistent (could add createdAt later)
            setRows(data.sort((a, b) => a.col1.localeCompare(b.col1)));
        } catch (error) {
            console.error("Error fetching datacenter records:", error);
            toast.error("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userData?.company_id]);

    const handleAddRow = async () => {
        if (!userData?.company_id) return;

        try {
            const newRow = {
                company_id: userData.company_id,
                col1: "Nouveau",
                col2: "",
                col3: "",
                col4: "",
                col5: "",
                col6: "",
                created_at: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "datacenter_records"), newRow);
            setRows([{ id: docRef.id, ...newRow } as DataRow, ...rows]);
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
            // Can be batched for performance later
            for (const id of idsToSave) {
                const updates = editingRows[id];
                await updateDoc(doc(db, "datacenter_records", id), updates);
            }

            // Apply to local state
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

    const filteredRows = rows.filter(row => {
        const searchTarget = Object.values(row).join(" ").toLowerCase();
        return searchTarget.includes(searchQuery.toLowerCase());
    });

    const hasUnsavedChanges = Object.keys(editingRows).length > 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Table2 className="w-8 h-8 text-indigo-500" />
                        Data Center
                    </h1>
                    <p className="text-slate-500 mt-1">Base de données interne sous forme de tableur (Édition rapide).</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={hasUnsavedChanges ? "default" : "outline"}
                        onClick={handleSaveEdits}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={cn(
                            "transition-all",
                            hasUnsavedChanges ? "bg-indigo-600 hover:bg-indigo-700 animate-pulse" : "" // Highlight save button
                        )}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Sauvegarder {hasUnsavedChanges && `(${Object.keys(editingRows).length} modif.)`}
                    </Button>
                    <Button onClick={handleAddRow} className="gap-2 bg-slate-900 hover:bg-slate-800">
                        <Plus className="w-4 h-4" />
                        Nouvelle Ligne
                    </Button>
                </div>
            </header>

            <div className="bg-white border rounded-lg shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="p-3 border-b bg-slate-50/80 flex items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher dans les données..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
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
                                    <th className="px-4 py-3 font-medium border-r w-12 text-center">#</th>
                                    {columns.map(col => (
                                        <th key={col.id} className="px-4 py-3 font-medium border-r min-w-[150px]">
                                            {col.name}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 font-medium text-center w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-slate-500">
                                            Aucune donnée trouvée. Cliquez sur "Nouvelle Ligne" pour commencer.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => {
                                        const isEditingObj = editingRows[row.id] || {};

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/50 group">
                                                <td className="px-2 py-2 border-r text-center text-xs text-slate-400 font-mono">
                                                    {index + 1}
                                                </td>
                                                {columns.map(col => {
                                                    const val = typeof isEditingObj[col.id as keyof DataRow] !== 'undefined'
                                                        ? isEditingObj[col.id as keyof DataRow]
                                                        : row[col.id as keyof DataRow] || "";

                                                    return (
                                                        <td key={col.id} className="border-r p-0 group-hover:bg-indigo-50/30 transition-colors">
                                                            <input
                                                                type="text"
                                                                value={val as string}
                                                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                className={cn(
                                                                    "w-full h-full px-4 py-3 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-700",
                                                                    typeof isEditingObj[col.id as keyof DataRow] !== 'undefined' && "bg-amber-50/50 text-indigo-900 font-medium"
                                                                )}
                                                                placeholder="-"
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
