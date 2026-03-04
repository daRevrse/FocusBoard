import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // 1. Generate the reset link
        const link = await adminAuth.generatePasswordResetLink(email);

        // 2. Fetch the user's company to use their SMTP settings
        // If the user doesn't exist, this will throw an error and we won't reveal anything (good security practice).
        const usersSnapshot = await adminDb.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
        
        let companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || ""; 
        let fullName = "Utilisateur";

        if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            companyId = userData.company_id || companyId;
            fullName = userData.full_name || fullName;
        }

        if (companyId) {
            // Send Reset Email
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour ${fullName},</p>
                    <p>Nous avons reçu une demande de réinitialisation de votre mot de passe FocusBoard.</p>
                    <a href="${link}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 24px; margin-bottom: 24px;">Réinitialiser mon mot de passe</a>
                    <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
                    <p style="color: #64748b; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur : <br>${link}</p>
                </div>
            `;

             await sendEmail({
                to: email,
                subject: "Réinitialisation de mot de passe FocusBoard",
                html: emailHtml,
                companyId: companyId
            });
        }

        return NextResponse.json({ success: true, message: "Email sent" });

    } catch (error: any) {
        console.error("Error generating reset link:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
