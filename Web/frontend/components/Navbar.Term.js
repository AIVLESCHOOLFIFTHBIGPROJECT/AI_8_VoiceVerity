const navStyle = {
    fontFamily: "fontA, sans-serif",
    display: "flex",
    height: "70px",
    background: "rgba(255, 255, 255, 0.55)",
    alignItems: "center",
    padding: "0 20px",
  };
  
  const brandStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#000",
  };
  
  export default function Navbar() {
    return (
      <nav style={navStyle}>
        <span style={brandStyle}>Voice Verity</span>
      </nav>
    );
  }
  