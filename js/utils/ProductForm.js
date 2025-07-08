function initProductForm(productDiv, cart, maxQtyModal) {
    const colorSelect = productDiv.querySelector('select[name="color"]');
    const row = productDiv.closest('.row');
    const img = row.querySelector('.product-image');
    const baseAlt = img.getAttribute('alt');

    const form = productDiv.querySelector('.product-options');
    const qtyDisplay = form.querySelector('.form-qty-value');
    const btnDecrease = form.querySelector('.form-btn-qty[data-action="decrease"]');

    let quantity = 1;

    const updateQtyUI = () => {
        qtyDisplay.textContent = quantity;
        btnDecrease.disabled = quantity <= 1;
    };

    updateQtyUI();

    form.querySelectorAll('.form-btn-qty').forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            const action = button.dataset.action;

            if (action === 'increase') {
                if (quantity < 10) {
                    quantity++;
                } else {
                    maxQtyModal.open();
                }
            } else if (action === 'decrease' && quantity > 1) {
                quantity--;
            }

            updateQtyUI();
        });
    });

    const updateImage = () => {
        const color = colorSelect.value.trim().toLowerCase();
        const smallSrc = img.getAttribute(`data-image-${color}-small`);
        const largeSrc = img.getAttribute(`data-image-${color}-large`);

        if (smallSrc && largeSrc) {
            img.srcset = `${smallSrc} 600w, ${largeSrc} 800w`;
            img.src = largeSrc;
            img.alt = `${baseAlt} in ${color} color`;
        }
    };

    colorSelect.addEventListener('change', updateImage);
    updateImage();

    form.addEventListener('submit', e => {
        e.preventDefault();

        const id = productDiv.dataset.id;
        const name = productDiv.dataset.name;
        const price = parseFloat(productDiv.dataset.price);
        const size = form.querySelector('select[name="size"]').value;
        const color = form.querySelector('select[name="color"]').value;
        const notes = form.querySelector('textarea[name="notes"]').value.trim();
        const image = img.getAttribute(`data-image-${color.toLowerCase()}-small`);
        const tag = productDiv.dataset.tag;

        const product = {
            id,
            name,
            price,
            quantity,
            size,
            color,
            notes,
            image,
            sizes: JSON.parse(productDiv.dataset.sizes || '[]'),
            colors: JSON.parse(productDiv.dataset.colors || '[]'),
            tag
        };

        cart.addToCart(product);

        // clear notes
        form.querySelector('textarea[name="notes"]').value = '';
    });
}

export default initProductForm;