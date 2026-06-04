# Lab Guide: Hands-On Password Cracking with Hashcat

This guide outlines a local cybersecurity lab designed to analyze password strength, compare the impact of **length vs. complexity**, and simulate how **password reuse** leads to credential stuffing attacks.

---

## 1. Environment Setup

### Prerequisites
- A system with a dedicated GPU (Nvidia/AMD) or Apple Silicon (M1/M2/M3 has excellent GPU acceleration through Metal).
- **Hashcat**: The world's fastest password recovery utility.

### Installing Hashcat
- **macOS** (using Homebrew):
  ```bash
  brew install hashcat
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update && sudo apt install hashcat
  ```
- **Windows**: Download binaries from [hashcat.net](https://hashcat.net) and add them to your System PATH.

### Verify Hardware Acceleration
Verify that Hashcat detects your system's CPU/GPU:
```bash
hashcat -I
```

---

## 2. Experiment 1: Benchmarking Hashing Speed
Different hashing algorithms offer vastly different resistance to cracking due to their computation requirements. We test speed using Hashcat's built-in benchmark.

### Run Benchmark for MD5 (Fast/Legacy Hashing)
```bash
hashcat -b -m 0
```
*Typical speed on consumer GPU:* **10 - 80 Billion hashes per second (GH/s)**.

### Run Benchmark for Bcrypt (Slow/Modern Hashing)
```bash
hashcat -b -m 3200
```
*Typical speed on consumer GPU:* **10 - 100 Thousand hashes per second (KH/s)**.

> [!NOTE]
> **Key Takeaway**: Slow algorithms like Bcrypt or Argon2 protect weak passwords by making the cracker spend 1,000,000x more time/energy per guess.

---

## 3. Experiment 2: Length vs. Complexity (Brute Force)
Brute-forcing tries every combination in a character space.
Let's analyze the mathematical search space:
- **Complexity-focused**: 8 characters, containing uppercase, lowercase, numbers, and symbols ($R=94$).
  - Total combinations: $94^8 \approx 6.09 \times 10^{15}$
- **Length-focused**: 16 characters, only lowercase letters ($R=26$).
  - Total combinations: $26^{16} \approx 4.36 \times 10^{22}$ (roughly **7.1 Million times harder** to brute force).

### Command to brute force an MD5 hash of an 8-character mixed password (takes hours/days depending on GPU):
```bash
hashcat -a 3 -m 0 <hash_file> ?a?a?a?a?a?a?a?a
```

### Command to brute force a 16-character lowercase password (computationally impossible to brute force in our lifetime):
```bash
hashcat -a 3 -m 0 <hash_file> ?l?l?l?l?l?l?l?l?l?l?l?l?l?l?l?l
```

---

## 4. Experiment 3: Smart Dictionary Attacks & Rules
Crackers rarely brute-force long passwords. Instead, they use leaked wordlists combined with **Rules** to mutate words (e.g., adding numbers, converting letters to symbols, capitalizing).

### Setting up the Wordlist
We use the classic `rockyou.txt` wordlist (14.3 million leaked passwords):
```bash
curl -L -o rockyou.txt https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt
```

### Attack 1: Straight Dictionary Attack
```bash
hashcat -a 0 -m 0 target_hashes.txt rockyou.txt
```

### Attack 2: Rule-Based Dictionary Attack
Using the `best64.rule` to apply 64 common transformations (e.g., changing `password` to `P@ssword123`):
```bash
hashcat -a 0 -m 0 target_hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```
*(On macOS, search for the rule file in `/opt/homebrew/share/hashcat/rules/best64.rule` or `/usr/local/share/hashcat/rules/best64.rule`)*

---

## 5. Experiment 4: The Password Reuse Disaster
Password reuse turns a single compromise into a total network takeover.

### Scenario:
1. **Target Account**: A user has an account on `insecure-gaming-forum.com` using the password `Spiderman2012!`.
2. **Breach**: The gaming forum's database is leaked, containing MD5 hashes.
3. **Cracking**: The attacker runs Hashcat using the RockYou list + rules. Within seconds, they crack `Spiderman2012!`.
4. **Credential Stuffing**: The attacker takes the compromised email/username and tries the password `Spiderman2012!` against:
   - **Gmail**
   - **PayPal / Online Banking**
   - **Corporate VPN / Slack**
5. **Impact**: Total compromise of personal and professional identity.

### Simulating a Credential Stuffing Tool:
To demonstrate this programmatically, look at the interactive dashboard web application included in this project, which features an animated Credential Stuffing Simulator mapping the domino effect of a single leaked password.
