import ProductList from '../classes/ProductList.js';

document.addEventListener('DOMContentLoaded', () => {
	const block = document.querySelector('#productList');

	if (!block) {
		console.error('Product list block not found');
		return;
	}
	const list = new ProductList(block, { perPage: 9 });

	list.init('/js/data/products.json').then(() => {
		console.log('Products loaded and rendered');
	}).catch(err => {
		console.error('Error initializing product list:', err);
	});

	window.addEventListener('popstate', () => {
		const urlParams = new URLSearchParams(window.location.search);
		const pageParam = parseInt(urlParams.get('page')) || 1;

		list.currentPage = pageParam;
		list.render();
		list.renderPagination();
	});
});