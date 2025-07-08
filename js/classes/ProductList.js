import Products from './Products.js';

class ProductList extends Products {
	constructor(element, options = {}) {
		super();
		this.element = element;
		this.products = [];

		this.paginationWrapper = document.querySelector('.pagination-wrapper');
		this.currentPage = 1;
		this.perPage = options.perPage || 9;

		this.message = document.querySelector('.message');
		this.loader = document.getElementById('loader');
	}

	async init(jsonPath) {
		this.loader.hidden = false;
		this.element.style.display = 'none';

		// url params
		const url = new URL(window.location.href);
		const urlParams = url.searchParams;
		let pageParam = parseInt(urlParams.get('page'));

		if (!pageParam || pageParam < 1) {
			pageParam = 1;
			url.searchParams.set('page', '1');
			history.replaceState({}, '', url);
		}

		try {
			this.products = await this.fetchAllProducts(jsonPath);
			this.currentPage = pageParam;
			this.render();
			this.renderPagination();
			this.paginationEvents();
		} catch (error) {
			console.error('Error loading products:', error);
			this.setMessage('Failed to load products.');
		} finally {
			this.loader.hidden = true;
			this.element.style.display = '';
		}
	}

	render() {
		this.element.innerHTML = '';

		const start = (this.currentPage - 1) * this.perPage;
		const end = start + this.perPage;
		const productsToRender = this.products.slice(start, end);

		// show "no products" message
		if (this.products.length === 0) {
			this.setMessage('No products found.');

			if (this.paginationWrapper) {
				this.paginationWrapper.innerHTML = '';
			}

			return;
		} else {
			this.setMessage('');
		}

		productsToRender.forEach(product => {
			const { id, name, description, price, images, alt } = product;
			const firstColor = product.colors[0].toLowerCase();
			const img = images[firstColor];

			const card = document.createElement('div');
			card.className = 'col';
			card.innerHTML = `
				<article class="card" aria-labelledby="card-title-${id}">
					<img srcset="${img.small} 400w, ${img.medium} 600w"
						sizes="(min-width: 992px) 400px,
							   (min-width: 768px) 600px,
							   100vw"
						src="${img.medium}" alt="${alt}" class="img-fluid" loading="lazy"
					/>

					<div class="card-content">
						<h2 id="card-title-${id}" class="card-title">${name}</h2>
						<h3 class="card-price" aria-label="Price: $${price.toFixed(2)}">$${price.toFixed(2)}</h3>
						<p class="card-description">${description}</p>
						<a href="product-single.html?id=${id}" class="btn-outline" aria-label="Read more about ${name}">View Product</a>
					</div>
				</article>
			`;
			this.element.appendChild(card);
		});
	}

	renderPagination() {
		if (!this.paginationWrapper) {
			return;
		}

		const totalPages = Math.ceil(this.products.length / this.perPage);
		if (totalPages <= 1) {
			this.paginationWrapper.innerHTML = '';
			return;
		}

		let html = `
			<nav aria-label="Product Pagination">
				<ul class="pagination">
					<li class="page-item page-prev ${this.currentPage === 1 ? 'disabled' : ''}">
						<a class="page-link" href="#" data-page="${this.currentPage - 1}">
							<span class="icon" aria-hidden="true">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
								</svg>
							</span>

							<span class="text">Previous</span>
						</a>
					</li>
		`;

		// page range with ellipsis
		const range = [];
		const { currentPage } = this;

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				range.push(i);
			}
		} else {
			if (currentPage <= 4) {
				range.push(1, 2, 3, 4, 5, '...', totalPages);
			} else if (currentPage >= totalPages - 3) {
				range.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
			} else {
				range.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
			}
		}

		range.forEach((page) => {
			if (page === '...') {
				html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
			} else if (page === currentPage) {
				html += `
					<li class="page-item active" aria-current="page">
						<span class="page-link">${page}</span>
					</li>
				`;
			} else {
				html += `
					<li class="page-item">
						<a class="page-link" href="#" data-page="${page}">${page}</a>
					</li>
				`;
			}
		});


		html += `
					<li class="page-item page-next ${this.currentPage === totalPages ? 'disabled' : ''}">
						<a class="page-link" href="#" data-page="${this.currentPage + 1}">
							<span class="text">Next</span>

							<span class="icon" aria-hidden="true">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
								</svg>
							</span>
						</a>
					</li>
				</ul>
			</nav>
		`;

		this.paginationWrapper.innerHTML = html;
	}

	paginationEvents() {
		if (!this.paginationWrapper) {
			return;
		}

		this.element.setAttribute('tabindex', '-1');

		this.paginationWrapper.addEventListener('click', (e) => {
			const target = e.target.closest('a[data-page]');
			if (!target) {
				return;
			}

			e.preventDefault();
			const page = parseInt(target.dataset.page);
			const totalPages = Math.ceil(this.products.length / this.perPage);

			if (page >= 1 && page <= totalPages) {
				this.currentPage = page;

				const url = new URL(window.location.href);
				url.searchParams.set('page', page);
				history.pushState({}, '', url);

				// smooth scroll
				if ('scrollBehavior' in document.documentElement.style) {
					this.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} else {
					this.element.scrollIntoView();
				}

				setTimeout(() => {
					this.paginationWrapper.style.display = 'none';
					this.loader.hidden = false;
					this.element.style.display = 'none';

					setTimeout(() => {
						this.render();
						this.renderPagination();
						this.loader.hidden = true;
						this.element.style.display = '';
						this.paginationWrapper.style.display = '';

						// set focus to product container
						this.element.focus();
					}, 300);
				}, 700);
			}
		});
	}

	setMessage(message) {
		if (!this.message) return;

		if (message) {
			this.message.innerHTML = `<h2 class="message-text">${message}</h2>`;
			this.message.style.display = '';
		} else {
			this.message.innerHTML = '';
			this.message.style.display = 'none';
		}
	}

}

export default ProductList;