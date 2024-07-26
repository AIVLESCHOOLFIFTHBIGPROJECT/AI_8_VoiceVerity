import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/Signup.module.css";
import Image from "next/image";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [allChecked, setAllChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState({
    personalInfo: false,
    serviceTerms: false,
    voiceCollection: false,
  });
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);

  useEffect(() => {
    localStorage.removeItem("termsChecked");
    localStorage.removeItem("allowedToSignup2");
  }, []);

  const handleAllCheck = () => {
    const newCheckState = !allChecked;
    setAllChecked(newCheckState);
    setTermsChecked({
      personalInfo: newCheckState,
      serviceTerms: newCheckState,
      voiceCollection: newCheckState,
    });
  };

  const handleCheck = (term) => {
    const newCheckState = !termsChecked[term];
    setTermsChecked({
      ...termsChecked,
      [term]: newCheckState,
    });
    setAllChecked(
      newCheckState &&
        Object.keys(termsChecked).every(
          (key) => key === term || termsChecked[key]
        )
    );
  };

  const handleNextStep = (event) => {
    event.preventDefault();
    if (!termsChecked.personalInfo || !termsChecked.serviceTerms) {
      alert("필수 약관에 동의해주세요.");
      return;
    }
    localStorage.setItem("termsChecked", JSON.stringify(termsChecked));
    setStep(2);
  };

  const validateNickname = (value) => {
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
    return (isKorean && value.length >= 2 && value.length <= 4) || (!isKorean && value.length >= 2 && value.length <= 6);
  };

  const validateUsername = (value) => {
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
    return (isKorean && value.length >= 2 && value.length <= 4) || (!isKorean && value.length >= 2 && value.length <= 6);
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleEmailBlur = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      alert("유효한 이메일 형식이 아닙니다.");
    }
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    const isNumeric = /^\d+$/.test(value);

    if (isNumeric) {
      setContact(value);
    } else {
      alert("연락처는 숫자만 입력할 수 있습니다.");
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      alert("유효한 이메일 형식이 아닙니다.");
      return;
    }

    if (!validateUsername(username)) {
      alert("사용자 이름은 한글 2~4자, 영어 2~6자만 가능합니다.");
      return;
    }

    if (!validateNickname(nickname)) {
      alert("닉네임은 한글 2~4자, 영어 2~6자만 가능합니다.");
      return;
    }

    if (password.length < 4) {
      alert("비밀번호는 최소 4자리 이상이어야 합니다.");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/signup/`, {
        username,
        nickname,
        email,
        password,
        company,
        contact,
        sms_marketing: smsMarketing,
        email_marketing: emailMarketing,
      });
      localStorage.setItem("token", response.data.token);
      alert("회원가입 성공");
      router.push("/home");
    } catch (error) {
      if (
        error.response &&
        error.response.data.error === "Email already exists"
      ) {
        alert("이미 존재하는 이메일입니다.");
        setEmail("");
      } else {
        alert("회원가입 실패");
      }
    }
  };

  const handlePopup = (url) => {
    const popup = window.open(
      url,
      "popup",
      "width=600,height=800,scrollbars=yes,resizable=no"
    );
    popup.focus();
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div style={{ height: "100px" }} />
      <div className={styles.main}>
        <div className={styles.logoContainer}>
          <Image
            src="/images/logo.png"
            alt="Voice Verity Logo"
            width={115}
            height={80}
          />
        </div>
        {step === 1 && (
          <div className={styles.signupBox}>
            <div className={styles.progress}>
              <span style={{ margin: "0 15px" }}>1 / 2</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFilled} />
              </div>
            </div>
            <h1 className={styles.title}>Voice Verity</h1>
            <h1 className={styles.subtitle}>서비스 약관에 동의 해주세요.</h1>
            <form onSubmit={handleNextStep}>
              <div className={styles.checkboxContainer}>
                <label>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleAllCheck}
                  />
                  <span>모두 동의합니다.</span>
                </label>
                <div className={styles.allcheck}>
                  <div style={{ width: "300px" }}>
                    <p>
                      전체 동의는 필수 및 선택 정보에 대한 동의도 포함되어
                      있으며, 개별적으로도 동의를 선택할 수 있습니다. 선택
                      항목의 경우 동의를 거부하셔도 서비스 이용이 가능합니다.
                    </p>
                  </div>
                </div>
                <hr style={{ border: "solid 1px #d9d9d9" }} />
                <div className={styles.termsList}>
                  <div className={styles.agreebox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={termsChecked.personalInfo}
                        onChange={() => handleCheck("personalInfo")}
                      />
                    </label>
                    <span
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "black",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopup("/terms/personal-info");
                      }}
                    >
                      [필수] 개인정보 수집 및 이용 동의
                    </span>
                  </div>
                  <div className={styles.agreebox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={termsChecked.serviceTerms}
                        onChange={() => handleCheck("serviceTerms")}
                      />
                    </label>
                    <span
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "black",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopup("/terms/service-terms");
                      }}
                    >
                      [필수] Voice Verity 통합서비스 약관
                    </span>
                  </div>
                  <div className={styles.agreebox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={termsChecked.voiceCollection}
                        onChange={() => handleCheck("voiceCollection")}
                      />
                    </label>
                    <span
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "black",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePopup("/terms/voice-collection");
                      }}
                    >
                      [선택] 음성 데이터 수집 및 이용 동의
                    </span>
                  </div>
                </div>
              </div>
              <button type="submit" className={styles.signupButton}>
                동의
              </button>
            </form>
          </div>
        )}
        {step === 2 && (
          <div className={styles.signupBox}>
            <div className={styles.progress}>
              <span style={{ margin: "0 15px" }}>2 / 2</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFilled2} />
              </div>
            </div>
            <h1 className={styles.title}>Voice Verity</h1>
            <h1 className={styles.subtitle}>
              가입에 필요한 정보를 입력해주세요.
            </h1>
            <form onSubmit={handleSignup}>
              <div style={{ margin: "0px" }} />
              <input
                type="text"
                placeholder="사용자 이름 (한글 2~4자, 영어 2~6자)"
                value={username}
                onChange={handleUsernameChange}
                required
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="닉네임 (한글 2~4자, 영어 2~6자)"
                value={nickname}
                onChange={handleNicknameChange}
                required
                className={styles.inputField}
              />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                required
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="회사 (선택사항)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={styles.inputField}
              />
              <input
                type="text"
                placeholder="연락처 ('-' 없이 입력)"
                value={contact}
                onChange={handleContactChange}
                required
                className={styles.inputField}
              />
              <input
                type="password"
                placeholder="비밀번호 (최소 4자리)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputField}
              />
              <input
                type="password"
                placeholder="비밀번호 확인 (최소 4자리)"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.inputField}
              />
              <div style={{ marginTop: "0px" }}>
                <p
                  style={{
                    color: "#868686",
                    textAlign: "left",
                  }}
                >
                  마케팅활용동의 및 광고수신동의
                </p>
              </div>
              <div className={styles.marketing}>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={smsMarketing}
                      onChange={() => setSmsMarketing(!smsMarketing)}
                    />
                    SMS 수신 동의
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={emailMarketing}
                      onChange={() => setEmailMarketing(!emailMarketing)}
                    />
                    E-mail 수신 동의
                  </label>
                </div>
              </div>
              <div style={{ margin: "10px" }} />
              <button type="submit" className={styles.signupButton}>
                회원 가입
              </button>
            </form>
            <button onClick={() => setStep(1)} className={styles.backButton}>
              뒤로 가기
            </button>
          </div>
        )}
      </div>
      <div style={{ height: "80px" }} />
      <Footer />
    </div>
  );
}
