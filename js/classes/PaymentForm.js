import { populateProvinceStateSelect } from '../utils/locationHelper.js';
import { getLabelsByCountry } from '../utils/location.js';
import { isValidEmail, isValidCardNumber, isValidExpiry, isValidPostalCode, getProvinceStateErrorLabel, isValidPhone } from '../utils/validation.js';

class PaymentForm {
    constructor(element) {
        this.form = element;
        this.billingAddressFields = this.form.querySelector('#billingAddressFields');
        this.shippingSummary = document.getElementById('shippingSummary');

        this.fields = {
            email: this.form.querySelector('#email'),
            cardName: this.form.querySelector('#cardName'),
            cardNumber: this.form.querySelector('#cardNumber'),
            expiry: this.form.querySelector('#expiry'),
            cvv: this.form.querySelector('#cvv'),

            sameAsShipping: this.form.querySelector('#sameAsShipping'),

			billPhone: this.form.querySelector('#billPhone'),
            billStAddress: this.form.querySelector('#billStAddress'),
            billAddressDetails: this.form.querySelector('#billAddressDetails'),
            billCity: this.form.querySelector('#billCity'),
            billCountry: this.form.querySelector('#billCountry'),
            billProvinceState: this.form.querySelector('#billProvinceState'),
            billPostalZip: this.form.querySelector('#billPostalZip'),
        };

        this.labels = {
            provinceLabel: this.form.querySelector('#billProvinceStateLabel'),
            postalLabel: this.form.querySelector('#billPostalZipLabel')
        };

        this.errors = {
            email: this.form.querySelector('#email-error'),
            cardName: this.form.querySelector('#cardName-error'),
            cardNumber: this.form.querySelector('#cardNumber-error'),
            expiry: this.form.querySelector('#expiry-error'),
            cvv: this.form.querySelector('#cvv-error'),
			billPhone: this.form.querySelector('#billPhone-error'),
            billStAddress: this.form.querySelector('#billStAddress-error'),
            billCity: this.form.querySelector('#billCity-error'),
            billCountry: this.form.querySelector('#billCountry-error'),
            billProvinceState: this.form.querySelector('#billProvinceState-error'),
            billPostalZip: this.form.querySelector('#billPostalZip-error'),
        };

        this.setupListeners();

        this.updateBillingLabels();
        this.prefillPaymentInfo();
        this.toggleBillingAddressFields();

        // disable province/state if no initial country selected
        if (!this.fields.billCountry.value) {
            this.fields.billProvinceState.disabled = true;
        }
    }

    setupListeners() {
        Object.entries(this.fields).forEach(([name, field]) => {
            if (field && field.type !== 'checkbox') {
                field.addEventListener('blur', () => this.validateField(name));
                field.addEventListener('input', () => this.clearError(name));
            }
        });

        this.fields.cardNumber.addEventListener('input', this.formatCardNumber.bind(this));
        this.fields.expiry.addEventListener('input', this.formatExpiryInput.bind(this));
        this.fields.cvv.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        this.fields.billPhone.addEventListener('input', this.formatPhoneInput.bind(this));
        this.fields.billPostalZip.addEventListener('input', this.formatPostalZipInput.bind(this));

        this.fields.billCountry.addEventListener('change', () => this.handleBillingCountryChange());

        this.fields.sameAsShipping.addEventListener('change', () => {
            this.toggleBillingAddressFields();
            this.updateShippingSummaryVisibility();
        });

        this.form.addEventListener('submit', e => this.handlePaymentInfoSubmit(e));
    }

    handleBillingCountryChange() {
        this.updateBillingLabels();

        this.clearError('billProvinceState');
        this.fields.billProvinceState.value = '';
        this.fields.billPostalZip.value = '';

        this.fields.billProvinceState.disabled = !this.fields.billCountry.value;

        if (!this.fields.billProvinceState.disabled) {
            this.fields.billProvinceState.focus();
        }
    }

    populateProvinceStateOptions() {
        const country = this.fields.billCountry.value;
        const select = this.fields.billProvinceState;

        populateProvinceStateSelect(select, country);
    }

    updateBillingLabels() {
        const country = this.fields.billCountry.value;
        const labels = getLabelsByCountry(country);

        this.labels.provinceLabel.innerHTML = `${labels.province}<span aria-hidden="true">*</span>`;
        this.labels.postalLabel.innerHTML = `${labels.postal}<span aria-hidden="true">*</span>`;

        this.populateProvinceStateOptions();
    }

    handlePaymentInfoSubmit(e) {
        e.preventDefault();

        const requiredFields = ['email', 'cardName', 'cardNumber', 'expiry', 'cvv'];

        if (!this.fields.sameAsShipping.checked) {
            requiredFields.push(
                'billPhone',
                'billStAddress',
                'billCity',
                'billCountry',
                'billProvinceState',
                'billPostalZip'
            );
        }

        const isValid = requiredFields.every(name => this.validateField(name));

        if (!isValid) {
            const firstInvalid = requiredFields.find(name => this.fields[name].getAttribute('aria-invalid') === 'true');
            if (firstInvalid) {
                this.fields[firstInvalid].focus();
            }

            return;
        }

        this.savePaymentInfo();

        const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
        const shippingData = JSON.parse(sessionStorage.getItem('shippingData') || '{}');
        const paymentData = JSON.parse(sessionStorage.getItem('paymentData') || '{}');

        // order ID – timestamp + 4‑digit random
        const orderId = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        sessionStorage.setItem('orderData', JSON.stringify({
            id: orderId,
            cart: cartData,
            shipping: shippingData,
            payment: paymentData
        }));

        // clear everything
        localStorage.removeItem('cart');
        sessionStorage.removeItem('shippingData');
        sessionStorage.removeItem('paymentData');

        window.location.assign('/confirmation.html');
    }

    toggleBillingAddressFields() {
        if (this.fields.sameAsShipping.checked) {
            this.billingAddressFields.style.display = 'none';

            ['billPhone', 'billStAddress', 'billCity', 'billCountry', 'billProvinceState', 'billPostalZip'].forEach(field => this.clearError(field));
        } else {
            this.billingAddressFields.style.display = 'block';
            this.populateProvinceStateOptions();
        }
    }

    formatCardNumber(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 20) {
            value = value.slice(0, 20);
        }

        // 1234 5678 9012 3456 7890
        value = value.replace(/(.{4})/g, '$1 ').trim();

        e.target.value = value;
    }

    formatExpiryInput(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 4) {
            value = value.slice(0, 4);
        }

        // insert slash
        if (value.length >= 3) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }

        e.target.value = value;
    }

    formatPhoneInput(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 10) {
            value = value.slice(0, 10);
        }

        // (555) 555-5555
        if (value.length >= 7) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
        } else if (value.length >= 4) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else if (value.length >= 1) {
            value = `(${value}`;
        }

        e.target.value = value;
    }

    formatPostalZipInput(e) {
        const country = this.fields.billCountry.value;
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (country === 'CA') {
            // M5V 2H2
            if (value.length > 6) {
                value = value.slice(0, 6);
            }

            // insert space after 3 characters
            if (value.length > 3) {
                value = value.slice(0, 3) + ' ' + value.slice(3);
            }
        } else if (country === 'US') {
            // 5 digits max
            value = value.replace(/\D/g, '').slice(0, 5);
        }

        e.target.value = value;
    }

    prefillPaymentInfo() {
        const stored = sessionStorage.getItem('paymentData');
        if (!stored) {
            return;
        }

        try {
            const data = JSON.parse(stored);
            if (!data) {
                return;
            }

            this.fields.email.value = data.email || '';

            if (data.sameAsShipping) {
                this.fields.sameAsShipping.checked = true;
                this.toggleBillingAddressFields();
            } else {
                this.fields.sameAsShipping.checked = false;
                this.toggleBillingAddressFields();

                if (data.billingAddress) {
                    this.fields.billPhone.value = data.billingAddress.phone || '';
                    this.fields.billStAddress.value = data.billingAddress.streetAddress || '';
                    this.fields.billAddressDetails.value = data.billingAddress.addressDetails || '';
                    this.fields.billCity.value = data.billingAddress.city || '';
                    this.fields.billCountry.value = data.billingAddress.country || '';

                    this.populateProvinceStateOptions();
                    requestAnimationFrame(() => {
                        this.fields.billProvinceState.value = data.billingAddress.provinceOrState || '';
                    });

                    this.fields.billPostalZip.value = data.billingAddress.postalOrZip || '';
                }
            }
        } catch (e) {
            console.error('Failed to parse payment data from sessionStorage.', e);
            sessionStorage.removeItem('paymentData');
        }
    }

    savePaymentInfo() {
        const paymentData = {
            email: this.fields.email.value.trim(),
            sameAsShipping: this.fields.sameAsShipping.checked,
            billingAddress: null,
        };

        if (!paymentData.sameAsShipping) {
            paymentData.billingAddress = {
                phone: this.fields.billPhone.value.trim(),
                streetAddress: this.fields.billStAddress.value.trim(),
                addressDetails: this.fields.billAddressDetails.value.trim(),
                city: this.fields.billCity.value.trim(),
                country: this.fields.billCountry.value,
                provinceOrState: this.fields.billProvinceState.value,
                postalOrZip: this.fields.billPostalZip.value.trim(),
            };
        }

        sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
    }

    // same as shipping
    updateShippingSummaryVisibility() {
        if (this.fields.sameAsShipping.checked) {
            this.renderShippingSummary();
        } else {
            this.shippingSummary.hidden = true;
            this.shippingSummary.innerHTML = '';
        }
    }

    renderShippingSummary() {
        const dataRaw = sessionStorage.getItem('shippingData');
        if (!dataRaw) {
            return;
        }

        let shippingData;
        try {
            shippingData = JSON.parse(dataRaw);
        } catch {
            return;
        }

        const { info, method } = shippingData;
        if (!info) {
            return;
        }

        const methodLine = method
            ? `<p>Method: ${method.label}</p>`
            : '';

        this.shippingSummary.innerHTML = `
            <div class="summary-header">
                <h3 class="summary-heading">Shipping Summary</h3>
                <a href="/shipping.html" class="summary-edit-link" style="display: inline-block;">Edit</a>
            </div>
            <p><strong>${info.firstName} ${info.lastName}</strong></p>
            <p>${info.streetAddress}${info.addressDetails ? ', ' + info.addressDetails : ''}</p>
            <p>${info.city}, ${info.provinceOrState}, ${info.postalOrZip}</p>
            <p>${info.countryLabel}</p>
            <p>Phone: ${info.phone}</p>
            ${methodLine}
        `;
        this.shippingSummary.hidden = false;
    }
    
	// ---- validation ----

    validateField(name) {
        switch (name) {
            case 'email': return this.validateEmail();
            case 'cardName': return this.validateCardName();
            case 'cardNumber': return this.validateCardNumber();
            case 'expiry': return this.validateExpiry();
            case 'cvv': return this.validateCVV();
			case 'billPhone': return this.validateBillingPhone();
            case 'billStAddress': return this.validateBillingStreetAddress();
            case 'billCity': return this.validateBillingCity();
            case 'billCountry': return this.validateBillingCountry();
            case 'billProvinceState': return this.validateBillingProvinceState();
            case 'billPostalZip': return this.validateBillingPostalZip();
            default: return true;
        }
    }

    validateEmail() {
        const val = this.fields.email.value.trim();
        if (!val) {
            return this.showError('email', 'Please enter your email address');
        }

        if (!isValidEmail(val)) {
            return this.showError('email', 'Please enter a valid email address');
        }

        return this.clearError('email');
    }

    validateCardName() {
        const val = this.fields.cardName.value.trim();
        if (!val) {
            return this.showError('cardName', 'Please enter the name on the card');
        }

        return this.clearError('cardName');
    }

    validateCardNumber() {
        const val = this.fields.cardNumber.value.trim();
        if (!val) {
            return this.showError('cardNumber', 'Please enter your card number');
        }

        if (!isValidCardNumber(val)) {
            return this.showError('cardNumber', 'Please enter a valid card number');
        }

        return this.clearError('cardNumber');
    }

    validateExpiry() {
        const val = this.fields.expiry.value.trim();
        if (!val) {
            return this.showError('expiry', 'Please enter the expiration date');
        }

        if (!isValidExpiry(val)) {
            return this.showError('expiry', 'Please enter a valid expiration date');
        }

        return this.clearError('expiry');
    }

    validateCVV() {
        const val = this.fields.cvv.value.trim();
        if (!/^\d{3,4}$/.test(val)) {
            return this.showError('cvv', 'Please enter a valid 3 or 4 digit CVV');
        }

        return this.clearError('cvv');
    }
    
    validateBillingPhone() {
        const val = this.fields.billPhone.value;
        if (!isValidPhone(val)) {
            return this.showError('billPhone', 'Enter a valid 10-digit phone number');
        }

        return this.clearError('phone');
    }

    validateBillingStreetAddress() {
        const val = this.fields.billStAddress.value.trim();
        if (!val) {
            return this.showError('billStAddress', 'Please enter your billing street address');
        }

        return this.clearError('billStAddress');
    }

    validateBillingCity() {
        const val = this.fields.billCity.value.trim();
        if (!val) {
            return this.showError('billCity', 'Please enter your billing city');
        }
        
        return this.clearError('billCity');
    }

    validateBillingCountry() {
        const val = this.fields.billCountry.value;
        if (!val) {
            return this.showError('billCountry', 'Please select your billing country');
        }

        return this.clearError('billCountry');
    }

    validateBillingProvinceState() {
        const val = this.fields.billProvinceState.value.trim();
        const country = this.fields.billCountry.value;

        if (!val) {
            const msg = getProvinceStateErrorLabel(country);
            return this.showError('billProvinceState', msg);
        }

        return this.clearError('billProvinceState');
    }

    validateBillingPostalZip() {
        const val = this.fields.billPostalZip.value.trim();
        const country = this.fields.billCountry.value;
        
        if (!val) {
            const msg = country === 'CA'
                ? 'Please enter a billing postal code'
                : country === 'US'
                    ? 'Please enter a billing zip code'
                    : 'Please enter a billing postal or zip code';
            return this.showError('billPostalZip', msg);
        }

        if (!isValidPostalCode(val, country)) {
            return this.showError('billPostalZip', country === 'CA' ? 'Invalid Canadian postal code' : country === 'US' ? 'Invalid US ZIP code' : 'Invalid postal or zip code');
        }

        return this.clearError('billPostalZip');
    }

    showError(field, message) {
        if (this.errors[field]) {
            this.errors[field].textContent = message;
        }

        if (this.fields[field]) {
            this.fields[field].setAttribute('aria-invalid', 'true');
        }

        return false;
    }

    clearError(field) {
        if (this.errors[field]) {
            this.errors[field].textContent = '';
        }

        if (this.fields[field]) {
            this.fields[field].removeAttribute('aria-invalid');
        }

        return true;
    }
}

export default PaymentForm;