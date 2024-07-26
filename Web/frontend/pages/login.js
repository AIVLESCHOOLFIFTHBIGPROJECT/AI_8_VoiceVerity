import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Login.module.css';
import Image from 'next/image';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      alert('You are already logged in');
      router.push('/home');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');  // Reset the error message
    try {
      const response = await axios.post(`${BACKEND_URL}/api/login/`, { email, password });
      localStorage.setItem('token', response.data.token);
      router.push('/home');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage('존재하지 않는 회원이거나 잘못된 입력입니다.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div style={{padding:'0 200px', 
        background: '#fff'}}><Navbar /></div>
      <div className={styles.main}>
        <div className={styles.loginBox}>
          <div className={styles.logoContainer}>
            <Image src="/images/logo.png" alt="Voice Volice Logo" width={115} height={80} />
          </div>
          {/* <h1 className={styles.title}>Voice Volice</h1> */}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="이메일 ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.inputField}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.inputField}
            />
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}  {/* Display the error message */}
            <button type="submit" className={styles.loginButton}>로그인</button>
          </form>
          <div className={styles.linkContainer}>
            <p><Link href="/find-id" className={styles.link}>ID</Link> / <Link href="/reset-password" className={styles.link}>PW</Link>를 잊으셨습니까?</p>
            <p><Link href="/signup" className={styles.link}>회원가입</Link></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
