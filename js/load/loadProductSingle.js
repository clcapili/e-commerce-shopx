import ProductSingle from '../classes/ProductSingle.js';

document.addEventListener('DOMContentLoaded', () => {
	const block = document.querySelector('#productSingle');

	if (!block) {
		console.error('Product element not found');
		return;
	}

	const params = new URLSearchParams(window.location.search);
	const id = params.get('id');

	if (!id) {
		console.warn('No product id found in URL');
		return;
	}

	const product = new ProductSingle(block);
	
	product.init(id, '/js/data/products.json')
	.then(() => console.log('Product loaded and rendered'))
	.catch(err => console.error('Error loading product:', err));
});