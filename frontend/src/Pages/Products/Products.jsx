import { useEffect, useState } from "react";
import {
  getProducts,
  getProductsPaginated,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";
import "./Products.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [productSearch, setProductSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const categoryOptions = ['Grains', 'Pulses', 'Spices', 'Oils', 'Sugars', 'Dairy', 'Beverages', 'Other'];
  const unitOptions = ['kg', 'litre', 'gram', 'ml', 'piece', 'packet', 'box', 'can'];

  const getBaseFilters = () => ({
    category: selectedCategory === "All" ? "" : selectedCategory,
    search: productSearch.trim(),
  });

  const getActiveFilters = () => ({
    ...getBaseFilters(),
    page: currentPage,
    limit: pageSize,
  });

  const fetchProducts = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");
      const data = await getProductsPaginated(filters);

      if (Array.isArray(data)) {
        if (data.length > pageSize) {
          const total = data.length;
          const fallbackTotalPages = Math.max(1, Math.ceil(total / pageSize));
          const safePage = Math.min(currentPage, fallbackTotalPages);
          const startIndex = (safePage - 1) * pageSize;
          const pagedProducts = data.slice(startIndex, startIndex + pageSize);

          setProducts(pagedProducts);
          setTotalProducts(total);
          setTotalPages(fallbackTotalPages);
          setHasNextPage(safePage < fallbackTotalPages);

          if (safePage !== currentPage) {
            setCurrentPage(safePage);
          }

          return;
        }
        setProducts(data);
        setTotalProducts((currentPage - 1) * pageSize + data.length);
        setTotalPages(Math.max(1, currentPage));
        setHasNextPage(data.length === pageSize);

        return;
      }

      const pagedProducts = Array.isArray(data.products) ? data.products : [];
      const pagination = data.pagination || {};
      const resolvedTotal = Number.isFinite(pagination.total)
        ? pagination.total
        : (currentPage - 1) * pageSize + pagedProducts.length;
      const resolvedTotalPages = Number.isFinite(pagination.totalPages)
        ? Math.max(1, pagination.totalPages)
        : Math.max(1, Math.ceil(resolvedTotal / pageSize));

      setProducts(pagedProducts);
      setTotalProducts(resolvedTotal);
      setTotalPages(resolvedTotalPages);
      setHasNextPage(Number.isFinite(pagination.totalPages)
        ? currentPage < pagination.totalPages
        : pagedProducts.length === pageSize);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, productSearch]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchProducts(getActiveFilters());
    }, 250);

    return () => clearTimeout(timerId);
  }, [selectedCategory, productSearch, currentPage]);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await addProduct({
        name,
        category,
        price: Number(price),
        purchasePrice: Number(purchasePrice),
        quantity: Number(quantity),
        unit,
      });

      resetForm();
      setShowProductModal(false);
      fetchProducts(getActiveFilters());

    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product");
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price?.toString() || "");
    setPurchasePrice(product.purchasePrice?.toString() || "");
    setQuantity(product.quantity?.toString() || "");
    setUnit(product.unit);
    setShowProductModal(true);
  };


  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await updateProduct(editingId, {
        name,
        category,
        price: Number(price),
        purchasePrice: Number(purchasePrice),
        quantity: Number(quantity),
        unit,
      });

      resetForm();
      setShowProductModal(false);
      fetchProducts(getActiveFilters());

    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);

      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchProducts(getActiveFilters());
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("");
    setPrice("");
    setPurchasePrice("");
    setQuantity("");
    setUnit("");
  };

  const openAddModal = () => {
    resetForm();
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    resetForm();
  };

  const downloadExcel = async () => {
    try {
      setError("");
      const allFilteredProducts = await getProducts(getBaseFilters());

      if (!Array.isArray(allFilteredProducts) || allFilteredProducts.length === 0) {
        alert("No products available");
        return;
      }

      const data = allFilteredProducts.map((p) => ({
        Name: p.name,
        Category: p.category,
        "Selling Price": p.price,
        "Cost Price": p.purchasePrice,
        Quantity: p.quantity,
        Unit: p.unit,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, "products.xlsx");
    } catch (error) {
      console.error("Error exporting products:", error);
      setError("Failed to export products");
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage || currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getStockClass = (qty) => {
    if (qty <= 5) {
      return "products-stock-critical";
    }
    if (qty <= 15) {
      return "products-stock-low";
    }
    return "products-stock-good";
  };


  return (
    <div className="products-page">
      <div className="products-header">
        <div>
          <h2 className="products-title">Products</h2>
          <p className="products-description">
            Add, update, and monitor stock items with consistent pricing and quantity tracking.
          </p>
        </div>

        <div className="products-header-actions">
          <button
            onClick={downloadExcel}
            type="button"
            className="products-export-btn"
            disabled={loading || products.length === 0}
          >
            Export Excel
          </button>

          <button
            type="button"
            className="products-primary-btn"
            onClick={openAddModal}
            disabled={loading}
          >
            Add Product
          </button>
        </div>
      </div>

      {error && <p className="products-feedback products-feedback-error">{error}</p>}
      {loading && <p className="products-feedback products-feedback-loading">Loading...</p>}

      <section className="products-section products-list-section">
        <h3 className="products-section-title">Inventory List</h3>

        <div className="products-list-toolbar">
          <div className="products-category-chips">
            <button
              type="button"
              className={`products-category-chip ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => setSelectedCategory("All")}
            >
              All
            </button>

            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`products-category-chip ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="products-search-input"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>

        <div className="products-table-wrap">
          <div className="products-table-head">
            <span>Product</span>
            <span>Category</span>
            <span>Selling Price</span>
            <span>Cost Price</span>
            <span>Stock</span>
            <span>Actions</span>
          </div>

          <div className="products-table-body">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product._id} className="products-table-row">
                  <span className="products-cell-name">{product.name}</span>
                  <span>{product.category}</span>
                  <span>₹{product.price}</span>
                  <span>₹{product.purchasePrice}</span>
                  <span>
                    <span className={`products-stock-badge ${getStockClass(product.quantity)}`}>
                      {product.quantity} {product.unit}
                    </span>
                  </span>
                  <span className="products-row-actions">
                    <button type="button" className="products-edit-btn" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="products-delete-btn" onClick={() => handleDelete(product._id)}>
                      Delete
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <p className="products-empty-state">
                No products found{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}.
              </p>
            )}
          </div>
        </div>

        <div className="products-pagination">
          <p className="products-pagination-summary">
            Showing page {currentPage} of {Math.max(totalPages, 1)} ({totalProducts} items)
          </p>

          <div className="products-pagination-actions">
            <button
              type="button"
              className="products-secondary-btn"
              onClick={goToPreviousPage}
              disabled={loading || currentPage <= 1}
            >
              Previous
            </button>

            <button
              type="button"
              className="products-secondary-btn"
              onClick={goToNextPage}
              disabled={loading || (!hasNextPage && currentPage >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {showProductModal && (
        <div className="products-modal-overlay" onClick={closeProductModal}>
          <div className="products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <div>
                <h3>{editingId ? "Update Product" : "Add New Product"}</h3>
                <p>Fill in the details below to add a new product to your inventory.</p>
              </div>

              <button
                type="button"
                className="products-modal-close"
                onClick={closeProductModal}
                aria-label="Close product modal"
              >
                x
              </button>
            </div>

            <form
              className="products-modal-form"
              onSubmit={editingId ? handleUpdateProduct : handleAddProduct}
            >
              <label>
                Product Name
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <div className="products-modal-grid-2">
                <label>
                Selling Price (Rs)
                  <input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Stock Quantity
                  <input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Cost Price (Rs)
                <input
                  type="number"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </label>

              <label>
                Unit
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                >
                  <option value="">Select unit</option>
                  {unitOptions.map((u, index) => (
                    <option key={index} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>

              <div className="products-modal-actions">
                <button type="submit" className="products-primary-btn" disabled={loading}>
                  {editingId ? "Update Product" : "Add Product"}
                </button>
                {editingId && (
                  <button type="button" className="products-secondary-btn" onClick={closeProductModal}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;