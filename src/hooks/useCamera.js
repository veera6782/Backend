import { useRef } from 'react';

export default function useCamera(videoRef) {
  const streamRef = useRef(null);

  async function startCamera(constraints = { facingMode: 'environment' }, onError) {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        onError?.('Camera access is not supported in this browser.');
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { ...constraints, facingMode: constraints.facingMode || 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      return stream;
    } catch (e) {
      console.warn('Camera not available', e);
      onError?.('I could not access your camera. Please allow camera permission and try again.');
      return null;
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function toggleTorch(enabled = true) {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || typeof track.applyConstraints !== 'function') return false;

    const capabilities = track.getCapabilities?.() || {};
    if (!('torch' in capabilities)) return false;

    await track.applyConstraints({ advanced: [{ torch: Boolean(enabled) }] });
    return true;
  }

  async function capture() {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
  }

  return { startCamera, stopCamera, toggleTorch, capture };
}
