import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Fingerprint, Check } from 'lucide-react';
import { PLATFORM_LIST, PLATFORMS } from '../../constants/platforms';
import { formatAadhaarInput, stripAadhaar, maskAadhaar } from '../../utils/aadhaarMask';

/**
 * Step 1 — Persona
 * Collects: Name, Platform, Worker ID, Aadhaar
 */
export default function PersonaStep({ form }) {
  const { register, setValue, watch, formState: { errors } } = form;
  const selectedPlatform = watch('platform');
  const aadhaarRaw = watch('aadhaar') || '';
  const [aadhaarDisplay, setAadhaarDisplay] = useState('');
  const [aadhaarMasked, setAadhaarMasked] = useState('');
  const [isAadhaarComplete, setIsAadhaarComplete] = useState(false);

  const handleAadhaarChange = (e) => {
    const raw = stripAadhaar(e.target.value);
    setValue('aadhaar', raw, { shouldValidate: raw.length === 12 });

    if (raw.length === 12) {
      setIsAadhaarComplete(true);
      setAadhaarMasked(maskAadhaar(raw));
      setAadhaarDisplay(maskAadhaar(raw));
    } else {
      setIsAadhaarComplete(false);
      setAadhaarMasked('');
      setAadhaarDisplay(formatAadhaarInput(raw));
    }
  };

  const handlePlatformSelect = (platformId) => {
    setValue('platform', platformId, { shouldValidate: true });
    const prefix = PLATFORMS[platformId].idPrefix;
    const currentId = watch('workerId') || '';
    if (!currentId.startsWith(prefix)) {
      setValue('workerId', `${prefix}-`, { shouldValidate: false });
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  const inputBase = "w-full bg-transparent border-0 border-b-2 border-gray-300 rounded-none px-0 py-3 text-[#1A1A1A] text-[15px] font-semibold focus:ring-0 focus:border-[#1A3C5E] transition-colors outline-none font-['Inter',sans-serif]";
  const inputError = "border-red-400 focus:border-red-500 focus:ring-0";

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
          <User className="w-4 h-4 text-[#0F7B6C]" />
          Full Name <span className="text-[#E85D04]">*</span>
        </label>
        <input
          type="text"
          className={`${inputBase} ${errors.fullName ? inputError : ''}`}
          placeholder="Enter your full name"
          {...register('fullName')}
          autoComplete="name"
        />
        {errors.fullName && (
          <span className="text-xs text-red-500">{errors.fullName.message}</span>
        )}
      </motion.div>

      {/* Platform Selection */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#0F7B6C]" />
          Platform <span className="text-[#E85D04]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PLATFORM_LIST.map((p) => {
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePlatformSelect(p.id)}
                className={`relative backdrop-blur-md border-2 rounded-2xl p-5 text-center cursor-pointer transition-all duration-200
                  ${isSelected
                    ? 'border-[#1A3C5E] bg-white/50 shadow-sm'
                    : 'border-white/40 bg-white/20 hover:border-[#1A3C5E] hover:bg-white/30'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1A3C5E] flex items-center justify-center shadow-md">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
                <span className="text-[2.5rem] block">{p.icon}</span>
                <span className="font-semibold text-[#1A1A1A] text-sm mt-2 block">{p.name}</span>
              </button>
            );
          })}
        </div>
        {errors.platform && (
          <span className="text-xs text-red-500">{errors.platform.message}</span>
        )}
      </motion.div>

      {/* Worker ID */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#0F7B6C]" />
          Worker ID <span className="text-[#E85D04]">*</span>
        </label>
        <input
          type="text"
          className={`${inputBase} ${errors.workerId ? inputError : ''}`}
          placeholder={selectedPlatform ? PLATFORMS[selectedPlatform]?.idPlaceholder : 'Select platform first'}
          {...register('workerId')}
        />
        {errors.workerId && (
          <span className="text-xs text-red-500">{errors.workerId.message}</span>
        )}
      </motion.div>

      {/* Aadhaar */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-[#0F7B6C]" />
          Aadhaar Number <span className="text-[#E85D04]">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            className={`${inputBase} ${errors.aadhaar ? inputError : ''} ${isAadhaarComplete ? 'border-[#0F7B6C] focus:border-[#0F7B6C] focus:ring-[#0F7B6C]/10' : ''}`}
            placeholder="XXXX-XXXX-XXXX"
            value={aadhaarDisplay}
            onChange={handleAadhaarChange}
            maxLength={14}
            autoComplete="off"
            inputMode="numeric"
          />
          {isAadhaarComplete && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-5 h-5 rounded-full bg-[#0F7B6C] flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
              <span className="font-mono text-xs text-[#0F7B6C] font-medium hidden sm:inline">{aadhaarMasked}</span>
            </motion.div>
          )}
        </div>
        {isAadhaarComplete && (
          <span className="text-xs text-[#0F7B6C] font-medium">✓ Verified format</span>
        )}
        <span className="text-xs text-gray-400">
          12-digit Aadhaar · Masked after entry · Not stored locally
        </span>
        {errors.aadhaar && (
          <span className="text-xs text-red-500">{errors.aadhaar.message}</span>
        )}
      </motion.div>
    </div>
  );
}
