import ShippingForm from "../classes/ShippingForm.js";

document.addEventListener('DOMContentLoaded', () => {
	const shippingFormEl = document.getElementById('shippingInfoForm');
	const shippingMethodFormEl = document.getElementById('shippingMethodForm');
	const shippingSummaryEl = document.getElementById('shippingSummary');

	if (shippingFormEl && shippingMethodFormEl && shippingSummaryEl) {
		new ShippingForm(shippingFormEl, shippingMethodFormEl, shippingSummaryEl);
	}
});