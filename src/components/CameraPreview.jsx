import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ScanButton from './ScanButton';
import useCamera from '../hooks/useCamera';

export default function CameraPreview({ onCapture, uploadedImage, setUploadedImage }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { startCamera, stopCamera, capture } = useCamera(videoRef);
  const [flash, setFlash] = useState(false);
  const [front, setFront] = useState(false);

  useEffect(() => {
    startCamera({ facingMode: front ? 'user' : 'environment' });
    return () => stopCamera();
  }, [front]);

  async function handleCapture() {
    const blob = await capture();
    if (onCapture) onCapture(blob);
  }

  return (
    <div className="rounded-2xl bg-gray-200 overflow-hidden relative">
      <div className="p-3 absolute inset-x-4 top-3 flex justify-center">
        <div className="bg-black/60 text-white text-sm rounded-full px-4 py-2">Center your food in the frame</div>
      </div>

      <div className="aspect-[4/3] rounded-2xl bg-black/10 flex items-center justify-center overflow-hidden">
        {!uploadedImage ? (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        ) : (
          <img src={uploadedImage} alt="Uploaded food" className="w-full h-full object-cover" />
        )}

        {/* corner guides */}
        <div className="absolute left-4 top-4 border-4 border-white w-6 h-6 rounded-sm" />
        <div className="absolute right-4 top-4 border-4 border-white w-6 h-6 rounded-sm" />
        <div className="absolute left-4 bottom-4 border-4 border-white w-6 h-6 rounded-sm" />
        <div className="absolute right-4 bottom-4 border-4 border-white w-6 h-6 rounded-sm" />

        <div className="absolute left-4 top-1/3 flex flex-col gap-3">
          <button aria-label="Flash" title="Flash" onClick={() => setFlash(f => !f)} className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center">⚡<span className="sr-only">Flash</span></button>
          <button aria-label="Flip" title="Flip camera" onClick={() => setFront(f => !f)} className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center">🔁<span className="sr-only">Flip camera</span></button>
        </div>

        <div className="absolute right-4 bottom-20">
          <button aria-label="Tips" className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center">?<span className="sr-only">Tips</span></button>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <motion.div whileTap={{ scale: 0.95 }}>
            <ScanButton onClick={handleCapture} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
