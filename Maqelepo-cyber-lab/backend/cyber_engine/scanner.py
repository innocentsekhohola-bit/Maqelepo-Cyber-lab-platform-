"""
cyber_engine/scanner.py
Simulated Nmap port scanner for the lab environment.
In a real Kali deployment, this would call subprocess with actual nmap.
The simulation returns realistic output and embeds the flag at the right moment.
"""
import time
import random

# Simulated host data
SIMULATED_HOSTS = {
    '192.168.1.100': {
        'hostname': 'target-machine.local',
        'os': 'Linux 4.15 (Ubuntu 18.04)',
        'ports': [
            {'port': 22,   'state': 'open',   'service': 'ssh',   'version': 'OpenSSH 7.6p1 FLAG{nmap_master_2024}'},
            {'port': 80,   'state': 'open',   'service': 'http',  'version': 'Apache httpd 2.4.29'},
            {'port': 443,  'state': 'closed', 'service': 'https', 'version': ''},
            {'port': 3306, 'state': 'open',   'service': 'mysql', 'version': 'MySQL 5.7.26'},
            {'port': 8080, 'state': 'open',   'service': 'http',  'version': 'Jetty 9.4.z'},
        ]
    }
}

LAB_TARGET = '192.168.1.100'


def _format_port_line(p: dict, show_version: bool = False) -> str:
    state_col = p['state'].ljust(7)
    service_col = p['service'].ljust(12)
    if show_version and p['version']:
        return f"{str(p['port']).ljust(6)}/tcp  {state_col}  {service_col}  {p['version']}"
    return f"{str(p['port']).ljust(6)}/tcp  {state_col}  {service_col}"


def run_scanner(parsed: dict, lab) -> dict:
    cmd = parsed.get('command', '')
    args = parsed.get('args', [])
    flags = parsed.get('flags', {})

    if cmd in ('help',):
        return {
            'output': (
                "Scanner Commands:\n"
                "  scan <target>              Basic SYN scan\n"
                "  scan -sV <target>          Service version detection\n"
                "  scan -p <range> <target>   Scan specific port range\n"
                "  scan -A <target>           Aggressive scan (OS + version)\n\n"
                "Example: scan -sV 192.168.1.100"
            ),
            'success': False
        }

    if cmd == 'clear':
        return {'output': '__CLEAR__', 'success': False}

    # Determine target
    target = None
    for a in args:
        if a.replace('.', '').isdigit():
            target = a
            break

    if not target:
        return {
            'output': 'Error: No target specified.\nUsage: scan <target_ip>',
            'success': False
        }

    host_data = SIMULATED_HOSTS.get(target)
    if not host_data:
        return {
            'output': (
                f"Starting Nmap scan on {target}...\n"
                f"Note: {target} seems down. Try {LAB_TARGET} for this lab."
            ),
            'success': False
        }

    show_version = 'sV' in flags or 'A' in flags or 'V' in flags

    # Port filter
    port_range = flags.get('p') or flags.get('port')
    ports = host_data['ports']
    if port_range:
        try:
            if '-' in str(port_range):
                lo, hi = map(int, str(port_range).split('-'))
                ports = [p for p in ports if lo <= p['port'] <= hi]
            else:
                specific = int(port_range)
                ports = [p for p in ports if p['port'] == specific]
        except ValueError:
            pass

    open_ports = [p for p in ports if p['state'] == 'open']
    closed_ports = [p for p in ports if p['state'] == 'closed']

    lines = [
        f"Starting Nmap 7.94 ( https://nmap.org )",
        f"Nmap scan report for {host_data['hostname']} ({target})",
        f"Host is up (0.0{random.randint(10,99)}s latency).",
        f"Not shown: {random.randint(900,998)} closed tcp ports (reset)",
        "PORT      STATE    SERVICE      " + ("VERSION" if show_version else ""),
    ]

    for p in open_ports:
        lines.append(_format_port_line(p, show_version))
    for p in closed_ports:
        lines.append(_format_port_line(p, show_version))

    if 'A' in flags or 'O' in flags:
        lines += [
            "",
            "OS detection:",
            f"  Running: {host_data['os']}",
        ]

    lines += [
        "",
        f"Nmap done: 1 IP address (1 host up) scanned in {random.uniform(1.2, 4.8):.2f} seconds"
    ]

    output = '\n'.join(lines)

    # Did they find the flag?
    flag_found = show_version and target == LAB_TARGET
    flag = 'FLAG{nmap_master_2024}' if flag_found else None

    return {
        'output': output,
        'success': flag_found,
        'flag': flag
    }
