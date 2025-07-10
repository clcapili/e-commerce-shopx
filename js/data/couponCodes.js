const coupons = {
	FREESHIP: { discount: 0, description: 'Free shipping on your order', minSubtotal: 100, freeShipping: true, type: 'freeShipping' },
	DISCOUNT10: { discount: 10, description: '$10 off your order', minSubtotal: 50, freeShipping: false, type: 'amount' },
	SAVE5: { discount: 5, description: '$5 off for first-time buyers', minSubtotal: 0, freeShipping: false, type: 'amount' },
	SUMMER15: { discount: 15, description: '15% off summer promo', minSubtotal: 75, freeShipping: false, type: 'percent' }
};

export { coupons };