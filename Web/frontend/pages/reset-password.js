// reset-password.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/ResetPassword.module.css';
import Image from 'next/image';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      alert('이미 로그인 상태입니다.');
      router.push('/home');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !username || !contact || !password || !confirmPassword) {
      alert('모든 필드를 채워주세요.');
      return;
    }
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/reset-password/`, { email, username, contact, password });
      if (response.data.error) {
        alert(response.data.error);
      } else {
        alert('비밀번호 변경 성공');
        router.push('/login');
      }
    } catch (error) {
      console.error('비밀번호 초기화 중 오류 발생', error);
      alert('잘못된 정보를 입력했거나 이전과 동일한 비밀번호 변경은 불과합니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div className={styles.resetPasswordBox}>
        <div className={styles.logoContainer}>
            <Image src="/images/logo.png" alt="Voice Volice Logo" width={115} height={80} />
          </div>
          {/* <h1 className={styles.title}>비밀번호 초기화</h1> */}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="text"
              placeholder="사용자 이름"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="text"
              placeholder="연락처 ('-' 없이 입력)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <button type="submit" className={styles.resetButton}>비밀번호 초기화</button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}