export const UPLOAD_MAX_SIZE_MB = 5;

// Allowed file types per context
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
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
        throw new Error(`Type de fichier non autorisé.`);
    }

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pathPrefix", pathPrefix);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = "Échec du téléchargement côté serveur";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
                // Ignore parse error
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.url) {
            throw new Error("L'API n'a pas retourné d'URL valide.");
        }

        return data.url;
    } catch (error: any) {
        console.error("Erreur d'upload interne:", error);
        throw new Error(error.message || "Échec de l'upload du fichier.");
    }
}
