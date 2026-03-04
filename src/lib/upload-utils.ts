

export const UPLOAD_MAX_SIZE_MB = 5;

// Allowed file types per context
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain",
    "application/zip"
];

export async function uploadFile(
    file: File, 
    pathPrefix: string, 
    allowedTypes?: string[],
    maxSizeMB: number = UPLOAD_MAX_SIZE_MB
): Promise<string> {
    
    // Validate Size
    if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`Le fichier est trop volumineux (Max: ${maxSizeMB}MB).`);
    }

    // Validate Type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
        throw new Error(`Type de fichier non autorisé. Types acceptés : ${allowedTypes.join(', ')}`);
    }

    // Create a safe, unique file name
    const extension = file.name.split('.').pop() || '';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const fullPath = `${pathPrefix}/${uniqueFileName}`;

    try {
        const formData = new FormData();
        // Since API endpoint handles the directory creation, and the uniqueFilename already includes the unique identifiers,
        // we just pass the file with its new name.
        const fileWithNewName = new File([file], uniqueFileName, { type: file.type });
        
        formData.append('file', fileWithNewName);
        formData.append('directory', pathPrefix); // Tell the API where to logically put it (e.g. 'avatars')

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Erreur serveur lors de l'upload");
        }

        const data = await res.json();
        return data.url; // The relative path returned from our new API
    } catch (error: any) {
        console.error("Erreur d'upload interne:", error);
        throw new Error(error.message || "Échec de l'upload du fichier.");
    }
}
