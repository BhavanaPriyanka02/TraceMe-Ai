import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function ReportItem() {
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [phone, setPhone] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    console.log("Submit clicked"); 

    if (!type || !name || !description || !location || !phone) {
      alert("Please fill all fields");
      return;
    }

    try {
      const userId = localStorage.getItem("user_id");

if (!userId) {
  alert("User not logged in properly. Login again.");
  return;
}

const parsedUserId = parseInt(userId);

if (isNaN(parsedUserId)) {
  alert("Invalid user ID. Login again.");
  return;
}

const formData = new FormData();

formData.append("name", name);
formData.append("description", description);
formData.append("location", location);
formData.append("type", type.toUpperCase());
formData.append("user_id", parsedUserId);  
formData.append("phone", phone);

if (image) {
  formData.append("image", image);
}

      const res = await API.post("/api/items", formData);

      console.log("ITEM ADDED:", res.data);

      alert("Item reported successfully!");
      navigate("/dashboard");

    } catch (err) {
      console.log("ERROR:", err.response?.data);
      alert("Error reporting item");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Report Item</h2>

      {/* TYPE SELECTION */}
      <div>
        <button onClick={() => setType("lost")}>Lost Item</button>
        <button onClick={() => setType("found")} style={{ marginLeft: "10px" }}>
          Found Item
        </button>
      </div>

      <br />

      {/* FORM */}
      {type && (
        <div>
          <h3>{type.toUpperCase()} ITEM</h3>

          <input
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <br /><br />

          <p>Upload Image (optional)</p>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <br /><br />

          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default ReportItem;