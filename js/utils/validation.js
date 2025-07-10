// basic email format
export function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email.trim());
}

// north american phone numbers in common formats
export function isValidPhone(phone) {
    const pattern = /^(\(\d{3}\)|\d{3})[- ]?\d{3}[- ]?\d{4}$/;
    return pattern.test(phone.trim());
}

// postal or zip code by country (supports CA and US)
export function isValidPostalCode(value, country) {
    const trimmed = value.trim();
    const patterns = {
        CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
        US: /^\d{5}(-\d{4})?$/,
    };

    if (!patterns[country]) {
        return true;
    }

    return patterns[country].test(trimmed);
}

// error label for province/state field depending on country
export function getProvinceStateErrorLabel(country) {
    if (country === 'CA') {
        return 'Please select a province';
    }

    if (country === 'US') {
        return 'Please select a state';
    }

    return 'Please select province or state';
}

// card number with Luhn algorithm check
export function isValidCardNumber(val) {
  const digits = val.replace(/\D/g, ''); // strip non-digits

  // check length between 13 and 20 digits
  if (digits.length < 13 || digits.length > 20) {
    return false;
  }

  return luhnCheck(digits);
}

// Luhn algorithm to verify credit card number validity
function luhnCheck(digits) {
    let sum = 0;
    let shouldDouble = false;

    // process digits right-to-left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);

        if (shouldDouble) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// expiry date (MM/YY) and ensures card not expired
export function isValidExpiry(expiry) {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.trim())) {
        return false;
    }

    const [month, year] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    // expiry cannot be in the past
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }

    // prevent expiry more than 15 years in future (likely invalid)
    if (year > currentYear + 15) {
        return false;
    }

    return true;
}