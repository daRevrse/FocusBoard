import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const companyId = url.searchParams.get("companyId");
        
        // Very basic server-side check. In a real app we'd verify the requesting user's Firebase token to ensure they are an admin.
        if (!userId || !companyId) {
             return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 1. Delete from Firebase Authentication
        await adminAuth.deleteUser(userId);

        // 2. Delete from Firestore Database
        await adminDb.collection("users").doc(userId).delete();

        // 3. Optional: Delete assigned tasks or change their status to orphaned? We leave them for historical scope for now
        
        return NextResponse.json({ success: true, message: "User completely removed from system" });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { userId, disabled } = body;

        if (!userId || typeof disabled !== "boolean") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Toggle the account's authentication status (this revokes active sessions and prevents new logins)
        await adminAuth.updateUser(userId, { disabled });

        // Sync to firestore status automatically
        await adminDb.collection("users").doc(userId).update({
            status: disabled ? "inactive" : "active"
        });

        return NextResponse.json({ success: true, disabled });
    } catch (error: any) {
        console.error("Error toggling user auth status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
