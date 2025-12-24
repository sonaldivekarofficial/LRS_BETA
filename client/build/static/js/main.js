const { useState, useEffect } = React;

const BACKEND_URL = 'https://lrsbeta.up.railway.app';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState('landing');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error(err));
  }, []);

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleTextAnswer = (id, value) => {
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

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black text-slate-900 mb-6">Life Resonance Schema (LRS)</h1>
          <p className="text-xl text-slate-700 mb-12">Discover your core psychological patterns and receive a personalized 4-week action plan.</p>
          <button onClick={() => setCurrentPage('quiz')} className="px-12 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full hover:bg-indigo-700 transition shadow-2xl">
            Start Assessment →
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
            {questions.map(q => {
              const scaleType = (q['Scale Type'] || '').toLowerCase();

              if (scaleType.includes('open')) {
                return (
                  <div key={q.ID} className="bg-white p-8 rounded-3xl shadow-lg">
                    <p className="text-lg font-medium mb-6">{q['Question Text']}</p>
                    <textarea
                      value={answers[q.ID] || ''}
                      onChange={(e) => handleTextAnswer(q.ID, e.target.value)}
                      className="w-full p-4 border border-slate-300 rounded-lg"
                      rows="4"
                      placeholder="Type your response here (max 100 words)..."
                    />
                  </div>
                );
              }

              if (scaleType.includes('yes/no')) {
                return (
                  <div key={q.ID} className="bg-white p-8 rounded-3xl shadow-lg">
                    <p className="text-lg font-medium mb-6">{q['Question Text']}</p>
                    <div className="grid grid-cols-2 gap-8">
                      {['No', 'Yes'].map((label, val) => (
                        <label key={val} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`q${q.ID}`}
                            value={val}
                            checked={answers[q.ID] == val}
                            onChange={() => handleAnswer(q.ID, val)}
                            className="sr-only"
                          />
                          <div className={`w-24 h-24 rounded-full border-4 transition-all ${answers[q.ID] == val ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-slate-500'}`} />
                          <span className="text-lg mt-4 font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              // Default 5-point Likert
              return (
                <div key={q.ID} className="bg-white p-8 rounded-3xl shadow-lg">
                  <p className="text-lg font-medium mb-6">{q['Question Text']}</p>
                  <div className="grid grid-cols-5 gap-4">
                    {[0,1,2,3,4].map(val => (
                      <label key={val} className="flex flex-col items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`q${q.ID}`}
                          value={val}
                          checked={answers[q.ID] === val}
                          onChange={() => handleAnswer(q.ID, val)}
                          className="sr-only"
                        />
                        <div className={`w-16 h-16 rounded-full border-4 transition-all ${answers[q.ID] === val ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-slate-500'}`} />
                        <span className="text-xs mt-2 text-slate-600">
                          {val === 0 ? 'Strongly Disagree' : val === 1 ? 'Disagree' : val === 2 ? 'Neutral' : val === 3 ? 'Agree' : 'Strongly Agree'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <button onClick={submitAnswers} disabled={loading} className="px-16 py-6 bg-indigo-600 text-white text-2xl font-bold rounded-full shadow-2xl">
              {loading ? 'Calculating...' : 'Submit & Get Results'}
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
          <h2 className="text-5xl font-black text-center mb-12">Your Top Schema Patterns</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((schema, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                <div className="flex justify-between mb-4">
                  <span className="text-4xl font-black text-indigo-600">#{idx+1}</span>
                  <span className="text-sm font-bold text-slate-500">Score: {schema.score.toFixed(1)}</span>
                </div>
                <h3 className="text-2xl font-black mb-3">{schema.name}</h3>
                <p className="text-slate-600 mb-4">{schema.symptoms}</p>
                <p className="text-slate-700 text-sm mb-4"><strong>Root Cause:</strong> {schema.causes}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-indigo-600 font-bold">View 4-Week Action Plan</summary>
                  <div className="mt-4 space-y-4 pl-4">
                    {Object.entries(schema.plan).map(([week, text]) => (
                      <div key={week}>
                        <h4 className="font-bold text-indigo-600">{week.toUpperCase()}:</h4>
                        <p className="text-slate-700">{text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
