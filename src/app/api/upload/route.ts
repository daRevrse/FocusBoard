import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as Blob | null;
        const directory = formData.get('directory') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier sélectionné" }, { status: 400 });
        }

        const originalName = (file as any).name || 'upload.bin';
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Ensure the absolute path points to the public directory
        const uploadDir = join(process.cwd(), 'public', directory);
        
        // Ensure directory exists recursively
        await mkdir(uploadDir, { recursive: true });
        
        const path = join(uploadDir, originalName);
        await writeFile(path, buffer);

        // Return path relative to `/`
        return NextResponse.json({ url: `/${directory}/${originalName}` });
    } catch (e: any) {
        console.error("Erreur lors de l'upload API:", e);
        return NextResponse.json({ error: "Échec du téléchargement côté serveur" }, { status: 500 });
    }
}
