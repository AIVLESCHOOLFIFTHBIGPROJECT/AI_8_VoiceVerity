import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/FindId.module.css";
import Image from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function FindId() {
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [users, setUsers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      alert("You are already logged in");
      router.push("/home");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !contact) {
      alert("모든 빈칸을 채워주세요.");
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/find-id/`, {
        username,
        contact,
      });
      if (response.data.error) {
        alert(response.data.error);
      } else {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error finding ID", error);
      alert("없는 회원입니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div className={styles.findIdBox}>
          <div className={styles.logoContainer}>
            <Image
              src="/images/logo.png"
              alt="Voice Volice Logo"
              width={115}
              height={80}
            />
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="사용자 이름"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="text"
              placeholder="연락처 ('-'없이 입력)"
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              className={styles.inputField}
            />
            <button type="submit" className={styles.findButton}>
              ID 찾기
            </button>
          </form>
          {users.length > 0 && (
            <div className={styles.userList}>
              <h2>Users found:</h2>
              <ul>
                {users.map((user, index) => (
                  <li key={index}>
                    이메일: {user.email} <br />
                    가입 날짜: {new Date(user.date_joined).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
