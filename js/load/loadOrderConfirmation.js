import OrderConfirmation from '../classes/OrderConfirmation.js';

document.addEventListener('DOMContentLoaded', () => {
    const block = document.getElementById('confirmationContent');

    if (block) {
        new OrderConfirmation(block);
    }
});