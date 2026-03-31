/**
 * Gig Platform Configurations
 * Each platform has distinct risk profiles and worker ID formats
 */
export const PLATFORMS = {
  zomato: {
    id: 'zomato',
    name: 'Zomato',
    color: '#E23744',
    idPrefix: 'ZMT',
    idPattern: /^ZMT-\d{6,}$/,
    idPlaceholder: 'ZMT-XXXXXX',
    riskModifier: 0.85, // delivery — moderate traffic exposure
    icon: '🍕',
  },
  swiggy: {
    id: 'swiggy',
    name: 'Swiggy',
    color: '#FF5200',
    idPrefix: 'SWG',
    idPattern: /^SWG-\d{6,}$/,
    idPlaceholder: 'SWG-XXXXXX',
    riskModifier: 0.85,
    icon: '🛵',
  },
  uber: {
    id: 'uber',
    name: 'Uber',
    color: '#276EF1',
    idPrefix: 'UBR',
    idPattern: /^UBR-\d{6,}$/,
    idPlaceholder: 'UBR-XXXXXX',
    riskModifier: 0.92, // ride-hailing — higher traffic exposure
    icon: '🚗',
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);
