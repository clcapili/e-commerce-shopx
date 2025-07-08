import Products from './Products.js';

class ProductSingle extends Products {
	async init(productId, jsonPath) {
		this.product = await this.fetchProductById(jsonPath, productId);
		this.render();
	}

	render() {
		if (!this.product) return;

		const { id, name, price, description, images, alt, sizes, colors, tag } = this.product;
		const firstColor = colors[0].toLowerCase();

		document.title = `shopx — ${name}`;

		// breadcrumb
		const currentBreadcrumb = document.querySelector('.breadcrumb-current span[itemprop="name"]');
		if (currentBreadcrumb) {
			currentBreadcrumb.textContent = name;
		}

		// product
		this.element.querySelector('h2.product-title').textContent = name;
		this.element.querySelector('.product-price').textContent = `$${price.toFixed(2)}`;
		this.element.querySelector('.product-description').textContent = description;

		const imageEl = this.element.querySelector('.product-image');
		imageEl.src = images[firstColor].large;
		imageEl.alt = alt;
		imageEl.srcset = `
			${images[firstColor].medium} 600w,
			${images[firstColor].large} 800w
		`;

		// image data attributes for all colors
		colors.forEach(color => {
			const lc = color.toLowerCase();
			imageEl.setAttribute(`data-image-${lc}-small`, images[lc].medium);
			imageEl.setAttribute(`data-image-${lc}-large`, images[lc].large);
		});

		// required attributes for cart
		const productDiv = this.element.querySelector('.product');
		if (productDiv) {
			productDiv.setAttribute('data-id', id);
			productDiv.setAttribute('data-name', name);
			productDiv.setAttribute('data-price', price);
			productDiv.setAttribute('data-sizes', JSON.stringify(sizes));
			productDiv.setAttribute('data-colors', JSON.stringify(colors));
			productDiv.setAttribute('data-tag', tag);
		}

		this.populateSelect('#size', sizes, true);
		this.populateSelect('#color', colors, false);
  	}

	populateSelect(selector, values, isSize) {
		const select = this.element.querySelector(selector);

		select.innerHTML = `<option value="" disabled selected>Select ${isSize ? 'size' : 'color'}</option>`;

		values.forEach(val => {
			select.innerHTML += `<option value="${val.toLowerCase()}">${val}</option>`;
		});
	}
}

export default ProductSingle;