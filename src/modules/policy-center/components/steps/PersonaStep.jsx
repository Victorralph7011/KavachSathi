import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Fingerprint } from 'lucide-react';
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
    // Auto-set worker ID prefix
    const prefix = PLATFORMS[platformId].idPrefix;
    const currentId = watch('workerId') || '';
    if (!currentId.startsWith(prefix)) {
      setValue('workerId', `${prefix}-`, { shouldValidate: false });
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <div className="step-persona">
      {/* Full Name */}
      <motion.div className="reg-field" custom={0} initial="hidden" animate="visible" variants={fadeIn}>
        <label className="reg-field__label text-mono">
          <User size={14} />
          <span>fullName</span>
          <span className="reg-field__required">*</span>
        </label>
        <input
          type="text"
          className={`reg-field__input ${errors.fullName ? 'has-error' : ''}`}
          placeholder="Enter your full name"
          {...register('fullName')}
          autoComplete="name"
        />
        {errors.fullName && <span className="reg-field__error text-mono">{errors.fullName.message}</span>}
      </motion.div>

      {/* Platform Selection */}
      <motion.div className="reg-field" custom={1} initial="hidden" animate="visible" variants={fadeIn}>
        <label className="reg-field__label text-mono">
          <CreditCard size={14} />
          <span>platform</span>
          <span className="reg-field__required">*</span>
        </label>
        <div className="platform-selector">
          {PLATFORM_LIST.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`platform-pill ${selectedPlatform === p.id ? 'active' : ''}`}
              onClick={() => handlePlatformSelect(p.id)}
              style={{
                '--pill-color': p.color,
                '--pill-glow': `${p.color}33`,
              }}
            >
              <span className="platform-pill__icon">{p.icon}</span>
              <span className="platform-pill__name">{p.name}</span>
            </button>
          ))}
        </div>
        {errors.platform && <span className="reg-field__error text-mono">{errors.platform.message}</span>}
      </motion.div>

      {/* Worker ID */}
      <motion.div className="reg-field" custom={2} initial="hidden" animate="visible" variants={fadeIn}>
        <label className="reg-field__label text-mono">
          <CreditCard size={14} />
          <span>workerId</span>
          <span className="reg-field__required">*</span>
        </label>
        <input
          type="text"
          className={`reg-field__input ${errors.workerId ? 'has-error' : ''}`}
          placeholder={selectedPlatform ? PLATFORMS[selectedPlatform]?.idPlaceholder : 'Select platform first'}
          {...register('workerId')}
        />
        {errors.workerId && <span className="reg-field__error text-mono">{errors.workerId.message}</span>}
      </motion.div>

      {/* Aadhaar */}
      <motion.div className="reg-field" custom={3} initial="hidden" animate="visible" variants={fadeIn}>
        <label className="reg-field__label text-mono">
          <Fingerprint size={14} />
          <span>aadhaarNumber</span>
          <span className="reg-field__required">*</span>
        </label>
        <div className="aadhaar-input-wrap">
          <input
            type="text"
            className={`reg-field__input aadhaar-input ${errors.aadhaar ? 'has-error' : ''}`}
            placeholder="XXXX-XXXX-XXXX"
            value={aadhaarDisplay}
            onChange={handleAadhaarChange}
            maxLength={14}
            autoComplete="off"
            inputMode="numeric"
          />
          {isAadhaarComplete && (
            <motion.div
              className="aadhaar-verified"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="var(--neon)" strokeWidth="1.5" />
                <path d="M5 8L7 10L11 6" stroke="var(--neon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-mono">{aadhaarMasked}</span>
            </motion.div>
          )}
        </div>
        <span className="reg-field__hint text-mono">12-digit Aadhaar · Masked after entry · Not stored locally</span>
        {errors.aadhaar && <span className="reg-field__error text-mono">{errors.aadhaar.message}</span>}
      </motion.div>
    </div>
  );
}
