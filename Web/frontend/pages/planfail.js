import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/Planafter.module.css";

const PlanFail = () => {
  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div
          style={{
            border: "solid #f72f5f",
            borderRadius: "50%",
            width: "100px",
            height: "100px",
            placeSelf: "center",
            alignContent: 'center'
          }}
        >
          <h1 style={{margin:'0'}}>❌</h1>
        </div>
        <h1>결제 실패</h1>
        <p>결제에 실패했습니다.</p>
        <br />
        <Link href="/plan">
          <button className={styles.button}>Go back to Plans</button>
        </Link>
      </div>
      <div className={styles.contactUs}>
        <h2>Contact Us</h2>
        <Link href="/contact/1">
          <button className={styles.button}>Contact Support</button>
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default PlanFail;
