class OrderConfirmation {
	constructor(element) {
		this.element = element;
		this.orderSection = this.element.querySelector('#thankYou');
		this.summaryEl = this.element.querySelector('#orderSummary');
		this.itemsEl = this.element.querySelector('#items');
		this.totalsEl = this.element.querySelector('#totals');
		this.shipBillEl = this.element.querySelector('#shippingBilling');
		this.shippingBlock = this.element.querySelector('#shippingBlock');
		this.billingBlock = this.element.querySelector('#billingBlock');
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

		console.log('orderData:', { id, cart, shipping, payment, coupon });

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
			<p>Subtotal: ${this.money(subtotal)}</p>
			<p>Shipping: ${this.money(shippingFee)}</p>
			<p>Tax (13% HST): ${this.money(tax)}</p>
			${discount > 0 ? `<p>Discount: -${this.money(discount)}</p>` : ''}
			<p><strong>Total: ${this.money(total)}</strong></p>
		`;

		this.summaryEl.hidden = false;
	}


	renderAddresses(shipping, payment) {
		this.shippingBlock.innerHTML = `
			<h3>Shipping</h3>
			<p><strong>${shipping.info.firstName} ${shipping.info.lastName}</strong></p>
			<p>${shipping.info.streetAddress}${shipping.info.addressDetails ? ', ' + shipping.info.addressDetails : ''}</p>
			<p>${shipping.info.city}, ${shipping.info.provinceOrState}, ${shipping.info.postalOrZip}</p>
			<p>${shipping.info.countryLabel}</p>
			<p>Phone: ${shipping.info.phone}</p>
		`;

		const bill = payment.sameAsShipping
			? shipping.info
			: payment.billingAddress;

		this.billingBlock.innerHTML = `
			<h3>Billing</h3>
			<p><strong>${bill.streetAddress ? '' : payment.email}</strong></p>
			${payment.email ? `<p>Email: ${payment.email}</p>` : ''}
			${bill.streetAddress ? `<p>${bill.streetAddress}${bill.addressDetails ? ', ' + bill.addressDetails : ''}</p>` : ''}
			${bill.city ? `<p>${bill.city}, ${bill.provinceOrState}, ${bill.postalOrZip}</p>` : ''}
			${bill.countryLabel ? `<p>${bill.countryLabel}</p>` : ''}
		`;

		this.shipBillEl.hidden = false;
	}

	money(n) {
		return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
	}
}

export default OrderConfirmation;