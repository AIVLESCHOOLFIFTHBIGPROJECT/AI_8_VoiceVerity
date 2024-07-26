import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Planafter.module.css';

const PlanCancel = () => {
  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <h1>결제 취소</h1>
        <p>결제가 취소되었습니다.</p>
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

export default PlanCancel;
