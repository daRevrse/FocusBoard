import nodemailer from "nodemailer";
import { adminDb } from "./firebase-admin";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    companyId: string;
}

export async function sendEmail({ to, subject, html, companyId }: EmailOptions) {
    try {
        // 1. Fetch company smtp settings
        const companyDoc = await adminDb.collection("companies").doc(companyId).get();
        if (!companyDoc.exists) {
            throw new Error("Company not found");
        }

        const data = companyDoc.data();
        if (!data?.smtp_host || !data?.smtp_port || !data?.smtp_user || !data?.smtp_password) {
            console.warn(`SMTP settings missing for company ${companyId}. Email to ${to} was not sent.`);
            return { success: false, error: "SMTP settings not configured" };
        }

        // 2. Create transporter
        const transporter = nodemailer.createTransport({
            host: data.smtp_host,
            port: parseInt(data.smtp_port, 10),
            secure: parseInt(data.smtp_port, 10) === 465, // true for 465, false for other ports
            auth: {
                user: data.smtp_user,
                pass: data.smtp_password,
            },
        });

        // 3. Send email
        const mailOptions = {
            from: `"${data.name || 'FocusBoard'}" <${data.smtp_user}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: (error as Error).message };
    }
}
