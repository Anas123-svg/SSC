export function stored(key, seed) { try { const v = localStorage.getItem('harmonix-' + key); return v ? JSON.parse(v) : seed ;} catch { return seed ;} }
