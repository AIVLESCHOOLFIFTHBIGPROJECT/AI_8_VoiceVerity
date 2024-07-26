import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import WaveSurfer from "wavesurfer.js";
import styles from "../styles/Try.module.css";

Chart.register(annotationPlugin);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const ALLOWED_EXTENSIONS = [".wav", ".m4a", ".mp3"];
const MAX_FILE_SIZE_MB = 200;

export default function TryVoice() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [inputType, setInputType] = useState("file");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [fakeCount, setFakeCount] = useState(0);
  const [realCount, setRealCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragFileName, setDragFileName] = useState("");
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const waveSurferRef = useRef(null);
  const waveContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (waveContainerRef.current && file) {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
      waveSurferRef.current = WaveSurfer.create({
        container: waveContainerRef.current,
        waveColor: "#CCCCCC",
        progressColor: "#9B90D2",
      });

      waveSurferRef.current.on("ready", () => {
        setDuration(formatTime(waveSurferRef.current.getDuration()));
        setCurrentTime("0:00");
      });

      waveSurferRef.current.on("audioprocess", () => {
        setCurrentTime(formatTime(waveSurferRef.current.getCurrentTime()));
      });

      waveSurferRef.current.on("seek", (progress) => {
        const newTime = waveSurferRef.current.getDuration() * progress;
        waveSurferRef.current.setCurrentTime(newTime);
        setCurrentTime(formatTime(newTime));
        waveSurferRef.current.play();
        setIsPlaying(true);
      });

      waveSurferRef.current.on("finish", () => {
        setIsPlaying(false);
        waveSurferRef.current.stop();
      });

      const reader = new FileReader();
      reader.onload = (event) => {
        waveSurferRef.current.load(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  useEffect(() => {
    const handleWaveformClick = () => {
      if (!isPlaying) {
        handlePlayPause();
        handlePlayPause();
      }
    };

    if (waveContainerRef.current) {
      waveContainerRef.current.addEventListener("click", handleWaveformClick);
    }

    return () => {
      if (waveContainerRef.current) {
        waveContainerRef.current.removeEventListener(
          "click",
          handleWaveformClick
        );
      }
    };
  }, [isPlaying, waveContainerRef.current]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours > 0 ? `${hours}:` : ""}${
      minutes < 10 && hours > 0 ? "0" : ""
    }${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSubscriptionPlan = () => {
    router.push("/plan");
  };

  const handleUploadClick = (e) => {
    // No need to check for login here
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    const fileSizeMB = selectedFile.size / (1024 * 1024);

    if (!ALLOWED_EXTENSIONS.includes(`.${fileExtension}`)) {
      alert("Invalid file type. Allowed extensions are: .wav, .mp3, .m4a");
      return;
    }

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert("File size exceeds the 200MB limit.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setIsPlaying(false); // Reset the play/pause state
    e.target.value = ""; // Reset the file input value to allow re-upload of the same file
  };

  const handleExampleClick = (exampleFile) => {
    // No need to check for login here
    // Load the file from the public/audios directory
    const filePath = `/audios/${exampleFile}`;

    setFileName(exampleFile);
    fetch(filePath)
      .then((response) => response.blob())
      .then((blob) => {
        const newFile = new File([blob], exampleFile, { type: blob.type });
        setFile(newFile);
        setIsPlaying(false); // Reset the play/pause state
      })
      .catch((error) => console.error("Error fetching example file:", error));
  };

  const handleFileRemove = () => {
    setFile(null);
    setFileName("");
    setIsPlaying(false); // Reset the play/pause state
  };

  const handleFileNameClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후, 이용 가능합니다.");
      return;
    }

    if (inputType === "file") {
      if (!file) {
        alert("음성 파일을 업로드가 필요합니다.");
        return;
      }

      const previousFileName = localStorage.getItem("previousFileName");

      if (previousFileName === fileName) {
        const confirmRetry = confirm(
          "체험하기 서비스는 하루 5회만 이용 가능한 서비스입니다.\n동일한 파일 분석 내역이 있습니다. 그래도 해당 파일로 분석하시겠습니까?"
        );
        if (!confirmRetry) {
          return;
        }
      }

      localStorage.setItem("previousFileName", fileName);

      setLoading(true);
      setResult("");
      setPredictions([]);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/upload-audio/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Token ${token}`,
            },
          }
        );
        const analysisResult = response.data.analysis_result;
        const predictions = response.data.predictions;
        const fakeCount = response.data.fake_cnt;
        const realCount = response.data.real_cnt;

        setResult(analysisResult);
        setPredictions(predictions || []);
        setFakeCount(fakeCount);
        setRealCount(realCount);
        setLoading(false);
      } catch (error) {
        console.error("Error uploading file", error);
        if (
          error.response &&
          error.response.status === 403 &&
          error.response.data.error ===
            "You have reached the maximum number of uploads for today"
        ) {
          alert(
            "오늘 체험 가능한 횟수를 모두 소진하셨습니다.\n엔터하고 내일 다시 이용해 주세요."
          );
        } else {
          alert("Error uploading file");
        }
        setLoading(false);
      }
    } else {
      if (!url) {
        alert("YouTube URL을 입력해주세요.");
        return;
      }

      const previousUrl = localStorage.getItem("previousUrl");

      if (previousUrl === url) {
        const confirmRetry = confirm(
          "체험하기 서비스는 하루 5회만 이용 가능한 서비스입니다.\n동일한 유튜브 영상 분석 기록이 있습니다. 그래도 해당 링크를 분석하시겠습니까?"
        );
        if (!confirmRetry) {
          return;
        }
      }

      localStorage.setItem("previousUrl", url);

      setLoading(true);
      setResult("");
      setPredictions([]);

      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/upload-youtube/`,
          { url },
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        const { analysis_result, predictions, fake_cnt, real_cnt } =
          response.data;

        setResult(analysis_result);
        setPredictions(predictions || []);
        setFakeCount(fake_cnt);
        setRealCount(real_cnt);
        setLoading(false);
      } catch (error) {
        console.error("Error uploading YouTube URL", error);
        if (
          error.response &&
          error.response.status === 400 &&
          error.response.data.error === "Invalid YouTube URL"
        ) {
          alert("올바른 YouTube URL을 입력해주세요.");
        } else {
          alert("Error uploading YouTube URL");
        }
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (predictions.length > 0) {
      if (lineChartRef.current) {
        lineChartRef.current.destroy();
      }
      const ctx1 = document.getElementById("lineChart").getContext("2d");
      lineChartRef.current = new Chart(ctx1, {
        type: "line",
        data: {
          labels: predictions.map((_, index) => index + 1),
          datasets: [
            {
              label: "Real/Fake Probability",
              data: predictions,
              fill: false,
              pointRadius: 0,
              borderColor: "rgb(155, 144, 210)",
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
            annotation: {
              annotations: {
                line1: {
                  type: "line",
                  yMin: 0.8,
                  yMax: 0.8,
                  borderColor: "red",
                  borderWidth: 2,
                  borderDash: [10, 5],
                  label: {
                    content: "0.8 (Fake)",
                    enabled: true,
                    position: "end",
                    backgroundColor: "rgba(255, 99, 132, 0.25)",
                  },
                },
              },
            },
          },
          responsive: false,
          scales: {
            x: {
              title: {
                display: false,
                text: "Seconds",
              },
              grid: {
                display: false,
              },
            },
            y: {
              grace: "100%",
              title: {
                display: false,
                text: "Probability (Real)",
              },
              grid: {
                display: false,
              },
              min: 0,
              max: 1,
            },
          },
        },
      });

      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
      const ctx2 = document.getElementById("pieChart").getContext("2d");
      pieChartRef.current = new Chart(ctx2, {
        type: "pie",
        data: {
          labels: ["Real", "Fake"],
          datasets: [
            {
              data: [realCount, fakeCount],
              backgroundColor: ["#CCCCCC", "#9B90D2"],
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            afterDraw: function (chart) {
              const ctx = chart.ctx;
              const meta = chart.getDatasetMeta(0);
              const fakePercentage =
                (fakeCount / (fakeCount + realCount)) * 100;
              const fakeAngle = (fakePercentage / 100) * 2 * Math.PI;

              if (fakePercentage > 30) {
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#FF0000";
                ctx.setLineDash([5, 5]);

                const chartArea = chart.chartArea;
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
                const outerRadius = chart.getDatasetMeta(0).data[0].outerRadius;

                ctx.arc(centerX, centerY, outerRadius, 0, fakeAngle);
                ctx.stroke();
                ctx.restore();
              }
            },
          },
        },
      });
    }
  }, [predictions, fakeCount, realCount]);

  const handlePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
      setIsPlaying(waveSurferRef.current.isPlaying());
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const selectedFile = e.dataTransfer.items[0].getAsFile(); // 드래그 중인 파일 가져오기
      if (selectedFile) {
        setDragFileName(selectedFile.name); // 드래그 파일 이름 설정
      }
    }
    setDragging(true); // 드래그 상태 설정
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false); // 드래그 상태 초기화
    setDragFileName(""); // 드래그 파일 이름 초기화

    if (e.dataTransfer.files && e.dataTransfer.files.length > 1) {
      alert("하나의 File만 업로드 해주세요.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      const fileSizeMB = selectedFile.size / (1024 * 1024);

      if (!ALLOWED_EXTENSIONS.includes(`.${fileExtension}`)) {
        alert("Invalid file type. Allowed extensions are: .wav, .mp3, .m4a");
        return;
      }

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        alert("File size exceeds the 200MB limit.");
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsPlaying(false); // 재생/일시정지 상태 초기화
    }
  };

  const handleDragLeave = () => {
    setDragging(false); // 드래그 상태 초기화
    setDragFileName(""); // 드래그 파일 이름 초기화
  };

  const handleInputChange = (e) => {
    setInputType(e.target.value);
    if (e.target.value === "file") {
      setUrl("");
    } else {
      setFile(null);
      setFileName("");
    }
  };

  return (
    <div className={styles.previewContext}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.mainContent}>
        <div className={styles.block}>
          <div style={{ height: "100px" }} />
          <h1>Try Voice Verity</h1>
          <h2>
            Voice Verity에서는 실시간 통화 중 딥보이스를 감지할 수 있습니다.
          </h2>
          <h2>Deep Fake Voice를 탐지하는 순간을 체험해보세요.</h2>
          <div style={{ textAlign: "-webkit-center" }}>
            <form onSubmit={handleSubmit}>
              <div className={styles.radioButtons}>
                <label>
                  <input
                    type="radio"
                    value="file"
                    checked={inputType === "file"}
                    onChange={handleInputChange}
                  />
                  File
                </label>
                <label>
                  <input
                    type="radio"
                    value="url"
                    checked={inputType === "url"}
                    onChange={handleInputChange}
                  />
                  URL
                </label>
              </div>
              {inputType === "file" ? (
                <div
                  className={`${styles.form} ${
                    dragging ? styles.fileDragging : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {dragging && dragFileName ? ( // 드래그 중일 때 파일 이름 표시
                    <div className={styles.dragFileNameContainer}>
                      <span className={styles.dragFileName}>
                        {dragFileName}
                      </span>
                    </div>
                  ) : fileName ? (
                    <>
                      <div className={styles.fileNameContainer}>
                        <span
                          className={styles.fileName}
                          onClick={handleFileNameClick}
                        >
                          {fileName}
                        </span>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={handleFileRemove}
                        >
                          X
                        </button>
                      </div>
                      <div className={styles.waveContainer}>
                        <div
                          ref={waveContainerRef}
                          className={styles.waveform}
                        ></div>
                      </div>
                      <div className={styles.timeContainer}>

                        <button
                          type="button"
                          className={styles.playPauseButton}
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? (
                            <div
                              className={styles.img}
                              style={{
                                backgroundImage: `url("/images/stopbtn.png")`,
                              }}
                            ></div>
                          ) : (
                            <div
                              className={styles.img}
                              style={{
                                backgroundImage: `url("/images/playbtn.png")`,
                              }}
                            />
                          )}
                        </button>
                        <span>{currentTime}</span>/<span>{duration}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <label htmlFor="upload" className={styles.uploadLabel}>
                        <span className={styles.uploadIcon}></span>
                      </label>
                      <p className={styles.uploadText}>
                        Click Upload Icon or Drag and Drop Your File.
                      </p>
                    </>
                  )}
                  <input
                    id="upload"
                    type="file"
                    onClick={handleUploadClick}
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className={styles.uploadHidden}
                  />
                </div>
              ) : (
                <div
                  className={styles.youtubeContainer}
                  onClick={() => document.getElementById("urlInput").focus()}
                >
                  <div className={styles.youtubehead}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <img
                        src="/images/youtube.png"
                        alt="YouTube Logo"
                        className={styles.youtubeLogo}
                      />
                      <p className={styles.youtubeLabel}>YouTube URL</p>
                    </div>
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={() => setUrl("")}
                    >
                      Clear
                    </button>
                  </div>
                  <input
                    type="text"
                    id="urlInput"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Put here your URL."
                    className={styles.input}
                  />
                </div>
              )}

              {inputType === "file" && (
                <div className={styles.exampleFiles}>
                  <button
                    type="button"
                    onClick={() => handleExampleClick("Real 1.wav")}
                    className={styles.exampleFile}
                  >
                    Real 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick("Fake 1.wav")}
                    className={styles.exampleFile}
                  >
                    Fake 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick("Fake 2.wav")}
                    className={styles.exampleFile}
                  >
                    Fake 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick("Fake 3.mp3")}
                    className={styles.exampleFile}
                  >
                    Fake 3
                  </button>
                </div>
              )}

              <div style={{ margin: "50px" }}>
                <h2>
                  {inputType === "file"
                    ? "음성파일을 올린 뒤, Start Detection 버튼을 눌러주세요."
                    : "URL을 입력한 뒤, Start Detection 버튼을 눌러주세요."}{" "}
                </h2>
                <p style={{ color: "#666" }}>
                  {inputType === "file"
                    ? "200MB 이내의 음성 파일로 제한(파일: .wav, .mp3, .m4a)"
                    : "BGM이 섞인 영상은 분류가 어렵습니다!"}
                </p>
                <button type="submit" className={styles.startDetectionButton}>
                  ▶ Start Detection
                </button>
              </div>
            </form>
          </div>
          {loading && (
            <p style={{ fontSize: "24px", margin: "100px 0" }}>분석중...</p>
          )}
          {!loading && Array.isArray(predictions) && predictions.length > 0 && (
            <div className={styles.resultContext}>
              <h1>Detect Report</h1>
              <h2>Voice Verity는 이렇게 분석했어요.</h2>
              <div style={{ textAlign: "-webkit-center" }}>
                <div className={styles.chartContainer}>
                  <div>
                    <p>구간별 Fake 확률 그래프(0(R) ~ 1(F))</p>
                    <canvas
                      id="lineChart"
                      style={{
                        width: "400px",
                        height: "200px",
                        border: "solid 1px #000",
                      }}
                      className={styles.chart}
                    ></canvas>
                  </div>
                  <div className={styles.piechart}>
                    <p style={{ textAlign: "center" }}>Real/Fake Ratio</p>
                    <div>
                      <canvas
                        id="pieChart"
                        width="260px"
                        height="260px"
                        className={styles.chart}
                      ></canvas>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ margin: "20px", fontSize: "24px" }}>▼</div>
              <div className={styles.resultTxt}>
                {inputType === "file" ? (
                  <h2>이 음성 파일은 {result} 입니다.</h2>
                ) : (
                  <h2>이 유튜브 영상은 {result} 입니다.</h2>
                )}
              </div>
            </div>
          )}
          <div className={styles.plan}>
            <h2>우리의 더 나은 서비스를 원하시나요?</h2>
            <button
              onClick={handleSubscriptionPlan}
              className={styles.planButton}
            >
              구독플랜 보기
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
