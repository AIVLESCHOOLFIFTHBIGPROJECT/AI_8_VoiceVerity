import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import ReactAudioPlayer from "react-audio-player";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const [isOn1, setisOn1] = useState(true);
  const [isOn2, setisOn2] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const realAudioRef = useRef(null);
  const fakeAudioRef = useRef(null);
  const [hoveredProfile, setHoveredProfile] = useState(null);

  useEffect(() => {
    if (realAudioRef.current && fakeAudioRef.current) {
      const realAudioEl = realAudioRef.current.audioEl.current;
      const fakeAudioEl = fakeAudioRef.current.audioEl.current;

      const handleAudioEnded = () => {
        setPlayingAudio(null);
      };

      realAudioEl.addEventListener("ended", handleAudioEnded);
      fakeAudioEl.addEventListener("ended", handleAudioEnded);

      return () => {
        realAudioEl.removeEventListener("ended", handleAudioEnded);
        fakeAudioEl.removeEventListener("ended", handleAudioEnded);
      };
    }
  }, []);

  const handleTryVoiceVerity = () => {
    router.push("/try");
  }; // try페이지로 이동

  const handleSubscriptionPlan = () => {
    router.push("/plan");
  }; // plan페이지로 이동

  const handleContactUs = () => {
    router.push("/contact/1");
  }; // contact페이지로 이동

  const stopCurrentAudio = () => {
    if (realAudioRef.current.audioEl.current.src) {
      realAudioRef.current.audioEl.current.pause();
      realAudioRef.current.audioEl.current.currentTime = 0;
    }
    if (fakeAudioRef.current.audioEl.current.src) {
      fakeAudioRef.current.audioEl.current.pause();
      fakeAudioRef.current.audioEl.current.currentTime = 0;
    }
    setPlayingAudio(null);
  };

  const toggleHandler1 = () => {
    stopCurrentAudio();
    setisOn1((prevState) => !prevState);
  }; // 오디오 토글 버튼

  const toggleHandler2 = () => {
    stopCurrentAudio();
    setisOn2((prevState) => !prevState);
  };

  const playAudio = (profile, isReal) => {
    const audioToPlay = isReal
      ? `/audios/real_voice${profile}.wav`
      : `/audios/fake_voice${profile}.wav`;

    if (playingAudio === audioToPlay) {
      // 이미 재생 중인 오디오를 다시 클릭하면 정지
      setPlayingAudio(null);
      if (realAudioRef.current.audioEl.current.src.includes(audioToPlay)) {
        realAudioRef.current.audioEl.current.pause();
        realAudioRef.current.audioEl.current.currentTime = 0;
      }
      if (fakeAudioRef.current.audioEl.current.src.includes(audioToPlay)) {
        fakeAudioRef.current.audioEl.current.pause();
        fakeAudioRef.current.audioEl.current.currentTime = 0;
      }
    } else {
      // 다른 오디오 클릭 시, 현재 재생 중인 오디오 정지
      stopCurrentAudio();
      setPlayingAudio(audioToPlay);
      setAudioSrc(audioToPlay);

      setTimeout(() => {
        if (isReal) {
          realAudioRef.current.audioEl.current.play();
        } else {
          fakeAudioRef.current.audioEl.current.play();
        }
      }, 0);
    }
  };

  const Panel = ({ pages }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [animationClass, setAnimationClass] = useState('');
  
    const nextPage = () => {
      setAnimationClass(styles.fadeOutNext);
      setTimeout(() => {
        setCurrentPage((prevPage) => (prevPage + 1) % pages.length);
        setAnimationClass(styles.fadeInNext);
      }, 300);
    }; //다음 패널 이동
  
    const prevPage = () => {
      setAnimationClass(styles.fadeOutPrev);
      setTimeout(() => {
        setCurrentPage((prevPage) => (prevPage - 1 + pages.length) % pages.length);
        setAnimationClass(styles.fadeInPrev);
      }, 300);
    }; //이전 패널 이동
  
    const goToPage = (index) => {
      if (index === currentPage) return;
      const isNext = index > currentPage;
      setAnimationClass(isNext ? styles.fadeOutNext : styles.fadeOutPrev);
      setTimeout(() => {
        setCurrentPage(index);
        setAnimationClass(isNext ? styles.fadeInNext : styles.fadeInPrev);
      }, 300);
    }; //패널 이동 효과
  
    useEffect(() => {
      const interval = setInterval(() => {
        nextPage();
      }, 5000);
      return () => clearInterval(interval);
    }, []); //5초 후 자동으로 다음 패널로 넘어감
  
    return (
      <div className={styles.panelcontainer}>
        <button
          className={styles.prevbtn}
          onClick={prevPage}
        >
          {"<"}
        </button>
        <button
          className={styles.nextbtn}
          onClick={nextPage}
        >
          {">"}
        </button>
        <div className={`${styles.panel} ${animationClass}`}>
          {pages[currentPage].content}
        </div>
        <div className={styles.indicatorContainer}>
          {pages.map((_, index) => (
            <span
              key={index}
              className={`${styles.indicator} ${index === currentPage ? styles.active : ''}`}
              onClick={() => goToPage(index)}
            />
          ))}
        </div>
      </div>
    );
  };

  const pages = [
    {
      content: (
        <div className={styles.textContainer}>
          <p className="phrase">
            <span> 파헤치다, </span>
            <br className="gap"></br>
            <span>구분하다,</span>
            <br className="gap"></br>
            <span>
              <span style={{ color: "#0300A7", margin: "0px" }}>진실</span>을
              말하다.
            </span>
          </p>
          <div className={styles.buttonContainer}>
            <div className={styles.logo} />
            <button onClick={handleTryVoiceVerity}>Try Voice Verity</button>
          </div>
        </div>
      ),
    },
    {
      content: (
        <div className={styles.payContainer}>
          <div className={styles.payinfo}>
            <p>우리의 서비스</p>
            <p>딱, 한 장</p>
            <div
              className={styles.paylogo}
              style={{ backgroundImage: "url(/images/pay.png)" }}
            ></div>
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={handleSubscriptionPlan}>Subscription Plan</button>
          </div>
        </div>
      ),
    },
    {
      content: (
        <div
          className={styles.textContainer}
          style={{ marginLeft: "50px", marginRight: "50px" }}
        >
          <p className="phrase">
            <span> 우리랑, </span>
            <br className="gap"></br>
            <span>일하고</span>
            <br className="gap"></br>
            <span>싶니?</span>
          </p>
          <div className={styles.buttonContainer}>
            <div className={styles.hand} />
            <button onClick={handleContactUs} style={{ width: "250px" }}>
              Contact Us
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.homeContainer}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.mainContent}>
        <Panel pages={pages} />
        <div className={styles.infoSection}>
          <h2>
            Voice Verity, 목소리에{" "}
            <span style={{ color: "#0300A7" }}>진실성</span>을 더하다.
          </h2>
          <p>수화기 너머의 목소리가 진짜 목소리일까요?</p>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <h2>Preview</h2>
              <h3>
                슈뢰딩거의 목소리를{" "}
                <span style={{ color: "#0300A7" }}>체험해보려면</span>
              </h3>
              <p>이거 내 목소리 맞아?</p>
              <p>얼마나 진짜 같을까? Fake Voice!</p>
              <button
                className={styles.infobutton}
                onClick={handleTryVoiceVerity}
              >
                체험하러 가기
              </button>
            </div>
            <div className={styles.infoItem}>
              <h2>API Service</h2>
              <h3>
                우리 서비스를{" "}
                <span style={{ color: "#0300A7" }}>구독하고 싶다면</span>
              </h3>
              <p>아 싸다 싸!</p>
              <p>우리 서비스 완전 싸요!</p>
              <button onClick={handleSubscriptionPlan}>구독플랜 보기</button>
            </div>
          </div>
        </div>
        <div className={styles.voiceverity}>
          <h2>독보적인 AI 음성 탐지 기술, Voice Verity</h2>
          <p>
            Voice Verity는 짧은 시간의 통화음으로도 목소리를 구별하는 기술을
            갖추고 있습니다.
          </p>
          <div>
            <div className={styles.dataicon} />
            <ul>
              Building a Deep Voice Dataset
              <li>
                생성형 AI를 이용한 고품질 한국어 딥보이스 데이터셋을 자체
                구축했습니다.
              </li>
            </ul>
          </div>
          <div>
            <div className={styles.callicon} />
            <ul>
              Deep Learning Deep Voice Detection
              <li>
                딥러닝 기반의 딥보이스 분류 모델을 개발하여 정확하게 딥보이스를
                탐지합니다.
              </li>
            </ul>
          </div>
          <div>
            <div className={styles.timeicon} />
            <ul>
              Real-Time Deep Voice Analysis
              <li>
                최신 딥러닝 모델을 이용하여 높은 정확성과 빠른 추론 속도의
                모델을 이용하여 통화 상태에서의 실시간 딥보이스 분석을
                지원합니다.
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.listensection}>
          <div style={{ height: "fit-content" }}>
            <h2>Deep Voice(딥보이스)를 들어보세요</h2>
            <p style={{ margin: "30px 0 5px 0" }}>
              사이버 범죄 수법으로 Deep Voice를 사용하는 비율이 늘어나고
              있습니다.
            </p>
            <p style={{ margin: "5px 0 30px 0" }}>
              실제 사람의 목소리와 얼마나 비슷한지 귀 기울여 들어보세요.
            </p>
          </div>
          <section>
            <li>
              * 사진 속 인물과 목소리의 주인은 전혀 다른 사람임을 알려드립니다.
            </li>
            <div className={styles.profileSection}>
              <div className={styles.profileContainer}>
                <div
                  className={styles.profile}
                  onMouseEnter={() => setHoveredProfile(1)}
                  onMouseLeave={() => setHoveredProfile(null)}
                  onClick={() => playAudio(1, isOn1)}
                >
                  <div className={styles.profileeek} />
                  {playingAudio === `/audios/real_voice1.wav` ||
                  playingAudio === `/audios/fake_voice1.wav` ? (
                    <div className={styles.playButton}>⏸</div>
                  ) : (
                    hoveredProfile === 1 && (
                      <div className={styles.playButton}>▶</div>
                    )
                  )}
                </div>
                <div className={styles.toggleline}>
                  <button
                    className={`${styles.toggle} ${
                      isOn1 ? styles.real : styles.fake
                    }`}
                    onClick={toggleHandler1}
                  >
                    <div className={styles.toggleitem}></div>
                  </button>
                  <p style={{ fontSize: "24px" }}>
                    {" "}
                    {isOn1 ? "Real Voice" : "Fake Voice"}
                  </p>
                </div>
              </div>
              <div className={styles.profileContainer}>
                <div
                  className={styles.profile}
                  onMouseEnter={() => setHoveredProfile(2)}
                  onMouseLeave={() => setHoveredProfile(null)}
                  onClick={() => playAudio(2, isOn2)}
                >
                  <div className={styles.profilejuj} />
                  {playingAudio === `/audios/real_voice2.wav` ||
                  playingAudio === `/audios/fake_voice2.wav` ? (
                    <div className={styles.playButton}>⏸</div>
                  ) : (
                    hoveredProfile === 2 && (
                      <div className={styles.playButton}>▶</div>
                    )
                  )}
                </div>
                <div className={styles.toggleline}>
                  <button
                    className={`${styles.toggle} ${
                      isOn2 ? styles.real : styles.fake
                    }`}
                    onClick={toggleHandler2}
                  >
                    <div className={styles.toggleitem}></div>
                  </button>
                  <p style={{ fontSize: "24px" }}>
                    {" "}
                    {isOn2 ? "Real Voice" : "Fake Voice"}
                  </p>
                </div>
              </div>
            </div>
            <ReactAudioPlayer
              src={audioSrc}
              ref={realAudioRef}
              controls
              style={{ display: "none" }}
            />
            <ReactAudioPlayer
              src={audioSrc}
              ref={fakeAudioRef}
              controls
              style={{ display: "none" }}
            />
          </section>
        </div>
        <div className={styles.do}>
          <div>
            <div style={{ height: "fit-content" }}>
              <h2>Voice Verity로 어떤 걸 할 수 있을까요?</h2>
              <p>
                Voice Verity는 생각지도 못한 다양한 곳에 사용될 수 있습니다.
              </p>
            </div>
            <div className={styles.row}>
              <div className={styles.column}>
                <section>
                  <div className={styles.space}>
                    <div className={styles.icon}>
                      <div className={styles.enter} />
                    </div>
                  </div>
                  <h2
                    style={{
                      margin: "0px 0px 0px 20px",
                      fontSize: "34px",
                      textAlign: "left",
                    }}
                  >
                    Entertainment
                  </h2>
                  <ul>
                    <li>성우 및 가수의 딥보이스 무단 사용 탐지</li>
                    <li>음성 합성 기술의 품질 평가</li>
                  </ul>
                </section>
                <section>
                  <div className={styles.space}>
                    <div className={styles.prevent} />
                  </div>
                  <h2
                    style={{
                      margin: "0px 0px 0px 20px",
                      fontSize: "34px",
                      textAlign: "left",
                    }}
                  >
                    Prevention
                  </h2>
                  <ul>
                    <li>음성 인증 시스템의 보안 강화</li>
                    <li>통화 중 실시간 딥페이크 음성 탐지</li>
                  </ul>
                </section>
                <section>
                  <div className={styles.space}>
                    <div className={styles.icon}>
                      <div className={styles.media} />
                    </div>
                  </div>
                  <h2
                    style={{
                      margin: "0px 0px 0px 20px",
                      fontSize: "34px",
                      textAlign: "left",
                    }}
                  >
                    Media literacy
                  </h2>
                  <ul>
                    <li>뉴스나 라디오의 음성 진위 확인</li>
                    <li>영화나 TV 프로그램에서 사용된 음성의 진위 여부 검증</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.youtubeSection}>
          <div>
            <h2>우리의 Dev Story</h2>
            <p style={{ margin: "30px 0 5px 0" }}>
              Voice Verity의 시작은 어디서부터였을까요? Voice Verity의 이야기를
              만나보세요.
            </p>
            <p style={{ margin: "5px 0 30px 0" }}>
              우리의 이야기는 끝나지 않았습니다.
            </p>
          </div>
          
          <div className={styles.youtubeContainer}>
          {/* 유튜브 프레임*/}  
            <iframe
              src="https://www.youtube.com/embed/OIbLEwy_O1s"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
        <div className={styles.contactUs}>
          <h2>Voice Verity와 함께해요.</h2>
          <p style={{ margin: "20px" }}>
            당신의 든든한 파트너가 될 수 있습니다.
          </p>
          <button onClick={handleContactUs}>Contact Us</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
