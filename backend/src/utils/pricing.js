const PARCEL_CHARGES = { document: 0, small: 10, medium: 25, large: 50 };

const calculatePrice = ({ distance, parcelType, weight }) => {
  const base = 60;
  const distCharge = distance * 15;
  const parcelCharge = PARCEL_CHARGES[parcelType] || 0;
  const extraWeight = weight > 5 ? (weight - 5) * 5 : 0;
  return Math.round(base + distCharge + parcelCharge + extraWeight);
};

module.exports = { calculatePrice, PARCEL_CHARGES };
