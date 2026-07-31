import React from 'react';

export default function UploadButton({ onCapture, uploadedImage, setUploadedImage }) {
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    if (onCapture) onCapture(file);
  }

  return (
    <div className="rounded-2xl bg-gray-100 p-6 flex items-center justify-center" style={{ minHeight: 300 }}>
      <label className="flex flex-col items-center gap-3 cursor-pointer">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center text-green-600">🖼️</div>
        <div className="text-center">
          <p className="font-semibold">Upload a photo</p>
          <p className="text-sm text-gray-600">Choose a picture from your gallery</p>
        </div>
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </label>
    </div>
  );
}
