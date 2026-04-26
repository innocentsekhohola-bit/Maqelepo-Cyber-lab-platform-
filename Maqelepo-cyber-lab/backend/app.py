from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db
from auth_routes import auth_bp
from lab_routes import lab_bp
from execute_routes import execute_bp
from progress_routes import progress_bp
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///cyberlab.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours

# Extensions
CORS(app, resources={r"/api/*": {"origins": os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000')}})
jwt = JWTManager(app)
db.init_app(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(lab_bp, url_prefix='/api')
app.register_blueprint(execute_bp, url_prefix='/api')
app.register_blueprint(progress_bp, url_prefix='/api')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Cyber Lab Platform running'}, 200

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {'error': 'Invalid token', 'code': 'INVALID_TOKEN'}, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return {'error': 'Authorization token required', 'code': 'MISSING_TOKEN'}, 401

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', port=5000)
