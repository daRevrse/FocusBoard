"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { BackgroundJobs } from "@/components/BackgroundJobs";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login"); // Strictly guard all /dashboard routes
        }
    }, [user, loading, router]);

    if (loading || !user || !userData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#FDFBF7]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
                {children}
            </main>
            <BackgroundJobs />
        </div>
    );
}
