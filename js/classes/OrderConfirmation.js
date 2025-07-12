class OrderConfirmation {
	constructor(element) {
		this.element = element;
		this.orderSection = this.element.querySelector('#thankYou');
		this.summaryEl = this.element.querySelector('#orderSummary');
		this.orderSummaryItemsEl = this.element.querySelector('#orderSummaryItems');
		this.totalsEl = this.element.querySelector('#totals');
		this.customerInfoEl = this.element.querySelector('#customerInfo');
		this.shippingBlock = this.element.querySelector('#shippingBlock');
		this.billingBlock = this.element.querySelector('#billingBlock');
		this.paymentMethodBlock = this.element.querySelector('#paymentMethod');
		this.orderNumEl = this.element.querySelector('#orderNumber');

		this.init();
	}

	init() {
		const raw = sessionStorage.getItem('orderData');
		if (!raw) {
			window.location.replace('/');
			return;
		}

		const { id, cart, shipping, payment } = JSON.parse(raw);

		let coupon = null;
		const couponRaw = sessionStorage.getItem('coupon');
		if (couponRaw) {
			try {
				coupon = JSON.parse(couponRaw);
			} catch (e) {
				console.warn('Failed to parse coupon:', e);
			}
		}

		this.renderOrderHeader(id);
		this.renderItems(cart);
		this.renderTotals(cart, shipping, coupon);
		this.renderAddresses(shipping, payment);

		sessionStorage.removeItem('coupon');
		sessionStorage.removeItem('orderData');
	}

	renderOrderHeader(id) {
		this.orderNumEl.textContent = id;
		this.orderSection.hidden = false;

		const copyBtn = this.element.querySelector('.btn-copy');
		if (copyBtn) {
			copyBtn.addEventListener('click', () => {
				navigator.clipboard.writeText(id)
					.then(() => {
						copyBtn.classList.add('copied');

						setTimeout(() => {
							copyBtn.classList.remove('copied');
						}, 2000);
					})
					.catch(err => {
						console.error('Failed to copy:', err);
					});
			});
		}
	}

	renderItems(cart) {
		if (!Array.isArray(cart) || cart.length === 0) {
			return;
		}

		this.orderSummaryItemsEl.innerHTML = cart
			.map(item => {
				const {
					name = 'Unnamed item',
					image = '',
					color = '',
					size  = '',
					price = 0,
					quantity = 0
				} = item;

				const updatedImage = image
					? image.replace(/_(.*?)@/, `_${color.toLowerCase()}@`)
					: '';

				const total = price * quantity;

				return `
					<div class="order-item">
						<div class="order-item-details">
							${updatedImage ? `<img src="${updatedImage}" alt="${name} in ${color}" loading="lazy">` : ''}
							<div>
								<p class="item-title">${name}</p>

								<div class="item-meta">
									${size  ? `<p>Size <span>${size}</span></p>`   : ''}
									${color ? `<p>Color <span>${color}</span></p>` : ''}
								</div>

								<p class="order-item-qty">x ${quantity}</p>
							</div>
						</div>

						<p class="order-item-price">${this.money(total)}</p>
					</div>
				`;
			})
			.join('');

		// update “Your order (x)”
		const totalItems = cart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
		const totalItemsEl = this.element.querySelector('#orderTotalItems');
		if (totalItemsEl) totalItemsEl.textContent = totalItems;

		this.summaryEl.hidden = false;
	}

	renderTotals(cart, shipping, coupon) {
		const subtotal = cart.reduce(
			(sum, i) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 0)),
			0
		);

		let discount = 0;
		let freeShippingApplied = false;

		let shippingFee = shipping?.method?.fee ? Number(shipping.method.fee) : 0;

		if (coupon) {
			if (coupon.type === 'percent') {
				discount = subtotal * (Number(coupon.discount) / 100);
			} else if (coupon.type === 'amount') {
				discount = Number(coupon.discount);
			} else if (coupon.type === 'freeShipping') {
				freeShippingApplied = true;
			}

			if (freeShippingApplied) {
				shippingFee = 0;
			}
		}

		discount = Math.min(Math.max(discount, 0), subtotal);
		const tax = +((subtotal + shippingFee) * 0.13).toFixed(2);
		const total = subtotal + shippingFee + tax - discount;

		this.totalsEl.innerHTML = `
			<div class="summary-item summary-subtotal">
				<span class="type">Subtotal</span>
				<span class="fee">${this.money(subtotal)}</span>
			</div>

			<div class="summary-item">
				<span>Shipping</span>
				<span>${this.money(shippingFee)}</span>
			</div>

			<div class="summary-item">
				<span>Tax</span>
				<span>${this.money(tax)}</span>
			</div>

			${discount > 0 ?`
				<div class="summary-item summary-coupon">
					<span>Discount</span>
					<span>-${this.money(discount)}</span>
				</div>
			`
				: ''}

			<div class="summary-item summary-total">
				<span class="type">Total</span>
				<span class="fee">${this.money(total)}</span>
			</div>
		`;

		this.summaryEl.hidden = false;
	}


	renderAddresses(shipping, payment) {
		const shippingInfo = shipping?.info || {};
		const billingInfo = payment.sameAsShipping ? shippingInfo : (payment.billingAddress || {});

		const email = payment.email || '';
		const phone = shippingInfo.phone || '';

		// email
		const emailEl = this.element.querySelector('#customerEmail');

		emailEl.textContent = email ? `${email}` : '';

		// shipping Address
		this.shippingBlock.innerHTML = `
			<h3>Shipping Address</h3>
			<p><strong>${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}</strong></p>
			<p>${shippingInfo.streetAddress || ''}${shippingInfo.addressDetails ? ', ' + shippingInfo.addressDetails : ''}</p>
			<p>${shippingInfo.city || ''}, ${shippingInfo.provinceOrState || ''}, ${shippingInfo.postalOrZip || ''}</p>
			<p>${shippingInfo.countryLabel || ''}</p>
			<p>${billingInfo.phone || ''}</p>
		`;

		// billing address
		this.billingBlock.innerHTML = `
			<h3>Billing Address</h3>
			<p><strong>${billingInfo.firstName || ''} ${billingInfo.lastName || ''}</strong></p>
			<p>${billingInfo.streetAddress || ''}${billingInfo.addressDetails ? ', ' + billingInfo.addressDetails : ''}</p>
			<p>${billingInfo.city || ''}, ${billingInfo.provinceOrState || ''}, ${billingInfo.postalOrZip || ''}</p>
			<p>${billingInfo.countryLabel || ''}</p>
			<p>${billingInfo.phone || ''}</p>
		`;
		
		// payment method
		const last4 = payment.cardNumber || '••••';
		const expMonth = payment.expMonth || '';
		const expYear = payment.expYear || '';
		const expLabel = (expMonth && expYear)
			? `${String(expMonth).padStart(2, '0')}/${expYear}`
			: '';

		const type = payment.type || 'Card';

		const cardClassMap = {
			Visa: 'card-visa',
			Mastercard: 'card-mastercard', 'American Express': 'card-amex',
			Discover: 'card-discover',
			JCB: 'card-jcb',
		};

		const cardClass = cardClassMap[type] || 'card-generic';

		this.paymentMethodBlock.innerHTML = `
			<h3>Payment Method</h3>
			<p>
				<span class="card-item-icon ${cardClass}" aria-hidden="true"></span>
				${type} ************ ending in ${last4}
			</p>
			${expLabel ? `<p>Exp: ${expLabel}</p>` : ''}
		`;

		this.customerInfoEl.hidden = false;
	}

	money(n) {
		return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
	}
}

export default OrderConfirmation;