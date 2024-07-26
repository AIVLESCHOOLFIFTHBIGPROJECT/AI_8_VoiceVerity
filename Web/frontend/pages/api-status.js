import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { CategoryScale } from 'chart.js'; 
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../styles/ApiStatus.module.css';

Chart.register(CategoryScale);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ApiStatus() {
  const [dailyUsage, setDailyUsage] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [totalApiCalls, setTotalApiCalls] = useState(0);
  const [successRate, setSuccessRate] = useState({ success: 0, failure: 0 });
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [responseTimeDistribution, setResponseTimeDistribution] = useState([]);
  const [monthlyApiCalls, setMonthlyApiCalls] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to access this page');
      router.push('/login');
    } else {
      axios.get(`${BACKEND_URL}/api/api-usage-daily/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setDailyUsage(response.data);
      })
      .catch(error => {
        console.error('Error fetching daily usage', error);
      });

      axios.get(`${BACKEND_URL}/api/user-files/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setUserFiles(response.data);
      })
      .catch(error => {
        console.error('Error fetching user files', error);
      });

      axios.get(`${BACKEND_URL}/api/total-api-calls/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setTotalApiCalls(response.data.total);
      })
      .catch(error => {
        console.error('Error fetching total API calls', error);
      });

      axios.get(`${BACKEND_URL}/api/success-rate/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setSuccessRate(response.data);
      })
      .catch(error => {
        console.error('Error fetching success rate', error);
      });

      axios.get(`${BACKEND_URL}/api/average-response-time/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setAvgResponseTime(response.data.avg_response_time);
      })
      .catch(error => {
        console.error('Error fetching average response time', error);
      });

      axios.get(`${BACKEND_URL}/api/response-time-distribution/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setResponseTimeDistribution(response.data);
      })
      .catch(error => {
        console.error('Error fetching response time distribution', error);
      });

      axios.get(`${BACKEND_URL}/api/monthly-api-calls/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      .then(response => {
        setMonthlyApiCalls(response.data);
      })
      .catch(error => {
        console.error('Error fetching monthly API calls', error);
      });
    }
  }, [router]);

  const dailyData = {
    labels: dailyUsage.map(data => data.upload_date),
    datasets: [
      {
        label: 'Daily Usage',
        data: dailyUsage.map(data => data.total_uploads),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const successRateData = {
    labels: ['Success', 'Failure'],
    datasets: [
      {
        label: 'API Success Rate',
        data: [successRate.success, successRate.failure],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const responseTimeData = {
    labels: responseTimeDistribution.map(data => data.response_time),
    datasets: [
      {
        label: 'Response Time Distribution',
        data: responseTimeDistribution.map(data => data.count),
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const monthlyData = {
    labels: monthlyApiCalls.map(data => data.month),
    datasets: [
      {
        label: 'Monthly API Calls',
        data: monthlyApiCalls.map(data => data.total_calls),
        fill: false,
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
      },
    ],
  };

  const options = {
    maintainAspectRatio: false, 
    responsive: true,
  };

  return (
    <div>
      <Navbar />
      <div className={styles.dashboard}>
        <h1 className={styles.heading}>API Status</h1>
        <div className={styles.chartContainer}>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>Daily API Usage</h2>
            <div style={{ height: '300px', width: '100%' }}>
              <Line data={dailyData} options={options} />
            </div>
          </div>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>API Success Rate</h2>
            <div style={{ height: '300px', width: '100%' }}>
              <Bar data={successRateData} options={options} />
            </div>
          </div>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>Response Time Distribution</h2>
            <div style={{ height: '300px', width: '100%' }}>
              <Line data={responseTimeData} options={options} />
            </div>
          </div>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>Monthly API Calls</h2>
            <div style={{ height: '300px', width: '100%' }}>
              <Bar data={monthlyData} options={options} />
            </div>
          </div>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>Total API Calls</h2>
            <p>{totalApiCalls}</p>
          </div>
          <div className={styles.chartItem}>
            <h2 className={styles.subHeading}>Average Response Time</h2>
            <p>{avgResponseTime} ms</p>
          </div>
        </div>
        <h2 className={styles.subHeading}>User Files</h2>
        <ul className={styles.userFilesList}>
          {userFiles.map((file, index) => (
            <li key={index} className={styles.userFilesListItem}>
              {file.file_name}: {file.file_path} - {file.analysis_result}
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
}
