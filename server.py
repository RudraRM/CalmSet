from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import datetime

app = Flask(__name__, static_folder='.')
CORS(app)

DATA_FILE = 'data.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {
            'tasks': [],
            'settings': {
                'username': 'Friend',
                'clock_format': '12',
                'clear_mode': False,
                'focus_duration': 25,
                'short_break': 5,
                'long_break': 15,
                'alert_sound': 'digital_bell',
                'alert_volume': 70
            },
            'stats': {
                'total_focus_minutes': 0,
                'streak_days': 0,
                'completed_tasks_total': 0,
                'sessions': []
            }
        }
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# ── TASKS ──────────────────────────────────────────────
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    data = load_data()
    return jsonify(data['tasks'])

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = load_data()
    task = request.json
    task['id'] = str(datetime.datetime.now().timestamp()).replace('.', '')
    task['completed'] = False
    task['created_at'] = datetime.datetime.now().isoformat()
    data['tasks'].append(task)
    save_data(data)
    return jsonify(task), 201

@app.route('/api/tasks/<task_id>', methods=['PATCH'])
def update_task(task_id):
    data = load_data()
    for task in data['tasks']:
        if task['id'] == task_id:
            updates = request.json
            task.update(updates)
            if updates.get('completed'):
                data['stats']['completed_tasks_total'] += 1
            save_data(data)
            return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    data = load_data()
    data['tasks'] = [t for t in data['tasks'] if t['id'] != task_id]
    save_data(data)
    return jsonify({'success': True})

# ── SETTINGS ───────────────────────────────────────────
@app.route('/api/settings', methods=['GET'])
def get_settings():
    data = load_data()
    return jsonify(data['settings'])

@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = load_data()
    data['settings'].update(request.json)
    save_data(data)
    return jsonify(data['settings'])

# ── STATS ──────────────────────────────────────────────
@app.route('/api/stats', methods=['GET'])
def get_stats():
    data = load_data()
    return jsonify(data['stats'])

@app.route('/api/stats/session', methods=['POST'])
def log_session():
    data = load_data()
    session = request.json
    session['date'] = datetime.datetime.now().isoformat()
    data['stats']['sessions'].append(session)
    data['stats']['total_focus_minutes'] += session.get('minutes', 0)
    save_data(data)
    return jsonify({'success': True})

if __name__ == '__main__':
    print("🌿 CalmSet server running at http://localhost:5000")
    app.run(debug=True, port=5000)
