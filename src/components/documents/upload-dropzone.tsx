import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Admin upload affordance: click or drag-drop a single file. Submit is disabled
// while a request is in flight; size/type limits are enforced server-side (a 400
// surfaces here as `error`).
export function UploadDropzone({
  onUpload,
  isUploading,
  error,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-surface px-6 py-10 text-center transition-colors",
          "hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60",
          dragging && "border-brand-400 bg-brand-50",
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-pill bg-brand-50 text-brand-600">
          <UploadSimple className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium text-text-primary">
          {isUploading ? "Đang tải lên…" : "Nhấp hoặc kéo tệp vào đây để tải lên"}
        </span>
        <span className="text-xs text-text-dim">Tải lại = xóa + tải lên lại (không giữ trên máy chủ).</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {error && (
        <p className="text-sm text-danger-fg" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
