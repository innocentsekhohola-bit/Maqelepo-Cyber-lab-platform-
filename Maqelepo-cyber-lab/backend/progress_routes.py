from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, User, Lab, Progress

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('/user-progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    all_progress = Progress.query.filter_by(user_id=user_id).all()
    completed = [p for p in all_progress if p.completed]
    in_progress = [p for p in all_progress if not p.completed]

    # Enrich with lab titles
    def enrich(p):
        d = p.to_dict()
        lab = Lab.query.get(p.lab_id)
        if lab:
            d['lab_title'] = lab.title
            d['lab_category'] = lab.category
            d['lab_difficulty'] = lab.difficulty
        return d

    return jsonify({
        'user': user.to_dict(),
        'stats': {
            'total_labs': Lab.query.filter_by(is_active=True).count(),
            'completed_count': len(completed),
            'in_progress_count': len(in_progress),
            'total_points': user.total_points,
            'rank': user.rank
        },
        'completed': [enrich(p) for p in completed],
        'in_progress': [enrich(p) for p in in_progress]
    }), 200


@progress_bp.route('/complete-lab', methods=['POST'])
@jwt_required()
def complete_lab():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    lab_id = data.get('lab_id')
    submitted_flag = (data.get('flag') or '').strip()

    if not lab_id:
        return jsonify({'error': 'lab_id is required'}), 400
    if not submitted_flag:
        return jsonify({'error': 'flag is required'}), 400

    lab = Lab.query.filter_by(id=lab_id, is_active=True).first()
    if not lab:
        return jsonify({'error': 'Lab not found'}), 404

    # Validate flag
    valid_flags = [f.strip().lower() for f in (lab.flags or [])]
    if submitted_flag.lower() not in valid_flags:
        return jsonify({'error': 'Incorrect flag. Keep trying!', 'correct': False}), 200

    # Get or create progress
    prog = Progress.query.filter_by(user_id=user_id, lab_id=lab_id).first()
    if not prog:
        prog = Progress(user_id=user_id, lab_id=lab_id)
        db.session.add(prog)

    if prog.completed:
        return jsonify({
            'message': 'Lab already completed!',
            'correct': True,
            'already_completed': True
        }), 200

    # Award points (reduced if hints used)
    base_points = lab.points
    hint_penalty = prog.hints_used * 10
    earned = max(base_points - hint_penalty, int(base_points * 0.25))

    prog.completed = True
    prog.completed_at = datetime.utcnow()
    prog.points_earned = earned

    user = User.query.get(user_id)
    user.total_points += earned
    user.update_rank()

    db.session.commit()

    return jsonify({
        'message': f'🎉 Lab completed! You earned {earned} points.',
        'correct': True,
        'points_earned': earned,
        'total_points': user.total_points,
        'rank': user.rank,
        'already_completed': False
    }), 200


@progress_bp.route('/use-hint', methods=['POST'])
@jwt_required()
def use_hint():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    lab_id = data.get('lab_id')
    hint_index = data.get('hint_index', 0)

    lab = Lab.query.filter_by(id=lab_id, is_active=True).first()
    if not lab:
        return jsonify({'error': 'Lab not found'}), 404

    hints = lab.hints or []
    if hint_index >= len(hints):
        return jsonify({'error': 'No more hints available'}), 404

    prog = Progress.query.filter_by(user_id=user_id, lab_id=lab_id).first()
    if not prog:
        prog = Progress(user_id=user_id, lab_id=lab_id)
        db.session.add(prog)

    prog.hints_used = max(prog.hints_used, hint_index + 1)
    db.session.commit()

    return jsonify({
        'hint': hints[hint_index],
        'hints_used': prog.hints_used,
        'point_penalty': prog.hints_used * 10
    }), 200
