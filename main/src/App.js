import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

function TeacherFileDetails() {
  const [submission, setSubmission] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    axios.get(`http://127.0.0.1:23456/api/submissions/${id}`)
      .then(response => {
        setSubmission(response.data);
      })
      .catch(error => {
        console.error('Error fetching submission details:', error);
      });
  }, [id]);

  const downloadFile = () => {
    let fileContent = "Question\tModel Answer\tConcepts\n"; 
  
    submission.teacher_file.forEach((item, index, array) => {
      let concepts = item.concepts ? item.concepts.join(';') : '';
      fileContent += `${item.question}\t${item.modelAnswer}\t${concepts}`;
      if (index < array.length - 1) {
        fileContent += "\n"; 
      }
    });
  
    const blob = new Blob([fileContent], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "teacher_file.tsv"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  

  if (!submission) return <div>Loading...</div>;

  return (
    <div className="teacher-file-details">
      <h2>Teacher File</h2>
      {submission.teacher_file && submission.teacher_file.map((item, index) => (
        <div key={index}>
          <p><strong>Question</strong>: {item.question}</p>
          <p><strong>Model Answer</strong>: {item.modelAnswer}</p>
          {item.concepts && (
            <p><strong>Concepts:</strong> {item.concepts.join(', ')}</p>
          )}
        </div>
      ))}
      <button onClick={downloadFile}>Download Teacher File</button> 
    </div>
  );
}

function StudentFileDetails() {
  const [submission, setSubmission] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    axios.get(`http://127.0.0.1:23456/api/submissions/${id}`)
      .then(response => {
        setSubmission(response.data);
      })
      .catch(error => {
        console.error('Error fetching submission details:', error);
      });
  }, [id]);

  const downloadFile = () => {
    let fileContent = "Question\tStudent Answer\n"; 
  
    submission.student_file.forEach((item, index, array) => {
      fileContent += `${item.question}\t${item.studentAnswer}`;
      if (index < array.length - 1) {
        fileContent += "\n"; 
      }
    });
  
    const blob = new Blob([fileContent], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_file.tsv"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  
  if (!submission) return <div>Loading...</div>;

  return (
    <div className="student-file-details">
      <h2>Student File</h2>
      {submission.student_file && submission.student_file.map((item, index) => (
        <div key={index}>
          <p><strong>Question</strong>: {item.question}</p>
          <p><strong>Student Answer</strong>: {item.studentAnswer}</p>
        </div>
      ))}
      <button onClick={downloadFile}>Download Student File</button> 
    </div>
  );
}

function GradingFileDetails() {
  const [submission, setSubmission] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    axios.get(`http://127.0.0.1:23456/api/submissions/${id}`)
      .then(response => {
        setSubmission(response.data);
      })
      .catch(error => {
        console.error('Error fetching submission details:', error);
      });
  }, [id]);

  const calculateScores = () => {
    if (submission && submission.details) {
      const totalScore = submission.details.reduce((acc, item) => acc + item.grade, 0);
      const totalPossibleScore = submission.details.length * 10;
      const finalGrade = totalPossibleScore > 0 ? (totalScore / totalPossibleScore * 100).toFixed(2) : "0.00";
      return { totalScore, totalPossibleScore, finalGrade };
    }
    return { totalScore: 0, totalPossibleScore: 0, finalGrade: "0.00" };
  };

  const downloadFile = () => {
    let fileContent = "";
    const { totalScore, totalPossibleScore, finalGrade } = calculateScores();

    if (submission && submission.details) {
      submission.details.forEach(item => {
        fileContent += `Question: ${item.question}\nStudent Answer: ${item.studentAnswer}\nGrade: ${item.grade}/10\nModel Answer: ${item.modelAnswer}\n\n`;
      });
    }

    fileContent += `Total Score: ${totalScore}/${totalPossibleScore}\n`;
    fileContent += `Final Grade: ${finalGrade}%\n`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "grade.txt"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!submission) return <div>Loading...</div>;

  const { totalScore, totalPossibleScore, finalGrade } = calculateScores();

  return (
    <div className="grading-file-details">
      <h2>Grading File</h2>
      {submission.details && submission.details.map((item, index) => (
        <div key={index}>
          <p><strong>Question</strong>: {item.question}</p>
          <p><strong>Student Answer</strong>: {item.studentAnswer}</p>
          <p><strong>Student Grade</strong>: {item.grade}/10</p>
          <p><strong>Model Answer</strong>: {item.modelAnswer}</p>
        </div>
      ))}
      <p><strong>Total Score:</strong> {totalScore}/{totalPossibleScore}</p>
      <p><strong>Final Grade:</strong> {finalGrade}%</p>
      <button onClick={downloadFile}>Download Grading File</button> 
    </div>
  );
}

function SubmissionDetails() {
  const [submission, setSubmission] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    axios.get(`http://127.0.0.1:23456/api/submissions/${id}`)
      .then(response => {
        setSubmission(response.data);
      })
      .catch(error => {
        console.error('Error fetching submission details:', error);
      });
  }, [id]);

  if (!submission) return <div>Loading...</div>;

  return (
    <div className="submission-details">
      <h2><strong>Submission Files</strong></h2>
      <h3><Link className="link-spacing link-button" to={`/submissions/${id}/teacher_file`}><strong>View Teacher File</strong></Link></h3>
      <h3><Link className="link-spacing link-button" to={`/submissions/${id}/student_file`}><strong>View Student File</strong></Link></h3>
      <h3><Link className="link-spacing link-button" to={`/submissions/${id}/grading_file`}><strong>View Grading File</strong></Link></h3>
    </div>
  );
}

function App() {
  const [teacherFile, setTeacherFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [score, setScore] = useState(null);
  const [totalScore, setTotalScore] = useState(null);
  const [totalPossibleScore, setTotalPossibleScore] = useState(null);
  const [details, setDetails] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/submissions')
      .then(response => {
        setSubmissions(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the submissions', error);
      });
  }, []);

  const onTeacherFileChange = (e) => {
    setTeacherFile(e.target.files[0]);
  };

  const onStudentFileChange = (e) => {
    setStudentFile(e.target.files[0]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setScore(null);
      const formData = new FormData();
      formData.append('teacherFile', teacherFile);
      formData.append('studentFile', studentFile);
      const response = await fetch('http://127.0.0.1:23456/api/process_files', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setScore(data.grade);
      setTotalScore(data.totalScore);
      setTotalPossibleScore(data.totalPossibleScore);
      setDetails(data.details);
      setError(null);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:23456/api/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const generateDownloadLink = () => {
    let content = ``;
    if (details) {
      details.forEach(detail => {
        const studentGrade = detail.grade;
        const totalPossibleGrade = 10;
        content += `Question: ${detail.question}\n`;
        content += `Student Answer: ${detail.studentAnswer}\n`;
        content += `Student Grade: ${studentGrade}/${totalPossibleGrade}\n`;
        content += `Model Answer: ${detail.modelAnswer}\n\n`;
      });
    }
    content += `Total Score: ${totalScore}/${totalPossibleScore}\n`;
    content += `Final Grade: ${(score * 100).toFixed(2)}%\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    return url;
  };

  return (
    <Router>
      <div className="App">
        <h1>Automated Short Answers Assessment</h1>
        <Routes>
          <Route path="/" exact element={
            <>
              <div>
                <label className="file-label">
                  <strong>Teacher File</strong>:
                  <input type="file" onChange={onTeacherFileChange} className="input-file" />
                </label>
              </div>
              <div>
                <label className="file-label">
                <strong>Student File</strong>:
                  <input type="file" onChange={onStudentFileChange} className="input-file" />
                </label>
              </div>
              <button onClick={fetchData} disabled={loading || !teacherFile || !studentFile}>
                {loading ? 'Grading...' : 'Grade'}
              </button>
              <button onClick={fetchSubmissions} disabled={loading} className="small-button">
                View Previous Submissions
              </button>
              {error && <div className="error-message">{error}</div>}
              {score !== null && (
                <div className="score-container">
                  <h2 className="score">Score: {totalScore}/{totalPossibleScore} ({(score * 100).toFixed(2)}%)</h2>
                  <a className="download-link download-grade" href={generateDownloadLink()} download="grade.txt">Download Grade</a>
                </div>
              )}
              {loading && <div className="loading-spinner"></div>}
              <div>
                {submissions.map((submission, index) => (
                  <div key={index}>
                    <Link className="link-spacing link-button" to={`/submissions/${submission._id.$oid}`}>
                    <strong>Submission {index + 1}</strong>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          } />
          <Route path="/submissions/:id" element={<SubmissionDetails />} />
          <Route path="/submissions/:id/teacher_file" element={<TeacherFileDetails />} />
          <Route path="/submissions/:id/student_file" element={<StudentFileDetails />} />
          <Route path="/submissions/:id/grading_file" element={<GradingFileDetails />} />
        </Routes>
      </div>
    </Router>  
  );  
}

export default App;
