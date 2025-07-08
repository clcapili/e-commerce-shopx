function renderRelatedProducts(block, products) {
    block.innerHTML = '';

    products.forEach(product => {
        const { id, name, price, images, alt, colors } = product;
        const firstColor = colors[0].toLowerCase();
        const img = images[firstColor];

        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <article class="card">
                <img srcset="${img.small} 400w, ${img.medium} 600w"
                    sizes="(min-width: 992px) 400px, (min-width: 768px) 600px, 100vw"
                    src="${img.medium}" alt="${alt}" class="img-fluid" loading="lazy"
                />

                <div class="card-content">
                    <h3>${name}</h3>
                    <h4 class="card-price">$${price.toFixed(2)}</h4>
                    <a href="product-single.html?id=${id}" class="card-link" aria-label="Read more about ${name}">View Product</a>
                </div>
            </article>
        `;
        
        block.appendChild(card);
    });
}

export default renderRelatedProducts;