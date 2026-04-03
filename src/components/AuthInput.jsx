import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AuthInput({ label, type = "text", value, onChange, placeholder, hasError, disabled }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full mb-2">
      <label className="block text-sm font-semibold text-[#64748B] mb-2 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent border-none outline-none pb-2 text-[#0F172A] font-mono text-lg placeholder-slate-300"
          style={{ boxShadow: 'none' }}
        />
        {/* The Live-Data Effect */}
        <motion.div 
          animate={{ 
            opacity: isFocused ? [0.2, 1, 0.2] : 0, 
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute right-0 top-1 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] bg-emerald-500"
          style={{ display: isFocused ? 'block' : 'none' }}
        />
      </div>
      {/* 
        Input Line: single border-b-2 in light gray
        Active State: animates to Deep Navy
      */}
      <div className="relative h-[2px] w-full bg-[#D1D5DB]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (isFocused || value) ? 1 : 0, backgroundColor: hasError ? '#EF4444' : '#0F172A' }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-0 origin-left"
        />
      </div>
    </div>
  );
}
