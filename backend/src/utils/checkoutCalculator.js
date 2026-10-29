const { haversineKm } = require('./routeOptimizer');

function hasCoordinates(obj) {
  return (
    obj &&
    typeof obj.latitude === 'number' &&
    !Number.isNaN(obj.latitude) &&
    typeof obj.longitude === 'number' &&
    !Number.isNaN(obj.longitude)
  );
}

/**
 * Evaluates whether a vendor can fulfill an order to the customer's location/address.
 * Never fabricates coordinates, distances, or ETAs.
 */
function evaluateServiceability(vendor, location = {}, fulfillmentType = 'Delivery') {
  if (!vendor || vendor.role !== 'vendor' || !vendor.isActive) {
    return {
      serviceable: false,
      reason: 'Vendor is currently inactive or unavailable.',
      distanceKm: null,
      estimatedMinutes: null,
    };
  }

  const settings = vendor.settings || {};

  if (fulfillmentType === 'Pickup') {
    if (settings.pickupAvailable === false) {
      return {
        serviceable: false,
        reason: 'Self-pickup is not offered by this vendor.',
        distanceKm: null,
        estimatedMinutes: null,
      };
    }
    let distanceKm = null;
    if (hasCoordinates(vendor) && hasCoordinates(location)) {
      distanceKm = Number(
        haversineKm(vendor.latitude, vendor.longitude, location.latitude, location.longitude).toFixed(2)
      );
    }
    const prep = typeof settings.estimatedPrepMinutes === 'number' ? settings.estimatedPrepMinutes : null;
    return {
      serviceable: true,
      reason: null,
      distanceKm,
      estimatedMinutes: prep ? { min: prep, max: prep + 10 } : null,
    };
  }

  // Delivery fulfillment
  if (settings.homeDelivery === false) {
    return {
      serviceable: false,
      reason: 'Home delivery is not enabled by this vendor. Choose self-pickup if available.',
      distanceKm: null,
      estimatedMinutes: null,
    };
  }

  const maxRadiusKm = typeof settings.deliveryRadiusKm === 'number' ? settings.deliveryRadiusKm : 5;
  let distanceKm = null;

  if (hasCoordinates(vendor) && hasCoordinates(location)) {
    distanceKm = Number(
      haversineKm(vendor.latitude, vendor.longitude, location.latitude, location.longitude).toFixed(2)
    );
    if (distanceKm > maxRadiusKm) {
      return {
        serviceable: false,
        reason: `Address is ${distanceKm} km away, outside vendor's ${maxRadiusKm} km delivery radius.`,
        distanceKm,
        estimatedMinutes: null,
      };
    }
  } else {
    const servicePincodes = Array.isArray(settings.servicePincodes)
      ? settings.servicePincodes.map((p) => String(p).trim()).filter(Boolean)
      : [];
    const reqPin = location?.pincode ? String(location.pincode).trim() : '';
    const reqCity = location?.city ? String(location.city).trim().toLowerCase() : '';
    const vendorPin = vendor.pincode ? String(vendor.pincode).trim() : '';
    const vendorCity = vendor.city ? String(vendor.city).trim().toLowerCase() : '';

    if (servicePincodes.length > 0 && reqPin) {
      if (!servicePincodes.includes(reqPin)) {
        return {
          serviceable: false,
          reason: `Pincode ${reqPin} is outside this vendor's serviceable pincodes (${servicePincodes.join(', ')}).`,
          distanceKm: null,
          estimatedMinutes: null,
        };
      }
    } else if (vendorPin && reqPin && vendorPin !== reqPin) {
      if (!vendorCity || !reqCity || vendorCity !== reqCity) {
        return {
          serviceable: false,
          reason: `Address pincode ${reqPin} does not match vendor's service area (${vendor.city || ''} ${vendorPin}).`,
          distanceKm: null,
          estimatedMinutes: null,
        };
      }
    } else if (vendorCity && reqCity && vendorCity !== reqCity) {
      return {
        serviceable: false,
        reason: `Vendor only delivers within ${vendor.city}.`,
        distanceKm: null,
        estimatedMinutes: null,
      };
    }
  }

  let estimatedMinutes = null;
  if (typeof settings.estimatedPrepMinutes === 'number' && settings.estimatedPrepMinutes > 0) {
    const travelMins = distanceKm !== null ? Math.ceil((distanceKm / 18) * 60) : 15;
    const min = settings.estimatedPrepMinutes + travelMins;
    estimatedMinutes = { min, max: min + 15 };
  }

  return {
    serviceable: true,
    reason: null,
    distanceKm,
    estimatedMinutes,
  };
}

/**
 * Computes authoritative server-side itemized bill from database Product prices.
 */
function calculateOrderTotals({ vendor, lineItems, fulfillmentType = 'Delivery' }) {
  const settings = vendor?.settings || {};
  let subtotal = 0;
  let estimatedProfit = 0;

  const computedItems = lineItems.map(({ product, quantity }) => {
    const qty = Number(quantity);
    const unitPrice = Number(product.price);
    const costPrice = Number(product.costPrice || 0);
    const totalPrice = Number((unitPrice * qty).toFixed(2));
    subtotal += totalPrice;
    estimatedProfit += (unitPrice - costPrice) * qty;

    return {
      productId: product.id,
      productName: product.name,
      kannadaName: product.kannadaName || null,
      unit: product.unit,
      quantity: qty,
      unitPrice,
      costPrice,
      totalPrice,
      availableStock: Number(product.stock),
      minOrderQty: Number(product.minOrderQty || 1),
      maxOrderQty: product.maxOrderQty ? Number(product.maxOrderQty) : null,
      inStock: Boolean(product.inStock && Number(product.stock) >= qty),
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  const minOrderAmount = Number(settings.minOrderAmount || 0);
  const minOrderShortfall =
    fulfillmentType === 'Delivery' && subtotal < minOrderAmount
      ? Number((minOrderAmount - subtotal).toFixed(2))
      : 0;

  let deliveryCharge = 0;
  if (fulfillmentType === 'Delivery' && computedItems.length > 0) {
    const baseDelivery = Number(settings.deliveryCharge ?? 0);
    const freeAbove =
      typeof settings.freeDeliveryAbove === 'number' && settings.freeDeliveryAbove > 0
        ? settings.freeDeliveryAbove
        : null;
    deliveryCharge = freeAbove !== null && subtotal >= freeAbove ? 0 : baseDelivery;
  }

  const discount = 0;
  const tax = 0;
  const total = Number((subtotal - discount + tax + deliveryCharge).toFixed(2));

  return {
    items: computedItems,
    subtotal,
    discount,
    tax,
    deliveryCharge,
    total,
    minOrderAmount,
    minOrderShortfall,
    freeDeliveryAbove:
      typeof settings.freeDeliveryAbove === 'number' ? settings.freeDeliveryAbove : null,
    estimatedProfit: Number(estimatedProfit.toFixed(2)),
  };
}

module.exports = {
  hasCoordinates,
  evaluateServiceability,
  calculateOrderTotals,
};
