import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

function Login() {
  const [mode, setMode] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // LOGIN
  const handleLogin = async () => {
  console.log("LOGIN CLICKED");

  if (!email || !password) {
    alert("Please enter email & password");
    return;
  }

  try {
    const res = await API.post("/api/login", {
      email,
      password,
    });

    console.log("LOGIN RESPONSE:", res.data);

    localStorage.setItem("user_id", res.data.user_id);
    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("username", res.data.username);

    navigate("/dashboard");
  } catch (err) {
    console.log(err);
    alert("Login failed");
  }
};

  const handleRegister = async () => {
  console.log("REGISTER CLICKED");

  if (!username || !email || !password) {
    alert("Fill all fields");
    return;
  }

  try {
    alert("Registering... please wait ");

    await API.post("/api/register", {
      username,
      email,
      password,
    });

    console.log("REGISTER SUCCESS");

    const res = await API.post("/api/login", {
      email,
      password,
    });

    console.log("LOGIN AFTER REGISTER:", res.data);

    localStorage.setItem("user_id", res.data.user_id);
    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("username", res.data.username);

    alert("Registered Successfully");

    navigate("/dashboard");
  } catch (err) {
    console.log(err);
    alert("Registration failed");
  }
};
  return (
    <div className="center-container">

      {!mode && (
        <div>
          <h1
            className="main-heading"
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)"
            }}
          >
            TraceMe
          </h1>

          <div style={{ display: "flex", gap: "30px", justifyContent: "center" }}>
            <div className="block" onClick={() => setMode("login")}>
              Login
            </div>

            <div className="block" onClick={() => setMode("register")}>
              Register
            </div>
          </div>
        </div>
      )}

      {mode === "login" && (
        <div style={{ textAlign: "center" }}>
          <h1 className="main-heading">Login</h1>

          <div className="card">
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

            <button className="btn" onClick={handleLogin}>
              Login
            </button>
          </div>

          <p style={{ cursor: "pointer", marginTop: "15px" }} onClick={() => setMode(null)}>
            ⬅ Back
          </p>
        </div>
      )}

      {mode === "register" && (
        <div style={{ textAlign: "center" }}>
          <h1 className="main-heading">Register</h1>

          <div className="card">
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

            <button className="btn" onClick={handleRegister}>
              Register
            </button>
          </div>

          <p style={{ cursor: "pointer", marginTop: "15px" }} onClick={() => setMode(null)}>
            ⬅ Back
          </p>
        </div>
      )}

    </div>
  );
}

export default Login;