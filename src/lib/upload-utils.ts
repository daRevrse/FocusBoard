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

    // We can't import getStorage here nicely without causing issues if it's not initialized yet on the server in NextJS sometimes,
    // so we import the initialized instance from our lib.
    const { storage } = await import("@/lib/firebase");
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

    // Create a safe, unique file name
    const extension = file.name.split('.').pop() || '';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const fullPath = `${pathPrefix}/${uniqueFileName}`;

    const storageRef = ref(storage, fullPath);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error: any) {
        console.error("Erreur lors de l'upload:", error);
        throw new Error(error.message || "Échec de l'upload du fichier.");
    }
}
