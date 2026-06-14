'use client';

import { useRef, useState } from 'react';
import { useDitherStore } from '@/store/ditherStore';

export default function UploadZone({ onBatchSelect }: { onBatchSelect?: (files: File[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFile } = useDitherStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;

    if (list.length > 1 && onBatchSelect) {
      onBatchSelect(list);
    } else {
      const file = list[0];
      setFile(file, file.type.startsWith('video/'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset so selecting the SAME file again still fires onChange
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="mb-4">
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={`border border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-white/30 bg-[rgba(0,0,0,0.05)]'
            : 'border-white/10 hover:border-white/40 hover:bg-[rgba(0,0,0,0.02)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="text-sm">{isDragging ? 'DROP TO UPLOAD' : 'DROP FILE OR CLICK'}</div>
        <div className="text-xs text-white/40 mt-2">
          SUPPORTS: JPG, PNG, GIF, MP4, WEBM
          <br />
          (Select multiple for batch processing)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => useDitherStore.getState().setWebcam(true)}
          className="p-2 text-[10px] bg-white/[0.05] border border-white/10 rounded-xl text-white/70 hover:bg-white hover:text-[#0b0b0d] hover:border-white/40 transition-colors"
        >
          USE WEBCAM
        </button>
        <button
          onClick={handleClick}
          className="p-2 text-[10px] bg-white/[0.05] border border-white/10 rounded-xl text-white/70 hover:bg-white hover:text-[#0b0b0d] hover:border-white/40 transition-colors"
        >
          BROWSE FILES
        </button>
      </div>
    </div>
  );
}
