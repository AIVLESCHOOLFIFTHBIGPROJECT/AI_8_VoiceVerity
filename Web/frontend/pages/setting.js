// setting.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import styles from '../styles/Setting.module.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Setting() {
  const [credits, setCredits] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiKeyIssued, setApiKeyIssued] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${BACKEND_URL}/api/get-credits/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setCredits(response.data.credits);
        setLoading(false);
      })
      .catch(error => {
        console.error('크레딧 가져오기 오류', error);
      });

      axios.get(`${BACKEND_URL}/api/user-info/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setApiKey(response.data.api_key);
      })
      .catch(error => {
        console.error('API 키 가져오기 오류', error);
      });
    }
  }, []);

  const handleApiKeyAction = async (action) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/${action}/`, { password }, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      setApiKey(response.data.api_key || '');
      setApiKeyIssued(true);
      alert(`${action === 'get-api-key' ? 'API 키 발급' : action === 'regenerate-api-key' ? 'API 키 재발급' : 'API 키 삭제'} 성공`);
    } catch (error) {
      console.error(`API 키 ${action} 오류`, error);
      alert(`API 키 ${action} 오류`);
    }
  };

  const handleTryVoiceVerity = () => {
    router.push('/try');
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <div className={styles.settingBox}>
          <h1 className={styles.title}>환경설정</h1>
          {loading ? <p>로딩 중...</p> : (
            <div>
              <p>크레딧: {credits}</p>
              <div className={styles.fieldGroup}>
                <label>비밀번호:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputField}
                />
              </div>
              <div className={styles.buttonGroup}>
                {!apiKey ? (
                  <button onClick={() => handleApiKeyAction('get-api-key')} className={styles.button}>API 키 발급</button>
                ) : (
                  <>
                    <button onClick={() => handleApiKeyAction('regenerate-api-key')} className={styles.button}>API 키 재발급</button>
                    <button onClick={() => handleApiKeyAction('delete-api-key')} className={styles.button}>API 키 삭제</button>
                  </>
                )}
              </div>
              {apiKey && (
                <div className={styles.apiKeyBox}>
                  <p>API 키: {apiKey}</p>
                </div>
              )}
              {apiKeyIssued && (
                <button onClick={handleTryVoiceVerity} className={styles.button}>Voice Verity 체험하기</button>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
