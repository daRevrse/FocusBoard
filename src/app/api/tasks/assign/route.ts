import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { taskId, title, assigneeId, assignerId, companyId } = body;

        if (!taskId || !title || !assigneeId || !companyId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch assignee details to get their email
        const userDoc = await adminDb.collection("users").doc(assigneeId).get();
        if (!userDoc.exists) {
             return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
        }
        
        const assignee = userDoc.data();
        if (!assignee?.email) {
            return NextResponse.json({ error: "Assignee has no email" }, { status: 400 });
        }

        let assignerName = "Un administrateur";
        if (assignerId) {
            const assignerDoc = await adminDb.collection("users").doc(assignerId).get();
            if (assignerDoc.exists) {
                assignerName = assignerDoc.data()?.full_name || assignerName;
            }
        }

        // Send Email Notification
        const taskLink = "http://focus-board-flame.vercel.app/dashboard/tasks"; // In a real app, link to specific task modal/page
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Nouvelle tâche assignée</h2>
                <p>Bonjour ${assignee.full_name},</p>
                <p><strong>${assignerName}</strong> vous a assigné une nouvelle tâche sur FocusBoard :</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">${title}</p>
                </div>
                <a href="${taskLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir mes tâches</a>
            </div>
        `;

        const result = await sendEmail({
            to: assignee.email,
            subject: "Nouvelle tâche assignée : " + title,
            html: emailHtml,
            companyId: companyId
        });

        // We don't strictly fail the request if email fails, but we return the status
        return NextResponse.json({ success: true, emailSent: result.success });

    } catch (error: any) {
        console.error("Error sending task assignment email:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
