import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for React frontend (localhost or Railway domain)
CORS(app)

# --- CONFIGURATION ---
# Ensure these filenames match exactly what you upload to your Railway repo
QUESTIONS_FILE = "LRS_Beta_QA.csv"
WEIGHT_MAP_FILE = "LRS_BETA_Weighted Score Map.csv"
SCHEMA_INFO_FILE = "LRS _Beta_Young_18_Schemas.csv"

# --- DATA LOADER HELPER ---
def load_data_file(filename):
    """
    Railway-ready loader. Attempts to read as CSV, then Excel 
    if the file is mislabeled.
    """
    if not os.path.exists(filename):
        return None
    try:
        # Try standard CSV
        return pd.read_csv(filename)
    except Exception:
        try:
            # Try Excel (handles cases where XLSX is renamed to CSV)
            return pd.read_excel(filename)
        except Exception:
            return None

# --- API ENDPOINTS ---

@app.route('/api/calculate', methods=['POST'])
def health_check():
    return jsonify({"status": "LRS Scoring Engine Online", "version": "1.0.0"}), 200

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Returns the full list of 100 questions for the frontend to render."""
    df = load_data_file(QUESTIONS_FILE)
    if df is None:
        return jsonify({"error": "Questions file not found"}), 404
    
    # We convert to a list of dicts for the React frontend
    # Assuming columns: ID, Question Text (final gentle wording), Section, Scale Type
    questions = df.to_dict(orient='records')
    return jsonify(questions)

@app.route('/api/calculate', methods=['POST'])
def calculate_results():
    """
    Accepts: { "answers": { "1": 5, "2": 3, ... } }
    Returns: Sorted list of schemas with calculated scores and action plans.
    """
    data = request.json
    user_answers = data.get('answers') # Dictionary of q_id: score
    
    if not user_answers:
        return jsonify({"error": "No answers provided"}), 400

    # Load Weights and Schema Info
    weights_df = load_data_file(WEIGHT_MAP_FILE)
    schemas_df = load_data_file(SCHEMA_INFO_FILE)

    if weights_df is None or schemas_df is None:
        return jsonify({"error": "Data files missing on server"}), 500

    # 1. Initialize Schema Scores
    # We'll use a dictionary to track totals: { "Abandonment": 15.5, ... }
    scores = {}
    
    # 2. Process Calculation Logic
    for _, row in weights_df.iterrows():
        q_id = str(row.get('QuestionID', row.get('ID')))
        schema_name = row.get('SchemaName', row.get('Schema Name'))
        weight = float(row.get('Weight', 1.0))
        is_reverse = row.get('Scoring Logic', '').lower() == 'reverse' or row.get('IsReverse', False)

        if q_id in user_answers:
            answer = float(user_answers[q_id])
            
            # Handle Reverse Scoring (Assuming 1-5 scale)
            if is_reverse:
                answer = 6 - answer # Maps 1->5, 5->1
            
            # Apply Weight
            weighted_val = answer * weight
            scores[schema_name] = scores.get(schema_name, 0) + weighted_val

    # 3. Merge with Metadata (Symptoms/Roots/Action Plans)
    results = []
    for schema_name, total_score in scores.items():
        # Find matching metadata row
        meta = schemas_df[schemas_df['Schema Name'] == schema_name].iloc[0] if not schemas_df[schemas_df['Schema Name'] == schema_name].empty else {}
        
        results.append({
            "name": schema_name,
            "score": round(total_score, 2),
            "category": meta.get('Element Links', 'General'),
            "causes": meta.get('Root (Childhood Unmet Need)', 'N/A'),
            "symptoms": meta.get('Symptoms', 'N/A'),
            # Action Plan logic can be pulled from the metadata or a mapping
            "action_plan": {
                "week1": "Deep Observation: Notice triggers.",
                "week2": "Cognitive Reframing.",
                "week3": "Behavioral Experiment.",
                "week4": "Relapse Prevention."
            }
        })

    # Sort results so the highest score (most active schema) is first
    results.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({"top_schemas": results})

if __name__ == '__main__':
    # Railway provides the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
