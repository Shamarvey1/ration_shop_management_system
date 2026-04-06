import { useEffect, useState } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(""); // 🔥 NEW
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts();
      setProducts(data);
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
        price,
        purchasePrice, 
        quantity,
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
    setPrice(product.price.toString());
    setPurchasePrice(product.purchasePrice?.toString() || ""); // 🔥 ADDED
    setQuantity(product.quantity.toString());
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
        price,
        purchasePrice, 
        quantity,
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
    setPurchasePrice(""); // 🔥 ADDED
    setQuantity("");
    setUnit("");
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

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

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

        <input
          type="text"
          placeholder="Unit (kg, litre, etc)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
        />

        <button type="submit">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>

      <div className="product-list">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <h4>{product.name}</h4>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Selling Price:</strong> ₹{product.price}</p>
            <p><strong>Cost Price:</strong> ₹{product.purchasePrice}</p> {/* 🔥 NEW */}
            <p><strong>Quantity:</strong> {product.quantity} {product.unit}</p>

            <button onClick={() => handleEdit(product)}>Edit</button>
            <button onClick={() => handleDelete(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;