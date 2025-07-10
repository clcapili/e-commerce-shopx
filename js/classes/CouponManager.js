import { coupons } from '../data/couponCodes.js';

class CouponManager {
	constructor(form, summaryInstance) {
		this.element = form;

	    this.input = this.element.querySelector('#couponCode');
	    this.fieldGroup = this.element.querySelector('#couponFieldGroup');
        this.message = this.element.querySelector('#couponMessage');
        this.error = this.element.querySelector('#couponCode-error');
        this.result = this.element.querySelector('#couponResult');
        this.removeBtn = this.element.querySelector('#removeCouponBtn');
        this.summary = summaryInstance;
        
        this.errorTimeout = null;
		this.couponApplied = false;

		this.init();
	}

	init() {
		this.loadFromSession();

		this.element.addEventListener('submit', this.handleApply.bind(this));
		this.removeBtn.addEventListener('click', this.removeCoupon.bind(this));

		document.addEventListener('cartUpdated', this.handleCartUpdated.bind(this));
		document.addEventListener('couponInvalidated', this.invalidateCoupon.bind(this));

		this.input.addEventListener('input', () => {
			this.input.value = this.input.value.toUpperCase();
		});
	}

	loadFromSession() {
		const saved = sessionStorage.getItem('coupon');
		if (saved) {
			const parsed = JSON.parse(saved);
			this.couponApplied = true;

			const coupon = coupons[parsed.code];
			this.showSuccess(parsed.code, coupon);

            this.refreshSummary();
		}
	}

	handleApply(e) {
		e.preventDefault();

		if (this.couponApplied) {
			return;
		}

		const code = this.input.value.trim().toUpperCase();
		const coupon = coupons[code];

		if (!code) {
			return this.showError('Please enter a coupon code');
		}

		if (!coupon) {
			return this.showError('Please enter a valid coupon code');
		}

		const cart = JSON.parse(localStorage.getItem('cart')) || [];
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

		if (subtotal < coupon.minSubtotal) {
			return this.showError(`Minimum order of $${coupon.minSubtotal.toFixed(2)} required`);
		}

		// success
		sessionStorage.setItem('coupon', JSON.stringify({ 
			code, 
			discount: coupon.discount, 
			type: coupon.type 
		}));

		this.clearError();
		this.showSuccess(code, coupon);
		this.couponApplied = true;
		this.refreshSummary();
	}

	removeCoupon() {
		sessionStorage.removeItem('coupon');
		this.input.value = '';
		this.clearError();
		this.couponApplied = false;
		this.resetUI();
		this.refreshSummary();
	}

	handleCartUpdated() {
		this.refreshSummary();

		// revalidate coupon
		const saved = JSON.parse(sessionStorage.getItem('coupon'));
		if (saved) {
			const code = saved.code;
			const coupon = coupons[code];
			const cart = JSON.parse(localStorage.getItem('cart')) || [];
			const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

			if (!coupon || subtotal < coupon.minSubtotal) {
				document.dispatchEvent(new Event('couponInvalidated'));
			}
		}
	}

	invalidateCoupon() {
		sessionStorage.removeItem('coupon');
		this.input.value = '';
		this.clearError();
		this.couponApplied = false;
		this.resetUI();
		this.refreshSummary();
	}

	showError(message) {
        this.error.textContent = message;
        this.input.setAttribute('aria-invalid', 'true');
        this.input.focus();

        // clear after 3 seconds
        clearTimeout(this.errorTimeout); // clear any previous timeout
        this.errorTimeout = setTimeout(() => {
            this.clearError();
        }, 3000);
    }

	clearError() {
		this.error.textContent = '';
		this.input.setAttribute('aria-invalid', 'false');
	}

	showSuccess(code, coupon) {
		let discountText = '';

		if (coupon) {
			if (coupon.type === 'percent') {
				discountText = `${coupon.discount}% OFF`;
			} else if (coupon.type === 'amount') {
				discountText = `$${coupon.discount.toFixed(2)} OFF`;
			} else if (coupon.type === 'freeShipping') {
				discountText = 'Free Shipping';
			}
		}

		const message = `${code}${discountText ? `: ${discountText}` : ''}`;

		this.message.textContent = message;
		this.result.style.display = 'flex';

		requestAnimationFrame(() => {
			this.result.style.opacity = '1';
			this.result.style.transform = 'translateY(0)';
		});

		this.fieldGroup.style.display = 'none';
	}

	resetUI() {
		this.result.style.opacity = '0';
		this.result.style.transform = 'translateY(-10px)';

		setTimeout(() => {
			this.result.style.display = 'none';
		}, 300);

		this.fieldGroup.style.display = '';
		this.input.focus();
	}

	refreshSummary() {
		if (this.summary) {
			this.summary.render();
		}
	}
}

export default CouponManager;