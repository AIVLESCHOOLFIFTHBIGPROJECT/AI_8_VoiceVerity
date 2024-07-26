import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Intro.module.css';

export default function Intro() {
  const router = useRouter();

  const handleTryButtonClick = () => {
    router.push('/try');
  };

  return (
    <div className={styles.introContainer}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.heading}>서비스 소개</h1>
        <section className={styles.section}>
          <h2 className={styles.subHeading}>이 서비스를 왜 만드는가?</h2>
          <p className={styles.text}>
            우리는 Voice Deep Fake 기술을 통해 보이스피싱 범죄를 예방하고, 음성 합성 기술의 긍정적인 사용을 장려하기 위해 이 서비스를 개발하였습니다.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.subHeading}>Voice Deep Fake란 무엇인가?</h2>
          <p className={styles.text}>
            Voice Deep Fake는 인공지능 기술을 활용하여 실제 사람의 목소리를 흉내내어 가짜 음성을 생성하는 기술입니다. 이는 긍정적으로 사용될 수도 있지만, 악용될 경우 심각한 피해를 초래할 수 있습니다.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.subHeading}>보이스피싱 범죄 예방</h2>
          <p className={styles.text}>
            보이스피싱은 가짜 음성을 이용하여 사람들을 속이는 범죄입니다. 우리의 서비스는 이러한 범죄를 탐지하고 예방하는 데 도움을 줄 수 있습니다.
          </p>
        </section>
        <section className={styles.section}>
          <h2 className={styles.subHeading}>이 서비스의 기대효과</h2>
          <p className={styles.text}>
            - 보이스피싱 범죄 예방
            <br />
            - 음성 합성 기술의 긍정적 사용 촉진
            <br />
            - 인공지능 기술에 대한 이해 증진
          </p>
        </section>
        <button onClick={handleTryButtonClick} className={styles.tryButton}>체험하기</button>
      </div>
      <Footer />
    </div>
  );
}
