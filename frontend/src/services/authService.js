const API_URL = import.meta.env.VITE_API_URL || "https://ration-shop-management-system-g0pm.onrender.com/api";

export const loginUser = async (userData) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    return { status: res.status, data };
  } catch (error) {
    console.error("Login error:", error);
    return { status: 500, data: { message: "Server error" } };
  }
};

export const signupUser = async (userData) => {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    return { status: res.status, data };
    console.log("Signup response:", res.status, data);
  } catch (error) {
    console.error("Signup error:", error);
    return { status: 500, data: { message: "Server error" } };
  }
};