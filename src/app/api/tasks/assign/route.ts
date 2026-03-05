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
        const taskLink = "https://focus-board-flame.vercel.app/dashboard/tasks"; 
        const emailHtml = `
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFBF7; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB;">
                <h2 style="color: #1a1a1a; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Nouveau focus assigné.</h2>
                <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Bonjour ${assignee.full_name},</p>
                <p style="color: #4B5563; font-size: 16px; line-height: 1.5;"><strong>${assignerName}</strong> vous a assigné un nouveau focus d'exécution dans Faucus :</p>
                <div style="background-color: #ffffff; border-left: 4px solid #059669; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">${title}</p>
                </div>
                <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-bottom: 32px;">Exécutez ce focus pour maintenir votre Performance Index (PI) et atteindre les objectifs de l'équipe.</p>
                <a href="${taskLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accéder à mon tableau de bord</a>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0 20px 0;" />
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">Faucus - L'Execution Measurement System des équipes performantes.</p>
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
