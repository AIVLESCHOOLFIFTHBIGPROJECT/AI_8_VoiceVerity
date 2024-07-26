import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import styles from "../styles/Apimanagement.module.css";
import Footer from "../components/Footer";
import PasswordModal from "../components/PasswordModal"; // Import PasswordModal

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ApiManagement = () => {
  const [user, setUser] = useState(null);
  const [dailyCredits, setDailyCredits] = useState(0);
  const [additionalCredits, setAdditionalCredits] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);
  const [usedCredits, setUsedCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [todaytotalCredits, setTodayTotalCredits] = useState(0);
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [apiKey, setApiKey] = useState(null);
  const [apiLastUsed, setApiLastUsed] = useState(null);
  const [apiStatus, setApiStatus] = useState(false); // Activate status
  const [isApiServerOn, setIsApiServerOn] = useState(false); // API Server status
  const [isOpen, setMenu] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState("hourly");
  const [trafficData, setTrafficData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [inputWidth, setInputWidth] = useState("auto");
  const [text, setText] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${BACKEND_URL}/api/user-info/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
          withCredentials: true, // 세션 인증을 위해 필요
        })
        .then((response) => {
          setUser(response.data);
          fetchApiKey(token);
          fetchCredits(token);
          checkApiServerStatus(token); // Check API server status
        })
        .catch((error) => {
          console.error("사용자 정보 가져오기 오류", error);
          alert("로그인 후 이용 가능합니다.");
          router.push("/home");
        });
    } else {
      alert("로그인 후 이용 가능합니다.");
      router.push("/home");
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchTrafficData(selectedInterval);
      fetchSummaryData(selectedInterval);
    }
  }, [selectedInterval, user]); //user 마다 저장된 트래픽과 요약 가져오기

  useEffect(() => {
    // Set initial input width based on the text length
    if (text) {
      const width = `${text.length + 1}ch`;
      setInputWidth(width);
    }
  }, [text]);

  const fetchApiKey = (token) => {
    axios
      .get(`${BACKEND_URL}/api/get-api-key/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        withCredentials: true, // 세션 인증을 위해 필요
      })
      .then((response) => {
        setApiKey(response.data.api_key);
        setApiLastUsed(response.data.last_used_at);
        setApiStatus(response.data.is_active);
        const apiKeyText = response.data.api_key || "발급된 키 없음";
        setText(apiKeyText); //키 폼에 띄울 글자 받아옴
      })
      .catch((error) => {
        console.error("API Key 가져오기 오류", error);
      });
  };

  const fetchCredits = (token) => {
    axios
      .get(`${BACKEND_URL}/api/get-credits/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        withCredentials: true, // 세션 인증을 위해 필요
      })
      .then((response) => {
        setTodayTotalCredits(response.data.total_credits);
        setDailyCredits(response.data.remaining_daily_credits);
        setAdditionalCredits(response.data.remaining_additional_credits);
        setRemainingCredits(response.data.total_remaining_credits);
        setFreeCredits(response.data.remaining_free_credits);
        setUsedCredits(response.data.used_credits);
        setTotalCredits(response.data.total_credits);
      })
      .catch((error) => {
        console.error("크레딧 가져오기 오류", error);
      });
  };

  const checkApiServerStatus = (token) => {
    axios
      .get(`${BACKEND_URL}/api/check-api-status/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        withCredentials: true, // 세션 인증을 위해 필요
      })
      .then((response) => {
        setIsApiServerOn(response.data.status === "OK");
      })
      .catch((error) => {
        setIsApiServerOn(false);
        console.error("API 서버 상태 확인 오류", error);
      });
  };

  const fetchTrafficData = (interval) => {
    axios
      .get(`${BACKEND_URL}/api/call-history/?interval=${interval}`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("token")}`,
        },
        withCredentials: true, // 세션 인증을 위해 필요
      })
      .then((response) => {
        setTrafficData(response.data);
      })
      .catch((error) => {
        console.error("트래픽 데이터 가져오기 오류", error);
      });
  };

  const fetchSummaryData = (interval) => {
    axios
      .get(`${BACKEND_URL}/api/call-summary/?interval=${interval}`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("token")}`,
        },
        withCredentials: true, // 세션 인증을 위해 필요
      })
      .then((response) => {
        setSummaryData(response.data);
      })
      .catch((error) => {
        console.error("요약 데이터 가져오기 오류", error);
      });
  };

  const openPasswordModal = (action) => {
    setPasswordAction(() => action);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (password) => {
    if (passwordAction) {
      passwordAction(password);
    }
  };

  const handleGenerateApiKey = (password) => {
    axios
      .post(
        `${BACKEND_URL}/api/get-api-key/`,
        { password },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        setApiKey(response.data.api_key);
        setText(response.data.api_key);
        setApiStatus(true);
      })
      .catch((error) => {
        if (error.response && error.response.data.error) {
          alert(error.response.data.error);
        } else {
          console.error("API Key 생성 오류", error);
        }
      });
  };

  const handleRegenerateApiKey = (password) => {
    axios
      .post(
        `${BACKEND_URL}/api/regenerate-api-key/`,
        { password },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        setApiKey(response.data.api_key);
        setText(response.data.api_key);
      })
      .catch((error) => {
        if (error.response && error.response.data.error) {
          alert(error.response.data.error);
        } else {
          console.error("API Key 재생성 오류", error);
        }
      });
  };

  const handleDeleteApiKey = (password) => {
    axios
      .post(
        `${BACKEND_URL}/api/delete-api-key/`,
        { password },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      )
      .then(() => {
        setApiKey(null);
        setText("발급된 키 없음");
        setApiStatus(false);
      })
      .catch((error) => {
        if (error.response && error.response.data.error) {
          alert(error.response.data.error);
        } else {
          console.error("API Key 삭제 오류", error);
        }
      });
  };

  const handleToggleApiStatus = (status) => {
    openPasswordModal((password) => {
      axios
        .post(
          `${BACKEND_URL}/api/toggle-api-status/`,
          { password, status },
          {
            headers: {
              Authorization: `Token ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
          }
        )
        .then((response) => {
          setApiStatus(response.data.status);
        })
        .catch((error) => {
          if (error.response && error.response.data.error) {
            alert(error.response.data.error);
          } else {
            console.error("API Key 상태 변경 오류", error);
          }
        });
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleLogoClick = () => {
    router.push("/home");
  };

  const toggleMenu = () => {
    setMenu((isOpen) => !isOpen);
  }; //메뉴바 열림 닫힘 토글

  const handleIntervalChange = (interval) => {
    setSelectedInterval(interval);
  };

  const handleChange = (event) => {
    const newText = event.target.value;
    setText(newText);

    // Update input width based on new text length
    const newWidth = `${newText.length + 1}ch`;
    setInputWidth(newWidth);
  }; //새로 발급된 키 글자와 글자수 설정

  const handleCopyApiKey = () => {
    if (apiKey) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(apiKey).then(
          () => {
            alert("API Key가 복사되었습니다.");
          },
          (error) => {
            console.error("API Key 복사 오류", error);
            alert("API Key 복사 오류가 발생했습니다.");
          }
        );
      } else {
        // Fallback for Clipboard API not supported
        const textArea = document.createElement("textarea");
        textArea.value = apiKey;
        // Avoid scrolling to bottom
        textArea.style.position = "fixed";
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.opacity = 0;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          alert("API Key가 복사되었습니다.");
        } catch (err) {
          console.error("Fallback: API Key 복사 오류", err);
          alert("API Key 복사 오류가 발생했습니다.");
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const renderSummary = () => {
    if (
      !summaryData.total_calls &&
      !summaryData.avg_response_time &&
      !summaryData.max_calls_time &&
      !summaryData.min_calls_time &&
      !summaryData.success_rate
    ) {
      return <p>API 사용 기록이 없습니다.</p>;
    }

    return (
      <div>
        <p>총 API 호출 수: {summaryData.total_calls}</p>
        <p>평균 응답 시간: {summaryData.avg_response_time} ms</p>
        <p>가장 많은 호출 시간: {summaryData.max_calls_time}</p>
        <p>가장 적은 호출 시간: {summaryData.min_calls_time}</p>
        <p>성공률: {summaryData.success_rate} %</p>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        const data = {
          labels: ["Daily", "Additional", "Used"],
          datasets: [
            {
              data: [freeCredits + dailyCredits, additionalCredits, usedCredits],
              backgroundColor: ["#FFCE56", "#FF6384", "#CCCCCC"],
            },
          ],
        };

        const trafficLabels = trafficData.map((item) => item.label);
        const trafficCounts = trafficData.map((item) => item.count);

        const trafficDataChart = {
          labels: trafficLabels,
          datasets: [
            {
              label: "API Calls",
              data: trafficCounts,
              fill: false,
              borderColor: "rgba(75, 192, 192, 1)",
              tension: 0.1,
            },
          ],
        };

        const trafficOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        };

        return (
          <div className={styles.content}>
            <div className={styles.row}>
              <div className={styles.card}>
                <h3>Total Credits</h3>
                <div className={styles.totalcredit}>
                  {freeCredits + dailyCredits === 0 && additionalCredits === 0 ? (
                    <p>남은 Credit이 없습니다.</p>
                  ) : (
                    <>
                      <p>⦁ Daily: {freeCredits + dailyCredits}개</p>
                      <p>⦁ Additional: {additionalCredits}개</p>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.card}>
                <h3>Credit Usage</h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "-20px",
                    justifyContent: 'center'
                  }}
                >
                  <div className={styles.cardcontent}>
                    <div className={styles.doughnutWrapper}>
                      <Doughnut
                        width="100px"
                        data={data}
                        style={{ width: "100px", height: "150px" }}
                        options={{
                          cutout: "70%",
                          responsive: false,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                    <div className={styles.usageleft}>
                      <span>
                        {Math.round(
                          ((todaytotalCredits - usedCredits) /
                            todaytotalCredits) *
                            100
                        )}
                        % | {remainingCredits} Credits
                      </span>
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                      <div
                        className={styles.legendColorBox}
                        style={{ backgroundColor: "#FFCE56" }}
                      ></div>
                      Daily
                    </div>
                    <div className={styles.legendItem}>
                      <div
                        className={styles.legendColorBox}
                        style={{ backgroundColor: "#FF6384" }}
                      ></div>
                      Additional
                    </div>
                    <div className={styles.legendItem}>
                      <div
                        className={styles.legendColorBox}
                        style={{ backgroundColor: "#CCCCCC" }}
                      ></div>
                      Used
                    </div>
                  </div>
                </div>
                <button
                  className={styles.purchaseButton}
                  onClick={() => router.push("/plan")}
                >
                  크레딧 추가구매
                </button>
              </div>
              <div className={styles.separator}></div>
              <div className={styles.card}>
                <h3>API Status</h3>
                <div className={styles.apiStatus}>
                  <p>내 API Key: {apiKey || "현재 키 없음"}</p>
                  <p>
                    현재 API 서버:{" "}
                    {isApiServerOn ? (
                      <span style={{ color: "green" }}>ON</span>
                    ) : (
                      <span style={{ color: "red" }}>OFF</span>
                    )}
                  </p>
                  <p>
                    마지막 사용 시간:{" "}
                    {apiLastUsed ? apiLastUsed : "사용한 기록이 없습니다."}
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.trafficSummary}>
              <div className={styles.traffic}>
                <h3>Traffic</h3>
                <div className={styles.intervalTabs}>
                  <button onClick={() => handleIntervalChange("hourly")}>
                    시간별(24시간)
                  </button>
                  <button onClick={() => handleIntervalChange("daily")}>
                    일별(일주일)
                  </button>
                  <button onClick={() => handleIntervalChange("weekly")}>
                    주별(6개월)
                  </button>
                  <button
                    onClick={() => handleIntervalChange("monthly")}
                    style={{ border: "none" }}
                  >
                    월별(1년)
                  </button>
                </div>
                <div className={styles.graph}>
                  {trafficData.length > 0 ? (
                    <Line data={trafficDataChart} options={trafficOptions} />
                  ) : (
                    <div className={styles.noDataMessage}>
                      API 사용 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.summary}>
                <h3>Summary</h3>
                <div style={{ height: "33.4px" }} />
                <div className={styles.graph}>{renderSummary()}</div>
              </div>
            </div>
          </div>
        );
      case "apiManagement":
        return (
          <div className={styles.content}>
            <div className={styles.apiCard}>
              <div className={styles.keydlete}>
                <h3>내 API Key</h3>
                {apiKey && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => openPasswordModal(handleDeleteApiKey)}
                  >
                    키 삭제
                  </button>
                )}
              </div>
              <div style={{ margin: "0 50px" }}>
                <div className={styles.keySection}>
                  <h3 style={{ width: "30%" }}>Key Value</h3>
                  <div className={styles.keyContainer}>
                    <input
                      className={styles.keyValue}
                      onChange={handleChange} // Use handleChange function
                      ref={inputRef}
                      value={text}
                      disabled
                      size={apiKey ? apiKey.length : 32}
                      style={{ width: inputWidth }} // Apply the dynamic width
                    />
                    <div className={styles.buttonContainer}>
                      <button
                        className={styles.button}
                        onClick={
                          apiKey
                            ? () => openPasswordModal(handleRegenerateApiKey)
                            : () => openPasswordModal(handleGenerateApiKey)
                        }
                      >
                        {apiKey ? "재발급" : "키 발급"}
                      </button>
                      {apiKey && (
                        <button
                          className={`${styles.button} ${styles.copyButton}`}
                          onClick={handleCopyApiKey}
                        >
                          키 복사
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.statusSection}>
                  <h3 style={{ width: "50%" }}>Activate Status</h3>
                  <div className={styles.use}>
                    <input
                      type="radio"
                      name="status"
                      value="사용함"
                      checked={apiStatus}
                      onChange={() => handleToggleApiStatus(true)}
                    />{" "}
                    사용함
                    <input
                      type="radio"
                      name="status"
                      value="사용 안함"
                      style={{ marginLeft: "20px" }}
                      checked={!apiStatus}
                      onChange={() => handleToggleApiStatus(false)}
                    />{" "}
                    사용 안함
                  </div>
                </div>
              </div>
              <div className={styles.nocontent}>🚧
                <p>~ 기능 추가 예정 ~</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.dashboard}>
        <p className={isOpen ? styles.open : styles.hide} onClick={toggleMenu}>
          ◁
        </p>
        <div className={isOpen ? styles.sidebar : styles.sidebaroff}>
          <div className={styles.logo}>
            <img
              src="/images/logo.png"
              alt="Voice Verity Logo"
              onClick={handleLogoClick}
            />
            <h2>Voice Verity</h2>
          </div>
          <ul className={styles.menu}>
            <li
              className={currentPage === "dashboard" ? styles.activeli : ""}
              onClick={() => setCurrentPage("dashboard")}
            >
              Dashboard
              <div
                className={currentPage === "dashboard" ? styles.active : ""}
              />
            </li>
            <li
              className={currentPage === "apiManagement" ? styles.activeli : ""}
              onClick={() => setCurrentPage("apiManagement")}
            >
              API 관리
              <div
                className={currentPage === "apiManagement" ? styles.active : ""}
              />
            </li>
            <li onClick={() => alert("🚧 추후 기능이 추가될 예정입니다.")}>🚧 보안 및 인증</li>
            <li onClick={() => alert("🚧 추후 기능이 추가될 예정입니다.")}>🚧 알림 설정</li>
          </ul>
        </div>
        <div className={styles.main}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>{currentPage === "dashboard" ? "Dashboard" : "API 관리"}</h1>
              <span>Welcome! {user ? user.username : "[User name]"}님</span>
            </div>
            <div className={styles.user} onClick={toggleDropdown}>
              <img
                src={
                  user && user.profile_image_url
                    ? `${BACKEND_URL}${user.profile_image_url}`
                    : "/images/userinfo/profile_default.png"
                }
                alt="Profile"
                className={styles.profileImage}
              />
              <div>
                <span className={styles.userName}>
                  {user ? user.username : "User Name"}
                </span>
                <span className={styles.userEmail}>
                  {user ? user.email : "User ID"}
                </span>
              </div>
              <div className={styles.dropdownIcon}>▼</div>
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <ul>
                    <li onClick={() => router.push("/user-info")}>내 정보</li>
                    <li onClick={() => router.push("/myplan")}>내 구독</li>
                    <li onClick={handleLogout}>로그아웃</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onRequestClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
      <Footer />
    </div>
  );
};

export default ApiManagement;
