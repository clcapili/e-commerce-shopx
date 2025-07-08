const coupons = {
	FREESHIP: { discount: 0, description: 'Free shipping on your order', minSubtotal: 0, freeShipping: true },
	DISCOUNT10: { discount: 10, description: '$10 off your order', minSubtotal: 50, freeShipping: false },
	SAVE5: { discount: 5, description: '$5 off for first-time buyers', minSubtotal: 0, freeShipping: false },
	SUMMER15: { discount: 15, description: '$15 off summer promo', minSubtotal: 75, freeShipping: false }
};

export { coupons };