class Products {
	constructor(element) {
		this.element = element;
		this.product = null;
	}

	// get a single product by ID
	async fetchProductById(jsonPath, id) {
		const res = await fetch(jsonPath);
		const allProducts = await res.json();
		return Object.values(allProducts).find(p => p.id === id.toString());
	}

	// get all products
	async fetchAllProducts(jsonPath) {
    	const res = await fetch(jsonPath);

    	const data = await res.json();
    	this.products = Object.values(data);
    	return this.products;
  	}

	render() {
		throw new Error('Subclasses must implement render()');
	}
}

export default Products;