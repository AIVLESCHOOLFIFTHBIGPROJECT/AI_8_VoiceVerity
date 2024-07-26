import Navbar from "../../components/Navbar.Term";
import Footer from "../../components/Footer";
import styles from "../../styles/Terms.module.css";

export default function VoiceCollectionTerms() {
  return (
    <div className={styles.container}>
      <div className={styles.navFooter}>
        <Navbar />
      </div>
      <div style={{ height: "40px" }} />
      <div className={styles.main}>
        <h1>음성 보이스 수집 및 이용 동의</h1>
        <div className={styles.space}>
          <p>
            Voice Verity는 음성 보이스 수집 및 이용에 대한 귀하의 동의를 소중히
            생각합니다.{" "}
          </p>
          <p>
            다음의 내용을 자세히 읽어보시고 동의 여부를 결정해 주시기 바랍니다.
          </p>
          <div style={{ height: "30px" }} />
          <h2>수집하는 음성 보이스의 항목</h2>
          <p>회사는 다음과 같은 음성 보이스 정보를 수집합니다:</p>
          <ul>
            <li>녹음된 음성 데이터</li>
            <li>음성 파일의 메타데이터(녹음 시간, 길이 등)</li>
          </ul>
          <div style={{ height: "30px" }} />
          <h2>음성 보이스의 수집 및 이용 목적</h2>
          <p>회사는 수집한 음성 보이스를 다음의 목적을 위해 활용합니다:</p>
          <ul>
            <li>AI 모델 학습 및 개선</li>
            <li>서비스 품질 향상</li>
            <li>연구 및 통계 분석</li>
          </ul>
          <div style={{ height: "30px" }} />
          <h2>음성 보이스의 보유 및 이용기간</h2>
          <p>
            수집된 음성 보이스는 수집 및 이용 목적 달성 시까지 보유하며, 목적
            달성 후에는 해당 정보를 지체 없이 파기합니다.
          </p>
          <div style={{ height: "30px" }} />
          <h2>동의 거부 권리</h2>
          <p>
            귀하는 음성 보이스 수집 및 이용에 대한 동의를 거부할 권리가 있으며,
            동의를 거부할 경우 일부 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
}
