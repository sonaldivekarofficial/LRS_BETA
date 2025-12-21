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

  // Full 18 Schema Details (complete with plans)
  const schemas = [
    {
      name: "Abandonment / Instability",
      category: "Disconnection & Rejection",
      causes: "Unstable or unreliable caregiving; early loss or parent absence.",
      symptoms: "Intense fear of loss, clinginess, jealousy, or withdrawal.",
      manifestations: "Connection (attachment worry), Roots (parent loss), Stability (world anxiety)",
      evidence: "Based on Young Schema Therapy (2003) and Attachment Theory.",
      plan: {
        week1: "Trigger Mapping: Record every time you feel 'abandonment panic'. Note the objective trigger vs. the internal fear.",
        week2: "The Healthy Adult Voice: Practice the thought: 'I am an adult now. Even if this person leaves, I can care for myself.'",
        week3: "Planned Separation: Spend an evening alone without checking social media. Practice self-soothing in the silence.",
        week4: "Relapse Prevention: Identify 3 healthy ways to ask for reassurance without testing or accusing your partner."
      }
    },
    {
      name: "Mistrust / Abuse",
      category: "Disconnection & Rejection",
      causes: "Abuse, betrayal, or manipulation by caregivers or peers.",
      symptoms: "Expectation of harm, hypervigilance, difficulty trusting, testing others.",
      manifestations: "Roots (trauma items), Connection (trust difficulty), Environment (safety)",
      evidence: "Based on Trauma-Informed CBT protocols.",
      plan: {
        week1: "Evidence Checking: Pick one person you distrust. List evidence 'for' and 'against' the belief they intend harm.",
        week2: "Boundary Training: Practice saying 'I’m not comfortable with that' to minor requests to build internal safety.",
        week3: "Vulnerability Experiment: Share one minor personal opinion with a safe person. Observe the safety.",
        week4: "Trust Pacing: Categorize people into 'Trust Levels' (1-5). Share only level-appropriate info."
      }
    },
    {
      name: "Emotional Deprivation",
      category: "Disconnection & Rejection",
      causes: "Lack of nurturance, empathy, or affection from caregivers.",
      symptoms: "Feeling chronically lonely, 'no one is there for me', choosing distant partners.",
      manifestations: "Connection (closeness), Roots (neglect), Vitality (mood)",
      evidence: "Based on Emotion-Focused Therapy and Young’s Schema models.",
      plan: {
        week1: "Need Awareness: Every time you feel empty, write down what you needed: Empathy, Protection, or Nurturance.",
        week2: "Cognitive Flashcard: Create a card: 'My feeling that no one cares is a schema memory, not a current fact.'",
        week3: "Active Request: Ask a trusted person for 10 minutes of active listening regarding a small stressor.",
        week4: "Inner Nurturing: Schedule one activity weekly that feels 'nurturing' to your inner child."
      }
    },
    {
      name: "Defectiveness / Shame",
      category: "Disconnection & Rejection",
      causes: "Criticism, rejection, or shaming; feeling inherently flawed.",
      symptoms: "Deep shame, self-loathing, hypersensitivity to criticism, hiding 'defects'.",
      manifestations: "Digital Wellbeing (comparison), Meaning (self-worth), Roots (insults)",
      evidence: "Inspired by Compassion-Focused Therapy.",
      plan: {
        week1: "Critic Audit: Name your inner critic (e.g., 'The Judge'). Note how often it speaks and the words it uses.",
        week2: "Humanity Re-framing: When you make a mistake, say: 'This is a common human experience, not a defect.'",
        week3: "Mirror Work: Spend 2 minutes daily looking at yourself saying: 'I am worthy of kindness regardless of flaws.'",
        week4: "Compassionate Letter: Write a letter to yourself from the perspective of a wise friend regarding a past mistake."
      }
    },
    {
      name: "Social Isolation / Alienation",
      category: "Disconnection & Rejection",
      causes: "Feeling different or excluded from family or peers.",
      symptoms: "Sense of being outsider, avoidance of groups, feeling no one understands.",
      manifestations: "Connection (outsider), Environment (identity), Digital Wellbeing (comparison)",
      evidence: "Based on Social Skills Training and CBT for Social Anxiety.",
      plan: {
        week1: "Similarity Search: In every social setting, find 3 things you have in common with others.",
        week2: "Small Talk Script: Prepare 3 open-ended questions to use in conversations.",
        week3: "Group Activity: Attend one low-pressure social event (e.g., class, meetup).",
        week4: "Reflection: Write what went better than expected and plan next social step."
      }
    },
    {
      name: "Dependence / Incompetence",
      category: "Impaired Autonomy & Performance",
      causes: "Overprotection or discouragement of independence.",
      symptoms: "Belief one is incapable, excessive reliance on others, avoidance of responsibility.",
      manifestations: "Growth (coping), Vitality (focus/energy), Roots (parentification)",
      evidence: "Based on Self-Efficacy Theory (Bandura) and Schema Therapy.",
      plan: {
        week1: "Competence Log: Track 5 daily tasks you completed independently.",
        week2: "Decision Practice: Make 3 small decisions without asking for advice.",
        week3: "Skill Building: Choose one simple task you've avoided and complete it step-by-step.",
        week4: "Reflection: List evidence of your growing capability."
      }
    },
    {
      name: "Vulnerability to Harm or Illness",
      category: "Impaired Autonomy & Performance",
      causes: "Exaggerated danger or traumatic events.",
      symptoms: "Catastrophizing, excessive precaution, phobias, hypochondria.",
      manifestations: "Vitality (health), Environment (safety), Stability (world anxiety)",
      evidence: "Based on Anxiety Disorder protocols.",
      plan: {
        week1: "Worry Time: Schedule 15 minutes daily to write all worries, then stop.",
        week2: "Probability Estimation: Rate likelihood of feared event (0-100%) and check evidence.",
        week3: "Exposure Step: Face one small feared situation (e.g., short trip).",
        week4: "Safety Review: List all times feared event did NOT happen."
      }
    },
    {
      name: "Enmeshment / Undeveloped Self",
      category: "Impaired Autonomy & Performance",
      causes: "Over-involved caregivers; no separate identity encouraged.",
      symptoms: "Lack of individual direction, guilt when separate, fusion with others.",
      manifestations: "Connection (preoccupation), Meaning (choices), Roots (mental illness in household)",
      evidence: "Based on Differentiation of Self (Bowen).",
      plan: {
        week1: "Identity List: Write 10 things you like that are independent of others.",
        week2: "Boundary Practice: Say 'I need time to think' to one request.",
        week3: "Solo Activity: Spend 2 hours on a personal interest without sharing.",
        week4: "Reflection: Notice how separate choices feel empowering."
      }
    },
    {
      name: "Failure",
      category: "Impaired Autonomy & Performance",
      causes: "Criticism or comparison leading to belief in inevitable failure.",
      symptoms: "Avoidance of challenges, self-sabotage, underachievement.",
      manifestations: "Growth (achievement), Stability (financial plan), Vitality (energy)",
      evidence: "Based on Learned Helplessness and Achievement Motivation.",
      plan: {
        week1: "Success Inventory: List 10 past achievements, big or small.",
        week2: "Growth Mindset: Replace 'I failed' with 'I learned'.",
        week3: "Small Challenge: Complete one avoided task with realistic goal.",
        week4: "Celebrate Effort: Reward process, not just outcome."
      }
    },
    {
      name: "Entitlement / Grandiosity",
      category: "Impaired Limits",
      causes: "Overindulgence or lack of limits.",
      symptoms: "Belief one is superior, demands special treatment, lack of empathy.",
      manifestations: "Growth (deservingness), Digital Wellbeing (rules)",
      evidence: "Based on Narcissistic Personality research.",
      plan: {
        week1: "Empathy Log: Note one need of another person daily.",
        week2: "Equality Reminder: 'Everyone's needs matter equally'.",
        week3: "Delay Gratification: Wait 24h for one non-essential want.",
        week4: "Gratitude Practice: Thank someone for meeting a reasonable need."
      }
    },
    {
      name: "Insufficient Self-Control / Self-Discipline",
      category: "Impaired Limits",
      causes: "Lack of structure or consequences.",
      symptoms: "Difficulty tolerating frustration, impulsivity, avoidance of discomfort.",
      manifestations: "Digital Wellbeing (scrolling), Stability (savings), Growth (procrastination)",
      evidence: "Based on Delay of Gratification studies.",
      plan: {
        week1: "Impulse Log: Track urges and delay action by 10 minutes.",
        week2: "If-Then Planning: 'If I feel urge to scroll, then I stand up and stretch'.",
        week3: "Commitment Device: Use app blocker for one habit.",
        week4: "Reward System: Plan healthy reward after completing task."
      }
    },
    {
      name: "Subjugation",
      category: "Other-Directedness",
      causes: "Punishment for asserting needs; dominance in family.",
      symptoms: "Suppression of anger/needs, passive compliance, bottled resentment.",
      manifestations: "Connection (suppression), Growth (conflict avoidance)",
      evidence: "Based on Assertiveness Training.",
      plan: {
        week1: "Need Awareness: Write down 3 suppressed wants daily.",
        week2: "Low-Risk Assertion: Express one small preference ('I’d prefer X').",
        week3: "Anger Journal: Safely write unsent letter expressing resentment.",
        week4: "Boundary Setting: Practice 'No' to one reasonable request."
      }
    },
    {
      name: "Self-Sacrifice",
      category: "Other-Directedness",
      causes: "Guilt or modeling of excessive giving.",
      symptoms: "Over-focus on others' needs, neglect own, resentment, burnout.",
      manifestations: "Meaning (helping), Connection (preoccupation), Roots (parentification)",
      evidence: "Based on Boundaries and Burnout research.",
      plan: {
        week1: "Giving Audit: Track time/energy given vs. received.",
        week2: "Self-Care Priority: Schedule one non-negotiable self-need daily.",
        week3: "Balanced Helping: Offer help only when you genuinely want to.",
        week4: "Guilt Reframe: 'Meeting my needs allows me to help others sustainably.'"
      }
    },
    {
      name: "Approval-Seeking / Recognition-Seeking",
      category: "Other-Directedness",
      causes: "Love conditional on performance/appearance.",
      symptoms: "Excessive need for admiration, identity based on external validation.",
      manifestations: "Digital Wellbeing (validation), Meaning (respect), Growth (worth)",
      evidence: "Based on Self-Determination Theory.",
      plan: {
        week1: "Validation Source: List 5 internal qualities you value in yourself.",
        week2: "Social Media Fast: 1 day without seeking likes/comments.",
        week3: "Intrinsic Goal: Do one activity for personal enjoyment, not sharing.",
        week4: "Self-Approval Practice: Daily affirm 'My worth is inherent'."
      }
    },
    {
      name: "Negativity / Pessimism",
      category: "Overvigilance & Inhibition",
      causes: "Focus on negative in family; repeated hardship.",
      symptoms: "Chronic focus on negatives, worry, discounting positives.",
      manifestations: "Vitality (mood), Stability (world anxiety), Meaning (gratitude)",
      evidence: "Based on Positive Psychology interventions.",
      plan: {
        week1: "3 Good Things: Write 3 positive events daily and why they happened.",
        week2: "Evidence Testing: For one worry, list evidence for/against.",
        week3: "Gratitude Visit: Write and deliver (or read) a gratitude letter.",
        week4: "Best Possible Self: Visualize and write about your ideal future."
      }
    },
    {
      name: "Emotional Inhibition",
      category: "Overvigilance & Inhibition",
      causes: "Suppression of emotions shamed or punished.",
      symptoms: "Restraint of feelings, fear of losing control, appear rigid/cold.",
      manifestations: "Connection (hiding feelings), Digital Wellbeing (curating self), Vitality (mood)",
      evidence: "Based on Emotion Regulation research.",
      plan: {
        week1: "Emotion Labeling: Name feelings 5 times daily.",
        week2: "Safe Expression: Share one feeling with a trusted person.",
        week3: "Body Awareness: Notice where emotions live in your body.",
        week4: "Play Experiment: Do one spontaneous, fun activity."
      }
    },
    {
      name: "Unrelenting Standards / Hypercriticalness",
      category: "Overvigilance & Inhibition",
      causes: "High pressure for performance; criticism for imperfection.",
      symptoms: "Perfectionism, chronic dissatisfaction, burnout, harsh judgment.",
      manifestations: "Growth (perfection), Meaning (peace), Connection (suppression)",
      evidence: "Based on Perfectionism CBT protocols.",
      plan: {
        week1: "Standards Audit: List your 'shoulds' and question necessity.",
        week2: "Good Enough Goal: Complete one task to 80% standard deliberately.",
        week3: "Self-Compassion Break: Use Kristin's phrase during criticism.",
        week4: "Balance Review: Schedule equal time for achievement and rest."
      }
    },
    {
      name: "Punitiveness",
      category: "Overvigilance & Inhibition",
      causes: "Harsh punishment; intolerance of mistakes.",
      symptoms: "Self-punishing or punitive toward others, difficulty forgiving.",
      manifestations: "Vitality (guilt), Growth (critical mistakes), Roots (cruel discipline)",
      evidence: "Based on Self-Compassion and Forgiveness research.",
      plan: {
        week1: "Mistake Log: Write mistakes without judgment.",
        week2: "Forgiveness Letter: Write (unsent) forgiving yourself or another.",
        week3: "Mercy Practice: Respond to one mistake with kindness phrase.",
        week4: "Common Humanity: Remind 'Everyone makes mistakes' daily."
      }
    }
  ];

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error("Failed to load questions", err));
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
      // Merge backend scores with full schema details
      const merged = schemas.map(schema => {
        const backend = data.top_schemas.find(s => s.name === schema.name) || { score: 0 };
        return { ...schema, score: backend.score || 0 };
      });
      merged.sort((a, b) => b.score - a.score);
      setResults(merged);
      setCurrentPage('results');
    } catch (err) {
      console.error(err);
      // Fallback: use hardcoded schemas with zero scores
      setResults(schemas.map(s => ({ ...s, score: 0 })));
      setCurrentPage('results');
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
    doc.text(schema.causes, 20, 50, { maxWidth: 170 });
    doc.text("Symptoms:", 20, 80);
    doc.text(schema.symptoms, 20, 90, { maxWidth: 170 });
    doc.text("4-Week Plan:", 20, 120);
    let y = 130;
    Object.entries(schema.plan).forEach(([week, text]) => {
      doc.text(`${week.toUpperCase()}: ${text}`, 20, y);
      y += 20;
    });
    doc.save(`${schema.name.replace(/ /g, '_')}_Plan.pdf`);
  };

  const toggleWeekComplete = (schemaName, week) => {
    const key = `${schemaName}-${week}`;
    setCompletedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Landing
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

  // Quiz
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

  // Results
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
                      <div className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                        {selectedSchema.category}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black mb-3">{selectedSchema.name}</h2>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <button onClick={handlePrint} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><Printer size={20} /></button>
                      <button onClick={() => handleDownloadPDF(selectedSchema)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"><Shield size={20} /></button>
                    </div>
                  </div>
                </div>
                <div className="p-10 grid md:grid-cols-3 gap-8 bg-slate-50 border-b border-slate-200">
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest"><Brain size={16}/> Root Cause</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedSchema.causes}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest"><AlertCircle size={16}/> Symptoms</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedSchema.symptoms}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-purple-600 font-black text-[10px] uppercase tracking-widest"><Activity size={16}/> Manifestations</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedSchema.manifestations}</p>
                  </div>
                </div>
                <div className="p-10">
                  <h3 className="text-3xl font-black text-slate-900 mb-10">4-Week Action Plan</h3>
                  <div className="space-y-10">
                    {Object.keys(selectedSchema.plan).map((week, idx) => {
                      const key = `${selectedSchema.name}-${week}`;
                      return (
                        <div key={week} className="flex gap-8 group">
                          <div className="flex flex-col items-center">
                            <div className={`p-4 rounded-2xl transition-all duration-500 ${completedWeeks[key] ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600 shadow-sm'}`}>
                              <BookOpen size={24} />
                            </div>
                            {idx < 3 && <div className="w-px h-full bg-slate-200 mt-4" />}
                          </div>
                          <div className="pb-10 flex-1">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className={`text-xl font-black uppercase tracking-tight ${completedWeeks[key] ? 'text-green-600' : 'text-slate-800'}`}>Week {idx+1}</h4>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer hover:text-blue-600 print:hidden">
                                <input 
                                  type="checkbox"
                                  checked={!!completedWeeks[key]}
                                  onChange={() => toggleWeekComplete(selectedSchema.name, week)}
                                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                {completedWeeks[key] ? 'COMPLETED' : 'MARK COMPLETE'}
                              </label>
                            </div>
                            <div className={`p-6 rounded-3xl leading-relaxed text-slate-700 border ${completedWeeks[key] ? 'bg-green-50/50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                              {selectedSchema.plan[week]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <footer className="mt-12 text-center text-slate-400 text-xs pb-12">
                This is a self-help tool. It is not a substitute for professional therapy.
              </footer>
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
