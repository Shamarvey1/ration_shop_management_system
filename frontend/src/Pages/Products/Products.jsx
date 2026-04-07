import { useEffect, useState } from "react";
import {
  getProducts,
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

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const categoryOptions = ['Grains', 'Pulses', 'Spices', 'Oils', 'Sugars', 'Dairy', 'Beverages', 'Other'];
  const unitOptions = ['kg', 'litre', 'gram', 'ml', 'piece', 'packet', 'box', 'can'];
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      fetchProducts();

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
      fetchProducts();

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
      fetchProducts();
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
  const downloadExcel = () => {
  if (!products || products.length === 0) {
    alert("No products available");
    return;
  }

  const data = products.map((p) => ({
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
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(fileData, "products.xlsx");
};


  return (
    <div className="products-container">
      <h2>Products</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct}>

        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categoryOptions.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Selling Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Purchase Price"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          required
        />


        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
        >
          <option value="">Select Unit</option>
          {unitOptions.map((u, index) => (
            <option key={index} value={u}>
              {u}
            </option>
          ))}
        </select>

        <button type="submit">
          {editingId ? "Update Product" : "Add Product"}
        </button>
        <button onClick={downloadExcel} type="button">
          Export Excel
        </button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>


      <div className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="product-card">
              <h4>{product.name}</h4>
              <p><strong>Category:</strong> {product.category}</p>
              <p><strong>Selling Price:</strong> ₹{product.price}</p>
              <p><strong>Cost Price:</strong> ₹{product.purchasePrice}</p>
              <p>
                <strong>Quantity:</strong> {product.quantity} {product.unit}
              </p>

              <button onClick={() => handleEdit(product)}>Edit</button>
              <button onClick={() => handleDelete(product._id)}>Delete</button>
            </div>
          ))
        ) : (
          <p>No products found</p>
        )}
      </div>
    </div>
  );
}

export default Products;