'use client';

import { useRef } from 'react';
import { useDitherStore } from '@/store/ditherStore';

export default function UploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFile } = useDitherStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setFile(file, isVideo);
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
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="text-sm">DROP FILE OR CLICK</div>
        <div className="text-xs text-[#888] mt-2">
          SUPPORTS: JPG, PNG, GIF, MP4, WEBM
        </div>
      </div>
    </div>
  );
}
