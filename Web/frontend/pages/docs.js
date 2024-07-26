import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/Docs.module.css";

export default function Documentation() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(`.${styles.section}`);
      let currentSection = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 50) {
          currentSection = section.getAttribute("id");
        }
      });
      setActiveSection(currentSection); 
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); 

  const handleScrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }; //스크롤 이동

  const handleNavigateToSetting = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    router.push("/management");
  }; //로그인이 되어있으면 api페이지 이동, 안되어있으면 경고 문구 출력

  const handleContactUs = () => {
    router.push("/contact/1");
  }; 

  const handleCopyClick = (textToCopy, id) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: "success" }));
          setTimeout(() => setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: "" })), 2000);
        })
        .catch((error) => {
          console.error("복사 실패:", error);
        });
    } else {
      // HTTPS가 아닌 환경에서는 execCommand를 사용
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";  // avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: "success" }));
        setTimeout(() => setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: "" })), 2000);
      } catch (err) {
        console.error("복사 실패:", err);
      }
      document.body.removeChild(textArea);
    }
  }; //클립보드 복사 기능

  return (
    <div className={styles.documentationContainer}>
      <div className={styles.contentContainer}>
        <div className={styles.sidebar}>
          <ul className={styles.sidebarList}>
            <li
              className={activeSection === "start" ? styles.active : ""}
              onClick={() => handleScrollToSection("start")}
            >
              시작 하기
            </li>
            <li
              className={
                activeSection === "supported-files" ? styles.active : ""
              }
              onClick={() => handleScrollToSection("supported-files")}
            >
              지원 파일
            </li>
            <li
              className={
                activeSection === "authentication" ? styles.active : ""
              }
              onClick={() => handleScrollToSection("authentication")}
            >
              인증
            </li>
            <li
              className={activeSection === "endpoints" ? styles.active : ""}
              onClick={() => handleScrollToSection("endpoints")}
            >
              엔드 포인트
            </li>
            <li
              className={activeSection === "error-codes" ? styles.active : ""}
              onClick={() => handleScrollToSection("error-codes")}
            >
              에러 코드
            </li>
          </ul>
        </div>
        <div className={styles.center}>
          <div className={styles.content}>
            <Navbar />
            <section id="start" className={styles.section}>
              <div className={styles.headsection}>
                <h1 className={styles.heading}>Voice Verity documentation</h1>
                <p>
                  <span>
                    Voice Verity는 KT AivleSchool 5기 AI Track 8조가 제공하는
                  </span>
                  <br />
                  <span>API 및 플랫폼 서비스입니다.</span>
                </p>
                <div className={styles.cardContainer}>
                  <div
                    className={styles.card}
                    onClick={() => handleScrollToSection("start")}
                  >
                    
                    <div style={{height:'200px', alignContent: 'center'}}><div className={styles.cardicon}/></div>
                    <div className={styles.cardtext}>
                      <h2>시작하기</h2>
                      <p style={{ color: "#444", fontSize: "20px" }}>Get start</p>
                      <p style={{ color: "blue" }}>Read documentation &gt;</p>
                    </div>
                  </div>
                  <div
                    className={styles.card}
                    onClick={handleNavigateToSetting}
                  >
                    <div style={{height:'200px', alignContent: 'center'}}><div className={styles.cardicon2}/></div>
                    <div className={styles.cardtext}>
                      <h2>Key 발급</h2>
                      <p style={{ color: "#444", fontSize: "20px" }}>Get Key</p>
                      <p style={{ color: "blue" }}>Go to API Management &gt;</p>
                    </div>
                  </div>
                </div>
                <h3>
                  Voice Verity는 음성 파일에 대해 Deep Fake 여부를 판별합니다.
                </h3>
              </div>
            </section>
            <section id="supported-files" className={styles.section}>
              <div className={styles.filesection}>
                <h2>지원하는 파일 형식</h2>
                <h3>File format</h3>
                <div className={styles.fileFormats}>
                  <span className={styles.fileFormat}>.wav</span>
                  <span className={styles.fileFormat}>.mp3</span>
                  <span className={styles.fileFormat}>.m4a</span>
                  <span className={styles.fileFormat}
                    style={{width:'max-content'}}>YouTube URL</span>
                </div>
                <p>10MB 이하의 음성 파일</p>
              </div>
            </section>
            <section id="authentication" className={styles.section}>
              <h2>인증</h2>
              <p>플랫폼에 회원가입 및 로그인하여 API 페이지에서 API 키를 발급받습니다.</p>
              <hr />
              <div className={styles.codeEX}>
                <div className={styles.codetop}>
                  <p>KEY</p>
                  <span
                    onClick={() =>
                      handleCopyClick(`Authorization: Bearer YOUR_API_KEY`, 'auth')
                    }
                  >
                    {copyStatus.auth === "success" ? (
                      <span>✔ 복사되었습니다!</span>
                    ) : (
                      <span>📋Copy</span>
                    )}
                  </span>
                </div>
                <pre>Authorization: Bearer YOUR_API_KEY</pre>
              </div>
            </section>
            <section id="endpoints" className={styles.section}>
              <h2>엔드 포인트</h2>
              <hr />
              <div style={{ marginBottom: "50px" }}>
                <h3>1. 음성 파일 분석(voice-verity)</h3>
                <ul>
                  <li>URL: http://voice-verity.com/api/voice-verity/</li>
                  <li>Method: POST</li>
                  <li>
                    설명: 업로드한 음성 파일을 기반으로 AI 모델로부터 Deep Fake 여부를 판단합니다.
                  </li>
                  <li>
                    음성 파일에 대한 분석은 1초 단위로 제공됩니다.
                  </li>
                </ul>
                <h3>Request Header</h3>
                <div className={styles.codeEX}>
                  <div className={styles.codetop}>
                    <p>Header</p>
                    <span
                      onClick={() =>
                        handleCopyClick(`Key: Authorization
Value: Bearer YOUR_API_KEY`, 'header')
                      }
                    >
                      {copyStatus.header === "success" ? (
                        <span>✔ 복사되었습니다!</span>
                      ) : (
                        <span>📋Copy</span>
                      )}
                    </span>
                  </div>
                  <pre>Key: Authorization{`\n`}Value: Bearer YOUR_API_KEY</pre>
                </div>
                <h3>Request Body</h3>
                <ul>
                  <li>multipart/form-data</li>
                </ul>
                <div className={styles.codeEX}>
                  <div className={styles.codetop}>
                    <p>Body</p>
                    <span
                      onClick={() =>
                        handleCopyClick(`Key: file
Value: YOUR_AUDIO_FILE.wav`, 'body')
                      }
                    >
                      {copyStatus.body === "success" ? (
                        <span>✔ 복사되었습니다!</span>
                      ) : (
                        <span>📋Copy</span>
                      )}
                    </span>
                  </div>
                  <pre>Key: file{`\n`}Value: YOUR_AUDIO_FILE.wav</pre>
                </div>
                <h3>Request Example</h3>
                <div className={styles.codeEX}>
                  <div className={styles.codetop}>
                    <p>sh</p>
                    <span
                      onClick={() =>
                        handleCopyClick(`curl -X POST http://voice-verity.com/api/voice-verity/ 
-H "Authorization: Bearer YOUR_API_KEY_HERE" 
-F "file=@/path/to/your_audio_file.wav"`, 'requestExample')
                      }
                    >
                      {copyStatus.requestExample === "success" ? (
                        <span>✔ 복사되었습니다!</span>
                      ) : (
                        <span>📋Copy</span>
                      )}
                    </span>
                  </div>
                  <pre>{`curl -X POST http://voice-verity.com/api/voice-verity/ 
-H "Authorization: Bearer YOUR_API_KEY_HERE" 
-F "file=@/path/to/your_audio_file.wav"`}</pre>
                </div>
                <h3>Response</h3>
                <ul>
                  <li>Content-Type: application/json</li>
                </ul>
                <div className={styles.codeEX}>
                  <div className={styles.codetop}>
                    <p>JSON</p>
                    <span
                      onClick={() =>
                        handleCopyClick(`{
  "predictions": [
    1.0,
    0.12,
    0.23,
    0.984,
    0.988,
    0.993,
    0.997,
    0.817
  ],
  "fake_cnt": 6,
  "real_cnt": 2,
  "analysis_result": "Fake"
}`, 'response')
                      }
                    >
                      {copyStatus.response === "success" ? (
                        <span>✔ 복사되었습니다!</span>
                      ) : (
                        <span>📋Copy</span>
                      )}
                    </span>
                  </div>
                  <pre>{`{
  "predictions": [
    1.0,
    0.12,
    0.23,
    0.984,
    0.988,
    0.993,
    0.997,
    0.817
  ],
  "fake_cnt": 6,
  "real_cnt": 2,
  "analysis_result": "Fake"
}`}</pre>
                </div>
              </div>
              <div style={{ height: "20px" }} />
              <h3>2. YouTube 영상 분석(youtube-verity)</h3>
<ul>
  <li>URL: http://voice-verity.com/api/youtube-verity/</li>
  <li>Method: POST</li>
  <li>
    설명: 업로드한 YouTube Link를 기반으로 AI 모델로부터 Deep Fake 여부를 판단합니다.
  </li>
  <li>영상에 대한 분석은 1초 단위로 제공됩니다.</li>
  <li>BGM 등이 포함된 영상은 정확도가 떨어질 수 있습니다.</li>
</ul>
<h3>Request Header</h3>
<div className={styles.codeEX}>
  <div className={styles.codetop}>
    <p>Header</p>
    <span
      onClick={() =>
        handleCopyClick(`Key: Authorization
Value: Bearer YOUR_API_KEY`, 'youtubeHeader')
      }
    >
      {copyStatus.youtubeHeader === "success" ? (
        <span>✔ 복사되었습니다!</span>
      ) : (
        <span>📋Copy</span>
      )}
    </span>
  </div>
  <pre>Key: Authorization{`\n`}Value: Bearer YOUR_API_KEY</pre>
</div>
<h3>Request Body</h3>
<ul>
  <li>application/json</li>
</ul>
<div className={styles.codeEX}>
  <div className={styles.codetop}>
    <p>Body</p>
    <span
      onClick={() =>
        handleCopyClick(`youtube_url: https://youtu.be/yHxXWIHOr6A`, 'youtubeBody')
      }
    >
      {copyStatus.youtubeBody === "success" ? (
        <span>✔ 복사되었습니다!</span>
      ) : (
        <span>📋Copy</span>
      )}
    </span>
  </div>
  <pre>youtube_url: https://youtu.be/yHxXWIHOr6A</pre>
</div>
<h3>Request Example</h3>
<div className={styles.codeEX}>
  <div className={styles.codetop}>
    <p>sh</p>
    <span
      onClick={() =>
        handleCopyClick(`curl -X POST http://voice-verity.com/api/youtube-verity/ 
-H "Authorization: Bearer YOUR_API_KEY_HERE" 
-F "youtube_url=https://youtu.be/yHxXWIHOr6A"`, 'youtubeExample')
      }
    >
      {copyStatus.youtubeExample === "success" ? (
        <span>✔ 복사되었습니다!</span>
      ) : (
        <span>📋Copy</span>
      )}
    </span>
  </div>
  <pre>{`curl -X POST http://voice-verity.com/api/youtube-verity/ 
-H "Authorization: Bearer YOUR_API_KEY_HERE" 
-F "youtube_url=https://youtu.be/yHxXWIHOr6A"`}</pre>
</div>
<h3>Response</h3>
<ul>
  <li>Content-Type: application/json</li>
</ul>
<div className={styles.codeEX}>
  <div className={styles.codetop}>
    <p>JSON</p>
    <span
      onClick={() =>
        handleCopyClick(`{
  "predictions": [
    1.0,
    0.12,
    0.23,
    0.984,
    0.988,
    0.993,
    0.997,
    0.817
  ],
  "fake_cnt": 6,
  "real_cnt": 2,
  "analysis_result": "Fake"
}`, 'youtubeResponse')
      }
    >
      {copyStatus.youtubeResponse === "success" ? (
        <span>✔ 복사되었습니다!</span>
      ) : (
        <span>📋Copy</span>
      )}
    </span>
  </div>
  <pre>{`{
  "predictions": [
    1.0,
    0.12,
    0.23,
    0.984,
    0.988,
    0.993,
    0.997,
    0.817
  ],
  "fake_cnt": 6,
  "real_cnt": 2,
  "analysis_result": "Fake"
}`}</pre>
</div>
              <div style={{ height: "50px" }} />

              <h3>3. 서버 상태 체크(check-api-status)</h3>
              <ul>
                <li>URL: http://voice-verity.com/api/check-api-status/</li>
                <li>Method: GET</li>
                <li>설명: 호출하는 API 모델의 서버 상태를 확인합니다.</li>
              </ul>
              <h3 style={{ color: "#5B5B5B" }}>Response</h3>
                <ul>
                  <li>Content-Type: application/json</li>
                </ul>
              <div className={styles.codeEX}>
                <div className={styles.codetop}>
                  <p>JSON</p>
                  <span
                    onClick={() =>
                      handleCopyClick(`{
  "status": "OK",
  "detail": "Server is healthy"
}`, 'status')
                    }
                  >
                    {copyStatus.status === "success" ? (
                      <span>✔ 복사되었습니다!</span>
                    ) : (
                      <span>📋Copy</span>
                    )}
                  </span>
                </div>
                <pre>
                  {`{
  "status": "OK",
  "detail": "Server is healthy"
}`}
                </pre>
              </div>
            </section>
            <section id="error-codes" className={styles.section}>
              <h2>에러 코드</h2>
              <p>
                API 사용 시 발생할 수 있는 일반적인 에러 코드와 의미는 다음과
                같습니다.
              </p>
              <hr />
              <table>
                <tbody>
                  <tr>
                    <td className={styles.td1}>400 Bad Request</td>
                    <td>| 음성 파일/YOUTUBE URL/API 키 중 하나가 누락되었습니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>401 Unauthorized</td>
                    <td>| 인증 실패입니다. 올바른 API 키를 제공하십시오.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>402 No YOUTUBE URL</td>
                    <td>| YOUTUBE URL이 올바르지 않습니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>403 Insufficient Credits</td>
                    <td>| Credit 추가 구매가 필요합니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>410 Only One File</td>
                    <td>| 1개의 파일만 분석할 수 있습니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>413 Payload Too Large</td>
                    <td>| 음성 파일의 크기가 허용 크기를 초과하였습니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>415 Invalid File Type</td>
                    <td>| 지원하지 않는 음성 파일입니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>500 Internal Server Error</td>
                    <td>| 웹 서버에 문제가 발생했습니다.</td>
                  </tr>
                  <tr>
                    <td className={styles.td1}>503 Service Unavailable</td>
                    <td>| AI 서버에 문제가 발생했습니다.</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ width: "840px" }}></div>
            </section>
            <section className={styles.section}>
              <div className={styles.contactUs}>
                <h2 style={{ textAlign: "center" }}>
                  Voice Verity와 함께해요.
                </h2>
                <p style={{ margin: "20px" }}>
                  당신의 든든한 파트너가 될 수 있습니다.
                </p>
                <button onClick={handleContactUs}>Contact Us</button>
              </div>
            </section>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
