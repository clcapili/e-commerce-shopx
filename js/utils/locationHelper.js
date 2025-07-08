import { getLabelsByCountry, getProvincesOrStatesByCountry } from './location.js';

export function populateProvinceStateSelect(selectElement, countryCode) {
    selectElement.innerHTML = '';

    const options = getProvincesOrStatesByCountry(countryCode);

    if (!countryCode || options.length === 0) {
        selectElement.disabled = true;
        selectElement.innerHTML = `<option value="" disabled selected>Select Province/State</option>`;
        return;
    }

    selectElement.disabled = false;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Select ${getLabelsByCountry(countryCode).province}`;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    options.forEach(({ code, name }) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        selectElement.appendChild(option);
    });
}