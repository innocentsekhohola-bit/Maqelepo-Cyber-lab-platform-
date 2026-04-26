from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    total_points = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default='Novice')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    progress = db.relationship('Progress', backref='user', lazy=True, cascade='all, delete-orphan')

    RANK_THRESHOLDS = [
        (0,    'Novice'),
        (100,  'Script Kiddie'),
        (300,  'Hacker'),
        (600,  'Elite Hacker'),
        (1000, 'Cyber Ninja'),
        (2000, 'Ghost Operative'),
    ]

    def update_rank(self):
        for threshold, rank_name in reversed(self.RANK_THRESHOLDS):
            if self.total_points >= threshold:
                self.rank = rank_name
                break

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'total_points': self.total_points,
            'rank': self.rank,
            'created_at': self.created_at.isoformat(),
            'completed_labs': len([p for p in self.progress if p.completed])
        }


class Lab(db.Model):
    __tablename__ = 'labs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)   # e.g. "Network", "Web", "Brute Force"
    difficulty = db.Column(db.String(50), nullable=False)  # "Easy", "Medium", "Hard"
    points = db.Column(db.Integer, default=50)
    instructions = db.Column(db.Text, nullable=False)
    hints = db.Column(db.JSON, default=list)               # list of hint strings
    flags = db.Column(db.JSON, default=list)               # list of acceptable flag strings
    allowed_commands = db.Column(db.JSON, default=list)    # whitelist of commands
    lab_type = db.Column(db.String(50), nullable=False)    # "scanner", "brute_force", "xss"
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    progress = db.relationship('Progress', backref='lab', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_flags=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'difficulty': self.difficulty,
            'points': self.points,
            'instructions': self.instructions,
            'hints': self.hints or [],
            'allowed_commands': self.allowed_commands or [],
            'lab_type': self.lab_type,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
        if include_flags:
            data['flags'] = self.flags or []
        return data


class Progress(db.Model):
    __tablename__ = 'progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    points_earned = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    hints_used = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint('user_id', 'lab_id', name='unique_user_lab'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lab_id': self.lab_id,
            'completed': self.completed,
            'attempts': self.attempts,
            'points_earned': self.points_earned,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'hints_used': self.hints_used
        }
