import os
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import pandas as pd

# -----------------------------
# Flask App Setup
# -----------------------------
app = Flask(__name__, static_folder=None)  # We handle static serving manually
CORS(app)  # Allow React frontend to call API from any origin

# -----------------------------
# CONFIGURATION
# -----------------------------
# Folder where your React build is located after `npm run build`
FRONTEND_BUILD_FOLDER = "client/build"  # Standard for Create React App

# CSV file names - make sure these exact names are in your repo
QUESTIONS_FILE = "LRS_Beta_QA.csv"
WEIGHT_MAP_FILE = "LRS_BETA_Weighted Score Map.csv"
SCHEMA_INFO_FILE = "LRS _Beta_Young_18_Schemas.csv"

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

if qa_df is None:
    print("WARNING: Questions file not loaded")
if weights_df is None:
    print("WARNING: Weight map file not loaded")
if schemas_df is None:
    print("WARNING: Schema info file not loaded")

# -----------------------------
# FULL SCHEMA DATA (hardcoded fallback in case CSV fails)
# -----------------------------
fallback_schemas = [
    {
        "id": 1,
        "category": "Disconnection & Rejection",
        "name": "Abandonment / Instability",
        "causes": "Unstable or unreliable caregiving; early loss or parent absence.",
        "symptoms": "Intense fear of loss, clinginess, jealousy, or withdrawal.",
        "manifestations": "Connection (attachment worry), Roots (parent loss), Stability (world anxiety)",
        "evidence": "Based on Young Schema Therapy (2003) and Attachment Theory.",
        "plan": {
            "week1": "Trigger Mapping: Record every time you feel 'abandonment panic'. Note the objective trigger vs. the internal fear.",
            "week2": "The Healthy Adult Voice: Practice the thought: 'I am an adult now. Even if this person leaves, I can care for myself.'",
            "week3": "Planned Separation: Spend an evening alone without checking social media. Practice self-soothing in the silence.",
            "week4": "Relapse Prevention: Identify 3 healthy ways to ask for reassurance without testing or accusing your partner."
        }
    },
    {
        "id": 2,
        "category": "Disconnection & Rejection",
        "name": "Mistrust / Abuse",
        "causes": "Abuse, betrayal, or manipulation by caregivers or peers.",
        "symptoms": "Expectation of harm, hypervigilance, difficulty trusting, testing others.",
        "manifestations": "Roots (trauma items), Connection (trust difficulty), Environment (safety)",
        "evidence": "Based on Trauma-Informed CBT protocols.",
        "plan": {
            "week1": "Evidence Checking: Pick one person you distrust. List evidence 'for' and 'against' the belief they intend harm.",
            "week2": "Boundary Training: Practice saying 'I’m not comfortable with that' to minor requests to build internal safety.",
            "week3": "Vulnerability Experiment: Share one minor personal opinion with a safe person. Observe the safety.",
            "week4": "Trust Pacing: Categorize people into 'Trust Levels' (1-5). Share only level-appropriate info."
        }
    },
    {
        "id": 3,
        "category": "Disconnection & Rejection",
        "name": "Emotional Deprivation",
        "causes": "Lack of nurturance, empathy, or affection from caregivers.",
        "symptoms": "Feeling chronically lonely, 'no one is there for me', choosing distant partners.",
        "manifestations": "Connection (closeness), Roots (neglect), Vitality (mood)",
        "evidence": "Based on Emotion-Focused Therapy and Young’s Schema models.",
        "plan": {
            "week1": "Need Awareness: Every time you feel empty, write down what you needed: Empathy, Protection, or Nurturance.",
            "week2": "Cognitive Flashcard: Create a card: 'My feeling that no one cares is a schema memory, not a current fact.'",
            "week3": "Active Request: Ask a trusted person for 10 minutes of active listening regarding a small stressor.",
            "week4": "Inner Nurturing: Schedule one activity weekly that feels 'nurturing' to your inner child."
        }
    },
    {
        "id": 4,
        "category": "Disconnection & Rejection",
        "name": "Defectiveness / Shame",
        "causes": "Criticism, rejection, or shaming; feeling inherently flawed.",
        "symptoms": "Deep shame, self-loathing, hypersensitivity to criticism, hiding 'defects'.",
        "manifestations": "Digital Wellbeing (comparison), Meaning (self-worth), Roots (insults)",
        "evidence": "Inspired by Compassion-Focused Therapy.",
        "plan": {
            "week1": "Critic Audit: Name your inner critic (e.g., 'The Judge'). Note how often it speaks and the words it uses.",
            "week2": "Humanity Re-framing: When you make a mistake, say: 'This is a common human experience, not a defect.'",
            "week3": "Mirror Work: Spend 2 minutes daily looking at yourself saying: 'I am worthy of kindness regardless of flaws.'",
            "week4": "Compassionate Letter: Write a letter to yourself from the perspective of a wise friend regarding a past mistake."
        }
    },
    {
        "id": 5,
        "category": "Disconnection & Rejection",
        "name": "Social Isolation / Alienation",
        "causes": "Feeling different or excluded from family or peers.",
        "symptoms": "Sense of being outsider, avoidance of groups, feeling no one understands.",
        "manifestations": "Connection (outsider), Environment (identity), Digital Wellbeing (comparison)",
        "evidence": "Based on Social Skills Training and CBT for Social Anxiety.",
        "plan": {
            "week1": "Similarity Search: In every social setting, find 3 things you have in common with others.",
            "week2": "Small Talk Script: Prepare 3 open-ended questions to use in conversations.",
            "week3": "Group Activity: Attend one low-pressure social event (e.g., class, meetup).",
            "week4": "Reflection: Write what went better than expected and plan next social step."
        }
    },
    {
        "id": 6,
        "category": "Impaired Autonomy & Performance",
        "name": "Dependence / Incompetence",
        "causes": "Overprotection or discouragement of independence.",
        "symptoms": "Belief one is incapable, excessive reliance on others, avoidance of responsibility.",
        "manifestations": "Growth (coping), Vitality (focus/energy), Roots (parentification)",
        "evidence": "Based on Self-Efficacy Theory (Bandura) and Schema Therapy.",
        "plan": {
            "week1": "Competence Log: Track 5 daily tasks you completed independently.",
            "week2": "Decision Practice: Make 3 small decisions without asking for advice.",
            "week3": "Skill Building: Choose one simple task you've avoided and complete it step-by-step.",
            "week4": "Reflection: List evidence of your growing capability."
        }
    },
    {
        "id": 7,
        "category": "Impaired Autonomy & Performance",
        "name": "Vulnerability to Harm or Illness",
        "causes": "Exaggerated danger or traumatic events.",
        "symptoms": "Catastrophizing, excessive precaution, phobias, hypochondria.",
        "manifestations": "Vitality (health), Environment (safety), Stability (world anxiety)",
        "evidence": "Based on Anxiety Disorder protocols.",
        "plan": {
            "week1": "Worry Time: Schedule 15 minutes daily to write all worries, then stop.",
            "week2": "Probability Estimation: Rate likelihood of feared event (0-100%) and check evidence.",
            "week3": "Exposure Step: Face one small feared situation (e.g., short trip).",
            "week4": "Safety Review: List all times feared event did NOT happen."
        }
    },
    {
        "id": 8,
        "category": "Impaired Autonomy & Performance",
        "name": "Enmeshment / Undeveloped Self",
        "causes": "Over-involved caregivers; no separate identity encouraged.",
        "symptoms": "Lack of individual direction, guilt when separate, fusion with others.",
        "manifestations": "Connection (preoccupation), Meaning (choices), Roots (mental illness in household)",
        "evidence": "Based on Differentiation of Self (Bowen).",
        "plan": {
            "week1": "Identity List: Write 10 things you like that are independent of others.",
            "week2": "Boundary Practice: Say 'I need time to think' to one request.",
            "week3": "Solo Activity: Spend 2 hours on a personal interest without sharing.",
            "week4": "Reflection: Notice how separate choices feel empowering."
        }
    },
    {
        "id": 9,
        "category": "Impaired Autonomy & Performance",
        "name": "Failure",
        "causes": "Criticism or comparison leading to belief in inevitable failure.",
        "symptoms": "Avoidance of challenges, self-sabotage, underachievement.",
        "manifestations": "Growth (achievement), Stability (financial plan), Vitality (energy)",
        "evidence": "Based on Learned Helplessness and Achievement Motivation.",
        "plan": {
            "week1": "Success Inventory: List 10 past achievements, big or small.",
            "week2": "Growth Mindset: Replace 'I failed' with 'I learned'.",
            "week3": "Small Challenge: Complete one avoided task with realistic goal.",
            "week4": "Celebrate Effort: Reward process, not just outcome."
        }
    },
    {
        "id": 10,
        "category": "Impaired Limits",
        "name": "Entitlement / Grandiosity",
        "causes": "Overindulgence or lack of limits.",
        "symptoms": "Belief one is superior, demands special treatment, lack of empathy.",
        "manifestations": "Growth (deservingness), Digital Wellbeing (rules)",
        "evidence": "Based on Narcissistic Personality research.",
        "plan": {
            "week1": "Empathy Log: Note one need of another person daily.",
            "week2": "Equality Reminder: 'Everyone's needs matter equally'.",
            "week3": "Delay Gratification: Wait 24h for one non-essential want.",
            "week4": "Gratitude Practice: Thank someone for meeting a reasonable need."
        }
    },
    {
        "id": 11,
        "category": "Impaired Limits",
        "name": "Insufficient Self-Control / Self-Discipline",
        "causes": "Lack of structure or consequences.",
        "symptoms": "Difficulty tolerating frustration, impulsivity, avoidance of discomfort.",
        "manifestations": "Digital Wellbeing (scrolling), Stability (savings), Growth (procrastination)",
        "evidence": "Based on Delay of Gratification studies.",
        "plan": {
            "week1": "Impulse Log: Track urges and delay action by 10 minutes.",
            "week2": "If-Then Planning: 'If I feel urge to scroll, then I stand up and stretch'.",
            "week3": "Commitment Device: Use app blocker for one habit.",
            "week4": "Reward System: Plan healthy reward after completing task."
        }
    },
    {
        "id": 12,
        "category": "Other-Directedness",
        "name": "Subjugation",
        "causes": "Punishment for asserting needs; dominance in family.",
        "symptoms": "Suppression of anger/needs, passive compliance, bottled resentment.",
        "manifestations": "Connection (suppression), Growth (conflict avoidance)",
        "evidence": "Based on Assertiveness Training.",
        "plan": {
            "week1": "Need Awareness: Write down 3 suppressed wants daily.",
            "week2": "Low-Risk Assertion: Express one small preference ('I’d prefer X').",
            "week3": "Anger Journal: Safely write unsent letter expressing resentment.",
            "week4": "Boundary Setting: Practice 'No' to one reasonable request."
        }
    },
    {
        "id": 13,
        "category": "Other-Directedness",
        "name": "Self-Sacrifice",
        "causes": "Guilt or modeling of excessive giving.",
        "symptoms": "Over-focus on others' needs, neglect own, resentment, burnout.",
        "manifestations": "Meaning (helping), Connection (preoccupation), Roots (parentification)",
        "evidence": "Based on Boundaries and Burnout research.",
        "plan": {
            "week1": "Giving Audit: Track time/energy given vs. received.",
            "week2": "Self-Care Priority: Schedule one non-negotiable self-need daily.",
            "week3": "Balanced Helping: Offer help only when you genuinely want to.",
            "week4": "Guilt Reframe: 'Meeting my needs allows me to help others sustainably.'"
        }
    },
    {
        "id": 14,
        "category": "Other-Directedness",
        "name": "Approval-Seeking / Recognition-Seeking",
        "causes": "Love conditional on performance/appearance.",
        "symptoms": "Excessive need for admiration, identity based on external validation.",
        "manifestations": "Digital Wellbeing (validation), Meaning (respect), Growth (worth)",
        "evidence": "Based on Self-Determination Theory.",
        "plan": {
            "week1": "Validation Source: List 5 internal qualities you value in yourself.",
            "week2": "Social Media Fast: 1 day without seeking likes/comments.",
            "week3": "Intrinsic Goal: Do one activity for personal enjoyment, not sharing.",
            "week4": "Self-Approval Practice: Daily affirm 'My worth is inherent'."
        }
    },
    {
        "id": 15,
        "category": "Overvigilance & Inhibition",
        "name": "Negativity / Pessimism",
        "causes": "Focus on negative in family; repeated hardship.",
        "symptoms": "Chronic focus on negatives, worry, discounting positives.",
        "manifestations": "Vitality (mood), Stability (world anxiety), Meaning (gratitude)",
        "evidence": "Based on Positive Psychology interventions.",
        "plan": {
            "week1": "3 Good Things: Write 3 positive events daily and why they happened.",
            "week2": "Evidence Testing: For one worry, list evidence for/against.",
            "week3": "Gratitude Visit: Write and deliver (or read) a gratitude letter.",
            "week4": "Best Possible Self: Visualize and write about your ideal future."
        }
    },
    {
        "id": 16,
        "category": "Overvigilance & Inhibition",
        "name": "Emotional Inhibition",
        "causes": "Suppression of emotions shamed or punished.",
        "symptoms": "Restraint of feelings, fear of losing control, appear rigid/cold.",
        "manifestations": "Connection (hiding feelings), Digital Wellbeing (curating self), Vitality (mood)",
        "evidence": "Based on Emotion Regulation research.",
        "plan": {
            "week1": "Emotion Labeling: Name feelings 5 times daily.",
            "week2": "Safe Expression: Share one feeling with a trusted person.",
            "week3": "Body Awareness: Notice where emotions live in your body.",
            "week4": "Play Experiment: Do one spontaneous, fun activity."
        }
    },
    {
        "id": 17,
        "category": "Overvigilance & Inhibition",
        "name": "Unrelenting Standards / Hypercriticalness",
        "causes": "High pressure for performance; criticism for imperfection.",
        "symptoms": "Perfectionism, chronic dissatisfaction, burnout, harsh judgment.",
        "manifestations": "Growth (perfection), Meaning (peace), Connection (suppression)",
        "evidence": "Based on Perfectionism CBT protocols.",
        "plan": {
            "week1": "Standards Audit: List your 'shoulds' and question necessity.",
            "week2": "Good Enough Goal: Complete one task to 80% standard deliberately.",
            "week3": "Self-Compassion Break: Use Kristin's phrase during criticism.",
            "week4": "Balance Review: Schedule equal time for achievement and rest."
        }
    },
    {
        "id": 18,
        "category": "Overvigilance & Inhibition",
        "name": "Punitiveness",
        "causes": "Harsh punishment; intolerance of mistakes.",
        "symptoms": "Self-punishing or punitive toward others, difficulty forgiving.",
        "manifestations": "Vitality (guilt), Growth (critical mistakes), Roots (cruel discipline)",
        "evidence": "Based on Self-Compassion and Forgiveness research.",
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
        return jsonify({"error": "Questions file not loaded on server"}), 500
    questions = qa_df.to_dict(orient='records')
    return jsonify(questions)

@app.route('/api/calculate', methods=['POST'])
def calculate_results():
    data = request.get_json()
    user_answers = data.get('answers', {})

    if not user_answers:
        return jsonify({"error": "No answers provided"}), 400

    if weights_df is None or schemas_df is None:
        return jsonify({"error": "Server data files missing"}), 500

    scores = {}

    for _, row in weights_df.iterrows():
        q_id = str(row.get('Question ID', row.get('ID', ''))).strip()
        schema_name = str(row.get('Schema Name', '')).strip()
        weight = float(row.get('Weight', 1.0))
        direction = str(row.get('SCORING LOGIC', '')).strip().lower()

        if q_id in user_answers and schema_name:
            answer = float(user_answers[q_id])

            if 'reverse' in direction:
                answer = 5 - answer + 1  # 0-4 scale reverse

            weighted = answer * weight
            scores[schema_name] = scores.get(schema_name, 0) + weighted

    # Build results with fallback schemas if CSV missing
    results = []
    for schema in fallback_schemas:
        name = schema['name']
        score = scores.get(name, 0)
        results.append({
            "id": schema['id'],
            "name": name,
            "category": schema['category'],
            "score": round(score, 2),
            "causes": schema['causes'],
            "symptoms": schema['symptoms'],
            "manifestations": schema['manifestations'],
            "evidence": schema['evidence'],
            "plan": schema['plan']
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({"top_schemas": results})

# -----------------------------
# SERVE REACT FRONTEND (Fixes 404)
# -----------------------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    build_path = os.path.join(os.getcwd(), FRONTEND_BUILD_FOLDER)

    if path != "" and os.path.exists(os.path.join(build_path, path)):
        return send_from_directory(build_path, path)
    else:
        return send_from_directory(build_path, 'index.html')

# -----------------------------
# Run Server
# -----------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
