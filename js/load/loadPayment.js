import PaymentForm from '../classes/PaymentForm.js';
import Summary from '../classes/Summary.js';
import CouponManager from '../classes/CouponManager.js';

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('paymentInfoForm');
	const summaryBlock = document.querySelector('.order-summary');
	const couponFormBlock = document.getElementById('couponForm');

	if (form) {
		new PaymentForm(form);
	}

	let summaryInstance = null;
	if (summaryBlock) {
		summaryInstance = new Summary(summaryBlock);
	}

	if (couponFormBlock && summaryInstance) {
		new CouponManager(couponFormBlock, summaryInstance);
	}

	// enable/disable purchase button based on confirmation checkbox
	const confirmCheckbox = document.getElementById('confirmPurchase');
	const purchaseBtn = document.getElementById('purchaseBtn');

	if (confirmCheckbox && purchaseBtn) {
		purchaseBtn.disabled = !confirmCheckbox.checked;

		confirmCheckbox.addEventListener('change', () => {
			purchaseBtn.disabled = !confirmCheckbox.checked;
		});
	}
});