# Entropy vs. Length: Password Cracking Lab & Awareness Presentation

**Autore:** Lorenzo Frasconi  
**Repository GitHub:** [FRASCOH/Password-Cracking-Rig](https://github.com/FRASCOH/Password-Cracking-Rig)

A comprehensive cybersecurity project designed to analyze password strength, compare the computational impact of **length vs. complexity**, demonstrate the risk of **password reuse**, and convert these findings into an interactive, visually stunning security awareness presentation.

---

## 🚀 Project Components

### 1. [Technical Lab Guide](file:///Users/lorenzofrasconi/Desktop/Cybersecurity%20Projects/Password%20Cracking%20Rig/lab_guide.md)
Contains step-by-step instructions for running cracking experiments using **Hashcat**.
- Benchmarking MD5 vs. Bcrypt speeds.
- Dictionary and Rule-Based attacks using mutated wordlists.
- Mathematical comparison of Brute Force character spaces.

### 2. [Entropy & Time-to-Crack Calculator](file:///Users/lorenzofrasconi/Desktop/Cybersecurity%20Projects/Password%20Cracking%20Rig/entropy_calc.py)
A Python tool to analyze passwords and calculate:
- Character search spaces.
- Shannon entropy.
- Time-to-crack estimates across three attack vectors (Online rate-limited, Offline fast hashing, Offline slow hashing).

### 3. [Interactive Awareness Web Application](file:///Users/lorenzofrasconi/Desktop/Cybersecurity%20Projects/Password%20Cracking%20Rig/index.html)
A premium dark-mode dashboard and presentation deck that can be hosted on GitHub Pages. It features:
- **Entropy & Password Strength visualizer** (interactive typing).
- **Password Reuse Simulator** showing a domino-effect credential stuffing attack.
- **Interactive charts** analyzing brute-force math.

---

## 💻 How to Run the Project

### Python Calculation Utility
To calculate the strength of any password:
```bash
python3 entropy_calc.py "your_password_here"
```

### Interactive Web Presentation
To open the presentation locally, simply double-click [index.html](file:///Users/lorenzofrasconi/Desktop/Cybersecurity%20Projects/Password%20Cracking%20Rig/index.html) or run a local server:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.
