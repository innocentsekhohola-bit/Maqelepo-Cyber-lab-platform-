from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, Lab, Progress

lab_bp = Blueprint('labs', __name__)


@lab_bp.route('/labs', methods=['GET'])
def get_labs():
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    lab_type = request.args.get('lab_type')

    query = Lab.query.filter_by(is_active=True)
    if category:
        query = query.filter(Lab.category.ilike(f'%{category}%'))
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if lab_type:
        query = query.filter_by(lab_type=lab_type)

    labs = query.order_by(Lab.id).all()

    # Optionally attach user progress if JWT present
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
    except Exception:
        pass

    result = []
    for lab in labs:
        d = lab.to_dict()
        if user_id:
            prog = Progress.query.filter_by(user_id=user_id, lab_id=lab.id).first()
            d['user_progress'] = prog.to_dict() if prog else None
        result.append(d)

    return jsonify({'labs': result, 'total': len(result)}), 200


@lab_bp.route('/labs/<int:lab_id>', methods=['GET'])
def get_lab(lab_id):
    lab = Lab.query.filter_by(id=lab_id, is_active=True).first_or_404()

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
    except Exception:
        pass

    data = lab.to_dict()
    if user_id:
        prog = Progress.query.filter_by(user_id=user_id, lab_id=lab.id).first()
        data['user_progress'] = prog.to_dict() if prog else None

        # Auto-create a progress record to mark "started"
        if not prog:
            prog = Progress(user_id=user_id, lab_id=lab.id)
            db.session.add(prog)
            db.session.commit()
            data['user_progress'] = prog.to_dict()

    return jsonify({'lab': data}), 200


@lab_bp.route('/labs/categories', methods=['GET'])
def get_categories():
    rows = db.session.query(Lab.category).filter_by(is_active=True).distinct().all()
    return jsonify({'categories': [r[0] for r in rows]}), 200
