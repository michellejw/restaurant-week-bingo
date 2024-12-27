import React from "react";
import NavBar from "../components/NavBar";

const MainPage: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <h1>Restaurant Week Bingo!</h1>
      <div
        style={{ flex: 1, backgroundColor: "#e0e0e0", marginBottom: "20px" }}
      >
        <h2>Map Placeholder</h2>
        {/* The map component will go here! */}
      </div>
      <div style={{ flex: 1, backgroundColor: "#f0f0f0", margin: "20px" }}>
        <h2>Bingo card placeholder</h2>
        {/* The bingo card component will go here! */}
      </div>
    </div>
  );
};

export default MainPage;
