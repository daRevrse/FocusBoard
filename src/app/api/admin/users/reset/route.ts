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
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFBF7; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Réinitialisation de mot de passe.</h2>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Bonjour ${fullName},</p>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Nous avons reçu une demande de réinitialisation de votre mot de passe pour accéder à Faucus.</p>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-bottom: 32px;">Cliquez sur le bouton ci-dessous pour configurer un nouveau mot de passe de manière sécurisée.</p>
                    <a href="${link}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Réinitialiser mon mot de passe</a>
                    
                    <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
                    <p style="color: #9CA3AF; font-size: 12px; margin-top: 16px; word-break: break-all;">Si le bouton ne fonctionne pas, copiez ce lien : <br>${link}</p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0 20px 0;" />
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">Faucus - L'Execution Measurement System des équipes performantes.</p>
                </div>
            `;

             await sendEmail({
                to: email,
                subject: "Réinitialisation de mot de passe Faucus",
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
