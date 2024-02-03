from flask import Flask, request, jsonify
from flask_cors import CORS 
from sentence_transformers import SentenceTransformer, util
import csv
import io
from pymongo import MongoClient
from datetime import datetime
from bson.json_util import dumps
from bson import ObjectId

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'

client = MongoClient('mongodb://localhost:12345')
db = client['automated_students_short_answers_assessment_db']  
submissions = db['submissions']  
class AutoGrader:
    def __init__(self):
        self.model = SentenceTransformer('roberta-large-nli-stsb-mean-tokens')

    def load_student_answers(self, student_data):
        reader = csv.reader(io.StringIO(student_data), delimiter='\t')
        next(reader)  
        student_answers = {row[0]: row[1] for row in reader}
        return student_answers

    def compute_similarity(self, sentence1, sentence2):
        embedding1 = self.model.encode(sentence1, convert_to_tensor=True)
        embedding2 = self.model.encode(sentence2, convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(embedding1, embedding2).item()
        return similarity

    def grade_answer(self, student_answer, model_answer, model_concepts):
        max_n = 1
        words_list = student_answer.split()
        student_phrases = [' '.join(words_list[i:i+n]) for n in range(1, min(max_n+1, len(words_list) + 1)) for i in range(len(words_list)-n+1)]
        total_concepts = len(model_concepts)
        detected_concepts = 0
        for model_concept in model_concepts:
            max_similarity = 0
            embeddings_student_phrases = self.model.encode(student_phrases, convert_to_tensor=True)
            embedding_model_concept = self.model.encode(model_concept, convert_to_tensor=True)
            similarities = util.pytorch_cos_sim(embedding_model_concept, embeddings_student_phrases)
            max_similarity = max(similarities[0])
            if max_similarity > 0.6:
                detected_concepts += 1
        grade = (detected_concepts / total_concepts) * 10
        return round(grade)

def format_qa_data(teacher_data, student_data):
    teacher_qa_pairs = [
        line.split('\t') for line in teacher_data.strip().split('\n') if line.strip()
    ]
    student_qa_pairs = [
        line.split('\t') for line in student_data.strip().split('\n') if line.strip()
    ]

    if teacher_qa_pairs:
        teacher_qa_pairs.pop(0) 
    if student_qa_pairs:
        student_qa_pairs.pop(0)

    formatted_teacher_data = []
    for pair in teacher_qa_pairs:
        if len(pair) == 3:
            question, model_answer, concepts = pair
            formatted_teacher_data.append({
                'question': question.strip(),
                'modelAnswer': model_answer.strip(),
                'concepts': concepts.split(';')
            })

    formatted_student_data = []
    for pair in student_qa_pairs:
        if len(pair) == 2:
            question, student_answer = pair
            formatted_student_data.append({
                'question': question.strip(),
                'studentAnswer': student_answer.strip()
            })

    return formatted_teacher_data, formatted_student_data

@app.route('/api/process_files', methods=['POST'])
def upload_file():
    if 'teacherFile' not in request.files or 'studentFile' not in request.files:
        return jsonify({'error': 'Missing file(s)'}), 400

    teacher_file = request.files['teacherFile']
    student_file = request.files['studentFile']

    teacher_data = teacher_file.read().decode('utf-8').strip()
    student_data = student_file.read().decode('utf-8').strip()

    if teacher_file.filename == '' or student_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if teacher_file and student_file:
        teacher_data = teacher_data.strip()
        student_data = student_data.strip()

        model_data = {}
        for line in teacher_data.split('\\n'):
            parts = line.split('\\t')
            if len(parts) == 3:
                question, model_answer, concepts = parts
                model_data[question.strip()] = (model_answer.strip(), concepts.split(';'))

        student_answers = {}
        for line in student_data.split('\\n'):
            parts = line.split('\\t')
            if len(parts) == 2:
                question, student_answer = parts
                student_answers[question.strip()] = student_answer.strip()

        auto_grader = AutoGrader()
        total_score = 0
        question_details = []
        formatted_teacher_data, formatted_student_data = format_qa_data(teacher_data, student_data)
        for student_answer_dict in formatted_student_data:
            question = student_answer_dict['question']
            student_answer = student_answer_dict['studentAnswer']
            corresponding_teacher_dict = next((item for item in formatted_teacher_data if item['question'] == question), None)
            if corresponding_teacher_dict:
                model_answer = corresponding_teacher_dict['modelAnswer']
                concepts = corresponding_teacher_dict['concepts']
                score = auto_grader.grade_answer(student_answer, model_answer, concepts)
                total_score += score
                question_details.append({
                    'question': question,
                    'studentAnswer': student_answer,
                    'grade': score,
                    'modelAnswer': model_answer
                })
                
        total_questions = len(formatted_teacher_data)
        total_possible_score = total_questions * 10
        total_grade = total_score / total_possible_score if total_questions > 0 else 0

        response_data = {
            'totalScore': total_score,
            'totalPossibleScore': total_possible_score, 
            'grade': total_grade,
            'details': question_details
        }

        submission_data = {
            'timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'teacher_file': formatted_teacher_data,
            'student_file': formatted_student_data,
            'grade': "{}/{}".format(total_score, total_possible_score),
            'details': question_details
        }
        submissions.insert_one(submission_data)

        return jsonify(response_data) 
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/submissions', methods=['GET'])
def get_all_submissions():
    try:
        all_submissions = list(db.submissions.find({}))
        return dumps(all_submissions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submissions/<submission_id>', methods=['GET'])
def get_submission(submission_id):
    try:
        submission = submissions.find_one({'_id': ObjectId(submission_id)})
        if submission:
            return dumps(submission), 200
        else:
            return jsonify({'error': 'Submission not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=23456)
