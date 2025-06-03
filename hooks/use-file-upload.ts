import { useState } from "react";
import { toast } from "sonner";
import { uploadImageAndGetUrl } from "@/lib/utils/pinata";

interface UseFileUploadOptions {
  namePrefix?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (!file || !(file instanceof File)) {
      toast.error("Không có file hợp lệ được chọn");
      setError("Không có file hợp lệ được chọn");
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Generate a name for the file if namePrefix is provided
      const fileName = options?.namePrefix 
        ? `${options.namePrefix}-${Date.now()}`
        : file.name;

      // Upload the file to IPFS via Pinata
      const url = await uploadImageAndGetUrl(file, fileName);
      
      // Update state with the uploaded file and URL
      setUploadedFile(file);
      setFileUrl(url);
      
      // Call onSuccess callback if provided
      options?.onSuccess?.(url);
      
      toast.success("Tải lên file thành công");
      return url;
    } catch (err) {
      console.error("Lỗi khi tải file:", err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Không thể tải lên file";
      
      toast.error(errorMessage);
      setError(errorMessage);
      
      // Call onError callback if provided
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setFileUrl("");
    setError(null);
  };

  return {
    uploadFile,
    resetUpload,
    isUploading,
    uploadedFile,
    fileUrl,
    error
  };
} 