import { useState } from "react";
import "../App.css";

function Login({ onSignup, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setMessage(`Welcome, ${data.user.name}! Login successful.`);
        onLoginSuccess();
        // Token ko abhi sirf response se receive kar rahe hain.
        // Protected pages baad mein connect karenge.
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (error) {
      setMessage("Server se connect nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Welcome Back 📚</h1>
      <p>Login to your BookNest account</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        New to BookNest?{" "}
        <button type="button" onClick={onSignup}>
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default Login;