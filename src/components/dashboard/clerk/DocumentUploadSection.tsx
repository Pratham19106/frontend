import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  File,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadedFile = {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: "uploading" | "complete" | "error";
  preview?: string;
};

interface DocumentUploadSectionProps {
  caseId: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (type.startsWith("image/")) return FileImage;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentUploadSection = ({ caseId: _caseId }: DocumentUploadSectionProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const simulateUpload = async (fileId: string) => {
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress, status: progress === 100 ? "complete" : "uploading" }
            : f
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      progress: 0,
      status: "uploading" as const,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload for each file
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".mov", ".avi"],
      "audio/*": [".mp3", ".wav", ".ogg"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Document & Media Upload</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Upload all case-related documents, videos, audio recordings, and images.
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "w-10 h-10 mx-auto mb-3",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse • Supports images, videos, audio, and documents
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-muted-foreground">
            Uploaded Files ({files.length})
          </p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  {/* Icon or Preview */}
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === "uploading" && (
                        <>
                          <span>•</span>
                          <span>{file.progress}%</span>
                        </>
                      )}
                      {file.status === "complete" && (
                        <span className="text-emerald-500">✓ Complete</span>
                      )}
                    </div>
                    
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {file.preview && file.status === "complete" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-10 right-0 text-white"
              onClick={() => setPreviewFile(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={previewFile.preview}
              alt={previewFile.name}
              className="max-w-full max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
