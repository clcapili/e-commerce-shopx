class Cart {
    constructor() {
        this.cartCountEl = document.querySelector('.cart-count');
        this.tbody = document.getElementById('cartItems');
        this.thead = document.getElementById('cartThead');
        this.maxQuantity = 10;

        if (this.tbody) {
            this.tbody.addEventListener('click', this.handleClick.bind(this));
        }

        this.render();
        this.updateCartCount();
    }

    getCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    }

    saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    updateCartCount() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (this.cartCountEl) {
            this.cartCountEl.textContent = totalItems;
            this.cartCountEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }

    addToCart(product) {
        const cart = this.getCart();
        const existingItem = cart.find(item =>
            item.id === product.id &&
            item.size === product.size &&
            item.color === product.color &&
            item.notes === product.notes
        );

        if (existingItem) {
            existingItem.quantity = Math.min(existingItem.quantity + product.quantity, this.maxQuantity);
        } else {
            product.quantity = Math.min(product.quantity, this.maxQuantity);
            cart.push(product);
        }

        this.saveCart(cart);
        this.render();
        this.updateCartCount();

        // notify others cart changed
        document.dispatchEvent(new Event('cartUpdated'));
    }

    removeFromCart(index) {
        const cart = this.getCart();

        cart.splice(index, 1);
        this.saveCart(cart);
        this.render();
        this.updateCartCount();

        // notify others cart changed
        document.dispatchEvent(new Event('cartUpdated'));
    }

    updateQuantity(index, action) {
        const cart = this.getCart();
        const item = cart[index];

        if (!item) {
            return;
        }

        if (action === 'increase') {
            if (item.quantity < this.maxQuantity) {
                item.quantity++;
            } else {
                if (typeof this.onMaxQuantityReached === 'function') {
                    this.onMaxQuantityReached(item);
                }
            }
        } else if (action === 'decrease' && item.quantity > 1) {
            item.quantity--;
        }

        this.saveCart(cart);
        this.render();
        this.updateCartCount();

        // notify others cart changed
        document.dispatchEvent(new Event('cartUpdated'));
    }

    updateItem(index, updatedItem) {
        const cart = this.getCart();

        const matchingIndex = cart.findIndex((item, i) =>
            i !== index &&
            item.id === updatedItem.id &&
            item.size === updatedItem.size &&
            item.color === updatedItem.color &&
            item.notes === updatedItem.notes
        );

        if (matchingIndex !== -1) {
            cart[matchingIndex].quantity += cart[index].quantity;
            
            cart.splice(index, 1);
        } else {
            cart[index] = updatedItem;
        }

        this.saveCart(cart);
        this.render();
        this.updateCartCount();

        // notify others cart changed
        document.dispatchEvent(new Event('cartUpdated'));
    }

    render() {
        const cart = this.getCart();

        if (!this.tbody) {
            return;
        }

        this.tbody.innerHTML = '';

        if (cart.length === 0) {
            if (this.thead) this.thead.style.display = 'none';

            this.tbody.innerHTML = `
                <tr class="cart-empty">
                    <td colspan="7">Your cart is empty.</td>
                </tr>
            `;

            this.updateCartCount();

            return;
        }

        if (this.thead) this.thead.style.display = '';

        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const updatedImage = item.image ? item.image.replace(/_(.*?)@/, `_${item.color.toLowerCase()}@`) : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="td-btn-remove">
                    <button class="btn-remove" aria-label="Remove ${item.name} from cart" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span class="visually-hidden">Remove</span>
                    </button>
                </td>

                <td colspan="3">
                    <div class="cart-product">
                        <a href="/product-single.html?id=${item.id}">
                            <img src="${updatedImage}" alt="${item.name} in ${item.color} color" loading="lazy" />
                        </a>

                        <div>
                            <a href="/product-single.html?id=${item.id}" class="product-name">${item.name}</a>
                            <p class="product-attribute">Size: <span>${item.size}</span></p>
                            <p class="product-attribute">Color: <span>${item.color}</span></p>
                            ${item.notes ? `<p class="product-attribute notes">Notes: ${item.notes}</p>` : ''}
                        </div>
                    </div>
                </td>

                <td>
                    <div class="quantity-control" role="group" aria-label="Quantity for ${item.name}">
                        <button class="cart-btn-qty" data-action="decrease" data-index="${index}" aria-label="Decrease quantity" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="qty-value" aria-live="polite" aria-atomic="true">${item.quantity}</span>
                        <button class="cart-btn-qty" data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
                    </div>
                </td>

                <td data-label="Price"><span aria-label="Price per item">$${item.price.toFixed(2)}</span></td>
                <td data-label="Subtotal"><span aria-label="Subtotal for ${item.name}">$${itemTotal.toFixed(2)}</span></td>

                <td class="td-btn-edit">
                    <button class="btn-edit" data-index="${index}" aria-label="Edit ${item.name}">
                        <span>Edit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                </td>
            `;

            this.tbody.appendChild(row);
        });

        const summaryRows = `
            <tr class="cart-summary-tr">
                <td colspan="8" style="text-align: right;">
                    <div class="summary">
                        <div class="total">
                            <h3 class="text">Item(s) subtotal:</h3>
                            <h3 class="text">$${subtotal.toFixed(2)}</h3>
                        </div>

                        <div class="total">
                            <p class="summary-note">*Before taxes</p>
                        </div>
                    </div>
                </td>
            </tr>

            <tr class="cart-summary-tr">
                <td colspan="8" style="text-align: right;">
                    <div class="summary checkout">
                        <div class="total">
                            <a href="/shipping.html" class="btn">Proceed to Checkout</a>
                            <a href="/index.html" class="btn-outline">Continue Shopping</a>
                        </div>
                    </div>
                </td>
            </tr>
        `;

        this.tbody.insertAdjacentHTML('beforeend', summaryRows);
    }

    handleClick(e) {
        const removeBtn = e.target.closest('.btn-remove');
        const qtyBtn = e.target.closest('.cart-btn-qty');
        const editBtn = e.target.closest('.btn-edit');

        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);

            if (typeof this.onRemoveClick === 'function') {
                this.onRemoveClick(index);
            }
        } else if (qtyBtn) {
            const action = qtyBtn.dataset.action;
            const index = parseInt(qtyBtn.dataset.index, 10);

            this.updateQuantity(index, action);
        } else if (editBtn) {
            e.stopPropagation();
            const index = parseInt(editBtn.dataset.index, 10);

            if (this.onEditClick) {
                this.onEditClick(index);
            }
        }
    }
}

export default Cart;