#!/usr/bin/env python3
import math
import sys
import json

def calculate_entropy(password):
    if not password:
        return 0, 0, "Empty"
    
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    
    pool_size = 0
    pool_desc = []
    if has_lower:
        pool_size += 26
        pool_desc.append("Lowercase (a-z)")
    if has_upper:
        pool_size += 26
        pool_desc.append("Uppercase (A-Z)")
    if has_digit:
        pool_size += 10
        pool_desc.append("Numbers (0-9)")
    if has_special:
        pool_size += 32 # standard special characters ASCII
        pool_desc.append("Symbols/Special chars")
        
    length = len(password)
    entropy = length * math.log2(pool_size) if pool_size > 0 else 0
    return entropy, pool_size, ", ".join(pool_desc)

def format_time(seconds):
    if seconds < 1:
        return "Instantly"
    
    intervals = (
        ('centuries', 60 * 60 * 24 * 365 * 100),
        ('years', 60 * 60 * 24 * 365),
        ('months', 60 * 60 * 24 * 30),
        ('days', 60 * 60 * 24),
        ('hours', 60 * 60),
        ('minutes', 60),
        ('seconds', 1),
    )
    
    for name, count in intervals:
        value = seconds / count
        if value >= 1:
            value = round(value, 1) if value < 10 else int(value)
            return f"{value} {name}"
    return "Instantly"

def get_crack_times(entropy):
    # Total combinations
    combinations = 2 ** entropy
    # Average combinations to check (50% on average)
    avg_attempts = combinations / 2
    
    # Speeds (guesses per second)
    speeds = {
        "online_rate_limited": 100,           # 100 H/s (Web application with rate limit)
        "offline_gpu_fast_md5": 100 * 10**9,   # 100 GH/s (Modern high-end GPU rig cracking MD5)
        "offline_gpu_slow_bcrypt": 100 * 10**3 # 100 KH/s (Bcrypt work factor 10)
    }
    
    results = {}
    for attack_type, speed in speeds.items():
        seconds = avg_attempts / speed
        results[attack_type] = {
            "seconds": seconds,
            "formatted": format_time(seconds)
        }
    return results

def main():
    if len(sys.argv) > 1:
        password = sys.argv[1]
        entropy, pool_size, desc = calculate_entropy(password)
        times = get_crack_times(entropy)
        
        output = {
            "password": password,
            "length": len(password),
            "pool_size": pool_size,
            "character_types": desc,
            "entropy_bits": round(entropy, 2),
            "crack_times": times
        }
        print(json.dumps(output, indent=4))
    else:
        print("Usage: ./entropy_calc.py <password>")

if __name__ == "__main__":
    main()
