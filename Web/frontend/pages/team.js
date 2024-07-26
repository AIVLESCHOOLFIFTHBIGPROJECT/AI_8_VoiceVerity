import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/Team.module.css";

export default function Team() {
  return (
    <div className={styles.teamContainer}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <h1 className={styles.heading}>팀 소개</h1>
        <p className={styles.subHeading}>AIVLE School Big Project 8조</p>
        <div className={styles.teamGrid}>
          <div className={styles.teamCard}>
            <img
              src="/images/team/문동규.png"
              alt="문동규"
              className={styles.profileImage}
            />
            <h2>문동규</h2>
            <p>Team Leader</p>
            <p>AI Model</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/김성규.png"
              alt="김성규"
              className={styles.profileImage}
            />
            <h2>김성규</h2>
            <p>AI Model</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/김아영.png"
              alt="김아영"
              className={styles.profileImage}
            />
            <h2>김아영</h2>
            <p>FrontEnd</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/박성훈.png"
              alt="박성훈"
              className={styles.profileImage}
            />
            <h2>박성훈</h2>
            <p>Data Collection</p>
            <p>Data Preprocessing</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/박종범.png"
              alt="박종범"
              className={styles.profileImage}
            />
            <h2>박종범</h2>
            <p>AI Model</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/정주영.png"
              alt="정주영"
              className={styles.profileImage}
            />
            <h2>정주영</h2>
            <p>Project Management</p>
            <p>Server Management</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/하세호.png"
              alt="하세호"
              className={styles.profileImage}
            />
            <h2>하세호</h2>
            <p>Data Collection</p>
            <p>Data Preprocessing</p>
          </div>
          <div className={styles.teamCard}>
            <img
              src="/images/team/한규현.png"
              alt="한규현"
              className={styles.profileImage}
            />
            <h2>한규현</h2>
            <p>BackEnd</p>
          </div>
        </div>
      </div>
      <div style={{height:'100px'}}></div>
      <Footer />
    </div>
  );
}
