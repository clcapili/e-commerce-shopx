import Products from '../classes/Products.js';
import Cart from '../classes/Cart.js';
import Modal from '../classes/Modal.js';
import initProductForm from '../utils/ProductForm.js';
import renderRelatedProducts from '../utils/renderRelatedProducts.js';

document.addEventListener('DOMContentLoaded', () => {
    // cart
    const cart = new Cart();

    // edit form modal
    const editModal = new Modal({
        modalId: 'editModal',
        onOpen: (index) => {
            const item = cart.getCart()[index];
            const form = document.getElementById('editForm');
            form.dataset.index = index;

            const sizeSelect = form.querySelector('select[name="edit-size"]');
            sizeSelect.innerHTML = item.sizes.map(size => {
                const val = size[0].toLowerCase();
                return `<option value="${val}">${size}</option>`;
            }).join('');
            sizeSelect.value = item.size;

            const colorSelect = form.querySelector('select[name="edit-color"]');
            colorSelect.innerHTML = item.colors.map(color => {
                const val = color.toLowerCase();
                return `<option value="${val}">${color.charAt(0).toUpperCase() + color.slice(1)}</option>`;
            }).join('');
            colorSelect.value = item.color;

            form.querySelector('textarea[name="edit-notes"]').value = item.notes || '';

            const previewImage = document.getElementById('editPreviewImage');
            const updatePreviewImage = () => {
                const selectedColor = colorSelect.value;
                const updatedImage = item.image.replace(/_(.*?)@/, `_${selectedColor}@`);
                previewImage.src = updatedImage;
                previewImage.alt = `${item.name} in ${selectedColor} color`;
                previewImage.classList.add('img-fluid');
            };
            colorSelect.addEventListener('change', updatePreviewImage);
            updatePreviewImage();

            // char counter
            initCharCounters();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    sizeSelect.focus();
                });
            });
        },

        onSubmit: (e, modalEl) => {
            const form = modalEl.querySelector('form');
            const index = parseInt(form.dataset.index, 10);
            const cartData = cart.getCart();
            const item = cartData[index];

            const updatedItem = {
                ...item,
                size: form.querySelector('select[name="edit-size"]').value,
                color: form.querySelector('select[name="edit-color"]').value,
                notes: form.querySelector('textarea[name="edit-notes"]').value.trim()
            };

            cart.updateItem(index, updatedItem);
            cart.render();
            editModal.close();
        }
    });

    cart.onEditClick = (index) => editModal.open(index);

    // added to cart modal
    const addedToCartModal = new Modal({
        modalId: 'addedToCartModal',
        onOpen: (product) => {
            if (!product) {
                return;
            }

            const addedQtyEl = document.getElementById('addedQty');
            const addedImageEl = document.getElementById('addedProductImage');
            const addedNameEl = document.getElementById('addedProductName');
            const addedSizeEl = document.getElementById('addedProductSize');
            const addedColorEl = document.getElementById('addedProductColor');

            addedQtyEl.textContent = product.quantity;
            addedNameEl.textContent = product.name;
            addedSizeEl.textContent = product.size;
            addedColorEl.textContent = product.color;
            addedImageEl.src = product.image;
            addedImageEl.alt = `${product.name} in ${product.color} color`;
        }
    });

    // override cart's addToCart to open modal
    const originalAddToCart = cart.addToCart.bind(cart);
    cart.addToCart = async (product) => {
        originalAddToCart(product);

        // fetch all products
        const helper = new Products(document.createElement('div'));
        const allProducts = await helper.fetchAllProducts('/js/data/products.json');

        // filter by tag
        const relatedProducts = allProducts
            .filter(p =>
                p.id !== product.id &&
                p.tag && product.tag &&
                p.tag === product.tag
            )
            .slice(0, 3);
        
        // elements
        const oldWrapper = document.getElementById('relatedWrapper');
        if (oldWrapper) {
            oldWrapper.remove();
        }

        if (relatedProducts.length > 0) {
            const modalBody = document.querySelector('#addedToCartModal .modal-body');
            const wrapper = document.createElement('div');
            wrapper.id = 'relatedProductsWrapper';
            wrapper.className = 'related-products-wrapper';
            wrapper.innerHTML = `
                <h2 class="related-products-heading">You may also like</h2>
                <div class="row three-col" id="relatedProducts"></div>
            `;

            modalBody.appendChild(wrapper);

            const block = wrapper.querySelector('#relatedProducts');
            renderRelatedProducts(block, relatedProducts);
        }

        addedToCartModal.open(product);
    };

    // remove from cart modal
    const removeFromCartModal = new Modal({
        modalId: 'removeFromCartModal',
        onOpen: (index) => {
            const confirmBtn = document.querySelector('#removeFromCartModal .modal-remove');
            confirmBtn.dataset.index = index;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    confirmBtn.focus();
                });
            });
        }
    });

    const removeBtn = document.querySelector('#removeFromCartModal .modal-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const index = parseInt(removeBtn.dataset.index, 10);
            cart.removeFromCart(index);
            removeFromCartModal.close();
        });

        cart.onRemoveClick = (index) => {
            removeFromCartModal.open(index);
        };
    }

    // max quantity modal
    const maxQtyModal = new Modal({
        modalId: 'maxQtyModal',
        onOpen: () => {
            const closeBtn = document.querySelector('#maxQtyModal .modal-close');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    closeBtn?.focus();
                });
            });
        }
    });

    cart.onMaxQuantityReached = () => {
        maxQtyModal.open();
    };

    // init product form
    document.querySelectorAll('.product').forEach(productDiv => {
        initProductForm(productDiv, cart, maxQtyModal);
    });

    // init char counter
    window.initCharCounters();
});