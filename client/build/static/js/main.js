import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, Activity, Shield, ChevronRight, Printer, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const BACKEND_URL = 'https://lrsbeta.up.railway.app';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState('landing');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [completedWeeks, setCompletedWeeks] = useState({});

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error("Load error", err));
  }, []);

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const submitAnswers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      setResults(data.top_schemas || []);
      setCurrentPage('results');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = (schema) => {
    const doc = new jsPDF();
    doc.text(schema.name, 20, 20);
    doc.text("Score: " + schema.score, 20, 30);
    doc.text("Root: " + (schema.causes || "N/A"), 20, 40, { maxWidth: 170 });
    doc.text("Symptoms: " + (schema.symptoms || "N/A"), 20, 60, { maxWidth: 170 });
    let y = 90;
    const plan = schema.plan || {};
    Object.keys(plan).forEach(week => {
      doc.text(week.toUpperCase() + ": " + plan[week], 20, y);
      y += 15;
    });
    doc.save('LRS_Plan.pdf');
  };

  const toggleWeekComplete = (name, week) => {
    const key = `${name}-${week}`;
    setCompletedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black text-slate-900 mb-6">Life Resonance Schema (LRS)</h1>
          <p className="text-xl text-slate-700 mb-12">Discover your core psychological patterns and get a personalized 4-week action plan.</p>
          <button onClick={() => setCurrentPage('quiz')} className="px-12 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full hover:bg-indigo-700 shadow-2xl">
            Start Assessment <ChevronRight className="inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'quiz') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12">Assessment</h2>
          <div className="space-y-8">
            {questions.map(q => (
              <div key={q.ID} className="bg-white p-8 rounded-3xl shadow-lg">
                <p className="text-lg font-medium mb-6">{q['Question Text']}</p>
                <div className="grid grid-cols-5 gap-4">
                  {[0,1,2,3,4].map(val => (
                    <label key={val} className="flex flex-col items-center">
                      <input type="radio" name={`q${q.ID}`} value={val} checked={answers[q.ID] === val} onChange={() => handleAnswer(q.ID, val)} className="sr-only" />
                      <div className={`w-16 h-16 rounded-full border-4 ${answers[q.ID] === val ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`} />
                      <span className="text-xs mt-2">{val === 0 ? 'Disagree' : val === 4 ? 'Agree' : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={submitAnswers} disabled={loading} className="px-12 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full">
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'results' && results) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {!selectedSchema ? (
            <>
              <h2 className="text-5xl font-black text-center mb-12">Your Profile</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {results.map((s, i) => (
                  <div key={i} onClick={() => setSelectedSchema(s)} className="bg-white p-8 rounded-3xl shadow-xl cursor-pointer">
                    <h3 className="text-2xl font-black">{s.name}</h3>
                    <p>Score: {s.score}</p>
                    <p className="text-sm text-slate-600">{s.symptoms}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <button onClick={() => setSelectedSchema(null)}>Back</button>
              <h2 className="text-4xl font-black">{selectedSchema.name}</h2>
              <p>Root: {selectedSchema.causes}</p>
              <p>Symptoms: {selectedSchema.symptoms}</p>
              <h3>4-Week Plan</h3>
              {Object.entries(selectedSchema.plan || {}).map(([week, text]) => (
                <div key={week}>
                  <h4>{week.toUpperCase()}</h4>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
