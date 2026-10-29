import React, { useState } from 'react';

/** Photo field for any editable HXC section; self-contained browser-local image. */
export default function PhotoUploadField({ value, onChange, disabled=false, label='Photo evidence' }) {
  const [error,setError]=useState('');
  const choose=async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(!file.type.startsWith('image/')){setError('Select an image file.');return;}
    try {
      const data=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read image'));
        reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Could not open image'));img.onload=()=>{
          const scale=Math.min(1,960/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
          const ctx=canvas.getContext('2d');if(!ctx)return reject(new Error('Image canvas unavailable'));ctx.drawImage(img,0,0,canvas.width,canvas.height);
          const result=canvas.toDataURL('image/jpeg',.68);if(result.length>850000)return reject(new Error('Image is too large for browser storage'));resolve(result);
        };img.src=String(reader.result)};reader.readAsDataURL(file);
      });onChange(data);setError('');
    }catch(err){setError(err.message||'Could not upload image')}
  };
  return <div className="hxc-uploaded-photo">{value && <img src={value} alt={label}/>}
    {!disabled && <div className="hwd-photo-actions"><label className="hwd-upload">{value?'Replace image':'Choose image'}<input type="file" accept="image/*" onChange={choose}/></label>{value && <button type="button" onClick={()=>onChange('')}>Remove</button>}</div>}
    {error && <small role="alert" className="hwd-photo-error">{error}</small>}
  </div>;
}
