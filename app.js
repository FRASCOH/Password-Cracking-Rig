document.addEventListener('DOMContentLoaded', () => {
    
    // --- SLIDE NAVIGATION ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const slides = document.querySelectorAll('.slide');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            // Update active navigation state
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch active slide
            slides.forEach(slide => {
                slide.classList.remove('active');
                if (slide.id === targetId) {
                    slide.classList.add('active');
                }
            });
        });
    });

    // --- PASSWORD STRENGTH & ENTROPY CALCULATOR ---
    const pwdInput = document.getElementById('pwd-input');
    const btnClear = document.getElementById('btn-clear');
    const valLen = document.getElementById('val-len');
    const valPool = document.getElementById('val-pool');
    const valEntropy = document.getElementById('val-entropy');
    const entropyDesc = document.getElementById('entropy-desc');
    const entropyProgress = document.getElementById('entropy-progress');
    
    const timeOnline = document.getElementById('time-online');
    const timeOfflineFast = document.getElementById('time-offline-fast');
    const timeOfflineSlow = document.getElementById('time-offline-slow');

    function calculateEntropy(pwd) {
        if (!pwd) return { entropy: 0, poolSize: 0 };
        
        let hasLower = false;
        let hasUpper = false;
        let hasDigit = false;
        let hasSpecial = false;

        for (let char of pwd) {
            if (/[a-z]/.test(char)) hasLower = true;
            else if (/[A-Z]/.test(char)) hasUpper = true;
            else if (/[0-9]/.test(char)) hasDigit = true;
            else hasSpecial = true;
        }

        let poolSize = 0;
        if (hasLower) poolSize += 26;
        if (hasUpper) poolSize += 26;
        if (hasDigit) poolSize += 10;
        if (hasSpecial) poolSize += 32;

        const entropy = pwd.length * Math.log2(poolSize);
        return { entropy, poolSize };
    }

    function formatTime(seconds) {
        if (seconds < 1) return "Istantaneo";
        if (seconds === Infinity) return "Eterno";

        const intervals = [
            { label: 'secoli', value: 60 * 60 * 24 * 365 * 100 },
            { label: 'anni', value: 60 * 60 * 24 * 365 },
            { label: 'mesi', value: 60 * 60 * 24 * 30 },
            { label: 'giorni', value: 60 * 60 * 24 },
            { label: 'ore', value: 60 * 60 },
            { label: 'minuti', value: 60 },
            { label: 'secondi', value: 1 }
        ];

        for (let interval of intervals) {
            const val = seconds / interval.value;
            if (val >= 1) {
                const rounded = val < 10 ? val.toFixed(1) : Math.floor(val);
                return `~ ${rounded} ${interval.label}`;
            }
        }
        return "Istantaneo";
    }

    const hibpAlert = document.getElementById('hibp-alert');
    const hibpMessage = document.getElementById('hibp-message');
    const hibpBadge = document.querySelector('.hibp-badge');
    let hibpTimeout = null;

    async function hashSHA1(str) {
        const buffer = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest("SHA-1", buffer);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
    }

    async function checkHIBP(password) {
        if (!password) {
            hibpAlert.style.display = 'none';
            return;
        }

        try {
            const hash = await hashSHA1(password);
            const prefix = hash.slice(0, 5);
            const suffix = hash.slice(5);

            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            if (!response.ok) throw new Error('API HIBP non disponibile');

            const text = await response.text();
            const lines = text.split('\n');
            let matchCount = 0;

            for (const line of lines) {
                const [lineSuffix, count] = line.trim().split(':');
                if (lineSuffix === suffix) {
                    matchCount = parseInt(count, 10);
                    break;
                }
            }

            if (matchCount > 0) {
                hibpBadge.textContent = `⚠️ Compromessa`;
                hibpBadge.style.backgroundColor = 'var(--text-danger)';
                hibpMessage.textContent = `Questa password è stata esposta ${matchCount.toLocaleString()} volte in leak pubblici! Sconsigliato l'uso.`;
                hibpAlert.style.display = 'flex';
                hibpAlert.style.background = 'rgba(255, 23, 68, 0.08)';
                hibpAlert.style.borderColor = 'var(--text-danger)';
            } else {
                hibpBadge.textContent = `✔️ Sicura`;
                hibpBadge.style.backgroundColor = 'var(--text-success)';
                hibpMessage.textContent = `Nessuna compromissione nota trovata nei database dei leak pubblici.`;
                hibpAlert.style.display = 'flex';
                hibpAlert.style.background = 'rgba(0, 230, 118, 0.08)';
                hibpAlert.style.borderColor = 'var(--text-success)';
            }
        } catch (error) {
            console.error(error);
            hibpAlert.style.display = 'none';
        }
    }

    function updateCalculator() {
        const password = pwdInput.value;
        const length = password.length;
        const { entropy, poolSize } = calculateEntropy(password);

        valLen.textContent = length;
        valPool.textContent = poolSize;
        valEntropy.textContent = entropy.toFixed(1);

        // Update progress bar and descriptive label
        let barColor = '#ff1744'; // Red
        let description = 'Nessuna password';
        let pct = Math.min((entropy / 100) * 100, 100);

        if (length === 0) {
            description = 'Inserisci una password';
            pct = 0;
        } else if (entropy < 28) {
            description = 'Molto Debole (Facile da craccare)';
            barColor = '#ff1744';
        } else if (entropy < 36) {
            description = 'Debole';
            barColor = '#ffd600'; // Yellow
        } else if (entropy < 60) {
            description = 'Media';
            barColor = '#ffb300'; // Orange
        } else if (entropy < 120) {
            description = 'Forte';
            barColor = '#00e676'; // Green
        } else {
            description = 'Estremamente Forte (Militare)';
            barColor = '#00e5ff'; // Cyan
        }

        entropyDesc.textContent = description;
        entropyProgress.style.width = `${pct}%`;
        entropyProgress.style.backgroundColor = barColor;

        // Debounce HIBP checking
        clearTimeout(hibpTimeout);
        if (length > 0) {
            hibpTimeout = setTimeout(() => {
                checkHIBP(password);
            }, 500);
        } else {
            hibpAlert.style.display = 'none';
        }

        // Cracking times estimation
        if (length === 0) {
            timeOnline.textContent = 'N/A';
            timeOfflineFast.textContent = 'N/A';
            timeOfflineSlow.textContent = 'N/A';
            return;
        }

        const totalCombinations = Math.pow(poolSize, length);
        const avgAttempts = totalCombinations / 2;

        const onlineSpeed = 100; // 100 H/s (Web application with rate limit)
        const offlineFastSpeed = 100 * Math.pow(10, 9); // 100 GH/s (GPU Rig MD5)
        const offlineSlowSpeed = 100 * Math.pow(10, 3); // 100 KH/s (Bcrypt)

        timeOnline.textContent = formatTime(avgAttempts / onlineSpeed);
        timeOfflineFast.textContent = formatTime(avgAttempts / offlineFastSpeed);
        timeOfflineSlow.textContent = formatTime(avgAttempts / offlineSlowSpeed);
    }

    pwdInput.addEventListener('input', updateCalculator);
    btnClear.addEventListener('click', () => {
        pwdInput.value = '';
        updateCalculator();
    });

    // Initialize Calculator with empty state
    updateCalculator();


    // --- CREDENTIAL STUFFING SIMULATOR ---
    const btnSimulate = document.getElementById('btn-simulate');
    const simConsole = document.getElementById('sim-console');
    
    // Nodes
    const node1 = document.getElementById('node-1');
    const node2 = document.getElementById('node-2');
    const nodeTargetGmail = document.getElementById('node-target-gmail');
    const nodeTargetBank = document.getElementById('node-target-bank');
    const nodeTargetWork = document.getElementById('node-target-work');

    // Connectors
    const conn1 = document.getElementById('conn-1');
    const connBranch = document.getElementById('conn-branch');

    let simRunning = false;

    function logToConsole(message, type = 'info') {
        const p = document.createElement('p');
        p.className = type === 'cmd' ? 't-cmd' : type === 'success' ? 't-output-highlight' : 't-output';
        p.textContent = message;
        simConsole.appendChild(p);
        simConsole.scrollTop = simConsole.scrollHeight;
    }

    async function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runSimulation() {
        if (simRunning) return;
        simRunning = true;
        btnSimulate.disabled = true;
        btnSimulate.textContent = "Simulazione in corso...";

        // Reset elements
        simConsole.innerHTML = '';
        node1.className = 'flow-node active';
        node2.className = 'flow-node';
        nodeTargetGmail.className = 'flow-node target-node';
        nodeTargetBank.className = 'flow-node target-node';
        nodeTargetWork.className = 'flow-node target-node';
        
        nodeTargetGmail.querySelector('.node-status').textContent = 'Protetto';
        nodeTargetGmail.querySelector('.node-status').className = 'node-status';
        nodeTargetBank.querySelector('.node-status').textContent = 'Protetto';
        nodeTargetBank.querySelector('.node-status').className = 'node-status';
        nodeTargetWork.querySelector('.node-status').textContent = 'Protetto';
        nodeTargetWork.querySelector('.node-status').className = 'node-status';

        conn1.classList.remove('active');
        connBranch.classList.remove('active');

        // Step 1: Database breach
        logToConsole('[*] Database breach rilevato su: forum-gaming-locale.it', 'info');
        await wait(1200);
        node1.classList.add('compromised');
        logToConsole('[!] Estratti 14,000 hash MD5 di utenti registrati.', 'info');
        await wait(1000);
        logToConsole('[*] Avvio attacco offline su hash associato a utente: mario.rossi@email.it', 'cmd');
        await wait(800);
        logToConsole('[+] SUCCESS: Hash decifrato! Password = "Summer2026!"', 'success');

        // Connector 1 animates
        conn1.classList.add('active');
        await wait(1500);

        // Step 2: Attacker script
        node2.classList.add('active');
        document.getElementById('status-node2').textContent = 'Esecuzione Botnet...';
        document.getElementById('status-node2').className = 'node-status text-warning';
        logToConsole('[*] Inizializzazione botnet di Credential Stuffing...', 'cmd');
        await wait(1200);
        logToConsole('[*] Avvio tentativi automatizzati con le credenziali (mario.rossi@email.it : Summer2026!)', 'info');
        
        // Connect branch activation
        connBranch.classList.add('active');
        await wait(1500);

        // Target: Gmail
        nodeTargetGmail.classList.add('compromised');
        nodeTargetGmail.querySelector('.node-status').textContent = 'COMPROMESSO!';
        nodeTargetGmail.querySelector('.node-status').className = 'node-status text-danger';
        logToConsole('[!] Gmail: Login Riuscito! Nessun MFA configurato. Accesso a email personali completato.', 'success');
        await wait(1500);

        // Target: Bank
        nodeTargetBank.classList.add('compromised');
        nodeTargetBank.querySelector('.node-status').textContent = 'COMPROMESSO!';
        nodeTargetBank.querySelector('.node-status').className = 'node-status text-danger';
        logToConsole('[!] Banca: Login Riuscito! L\'attaccante invia richiesta di reimpostazione PIN tramite email appena compromessa.', 'success');
        await wait(1500);

        // Target: Work
        nodeTargetWork.classList.add('compromised');
        nodeTargetWork.querySelector('.node-status').textContent = 'COMPROMESSO!';
        nodeTargetWork.querySelector('.node-status').className = 'node-status text-danger';
        logToConsole('[!] Slack Aziendale: Login Riuscito. Accesso alle chat interne del team e furto dati sensibili.', 'success');
        await wait(1500);

        logToConsole('[CRITICAL] Attacco completato con successo. Compromissione totale dell\'identità digitale.', 'info');
        
        btnSimulate.disabled = false;
        btnSimulate.textContent = "Riavvia Simulazione";
        simRunning = false;
    }

    btnSimulate.addEventListener('click', runSimulation);

    // --- INTERACTIVE GLOSSARY POPUPS ---
    const glossaryDb = {
        'hashcat': {
            title: 'Hashcat',
            desc: 'Hashcat è uno dei software di password recovery e cracking offline più veloci e utilizzati al mondo. Sfrutta la potenza di calcolo parallela delle GPU per calcolare miliardi di hash al secondo, supportando attacchi a dizionario, brute force e regole di mutazione complesse.'
        },
        'entropy': {
            title: 'Forza & Entropia (Shannon)',
            desc: 'L\'entropia delle password (misurata in Bit) definisce la casualità matematica di una chiave. Più l\'entropia è alta, maggiore è il numero di combinazioni che un software di cracking deve testare per indovinarla. La formula dipende direttamente dalla lunghezza e dallo spazio dei caratteri scelti.'
        },
        'online-attack': {
            title: 'Attacco Online (Rate-Limited)',
            desc: 'Un attacco condotto direttamente contro un portale web. È limitato dalla velocità del server, dalla latenza di rete e da protezioni come il blocco dell\'account dopo 3-5 tentativi errati (rate-limiting), rendendo il cracking estremamente lento.'
        },
        'offline-fast': {
            title: 'Attacco Offline Rapido (MD5)',
            desc: 'Avviene quando un attaccante ruba il database cifrato e cracca gli hash localmente. Con algoritmi legacy non sicuri come MD5 o SHA-1, le moderne GPU possono testare centinaia di miliardi di combinazioni al secondo.'
        },
        'offline-slow': {
            title: 'Attacco Offline Lento (Bcrypt)',
            desc: 'Avviene quando il database rubato è protetto da algoritmi moderni e lenti (come Bcrypt o Argon2). Questi algoritmi forzano la CPU/GPU dell\'attaccante ad eseguire calcoli complessi ad ogni tentativo, riducendo le velocità di crack da miliardi a sole poche migliaia al secondo.'
        },
        'leak': {
            title: 'Password Leak / Data Breach',
            desc: 'L\'esposizione pubblica di credenziali precedentemente rubate da un database compromesso. Queste password finiscono in wordlist globali utilizzate dagli attaccanti per attacchi mirati.'
        },
        'stuffing': {
            title: 'Credential Stuffing',
            desc: 'Un attacco automatizzato in cui i bot utilizzano liste di e-mail e password violate da un sito (leak) per accedere abusivamente ad altri portali (social, banche, email), sfruttando l\'abitudine diffusa di riutilizzare la stessa password.'
        },
        'manager': {
            title: 'Password Manager',
            desc: 'Un software (come Keepass, Bitwarden o 1Password) che genera e memorizza password lunghe e uniche per ogni account all\'interno di un database cifrato. L\'utente deve ricordare solo una singola Master Password.'
        },
        'passphrase': {
            title: 'Passphrase',
            desc: 'Una password composta da una sequenza di parole casuali (es: "treno-foglia-cielo-gatto"). Raggiunge una lunghezza elevatissima (facile da ricordare ma con entropia enorme), bloccando di fatto gli attacchi brute-force.'
        },
        'mfa': {
            title: 'MFA (Multi-Factor Authentication)',
            desc: 'Un sistema di sicurezza che richiede due o più prove di identità prima di concedere l\'accesso (es: Password + codice temporaneo OTP su smartphone). Impedisce l\'intrusione anche se la password viene craccata.'
        }
    };

    const glossaryModal = document.getElementById('glossary-modal');
    const modalTitle = document.getElementById('modal-term-title');
    const modalDesc = document.getElementById('modal-term-desc');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    document.querySelectorAll('.glossary-term').forEach(term => {
        term.addEventListener('click', (e) => {
            e.stopPropagation();
            const termId = term.getAttribute('data-term');
            const data = glossaryDb[termId];
            if (data) {
                modalTitle.textContent = data.title;
                modalDesc.textContent = data.desc;
                glossaryModal.style.display = 'flex';
            }
        });
    });

    // Close Modal Functions
    function closeModal() {
        glossaryModal.style.display = 'none';
    }

    modalCloseBtn.addEventListener('click', closeModal);
    glossaryModal.addEventListener('click', (e) => {
        if (e.target === glossaryModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && glossaryModal.style.display === 'flex') {
            closeModal();
        }
    });
});
