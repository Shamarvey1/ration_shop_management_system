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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
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
      setError("Failed to load products. Please check your connection and try again.");
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
        quantity,
        unit,
      });

      setName("");
      setCategory("");
      setPrice("");
      setQuantity("");
      setUnit("");

      setShowForm(false);

      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setUnit(product.unit);
    setShowForm(true);
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
        quantity,
        unit,
      });

      setName("");
      setCategory("");
      setPrice("");
      setQuantity("");
      setUnit("");
      setEditingId(null);
      setShowForm(false);

      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setCategory("");
    setPrice("");
    setQuantity("");
    setUnit("");
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await deleteProduct(id);
      
      // Clear form if the deleted product was being edited
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
        setName("");
        setCategory("");
        setPrice("");
        setQuantity("");
        setUnit("");
      }
      
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product. Please try again.");
    }
  };

  return (
    <div className="products-container">
      <h2>Products</h2>

      {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct} className="product-form">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={loading}
          style={{padding: '8px', margin: '5px', borderRadius: '4px', border: '1px solid #ccc'}}
        >
          <option value="">Select Category</option>
          <option value="Grains">Grains</option>
          <option value="Pulses">Pulses</option>
          <option value="Spices">Spices</option>
          <option value="Oils">Oils</option>
          <option value="Sugars">Sugars</option>
          <option value="Dairy">Dairy</option>
          <option value="Beverages">Beverages</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          disabled={loading}
        />

        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
          disabled={loading}
          style={{padding: '8px', margin: '5px', borderRadius: '4px', border: '1px solid #ccc'}}
        >
          <option value="">Select Unit</option>
          <option value="kg">Kilogram (kg)</option>
          <option value="litre">Litre</option>
          <option value="gram">Gram</option>
          <option value="ml">Millilitre (ml)</option>
          <option value="piece">Piece</option>
          <option value="packet">Packet</option>
          <option value="box">Box</option>
          <option value="can">Can</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Product" : "Add Product")}
        </button>
      </form>

      <div className="product-list">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <h4>{product.name}</h4>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ₹{product.price}</p>
            <p><strong>Quantity:</strong> {product.quantity} {product.unit}</p>

            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button 
                onClick={() => handleEdit(product)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => handleDelete(product._id)} 
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;