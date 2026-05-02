const PRICING = {
  base_fare: 60,
  per_km_rate: 15,
  weight_charges: {
    document: 0,
    small: 10,
    medium: 25,
    large: 50,
  },
};

const calculatePrice = (distance, weight, parcelType) => {
  const baseFare = PRICING.base_fare;
  const distanceCharge = distance * PRICING.per_km_rate;
  const weightCharge = PRICING.weight_charges[parcelType] || 0;
  const extraWeight = weight > 5 ? (weight - 5) * 5 : 0;

  return Math.round(baseFare + distanceCharge + weightCharge + extraWeight);
};

module.exports = { calculatePrice, PRICING };
