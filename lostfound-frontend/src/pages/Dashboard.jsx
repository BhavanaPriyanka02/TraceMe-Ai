import { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/theme.css";

function Dashboard() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [acceptedMatches, setAcceptedMatches] = useState({});
  const [view, setView] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const res = await API.get(`/dashboard/${userId}`);

      setLostItems(res.data.lost_items || []);
      setFoundItems(res.data.found_items || []);
      setMatches(res.data.matches || []);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.log(err);
    }
  };

  const acceptMatch = async (matchId) => {
    try {
      const res = await API.post(`/matches/${matchId}/accept`);

      setAcceptedMatches((prev) => ({
        ...prev,
        [matchId]: {
          lost: res.data.lost_user_phone,
          found: res.data.found_user_phone,
        },
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const rejectMatch = async (matchId) => {
    try {
      await API.post(`/matches/${matchId}/reject`);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (err) {
      console.log(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="page-container">

      {/* TOP BAR */}
      <div className="top-bar">
        <h2>
          Welcome, {localStorage.getItem("username") || "User"}
        </h2>

        <button
          className="btn"
          style={{
            width: "90px",
            height: "36px",
            fontSize: "13px",
            borderRadius: "6px"
          }}
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      {/* CENTER AREA */}
      <div className="center-area">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* REPORT ITEM */}
          <div
            className="block"
            style={{ width: "240px", marginBottom: "30px" }}
            onClick={() => window.location.href = "/report"}
          >
            Report Item
          </div>

          {/* ROW 1 */}
          <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
            <div className="block" onClick={() => setView("lost")}>
              Lost Items
            </div>

            <div className="block" onClick={() => setView("found")}>
              Found Items
            </div>
          </div>

          {/* ROW 2 */}
          <div style={{ display: "flex", gap: "40px", marginBottom: "30px" }}>
            <div className="block" onClick={() => setView("matches")}>
              Matches
            </div>

            <div className="block" onClick={() => setView("notifications")}>
              Notifications
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ marginTop: "20px", width: "100%", maxWidth: "700px" }}>

            {/* LOST */}
            {view === "lost" &&
              (lostItems.length === 0 ? (
                <p>No lost items</p>
              ) : (
                <div className="cards-container">
                  {lostItems.map((item) => (
                    <div key={item.id} className="card">

                      {item.image_url && (
                        <img
                          src={item.image}
                          alt="item"
                          className="item-image"
                        />
)}

                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      <p><b>Location:</b> {item.location}</p>
                    </div>
                  ))}
                </div>
              ))}

            {/* FOUND */}
            {view === "found" &&
              (foundItems.length === 0 ? (
                <p>No found items</p>
              ) : (
                <div className="cards-container">
                  {foundItems.map((item) => (
                    <div key={item.id} className="card">

                      {/* 🔥 IMAGE */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt="item"
                          className="item-image"
                        />
                      )}

                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      <p><b>Location:</b> {item.location}</p>
                    </div>
                  ))}
                </div>
              ))}

            {/* MATCHES (UNCHANGED) */}
            {view === "matches" &&
              (matches.length === 0 ? (
                <p>No matches found</p>
              ) : (
                <div className="grid">
                  {matches.map((match) => (
                    <div key={match.id} className="card">
                      <p><b>Lost:</b> {match.lost_item_name}</p>
                      <p><b>Found:</b> {match.found_item_name}</p>
                      <p><b>Match Level:</b> {match.match_level}</p>

                      {acceptedMatches[match.id] ? (
                        <div>
                          <p><b>📞 Contact Details</b></p>
                          <p>Lost: {acceptedMatches[match.id].lost}</p>
                          <p>Found: {acceptedMatches[match.id].found}</p>

                          <button
                            className="btn"
                            style={{ marginTop: "10px", background: "#444" }}
                            onClick={() => {
                              setMatches((prev) =>
                                prev.filter((m) => m.id !== match.id)
                              );

                              setAcceptedMatches((prev) => {
                                const updated = { ...prev };
                                delete updated[match.id];
                                return updated;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          <button
                            className="btn"
                            style={{ flex: 1 }}
                            onClick={() => acceptMatch(match.id)}
                          >
                            Accept
                          </button>

                          <button
                            className="btn"
                            style={{ flex: 1, background: "#444" }}
                            onClick={() => rejectMatch(match.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {/* NOTIFICATIONS */}
            {view === "notifications" &&
              (notifications.length === 0 ? (
                <p>No notifications</p>
              ) : (
                <div className="cards-container">
                  {notifications.map((note) => (
                    <div key={note.id} className="card">
                      <p>{note.message}</p>

                      <button
                        className="btn"
                        onClick={() => markAsRead(note.id)}
                      >
                        Mark as Read
                      </button>
                    </div>
                  ))}
                </div>
              ))}

          </div>

        </div>
      </div>

    </div>
  );
}

export default Dashboard;