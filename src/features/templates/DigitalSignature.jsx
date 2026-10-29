import React, { useEffect, useRef, useState } from 'react';
import { PenLine, RotateCcw } from 'lucide-react';

/** Drawn, locally-stored signature image. Works with mouse, touch and stylus. */
export default function DigitalSignature({ value = '', onChange = () => {}, disabled = false, label = 'Digital signature' }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const prevRef = useRef(null);
  const [editing, setEditing] = useState(!value);
  const isImage = typeof value === 'string' && value.startsWith('data:image/');

  useEffect(() => {
    if (!editing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (isImage) {
      const image = new Image();
      image.onload = () => { if (canvasRef.current === canvas) ctx.drawImage(image, 0, 0, canvas.width, canvas.height); };
      image.src = value;
    }
  }, [editing]); // Intentionally not redrawing on every saved stroke.

  const coordinate = (event) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * c.width / rect.width, y: (event.clientY - rect.top) * c.height / rect.height };
  };
  const start = event => {
    if (disabled || !editing) return;
    event.preventDefault();
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture?.(event.pointerId);
    prevRef.current = coordinate(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#152b46';
    ctx.beginPath(); ctx.arc(prevRef.current.x, prevRef.current.y, 1.4, 0, Math.PI*2); ctx.fill();
  };
  const move = event => {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const next = coordinate(event); const old = prevRef.current || next;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#152b46'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(old.x, old.y); ctx.lineTo(next.x, next.y); ctx.stroke();
    prevRef.current = next;
  };
  const finish = event => {
    if (!drawingRef.current) return;
    event.preventDefault(); drawingRef.current = false; prevRef.current = null;
    if (canvasRef.current?.hasPointerCapture?.(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
    onChange(canvasRef.current.toDataURL('image/jpeg', 0.75));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
    onChange(''); setEditing(true);
  };
  if (!editing && value) return <div className="hwd-signature-captured">
    {isImage ? <img src={value} alt={`${label} — signed`} /> : <span className="hwd-legacy-signature">{value}</span>}
    {!disabled && <button type="button" onClick={()=>setEditing(true)}><PenLine size={13}/> Edit signature</button>}
  </div>;
  return <div className="hwd-signature-field">
    <canvas ref={canvasRef} width={440} height={120} role="img" aria-label={`${label} drawing area`} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} />
    <div className="hwd-signature-actions"><span>{value ? 'Signature saved' : 'Sign here using your finger, mouse or pen'}</span>
      {!disabled && <button type="button" onClick={clear}><RotateCcw size={13}/> Clear</button>}</div>
  </div>;
}
