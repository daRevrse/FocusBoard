import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
        let companyId = null;

        // 1. First, try to find an existing user with this exact email
        const usersSnapshot = await adminDb.collection("users").where("email", "==", email).limit(1).get();
        if (!usersSnapshot.empty) {
            companyId = usersSnapshot.docs[0].data().company_id;
        } else {
            // 2. If no user found, try to match the email domain against company settings
            const domain = email.split("@")[1];
            if (domain) {
                const companiesSnapshot = await adminDb.collection("companies").where("email_domain", "==", domain).limit(1).get();
                if (!companiesSnapshot.empty) {
                    companyId = companiesSnapshot.docs[0].id;
                }
            }
        }

        if (!companyId) {
            return NextResponse.json({ logo_url: null, name: null });
        }

        const companyDoc = await adminDb.collection("companies").doc(companyId).get();
        if (!companyDoc.exists) {
            return NextResponse.json({ logo_url: null, name: null });
        }

        const companyData = companyDoc.data();
        return NextResponse.json({
            logo_url: companyData?.logo_url || null,
            name: companyData?.name || null
        });

    } catch (error) {
        console.error("Error fetching company by email:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
