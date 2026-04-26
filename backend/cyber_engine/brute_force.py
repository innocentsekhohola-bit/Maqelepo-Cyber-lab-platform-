"""
cyber_engine/brute_force.py
Simulated Hydra-style SSH brute force lab.
Does NOT call real Hydra — it simulates the process with realistic output.
"""
import time
import random

WORDLISTS = {
    'common': [
        '123456', 'password', 'admin', 'root', 'letmein',
        'qwerty', 'abc123', 'monkey', 'iloveyou', '1234567890',
        'dragon', 'master', 'pass', 'test', 'guest',
        'login', 'welcome', 'solo', 'dragon', 'password1'
    ],
    'rockyou-top100': [
        '123456', 'password', '12345678', 'qwerty', '123456789',
        '12345', '1234', '111111', '1234567', 'dragon',
        '123123', 'baseball', 'iloveyou', 'trustno1', '1234567890',
        'sunshine', 'master', '123321', 'superman', 'hello',
        'charlie', 'donald', 'password1', 'qwerty123', 'admin'
    ],
    'numeric': [str(i) for i in range(1000, 9999)]
}

CORRECT_CREDS = {
    '10.0.0.5': {'admin': 'password'}
}

FLAG = 'FLAG{brute_force_pwned}'


def run_brute_force(parsed: dict, lab) -> dict:
    cmd = parsed.get('command', '')
    flags = parsed.get('flags', {})
    args = parsed.get('args', [])

    if cmd == 'help':
        return {
            'output': (
                "Brute Force Commands:\n"
                "  brute --target <ip> --user <user> --wordlist <list>\n\n"
                "Available wordlists:\n"
                "  common          Top 20 common passwords\n"
                "  rockyou-top100  Top 100 RockYou passwords\n"
                "  numeric         Numeric 4-digit codes\n\n"
                "Example:\n"
                "  brute --target 10.0.0.5 --user admin --wordlist common"
            ),
            'success': False
        }

    if cmd == 'wordlist':
        name = args[0] if args else flags.get('name', '')
        wl = WORDLISTS.get(name)
        if not wl:
            return {'output': f"Unknown wordlist '{name}'. Available: {', '.join(WORDLISTS.keys())}", 'success': False}
        preview = wl[:10]
        return {
            'output': f"Wordlist '{name}' ({len(wl)} entries):\n  " + '\n  '.join(preview) + '\n  ...',
            'success': False
        }

    if cmd == 'clear':
        return {'output': '__CLEAR__', 'success': False}

    # Require --target and --user
    target = flags.get('target') or (args[0] if args else None)
    user = flags.get('user') or flags.get('u') or 'admin'
    wordlist_name = flags.get('wordlist') or flags.get('w') or 'common'

    if not target:
        return {'output': 'Error: --target is required.\nExample: brute --target 10.0.0.5 --user admin --wordlist common', 'success': False}

    wordlist = WORDLISTS.get(wordlist_name)
    if not wordlist:
        return {'output': f"Unknown wordlist: {wordlist_name}. Available: {', '.join(WORDLISTS.keys())}", 'success': False}

    host_creds = CORRECT_CREDS.get(target)
    if not host_creds:
        return {
            'output': f"[ERROR] Cannot connect to {target}:22\nHost unreachable. Use target 10.0.0.5 for this lab.",
            'success': False
        }

    correct_password = host_creds.get(user)

    lines = [
        f"Hydra v9.5 (c) 2023 by van Hauser/THC",
        f"[DATA] max 16 tasks per 1 server, overall 16 tasks, {len(wordlist)} login tries",
        f"[DATA] attacking ssh://{target}:22/",
        f"[SSH] host: {target}   login: {user}   password: ***attempting***",
        "",
    ]

    found = False
    tried = 0

    for pw in wordlist:
        tried += 1
        if pw == correct_password:
            lines.append(f"[{tried}/{len(wordlist)}] Trying {user}:{pw} ... SUCCESS!")
            lines.append("")
            lines.append(f"[22][ssh] host: {target}   login: {user}   password: {pw}")
            lines.append("")
            lines.append(f"1 valid password found.")
            lines.append("")
            lines.append("=" * 50)
            lines.append(f"SSH Session opened as {user}@{target}")
            lines.append(f"$ cat /home/{user}/flag.txt")
            lines.append(FLAG)
            found = True
            break
        elif tried % 5 == 0 or tried <= 3:
            lines.append(f"[{tried}/{len(wordlist)}] Trying {user}:{pw} ... failed")

    if not found:
        lines += [
            "",
            f"[ERROR] 0 valid passwords found in wordlist '{wordlist_name}'.",
            f"Try a different wordlist. The password might be in rockyou-top100."
        ]

    return {
        'output': '\n'.join(lines),
        'success': found,
        'flag': FLAG if found else None
    }
