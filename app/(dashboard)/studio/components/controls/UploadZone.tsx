'use client';

import { useRef } from 'react';
import { useDitherStore } from '@/store/ditherStore';

export default function UploadZone({ onBatchSelect }: { onBatchSelect?: (files: File[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFile } = useDitherStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 1 && onBatchSelect) {
      onBatchSelect(Array.from(files));
    } else {
      const file = files[0];
      const isVideo = file.type.startsWith('video/');
      setFile(file, isVideo);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <div
        onClick={handleClick}
        className="border border-dashed border-[#d0cdc4] p-8 text-center cursor-pointer transition-all hover:border-[#2a2a2a] hover:bg-[rgba(0,0,0,0.02)]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="text-sm">DROP FILE OR CLICK</div>
        <div className="text-xs text-[#888] mt-2">
          SUPPORTS: JPG, PNG, GIF, MP4, WEBM
          <br />
          (Select multiple for batch processing)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => useDitherStore.getState().setWebcam(true)}
          className="p-2 text-[10px] bg-white border border-[#d0cdc4] text-[#666] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] hover:border-[#2a2a2a] transition-colors"
        >
          USE WEBCAM
        </button>
        <button
          onClick={handleClick}
          className="p-2 text-[10px] bg-white border border-[#d0cdc4] text-[#666] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] hover:border-[#2a2a2a] transition-colors"
        >
          BROWSE FILES
        </button>
      </div>
    </div>
  );
}
