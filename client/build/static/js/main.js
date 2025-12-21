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
      .catch(err => console.error(err));
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
      setResults(data.top_schemas);
      setCurrentPage('results');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = (schema) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(schema.name, 20, 20);
    doc.setFontSize(12);
    doc.text("Root Cause:", 20, 40);
    doc.text(schema.causes || "N/A", 20, 50, { maxWidth: 170 });
    doc.text("Symptoms:", 20, 80);
    doc.text(schema.symptoms || "N/A", 20, 90, { maxWidth: 170 });
    doc.text("4-Week Plan:", 20, 120);
    let y = 130;
    Object.entries(schema.plan || {}).forEach(([week, text]) => {
      doc.text(`${week.toUpperCase()}: ${text}`, 20, y);
      y += 20;
    });
    doc.save(`${schema.name.replace(/ /g, '_')}_Plan.pdf`);
  };

  const toggleWeekComplete = (schemaName, week) => {
    const key = `${schemaName}-${week}`;
    setCompletedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black text-slate-900 mb-6">Life Resonance Schema (LRS)</h1>
          <p className="text-xl text-slate-700 mb-12">Discover your core psychological patterns and receive a personalized 4-week action plan.</p>
          <button onClick={() => setCurrentPage('quiz')} className="px-12 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full hover:bg-indigo-700 transition shadow-2xl">
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
          <h2 className="text-4xl font-black text-center mb-12">Your Assessment</h2>
          <div className="space-y-8">
            {questions.map(q => (
              <div key={q.ID} className="bg-white p-8 rounded-3xl shadow-lg">
                <p className="text-lg font-medium mb-6">{q['Question Text']}</p>
                <div className="grid grid-cols-5 gap-4">
                  {[0,1,2,3,4].map(val => (
                    <label key={val} className="flex flex-col items-center cursor-pointer">
                      <input type="radio" name={`q${q.ID}`} value={val} checked={answers[q.ID] === val} onChange={() => handleAnswer(q.ID, val)} className="sr-only" />
                      <div className={`w-16 h-16 rounded-full border-4 transition-all ${answers[q.ID] === val ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-slate-500'}`} />
                      <span className="text-xs mt-2 text-slate-600">{val === 0 ? 'Strongly Disagree' : val === 4 ? 'Strongly Agree' : val}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={submitAnswers} disabled={loading} className="px-12 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xl">
              {loading ? <Loader2 className="animate-spin inline mr-3" /> : 'Submit & Get Results'}
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
              <h2 className="text-5xl font-black text-center mb-12">Your Schema Profile</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((schema, idx) => (
                  <div key={idx} onClick={() => setSelectedSchema(schema)} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition cursor-pointer border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl font-black text-indigo-600">#{idx+1}</span>
                      <span className="text-sm font-bold text-slate-500">Score: {schema.score.toFixed(1)}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-3">{schema.name}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{schema.symptoms}</p>
                    <button className="mt-6 text-indigo-600 font-bold flex items-center gap-2">
                      View Plan <ChevronRight size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <button onClick={() => setSelectedSchema(null)} className="mb-8 flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                <ArrowLeft size={20} /> Back to Profile
              </button>
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 p-10 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black mb-3">{selectedSchema.name}</h2>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <button onClick={handlePrint} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><Printer size={20} /></button>
                      <button onClick={() => handleDownloadPDF(selectedSchema)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><Shield size={20} /></button>
                    </div>
                  </div>
                </div>
                <div className="p-10">
                  <h3 className="text-3xl font-black text-slate-900 mb-10">4-Week Action Plan</h3>
                  <div className="space-y-10">
                    {Object.keys(selectedSchema.plan).map((week, idx) => {
                      const key = `${selectedSchema.name}-${week}`;
                      return (
                        <div key={week} className="flex gap-8">
                          <div className="flex flex-col items-center">
                            <div className={`p-4 rounded-2xl ${completedWeeks[key] ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                              <BookOpen size={24} />
                            </div>
                            {idx < 3 && <div className="w-px h-32 bg-slate-200 mt-4" />}
                          </div>
                          <div className="flex-1 pb-10">
                            <div className="flex justify-between mb-3">
                              <h4 className={`text-xl font-black uppercase ${completedWeeks[key] ? 'text-green-600' : 'text-slate-800'}`}>Week {idx+1}</h4>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer print:hidden">
                                <input type="checkbox" checked={!!completedWeeks[key]} onChange={() => toggleWeekComplete(selectedSchema.name, week)} className="w-5 h-5" />
                                MARK COMPLETE
                              </label>
                            </div>
                            <div className={`p-6 rounded-3xl border ${completedWeeks[key] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                              {selectedSchema.plan[week]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
