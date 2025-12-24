import os
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import pandas as pd

# -----------------------------
# Flask App Setup
# -----------------------------
app = Flask(__name__, static_folder=None)  # We handle static serving manually
CORS(app)  # Allow React frontend to call API

# -----------------------------
# CONFIGURATION
# -----------------------------
# Folder where your React build is located
FRONTEND_BUILD_FOLDER = "client/build"

# CSV file names — MUST EXACTLY MATCH your uploaded files in repo
QUESTIONS_FILE = "LRS_Beta_QA.csv"
WEIGHT_MAP_FILE = "LRS_BETA_Weighted_Score_Map.csv"
SCHEMA_INFO_FILE = "LRS_Beta_Young_18_Schemas.csv"

# -----------------------------
# DATA LOADER (safe for CSV or misnamed XLSX)
# -----------------------------
def load_data_file(filename):
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return None
    try:
        return pd.read_csv(filename)
    except Exception as e1:
        print(f"CSV read failed for {filename}: {e1}")
        try:
            return pd.read_excel(filename)
        except Exception as e2:
            print(f"Excel read also failed for {filename}: {e2}")
            return None

# Load data at startup
qa_df = load_data_file(QUESTIONS_FILE)
weights_df = load_data_file(WEIGHT_MAP_FILE)
schemas_df = load_data_file(SCHEMA_INFO_FILE)

# -----------------------------
# FULL SCHEMA DATA (hardcoded fallback with complete 4-week plans)
# -----------------------------
fallback_schemas = [
    {
        "name": "Abandonment / Instability",
        "category": "Disconnection & Rejection",
        "causes": "Unstable or unreliable caregiving; early loss or parent absence.",
        "symptoms": "Intense fear of loss, clinginess, jealousy, or withdrawal.",
        "manifestations": "Connection (attachment worry), Roots (parent loss), Stability (world anxiety)",
        "plan": {
            "week1": "Trigger Mapping: Record every time you feel 'abandonment panic'. Note the objective trigger vs. the internal fear.",
            "week2": "The Healthy Adult Voice: Practice the thought: 'I am an adult now. Even if this person leaves, I can care for myself.'",
            "week3": "Planned Separation: Spend an evening alone without checking social media. Practice self-soothing in the silence.",
            "week4": "Relapse Prevention: Identify 3 healthy ways to ask for reassurance without testing or accusing your partner."
        }
    },
    {
        "name": "Mistrust / Abuse",
        "category": "Disconnection & Rejection",
        "causes": "Abuse, betrayal, or manipulation by caregivers or peers.",
        "symptoms": "Expectation of harm, hypervigilance, difficulty trusting, testing others.",
        "manifestations": "Roots (trauma items), Connection (trust difficulty), Environment (safety)",
        "plan": {
            "week1": "Evidence Checking: Pick one person you distrust. List evidence 'for' and 'against' the belief they intend harm.",
            "week2": "Boundary Training: Practice saying 'I’m not comfortable with that' to minor requests to build internal safety.",
            "week3": "Vulnerability Experiment: Share one minor personal opinion with a safe person. Observe the safety.",
            "week4": "Trust Pacing: Categorize people into 'Trust Levels' (1-5). Share only level-appropriate info."
        }
    },
    {
        "name": "Emotional Deprivation",
        "category": "Disconnection & Rejection",
        "causes": "Lack of nurturance, empathy, or affection from caregivers.",
        "symptoms": "Feeling chronically lonely, 'no one is there for me', choosing distant partners.",
        "manifestations": "Connection (closeness/intimacy), Roots (neglect/affection lack), Vitality (mood)",
        "plan": {
            "week1": "Need Awareness: Every time you feel empty, write down what you needed: Empathy, Protection, or Nurturance.",
            "week2": "Cognitive Flashcard: Create a card: 'My feeling that no one cares is a schema memory, not a current fact.'",
            "week3": "Active Request: Ask a trusted person for 10 minutes of active listening regarding a small stressor.",
            "week4": "Inner Nurturing: Schedule one activity weekly that feels 'nurturing' to your inner child."
        }
    },
    {
        "name": "Defectiveness / Shame",
        "category": "Disconnection & Rejection",
        "causes": "Criticism, rejection, or shaming; feeling inherently flawed.",
        "symptoms": "Deep shame, self-loathing, hypersensitivity to criticism, hiding 'defects', self-sabotage in relationships.",
        "manifestations": "Digital Wellbeing (comparison), Meaning (self-worth), Roots (insults/shame)",
        "plan": {
            "week1": "Critic Audit: Name your inner critic (e.g., 'The Judge'). Note how often it speaks and the words it uses.",
            "week2": "Humanity Re-framing: When you make a mistake, say: 'This is a common human experience, not a defect.'",
            "week3": "Mirror Work: Spend 2 minutes daily looking at yourself saying: 'I am worthy of kindness regardless of flaws.'",
            "week4": "Compassionate Letter: Write a letter to yourself from the perspective of a wise friend regarding a past mistake."
        }
    },
    {
        "name": "Social Isolation / Alienation",
        "category": "Disconnection & Rejection",
        "causes": "Feeling different or excluded from family/peers.",
        "symptoms": "Sense of being outsider, avoidance of groups despite longing, feeling no one understands.",
        "manifestations": "Connection (outsider feelings), Environment (spaces/personal identity), Digital Wellbeing (comparison)",
        "plan": {
            "week1": "Similarity Search: In every social setting, find 3 things you have in common with others.",
            "week2": "Small Talk Script: Prepare 3 open-ended questions to use in conversations.",
            "week3": "Group Activity: Attend one low-pressure social event (e.g., class, meetup).",
            "week4": "Reflection: Write what went better than expected and plan next social step."
        }
    },
    {
        "name": "Dependence / Incompetence",
        "category": "Impaired Autonomy & Performance",
        "causes": "Overprotection or discouragement of independence.",
        "symptoms": "Belief one is incapable, excessive reliance on others, avoidance of responsibility, helplessness.",
        "manifestations": "Growth (coping/capability), Vitality (focus/energy), Roots (parentification)",
        "plan": {
            "week1": "Competence Log: Track 5 daily tasks you completed independently.",
            "week2": "Decision Practice: Make 3 small decisions without asking for advice.",
            "week3": "Skill Building: Choose one simple task you've avoided and complete it step-by-step.",
            "week4": "Reflection: List evidence of your growing capability."
        }
    },
    {
        "name": "Vulnerability to Harm or Illness",
        "category": "Impaired Autonomy & Performance",
        "causes": "Exaggerated danger or traumatic events.",
        "symptoms": "Catastrophizing, excessive precaution, phobias, hypochondria.",
        "manifestations": "Vitality (health/resilience), Environment (safety/noise/light), Stability (world anxiety)",
        "plan": {
            "week1": "Worry Time: Schedule 15 minutes daily to write all worries, then stop.",
            "week2": "Probability Estimation: Rate likelihood of feared event (0-100%) and check evidence.",
            "week3": "Exposure Step: Face one small feared situation (e.g., short trip).",
            "week4": "Safety Review: List all times feared event did NOT happen."
        }
    },
    {
        "name": "Enmeshment / Undeveloped Self",
        "category": "Impaired Autonomy & Performance",
        "causes": "Over-involved caregivers; no separate identity encouraged.",
        "symptoms": "Lack of individual direction, guilt when separate, fusion with others' emotions/needs.",
        "manifestations": "Connection (preoccupation), Meaning (choices/values), Roots (household mental illness)",
        "plan": {
            "week1": "Identity List: Write 10 things you like that are independent of others.",
            "week2": "Boundary Practice: Say 'I need time to think' to one request.",
            "week3": "Solo Activity: Spend 2 hours on a personal interest without sharing.",
            "week4": "Reflection: Notice how separate choices feel empowering."
        }
    },
    {
        "name": "Failure",
        "category": "Impaired Autonomy & Performance",
        "causes": "Criticism or comparison leading to belief in inevitable failure.",
        "symptoms": "Avoidance of challenges, self-sabotage, underachievement despite ability.",
        "manifestations": "Growth (achievement/perfection), Stability (financial plan), Vitality (energy)",
        "plan": {
            "week1": "Success Inventory: List 10 past achievements, big or small.",
            "week2": "Growth Mindset: Replace 'I failed' with 'I learned'.",
            "week3": "Small Challenge: Complete one avoided task with realistic goal.",
            "week4": "Celebrate Effort: Reward process, not just outcome."
        }
    },
    {
        "name": "Entitlement / Grandiosity",
        "category": "Impaired Limits",
        "causes": "Overindulgence or lack of limits.",
        "symptoms": "Belief one is superior, demands special treatment, lack of empathy/reciprocal responsibility.",
        "manifestations": "Growth (deservingness/empathy), Digital Wellbeing (rules/control)",
        "plan": {
            "week1": "Empathy Log: Note one need of another person daily.",
            "week2": "Equality Reminder: 'Everyone's needs matter equally'.",
            "week3": "Delay Gratification: Wait 24h for one non-essential want.",
            "week4": "Gratitude Practice: Thank someone for meeting a reasonable need."
        }
    },
    {
        "name": "Insufficient Self-Control / Self-Discipline",
        "category": "Impaired Limits",
        "causes": "Lack of structure or consequences.",
        "symptoms": "Difficulty tolerating frustration, impulsivity, avoidance of discomfort needed for goals.",
        "manifestations": "Digital Wellbeing (scrolling/notifications), Stability (savings), Growth (procrastination)",
        "plan": {
            "week1": "Impulse Log: Track urges and delay action by 10 minutes.",
            "week2": "If-Then Planning: 'If I feel urge to scroll, then I stand up and stretch'.",
            "week3": "Commitment Device: Use app blocker for one habit.",
            "week4": "Reward System: Plan healthy reward after completing task."
        }
    },
    {
        "name": "Subjugation",
        "category": "Other-Directedness",
        "causes": "Punishment for asserting needs; dominance in family.",
        "symptoms": "Suppression of anger/needs to avoid retaliation, passive compliance, bottled resentment.",
        "manifestations": "Connection (suppression/peace), Growth (conflict avoidance)",
        "plan": {
            "week1": "Need Awareness: Write down 3 suppressed wants daily.",
            "week2": "Low-Risk Assertion: Express one small preference ('I’d prefer X').",
            "week3": "Anger Journal: Safely write unsent letter expressing resentment.",
            "week4": "Boundary Setting: Practice 'No' to one reasonable request."
        }
    },
    {
        "name": "Self-Sacrifice",
        "category": "Other-Directedness",
        "causes": "Guilt or modeling of excessive giving.",
        "symptoms": "Over-focus on others' needs, neglect own, resentment, burnout.",
        "manifestations": "Meaning (helping/meaning), Connection (preoccupation), Roots (parentification)",
        "plan": {
            "week1": "Giving Audit: Track time/energy given vs. received.",
            "week2": "Self-Care Priority: Schedule one non-negotiable self-need daily.",
            "week3": "Balanced Helping: Offer help only when you genuinely want to.",
            "week4": "Guilt Reframe: 'Meeting my needs allows me to help others sustainably.'"
        }
    },
    {
        "name": "Approval-Seeking / Recognition-Seeking",
        "category": "Other-Directedness",
        "causes": "Love conditional on performance/appearance.",
        "symptoms": "Excessive need for admiration, identity based on external validation, conformity.",
        "manifestations": "Digital Wellbeing (validation/likes), Meaning (respect), Growth (worth)",
        "plan": {
            "week1": "Validation Source: List 5 internal qualities you value in yourself.",
            "week2": "Social Media Fast: 1 day without seeking likes/comments.",
            "week3": "Intrinsic Goal: Do one activity for personal enjoyment, not sharing.",
            "week4": "Self-Approval Practice: Daily affirm 'My worth is inherent'."
        }
    },
    {
        "name": "Negativity / Pessimism",
        "category": "Overvigilance & Inhibition",
        "causes": "Focus on negative in family; repeated hardship.",
        "symptoms": "Chronic focus on negatives, worry, discounting positives, life feels bleak.",
        "manifestations": "Vitality (mood/energy), Stability (world anxiety), Meaning (gratitude/peace)",
        "plan": {
            "week1": "3 Good Things: Write 3 positive events daily and why they happened.",
            "week2": "Evidence Testing: For one worry, list evidence for/against.",
            "week3": "Gratitude Visit: Write and deliver (or read) a gratitude letter.",
            "week4": "Best Possible Self: Visualize and write about your ideal future."
        }
    },
    {
        "name": "Emotional Inhibition",
        "category": "Overvigilance & Inhibition",
        "causes": "Suppression of emotions shamed or punished.",
        "symptoms": "Restraint of feelings, fear of losing control, appear rigid/cold, difficulty with spontaneity.",
        "manifestations": "Connection (hiding feelings), Digital Wellbeing (curating self), Vitality (mood)",
        "plan": {
            "week1": "Emotion Labeling: Name feelings 5 times daily.",
            "week2": "Safe Expression: Share one feeling with a trusted person.",
            "week3": "Body Awareness: Notice where emotions live in your body.",
            "week4": "Play Experiment: Do one spontaneous, fun activity."
        }
    },
    {
        "name": "Unrelenting Standards / Hypercriticalness",
        "category": "Overvigilance & Inhibition",
        "causes": "High pressure for performance; criticism for imperfection.",
        "symptoms": "Perfectionism, chronic dissatisfaction, burnout, harsh self/other judgment.",
        "manifestations": "Growth (perfection/strive), Meaning (peace), Connection (suppression)",
        "plan": {
            "week1": "Standards Audit: List your 'shoulds' and question necessity.",
            "week2": "Good Enough Goal: Complete one task to 80% standard deliberately.",
            "week3": "Self-Compassion Break: Use Kristin's phrase during criticism.",
            "week4": "Balance Review: Schedule equal time for achievement and rest."
        }
    },
    {
        "name": "Punitiveness",
        "category": "Overvigilance & Inhibition",
        "causes": "Harsh punishment; intolerance of mistakes.",
        "symptoms": "Self-punishing or punitive toward others, difficulty forgiving errors.",
        "manifestations": "Vitality (guilt/appetite), Growth (critical mistakes), Roots (cruel discipline)",
        "plan": {
            "week1": "Mistake Log: Write mistakes without judgment.",
            "week2": "Forgiveness Letter: Write (unsent) forgiving yourself or another.",
            "week3": "Mercy Practice: Respond to one mistake with kindness phrase.",
            "week4": "Common Humanity: Remind 'Everyone makes mistakes' daily."
        }
    }
]

# -----------------------------
# API ENDPOINTS
# -----------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "LRS Scoring Engine Online", "version": "1.0.0"}), 200

@app.route('/api/questions', methods=['GET'])
def get_questions():
    if qa_df is None:
        return jsonify({"error": "Questions file not loaded"}), 500
    
    # Replace NaN with empty string to prevent invalid JSON
    clean_df = qa_df.fillna('')
    questions = clean_df.to_dict(orient='records')
    return jsonify(questions)

@app.route('/api/calculate', methods=['POST'])
def calculate_results():
    data = request.get_json()
    user_answers = data.get('answers', {})

    if not user_answers:
        return jsonify({"error": "No answers provided"}), 400

    if weights_df is None:
        return jsonify({"error": "Server data files missing"}), 500

    scores = {}

    for _, row in weights_df.iterrows():
        q_id = str(row.get('Question ID', row.get('ID', ''))).strip()
        schema_name = str(row.get('Schema Name', '')).strip()
        weight = float(row.get('Weight', 1.0))
        direction = str(row.get('SCORING LOGIC', '')).strip().lower()

        # Only process if this question has a numeric answer (skip open-ended)
        if q_id in user_answers:
            answer_value = user_answers[q_id]
            # Skip non-numeric answers (open-ended text)
            if not isinstance(answer_value, (int, float)):
                continue
            try:
                answer = float(answer_value)
            except (ValueError, TypeError):
                continue  # Skip invalid

            if 'reverse' in direction:
                answer = 5 - answer + 1  # 0-4 scale reverse

            weighted = answer * weight
            scores[schema_name] = scores.get(schema_name, 0) + weighted

    results = []
    for schema in fallback_schemas:
        name = schema['name']
        score = scores.get(name, 0.0)
        results.append({
            "name": name,
            "category": schema['category'],
            "score": round(score, 2),
            "causes": schema['causes'],
            "symptoms": schema['symptoms'],
            "manifestations": schema['manifestations'],
            "plan": schema['plan']
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({"top_schemas": results})

# -----------------------------
# SERVE REACT FRONTEND
# -----------------------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    build_path = os.path.join(os.getcwd(), FRONTEND_BUILD_FOLDER)
    full_path = os.path.join(build_path, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(build_path, path)
    else:
        return send_from_directory(build_path, 'index.html')

# -----------------------------
# Run Server
# -----------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
