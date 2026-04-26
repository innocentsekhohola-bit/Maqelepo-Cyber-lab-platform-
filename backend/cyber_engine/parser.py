"""
cyber_engine/parser.py
Sanitize and parse user-submitted terminal commands.
Only whitelisted commands are allowed; shell injection characters are blocked.
"""
import re
import shlex

# Characters that are dangerous in shell contexts
SHELL_INJECTION_PATTERN = re.compile(
    r'[;&|`$(){}<>!\\]'   # shell metacharacters
    r'|\.\.'               # path traversal
    r'|/etc|/proc|/sys'    # sensitive paths
    r'|sudo|su\b|chmod|chown|rm\s|mkfs|dd\s'  # dangerous commands
    r'|nc\s|netcat|bash|sh\s|zsh|python|perl|ruby|php|curl|wget',  # shells/downloaders
    re.IGNORECASE
)

MAX_COMMAND_LENGTH = 256


def sanitize_and_parse(raw: str, allowed_commands: list) -> dict:
    """
    Returns a dict with:
      - blocked (bool)
      - reason (str, if blocked)
      - command (str)       — the base command keyword
      - args (list[str])    — positional arguments
      - flags (dict)        — --key value pairs
      - raw (str)           — cleaned raw string
    """
    # Length check
    if len(raw) > MAX_COMMAND_LENGTH:
        return {'blocked': True, 'reason': f'Command too long (max {MAX_COMMAND_LENGTH} chars)'}

    # Strip null bytes and control characters (except normal whitespace)
    cleaned = re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', '', raw).strip()

    # Shell injection check
    if SHELL_INJECTION_PATTERN.search(cleaned):
        return {'blocked': True, 'reason': 'Potentially dangerous characters detected'}

    # Tokenize safely
    try:
        tokens = shlex.split(cleaned)
    except ValueError as e:
        return {'blocked': True, 'reason': f'Malformed command: {e}'}

    if not tokens:
        return {'blocked': True, 'reason': 'Empty command'}

    base_cmd = tokens[0].lower()

    # Whitelist check
    if allowed_commands and base_cmd not in [c.lower() for c in allowed_commands]:
        allowed_str = ', '.join(allowed_commands)
        return {
            'blocked': True,
            'reason': f'Command "{base_cmd}" not allowed. Available: {allowed_str}'
        }

    # Parse flags (--key value) and positional args
    flags = {}
    args = []
    i = 1
    while i < len(tokens):
        tok = tokens[i]
        if tok.startswith('--'):
            key = tok[2:]
            if i + 1 < len(tokens) and not tokens[i + 1].startswith('--'):
                flags[key] = tokens[i + 1]
                i += 2
            else:
                flags[key] = True
                i += 1
        elif tok.startswith('-') and len(tok) > 1:
            # Short flags e.g. -sV  -p
            key = tok[1:]
            if i + 1 < len(tokens) and not tokens[i + 1].startswith('-'):
                flags[key] = tokens[i + 1]
                i += 2
            else:
                flags[key] = True
                i += 1
        else:
            args.append(tok)
            i += 1

    return {
        'blocked': False,
        'command': base_cmd,
        'args': args,
        'flags': flags,
        'raw': cleaned
    }
