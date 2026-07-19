import { useState, useRef } from "react";
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  bucket: string;
  path: string;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  onUploadComplete?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  uploading: boolean;
  error?: string;
}

export function FileUpload({
  bucket,
  path,
  acceptedFileTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSizeMB = 10,
  onUploadComplete,
  onUploadError,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, error, uploading: false } : f
        )
      );
      onUploadError?.(error);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    setFiles((prev) =>
      prev.map((f) =>
        f.name === file.name ? { ...f, uploading: true, error: undefined } : f
      )
    );

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;

      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, url, uploading: false, error: undefined }
            : f
        )
      );

      onUploadComplete?.(url, file.name);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Erro ao fazer upload";
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, error, uploading: false } : f
        )
      );
      onUploadError?.(error);
    }
  };

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((f) => ({
      name: f.name,
      url: "",
      size: f.size,
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    Array.from(selectedFiles).forEach(uploadFile);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          dragOver
            ? "border-idep-500 bg-idep-50 dark:bg-idep-950/30"
            : "border-border hover:border-idep-300 hover:bg-muted/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Arraste arquivos ou clique para enviar
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, JPEG, PNG, DOC até {maxSizeMB}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-all",
                file.error ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-border"
              )}
            >
              <File className="h-5 w-5 text-idep-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                {file.error && (
                  <p className="text-xs text-red-500 mt-0.5">{file.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {file.uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : file.url ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : file.error ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : null}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
