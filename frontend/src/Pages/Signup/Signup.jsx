import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../../services/authService";
import { Eye, EyeOff, ShoppingCart } from "lucide-react";
import "./Signup.css";

function Signup() {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!shopName || !ownerName || !email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { status, data } = await signupUser({
      shopName,
      ownerName,
      email,
      password,
    });

    if (status === 201 || status === 200) {
      navigate("/login");
    } else {
      setError(data.message || "Signup failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="signup-logo">
            <ShoppingCart size={32} className="logo-icon" />
            <h1>RationShop Pro</h1>
          </div>
          <p className="signup-subtitle">Create your account to get started</p>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label htmlFor="shopName">Shop Name</label>
            <input
              id="shopName"
              type="text"
              placeholder="Enter your shop name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerName">Owner Name</label>
            <input
              id="ownerName"
              type="text"
              placeholder="Enter your full name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input password-input"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;