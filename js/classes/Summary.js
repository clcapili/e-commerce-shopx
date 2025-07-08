import { coupons } from '../data/couponCodes.js';

class Summary {
	constructor(element) {
		this.element = element;
		this.loadData();

		if (this.element) {
			this.totalItemsEl = this.element.querySelector('#summaryTotalItems');
			this.orderSummaryEl = this.element.querySelector('#orderSummary');

			this.render();
		}
	}

	loadData() {
		this.cart = JSON.parse(localStorage.getItem('cart')) || [];
		const shippingData = JSON.parse(sessionStorage.getItem('shippingData')) || {};
		this.delivery = shippingData.method || { fee: 0 };
		this.coupon = JSON.parse(sessionStorage.getItem('coupon')) || null;
	}

	render() {
		this.loadData();

		const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
		const subtotal = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

		// shipping fee
		let shipping = this.delivery.fee || 0;

		// validate coupon discount and free shipping
		let couponDiscount = 0;
		let freeShippingApplied = false;

		if (this.coupon) {
			const couponData = coupons[this.coupon.code];
			if (!couponData || subtotal < couponData.minSubtotal) {
				// clear when coupon is invalid
				sessionStorage.removeItem('coupon');
				this.coupon = null;
				couponDiscount = 0;
				freeShippingApplied = false;
				document.dispatchEvent(new Event('couponInvalidated'));
			} else {
				couponDiscount = this.coupon.discount || 0;
				if (couponData.freeShipping) {
					shipping = 0;
					freeShippingApplied = true;
				}
			}
		}

		const tax = (subtotal + shipping) * 0.13;
		const total = subtotal + shipping + tax - couponDiscount;

		if (this.totalItemsEl) {
			this.totalItemsEl.textContent = totalItems;
		}

		if (this.orderSummaryEl) {
			this.orderSummaryEl.innerHTML = `
				<div class="summary">
					<div class="summary-item summary-subtotal"><span class="type">Subtotal</span><span class="fee">$${subtotal.toFixed(2)}</span></div>
					<div class="summary-item"><span>Shipping</span><span>$${shipping.toFixed(2)}</span></div>
					<div class="summary-item"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
					${(couponDiscount > 0 || freeShippingApplied) ? `
						<div class="summary-item summary-coupon">
							<span>Coupon</span>
							<span class="discount">
								${couponDiscount > 0 ? `- $${couponDiscount.toFixed(2)}` : ''}
								${(couponDiscount > 0 && freeShippingApplied) ? ' + ' : ''}
								${freeShippingApplied ? 'Free Shipping' : ''}
							</span>
						</div>
					` : ''}
					<div class="summary-item summary-total"><span class="type">Total</span><span class="fee">$${total.toFixed(2)}</span></div>
				</div>
			`;
		}
	}
}

export default Summary;