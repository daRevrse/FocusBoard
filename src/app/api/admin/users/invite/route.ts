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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Bienvenue sur FocusBoard !</h2>
                    <p>Bonjour ${fullName},</p>
                    <p>Un compte administrateur vous a été créé sur FocusBoard.</p>
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>Identifiant :</strong> ${email}</p>
                        <p style="margin: 0;"><strong>Mot de passe provisoire :</strong> ${password}</p>
                    </div>
                    <p>Nous vous conseillons de modifier votre mot de passe dès votre première connexion.</p>
                    <a href="http://focus-board-flame.vercel.app/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Se connecter</a>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: "Votre compte FocusBoard a été créé",
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
            const inviteLink = `http://focus-board-flame.vercel.app/accept-invite?token=${userId}`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Invitation à rejoindre FocusBoard</h2>
                    <p>Bonjour ${fullName},</p>
                    <p>Vous avez été invité à rejoindre un espace de travail sur FocusBoard.</p>
                    <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 24px; margin-bottom: 24px;">Accepter l'invitation</a>
                    <p style="color: #64748b; font-size: 14px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur : <br>${inviteLink}</p>
                </div>
            `;

             await sendEmail({
                to: email,
                subject: "Invitation à rejoindre FocusBoard",
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
