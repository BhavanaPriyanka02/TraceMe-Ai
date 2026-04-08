import { useState } from "react";
import API from "../api/axios";
import "../styles/theme.css";

function Report() {
  const [type, setType] = useState(null); // lost | found
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async () => {
  try {
    const userId = Number(localStorage.getItem("user_id"));

    if (!type) {
      alert("Please select Lost or Found");
      return;
    }

    if (!userId) {
      alert("User not logged in");
      return;
    }

    if (!image) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("type", type);
    formData.append("user_id", userId);
    formData.append("phone", phone);
    formData.append("image", image);

    await API.post("/api/items", formData);

    alert("Item reported successfully!");
    window.location.href = "/dashboard";

  } catch (err) {
  console.log("FULL ERROR:", err);
  console.log("RESPONSE:", err.response);
  console.log("DATA:", err.response?.data);

  alert(JSON.stringify(err.response?.data || err.message));
}
};

  return (
  <div className="page-container">

    {/* TOP */}
    <div className="top-heading">
      <h1 className="main-heading">Report Item</h1>
    </div>

    {/* CENTER */}
    <div className="center-area">

      {!type && (
        <div className="block-row">
          <div className="block" onClick={() => setType("lost")}>
            Lost Item
          </div>

          <div className="block" onClick={() => setType("found")}>
            Found Item
          </div>
        </div>
      )}

      {type === "lost" && (
        <div className="form-container">
          <h1 className="main-heading">Lost Item</h1>

          <div className="card">
            <input type="text" placeholder="Item Name" onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
            <input type="text" placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
            <input type="text" placeholder="Phone Number" onChange={(e) => setPhone(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            <button className="btn" onClick={handleSubmit}>Submit</button>
          </div>

          <p className="back-btn" onClick={() => setType(null)}>⬅ Back</p>
        </div>
      )}

      {type === "found" && (
        <div className="form-container">
          <h1 className="main-heading">Found Item</h1>

          <div className="card">
            <input type="text" placeholder="Item Name" onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
            <input type="text" placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
            <input type="text" placeholder="Phone Number" onChange={(e) => setPhone(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            <button className="btn" onClick={handleSubmit}>Submit</button>
          </div>

          <p className="back-btn" onClick={() => setType(null)}>⬅ Back</p>
        </div>
      )}

    </div>
  </div>
);
}

export default Report;