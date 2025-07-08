import { populateProvinceStateSelect } from '../utils/locationHelper.js';
import { getLabelsByCountry } from '../utils/location.js';
import { isValidPhone, isValidPostalCode, getProvinceStateErrorLabel } from '../utils/validation.js';

const shippingOptions = {
    CA: [
        { id: 'canadaPostStandard', value: 'canada_post_standard', label: 'Canada Post — Expedited Parcel — Free (2-7 business days)', fee: 0 },
        { id: 'canadaPostXpress', value: 'canada_post_xpress', label: 'Canada Post — Xpresspost — $14.99 (1-3 business days)', fee: 14.99 },
        { id: 'canadaPostPriority', value: 'canada_post_priority', label: 'Canada Post — Priority — $29.99 (Next business day)', fee: 29.99 }
    ],
    US: [
        { id: 'fedExGround', value: 'fedex_ground', label: 'FedEx Ground — Free (5-7 business days)', fee: 0 },
        { id: 'fedExExpress', value: 'fedex_express', label: 'FedEx Express — $9.99 (2-3 business days)', fee: 9.99 },
        { id: 'fedExOvernight', value: 'fedex_overnight', label: 'FedEx Overnight — $19.99 (Next business day)', fee: 19.99 }
    ]
};

class ShippingForm {
	constructor(shippingFormEl, shippingMethodFormEl, shippingSummaryEl) {
		this.shippingInfoForm = shippingFormEl;
		this.shippingMethodForm = shippingMethodFormEl;
		this.shippingSummary = shippingSummaryEl;
        
        this.deliveryNote = document.getElementById('deliveryNote');

		this.fields = {
			firstName: this.shippingInfoForm.querySelector('#firstName'),
			lastName: this.shippingInfoForm.querySelector('#lastName'),
			phone: this.shippingInfoForm.querySelector('#phone'),
			shipStAddress: this.shippingInfoForm.querySelector('#shipStAddress'),
			shipAddressDetails: this.shippingInfoForm.querySelector('#shipAddressDetails'),
			shipCity: this.shippingInfoForm.querySelector('#shipCity'),
			shipCountry: this.shippingInfoForm.querySelector('#shipCountry'),
			shipProvinceState: this.shippingInfoForm.querySelector('#shipProvinceState'),
			shipPostalZip: this.shippingInfoForm.querySelector('#shipPostalZip'),
		};

        this.labels = {
            provinceLabel: this.shippingInfoForm.querySelector('#shipProvinceStateLabel'),
            postalLabel: this.shippingInfoForm.querySelector('#shipPostalZipLabel')
        };

		this.errors = {
			firstName: this.shippingInfoForm.querySelector('#firstName-error'),
			lastName: this.shippingInfoForm.querySelector('#lastName-error'),
			phone: this.shippingInfoForm.querySelector('#phone-error'),
			shipStAddress: this.shippingInfoForm.querySelector('#shipStAddress-error'),
			shipCity: this.shippingInfoForm.querySelector('#shipCity-error'),
			shipCountry: this.shippingInfoForm.querySelector('#shipCountry-error'),
			shipProvinceState: this.shippingInfoForm.querySelector('#shipProvinceState-error'),
			shipPostalZip: this.shippingInfoForm.querySelector('#shipPostalZip-error'),
			shippingMethod: this.shippingMethodForm.querySelector('#shippingMethod-error'),
		};

		this.shippingMethodForm.style.display = 'none';
            
		this.setupListeners();

		this.updateShippingLabels();
        this.prefillShippingInfo();
        this.preselectShippingMethod();
        this.renderDeliveryOptions();

        // disable province/state if no initial country selected
        if (!this.fields.shipCountry.value) {
            this.fields.shipProvinceState.disabled = true;
        }
	}

    setupListeners() {
		Object.values(this.fields).forEach(field => {
			if (field && !(field.type === 'checkbox')) {
				field.addEventListener('blur', () => this.validateField(field.name));
				field.addEventListener('input', () => this.clearError(field.name));
			}
		});

        this.fields.shipCountry.addEventListener('change', () => this.handleShippingCountryChange());

		this.shippingInfoForm.addEventListener('submit', (e) => this.handleShippingInfoSubmit(e));
		this.shippingMethodForm.addEventListener('submit', (e) => this.handleShippingMethodSubmit(e));
    }

    handleShippingCountryChange() {
        this.updateShippingLabels();
        this.clearError('shipProvinceState');
        this.fields.shipProvinceState.value = '';

        this.fields.shipProvinceState.disabled = !this.fields.shipCountry.value;

        if (!this.fields.shipProvinceState.disabled) {
            this.fields.shipProvinceState.focus();
        }

        this.shippingMethodForm.style.display = 'none';

        const shippingDataRaw = sessionStorage.getItem('shippingData');
        if (shippingDataRaw) {
            try {
                const data = JSON.parse(shippingDataRaw);
                data.method = null;
                sessionStorage.setItem('shippingData', JSON.stringify(data));
            } catch (e) {
                console.error('Failed to reset shipping method:', e);
            }
        }

        if (this.deliveryNote) {
            this.deliveryNote.style.display = 'block';
        }
    }

    populateProvinceStateOptions() {
        const country = this.fields.shipCountry.value;
        const select = this.fields.shipProvinceState;

        populateProvinceStateSelect(select, country);
    }

	updateShippingLabels() {
        const country = this.fields.shipCountry.value;
        const labels = getLabelsByCountry(country);

        this.labels.provinceLabel.innerHTML = `${labels.province}<span aria-hidden="true">*</span>`;
        this.labels.postalLabel.innerHTML = `${labels.postal}<span aria-hidden="true">*</span>`;

        this.populateProvinceStateOptions();
    }

	handleShippingInfoSubmit(e) {
        e.preventDefault();

        const requiredFields = [
            'firstName', 'lastName', 'phone',
            'shipStAddress', 'shipCity',
            'shipCountry', 'shipProvinceState',
            'shipPostalZip'
        ];

        const isValid = requiredFields.every(name => this.validateField(name));

        if (!isValid) {
            this.shippingInfoForm.reportValidity();

            const firstInvalid = Object.values(this.fields).find(field => field.getAttribute('aria-invalid') === 'true');
            if (firstInvalid) {
                firstInvalid.focus();
            }

            return;
        }

        this.saveShippingInfo();
        this.showSummary();

        this.shippingInfoForm.style.display = 'none';
        this.shippingMethodForm.style.display = 'block';

        this.renderDeliveryOptions();

        if (this.deliveryNote) {
            this.deliveryNote.style.display = 'none';
        }

        this.preselectShippingMethod();

        if (this.editBtn) {
            this.editBtn.style.display = 'inline-block';
        }
    }


	saveShippingInfo() {
		const {
			firstName, lastName, phone,
			shipStAddress, shipAddressDetails,
			shipCity, shipCountry,
			shipProvinceState, shipPostalZip
		} = this.fields;

		const shippingData = {
			info: {
				firstName: firstName.value.trim(),
				lastName: lastName.value.trim(),
				phone: phone.value.trim(),
				streetAddress: shipStAddress.value.trim(),
				addressDetails: shipAddressDetails.value.trim(),
				city: shipCity.value.trim(),
				country: shipCountry.value,
				countryLabel: shipCountry.options[shipCountry.selectedIndex].text,
				provinceOrState: shipProvinceState.value.trim(),
				postalOrZip: shipPostalZip.value.trim(),
			},
			method: null // placeholder until method is selected
		};

		sessionStorage.setItem('shippingData', JSON.stringify(shippingData));
	}

	showSummary() {
        const data = JSON.parse(sessionStorage.getItem('shippingData'));
        if (!data || !data.info) {
            return;
        }

        const info = data.info;

        const summaryHtml = `
            <div class="summary-header">
                <h2 class="summary-heading">Shipping Summary</h2>
                <a href="#" id="editShippingInfoBtn" class="summary-edit-link" style="display: none">Edit</a>
            </div>

            <p><strong>${info.firstName} ${info.lastName}</strong></p>
            <p>${info.streetAddress}${info.addressDetails ? ', ' + info.addressDetails : ''}</p>
            <p>${info.city}, ${info.provinceOrState}, ${info.postalOrZip}</p>
            <p>${info.countryLabel}</p>
            <p>Phone: ${info.phone}</p>
        `;

        this.shippingSummary.innerHTML = summaryHtml;
        this.bindEditButton();
    }

    handleEditShippingInfo() {
        const dataRaw = sessionStorage.getItem('shippingData');
        if (dataRaw) {
            try {
                const data = JSON.parse(dataRaw);
                data.method = null;
                sessionStorage.setItem('shippingData', JSON.stringify(data));
            } catch {}
        }

        this.shippingInfoForm.style.display = 'block';
        this.shippingMethodForm.style.display = 'none';
        document.getElementById('editShippingInfoBtn').style.display = 'none';

        this.shippingSummary.innerHTML = '';

        if (this.deliveryNote) {
            this.deliveryNote.style.display = 'block';
        }
    }

    bindEditButton() {
        this.editBtn = document.getElementById('editShippingInfoBtn');
        if (this.editBtn) {
            this.editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditShippingInfo();
            });
            this.editBtn.style.display = 'inline-block';
        }
    }

	handleShippingMethodSubmit(e) {
		e.preventDefault();

		const selectedOption = this.shippingMethodForm.querySelector('input[name="shippingMethod"]:checked');
		if (!selectedOption) {
			this.errors.shippingMethod.textContent = 'Please select a shipping method';

			return;
		}

		this.errors.shippingMethod.textContent = '';

        const methodValue = selectedOption.value;
        const country = this.fields.shipCountry.value;
        const selectedOptionData = (shippingOptions[country] || []).find(opt => opt.value === methodValue);

		// update existing shippingData object
		const data = JSON.parse(sessionStorage.getItem('shippingData')) || {};
        data.method = selectedOptionData;
        sessionStorage.setItem('shippingData', JSON.stringify(data));

		// redirect to payment page
		window.location.href = 'payment.html';
	}

    prefillShippingInfo() {
        const stored = sessionStorage.getItem('shippingData');
        if (!stored) {
            return;
        }

        try {
            const data = JSON.parse(stored);
            if (!data.info) {
                return;
            }

            const info = data.info;

            this.fields.firstName.value = info.firstName || '';
            this.fields.lastName.value = info.lastName || '';
            this.fields.phone.value = info.phone || '';
            this.fields.shipStAddress.value = info.streetAddress || '';
            this.fields.shipAddressDetails.value = info.addressDetails || '';
            this.fields.shipCity.value = info.city || '';
            this.fields.shipCountry.value = info.country || '';

            this.updateShippingLabels();
            setTimeout(() => {
                this.fields.shipProvinceState.value = info.provinceOrState || '';
            }, 0);

            this.fields.shipPostalZip.value = info.postalOrZip || '';

            if (this.hasValidShippingInfo()) {
                this.shippingInfoForm.style.display = 'none';
                this.shippingMethodForm.style.display = 'block';
                this.showSummary();
            }

        } catch (e) {
            console.error('Failed to parse shipping data from sessionStorage.', e);
            sessionStorage.removeItem('shippingData');
        }
    }

    preselectShippingMethod() {
        const data = JSON.parse(sessionStorage.getItem('shippingData'));
        if (!data || !data.method) {
            return;
        }

        const method = data.method;
        const radio = this.shippingMethodForm.querySelector(`input[name="shippingMethod"][value="${method}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    renderDeliveryOptions() {
        const country = this.fields.shipCountry.value;
        const options = shippingOptions[country] || [];
        const optionsWrapper = this.shippingMethodForm.querySelector('#shippingOptionsWrapper');

        optionsWrapper.innerHTML = '';

        const shippingDataRaw = sessionStorage.getItem('shippingData');
        if (!shippingDataRaw) {
            this.shippingMethodForm.style.display = 'none';
            if (this.deliveryNote) {
                this.deliveryNote.style.display = 'block';
            }
            return;
        }

        let shippingData;
        try {
            shippingData = JSON.parse(shippingDataRaw);
        } catch {
            this.shippingMethodForm.style.display = 'none';
            if (this.deliveryNote) {
                this.deliveryNote.style.display = 'block';
            }
            return;
        }

        if (!shippingData.info || !shippingData.info.country) {
            this.shippingMethodForm.style.display = 'none';
            if (this.deliveryNote) {
                this.deliveryNote.style.display = 'block';
            }
            return;
        }

        // no shipping options for this country, hide options
        if (options.length === 0) {
            this.shippingMethodForm.style.display = 'none';
            if (this.deliveryNote) {
                this.deliveryNote.style.display = 'block';
            }
            return;
        }

        this.shippingMethodForm.style.display = 'block';
        if (this.deliveryNote) {
            this.deliveryNote.style.display = 'none';
        }

        const optionElements = options.map(({ id, value, label }) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('form-check');

            const input = document.createElement('input');
            input.type = 'radio';
            input.id = id;
            input.classList.add('form-check-input');
            input.name = 'shippingMethod';
            input.value = value;
            input.required = true;

            const lbl = document.createElement('label');
            lbl.setAttribute('for', id);
            lbl.classList.add('form-check-label');
            lbl.textContent = label;

            wrapper.appendChild(input);
            wrapper.appendChild(lbl);

            return wrapper;
        });

        optionsWrapper.append(...optionElements);


        this.preselectShippingMethod();
    }

    hasValidShippingInfo() {
        try {
            const data = JSON.parse(sessionStorage.getItem('shippingData'));
            if (!data || !data.info) {
                return false;
            }

            const info = data.info;

            return ['firstName', 'lastName', 'phone', 'streetAddress', 'city', 'country', 'provinceOrState', 'postalOrZip']
                .every(field => info[field]?.trim?.() !== '');
        } catch {
            return false;
        }
    }
    
	// ---- validation ----

	validateField(name) {
		switch (name) {
			case 'firstName': return this.validateFirstName();
			case 'lastName': return this.validateLastName();
			case 'phone': return this.validatePhone();
			case 'shipStAddress': return this.validateShippingStreetAddress();
			case 'shipCity': return this.validateShippingCity();
			case 'shipCountry': return this.validateShippingCountry();
			case 'shipProvinceState': return this.validateShippingProvinceState();
			case 'shipPostalZip': return this.validateShippingPostalZip();
			default: return true;
		}
	}

	validateFirstName() {
		const val = this.fields.firstName.value.trim();
		if (!val) {
            return this.showError('firstName', 'Please enter your first name');
        }

		return true;
	}

	validateLastName() {
		const val = this.fields.lastName.value.trim();
		if (!val) {
            return this.showError('lastName', 'Please enter your last name');
        }

		return true;
	}

	validatePhone() {
        const val = this.fields.phone.value;
        if (!isValidPhone(val)) {
            return this.showError('phone', 'Enter a valid 10-digit phone number');
        }

        return true;
    }

	validateShippingStreetAddress() {
		const val = this.fields.shipStAddress.value.trim();
		if (!val) {
            return this.showError('shipStAddress', 'Please enter your address');
        }

		return true;
	}

	validateShippingCity() {
		const val = this.fields.shipCity.value.trim();
		if (!val) {
            return this.showError('shipCity', 'Please enter your city');
        }

		return true;
	}

	validateShippingCountry() {
		if (!this.fields.shipCountry.value) {
            return this.showError('shipCountry', 'Please select a country');
        }
        
		return true;
	}

	validateShippingProvinceState() {
        const val = this.fields.shipProvinceState.value.trim();
        const country = this.fields.shipCountry.value;

        if (!val) {
            return this.showError('shipProvinceState', getProvinceStateErrorLabel(country));
        }

        return true;
    }

	validateShippingPostalZip() {
        const val = this.fields.shipPostalZip.value;
        const country = this.fields.shipCountry.value;

        if (!val) {
            const msg = country === 'CA'
                ? 'Please enter postal code'
                : country === 'US'
                    ? 'Please enter zip code'
                    : 'Please enter postal or zip code';
            return this.showError('shipPostalZip', msg);
        }

        if (!isValidPostalCode(val, country)) {
            const msg = country === 'CA' ? 'Invalid Canadian postal code' : 'Invalid US ZIP code';
            return this.showError('shipPostalZip', msg);
        }

        return true;
    }

	showError(field, message) {
		this.errors[field].textContent = message;
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
	}
}

export default ShippingForm;