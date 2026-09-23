import React, { useState } from 'react';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSizeBytes = 10 * 1024 * 1024;

export default function UploadButton({ onCapture, uploadedImage, setUploadedImage }) {
  const [error, setError] = useState('');

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError('Image is too large. Please choose a file under 10MB.');
      return;
    }

    setError('');
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    if (onCapture) onCapture(file, file.name);
  }

  return (
    <div className="rounded-2xl bg-gray-100 p-6 flex items-center justify-center" style={{ minHeight: 300 }}>
      <label className="flex flex-col items-center gap-3 cursor-pointer">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center text-green-600">🖼️</div>
        <div className="text-center">
          <p className="font-semibold">Upload a photo</p>
          <p className="text-sm text-gray-600">Choose a picture from your gallery</p>
        </div>
        {uploadedImage ? (
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-white p-2">
            <img src={uploadedImage} alt="Selected food" className="w-32 h-32 object-cover rounded-lg" />
            <div className="mt-2 text-xs text-gray-600">Tap to replace photo</div>
          </div>
        ) : null}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFile} />
      </label>
      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
    </div>
  );
}
