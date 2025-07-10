class OrderConfirmation {
	constructor(element) {
		this.element = element;
		this.orderSection = this.element.querySelector('#thankYou');
		this.summaryEl = this.element.querySelector('#orderSummary');
		this.itemsEl = this.element.querySelector('#items');
		this.totalsEl = this.element.querySelector('#totals');
		this.customerDetailsEl = this.element.querySelector('#customerDetails');
		this.shippingBlock = this.element.querySelector('#shippingBlock');
		this.billingBlock = this.element.querySelector('#billingBlock');
		this.orderNumEl = this.element.querySelector('#orderNumber');

		this.init();
	}

	init() {
		const raw = sessionStorage.getItem('orderData');
		if (!raw) {
			// window.location.replace('/');
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

		console.log('orderData:', { id, cart, shipping, payment, coupon });

		this.renderOrderHeader(id);
		this.renderItems(cart);
		this.renderTotals(cart, shipping, coupon);
		this.renderAddresses(shipping, payment);

		// sessionStorage.removeItem('coupon');
		// sessionStorage.removeItem('orderData');
	}

	renderOrderHeader(id) {
		this.orderNumEl.textContent = id;
		this.orderSection.hidden = false;
	}

	renderItems(cart) {
		if (!Array.isArray(cart) || cart.length === 0) {
			return;
		}

		this.itemsEl.innerHTML = cart
			.map(item => {
				const title = item.title || item.name || 'Unnamed item';
				const quantity = item.quantity || 0;
				const total = (Number(item.price) || 0) * quantity;

				return `<p>${quantity} × ${title} — ${this.money(total)}</p>`;
			})
			.join('');

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
					<span class="discount">-${this.money(discount)}</span>
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

		// email & phone
		const emailEl = this.element.querySelector('#customerEmail');
		const phoneEl = this.element.querySelector('#customerPhone');

		emailEl.textContent = email ? `Email: ${email}` : '';
		phoneEl.textContent = phone ? `Phone: ${phone}` : '';

		// shipping Address
		this.shippingBlock.innerHTML = `
			<h3>Shipping Address</h3>
			<p><strong>${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}</strong></p>
			<p>${shippingInfo.streetAddress || ''}${shippingInfo.addressDetails ? ', ' + shippingInfo.addressDetails : ''}</p>
			<p>${shippingInfo.city || ''}, ${shippingInfo.provinceOrState || ''}, ${shippingInfo.postalOrZip || ''}</p>
			<p>${shippingInfo.countryLabel || ''}</p>
		`;

		// billing address
		this.billingBlock.innerHTML = `
			<h3>Billing Address</h3>
			<p><strong>${billingInfo.firstName || ''} ${billingInfo.lastName || ''}</strong></p>
			<p>${billingInfo.streetAddress || ''}${billingInfo.addressDetails ? ', ' + billingInfo.addressDetails : ''}</p>
			<p>${billingInfo.city || ''}, ${billingInfo.provinceOrState || ''}, ${billingInfo.postalOrZip || ''}</p>
			<p>${billingInfo.countryLabel || ''}</p>
		`;

		this.customerDetailsEl.hidden = false;
	}


	money(n) {
		return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
	}
}

export default OrderConfirmation;