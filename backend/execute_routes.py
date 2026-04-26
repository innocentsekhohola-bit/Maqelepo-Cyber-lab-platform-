from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Lab, Progress
from cyber_engine.parser import sanitize_and_parse
from cyber_engine.scanner import run_scanner
from cyber_engine.brute_force import run_brute_force
from cyber_engine.xss_lab import run_xss_lab

execute_bp = Blueprint('execute', __name__)

HANDLERS = {
    'scanner':     run_scanner,
    'brute_force': run_brute_force,
    'xss':         run_xss_lab,
}


@execute_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    lab_id = data.get('lab_id')
    raw_command = data.get('command', '')

    if not lab_id:
        return jsonify({'error': 'lab_id is required'}), 400
    if not raw_command or not raw_command.strip():
        return jsonify({'error': 'command is required'}), 400

    lab = Lab.query.filter_by(id=lab_id, is_active=True).first()
    if not lab:
        return jsonify({'error': 'Lab not found'}), 404

    # Sanitize + parse
    parsed = sanitize_and_parse(raw_command, lab.allowed_commands or [])
    if parsed.get('blocked'):
        return jsonify({
            'output': f'[BLOCKED] {parsed["reason"]}',
            'success': False,
            'blocked': True
        }), 200

    # Get or create progress record
    prog = Progress.query.filter_by(user_id=user_id, lab_id=lab_id).first()
    if not prog:
        prog = Progress(user_id=user_id, lab_id=lab_id)
        db.session.add(prog)

    prog.attempts += 1
    db.session.commit()

    # Dispatch to the right engine
    handler = HANDLERS.get(lab.lab_type)
    if not handler:
        return jsonify({'error': f'Unknown lab type: {lab.lab_type}'}), 500

    result = handler(parsed, lab)

    return jsonify({
        'output': result.get('output', ''),
        'success': result.get('success', False),
        'flag': result.get('flag'),
        'hint': result.get('hint'),
        'attempts': prog.attempts
    }), 200
