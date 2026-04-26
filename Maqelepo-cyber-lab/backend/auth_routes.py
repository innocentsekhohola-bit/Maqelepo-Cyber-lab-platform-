from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import bcrypt
import re
from datetime import datetime
from models import db, User

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_\-]{3,30}$')


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')


def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    # Validate
    errors = {}
    if not USERNAME_REGEX.match(username):
        errors['username'] = 'Username must be 3-30 characters: letters, numbers, _ or -'
    if not EMAIL_REGEX.match(email):
        errors['email'] = 'Invalid email address'
    if len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    if errors:
        return jsonify({'error': 'Validation failed', 'fields': errors}), 422

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password)
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Account created successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    identifier = (data.get('username') or data.get('email') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400

    # Find by username or email
    user = User.query.filter_by(username=identifier).first()
    if not user:
        user = User.query.filter_by(email=identifier.lower()).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    user.last_login = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()}), 200
