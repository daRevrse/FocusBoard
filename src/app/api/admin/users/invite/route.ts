import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, fullName, role, password, companyId, inviterId, isManagerInvite } = body;

        if (!email || !fullName || !role || !companyId || !inviterId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let userId = "";

        if (!isManagerInvite) {
            // ADMIN ACTION: Create full authenticated user
            if (!password || password.length < 6) {
                return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
            }

            try {
                // Check if user already exists
                await adminAuth.getUserByEmail(email);
                return NextResponse.json({ error: "auth/email-already-in-use" }, { status: 400 });
            } catch (authError: any) {
                if (authError.code !== 'auth/user-not-found') {
                    throw authError; // Re-throw other errors
                }
            }

            const userRecord = await adminAuth.createUser({
                email: email,
                password: password,
                displayName: fullName,
            });

            userId = userRecord.uid;

            await adminDb.collection("users").doc(userId).set({
                email: email.toLowerCase(),
                full_name: fullName,
                role: role,
                company_id: companyId,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
                status: "active",
                created_at: new Date(),
            });

            // Send Welcome Email
            const emailHtml = `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFBF7; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Bienvenue sur Faucus.</h2>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Bonjour ${fullName},</p>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Votre compte a été créé par un administrateur pour accéder à Faucus, votre nouvel outil de pilotage d'exécution.</p>
                    <div style="background-color: #ffffff; border-left: 4px solid #059669; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563;"><strong>Identifiant :</strong> <span style="color: #1a1a1a;">${email}</span></p>
                        <p style="margin: 0; font-size: 14px; color: #4B5563;"><strong>Mot de passe provisoire :</strong> <span style="color: #1a1a1a; font-family: monospace; font-size: 16px; background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
                    </div>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-bottom: 32px;">Nous vous conseillons de modifier votre mot de passe dès votre première connexion.</p>
                    <a href="https://focus-board-flame.vercel.app/login" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Se connecter</a>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0 20px 0;" />
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">Faucus - L'Execution Measurement System des équipes performantes.</p>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: "Votre compte Faucus a été créé",
                html: emailHtml,
                companyId: companyId
            });

        } else {
            // MANAGER ACTION: Create pending invite
            userId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await adminDb.collection("users").doc(userId).set({
                email: email.toLowerCase(),
                full_name: fullName,
                role: role,
                company_id: companyId,
                status: "pending_invite",
                invite_token: userId, // We'll use the doc ID as the token for simplicity in this MVP
                created_at: new Date(),
            });

            // Send Invite Email
            const inviteLink = `https://focus-board-flame.vercel.app/accept-invite?token=${userId}`;
            const emailHtml = `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FDFBF7; padding: 40px; border-radius: 12px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Rejoignez votre équipe sur Faucus.</h2>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Bonjour ${fullName},</p>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">Vous avez été invité(e) à rejoindre un espace de travail Faucus.</p>
                    <p style="color: #4B5563; font-size: 14px; line-height: 1.5; margin-bottom: 32px;">Intégrez dès maintenant le système de mesure d'exécution pour suivre votre Performance Index et collaborer avec l'équipe.</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accepter l'invitation</a>
                    
                    <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px; word-break: break-all;">Si le bouton ne s'affiche pas, voici votre lien direct : <br>${inviteLink}</p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0 20px 0;" />
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">Faucus - L'Execution Measurement System des équipes performantes.</p>
                </div>
            `;

             await sendEmail({
                to: email,
                subject: "Invitation à rejoindre Faucus",
                html: emailHtml,
                companyId: companyId
            });
        }

        // Log activity
        await adminDb.collection("activity_feed").add({
            company_id: companyId,
            user_id: inviterId,
            event_type: isManagerInvite ? "user_invited" : "user_created",
            details: { targetEmail: email, role },
            created_at: new Date(),
        });

        return NextResponse.json({ success: true, userId });

    } catch (error: any) {
        console.error("Error creating/inviting user via API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
