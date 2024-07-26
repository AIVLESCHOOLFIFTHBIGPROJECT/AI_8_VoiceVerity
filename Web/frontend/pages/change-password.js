// change-password.js
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import styles from "../styles/ChangePassword.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      router.push("/login");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/change-password/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("비밀번호가 성공적으로 변경되었습니다.");
      router.push("/user-info");
    } catch (error) {
      console.error("비밀번호 변경 중 오류 발생", error);
      if (error.response && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert("비밀번호 변경 중 오류 발생");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div className={styles.changePasswordBox}>
          <h1 className={styles.title}>비밀번호 변경</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="password"
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.inputField}
            />
            <button type="submit" className={styles.changeButton}>
              비밀번호 변경
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
