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

        // Update Chart User Marker
        if (typeof entropyChart !== 'undefined' && entropyChart) {
            if (length >= 4) {
                entropyChart.data.datasets[4].data = [{ x: length, y: parseFloat(entropy.toFixed(1)) }];
            } else {
                entropyChart.data.datasets[4].data = [];
            }
            entropyChart.update();
        }
    }

    pwdInput.addEventListener('input', updateCalculator);
    btnClear.addEventListener('click', () => {
        pwdInput.value = '';
        updateCalculator();
    });

    // --- COMPARISON CHART (Chart.js) ---
    const ctx = document.getElementById('entropy-chart').getContext('2d');
    const lengths = Array.from({length: 13}, (_, i) => i + 6); // 6 to 18

    const numericData = lengths.map(l => l * Math.log2(10));
    const lowercaseData = lengths.map(l => l * Math.log2(26));
    const alphanumericData = lengths.map(l => l * Math.log2(62));
    const fullSymbolsData = lengths.map(l => l * Math.log2(94));

    const entropyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lengths,
            datasets: [
                {
                    label: 'Numeri (10)',
                    data: numericData,
                    borderColor: '#ff1744',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Minuscole (26)',
                    data: lowercaseData,
                    borderColor: '#ffd600',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Alfanumerico (62)',
                    data: alphanumericData,
                    borderColor: '#00e676',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Completo (94)',
                    data: fullSymbolsData,
                    borderColor: '#d500f9',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Tua Password',
                    data: [],
                    borderColor: '#00e5ff',
                    backgroundColor: '#00e5ff',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false,
                    fill: false,
                    type: 'scatter'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#8a99ad',
                        font: { family: 'Plus Jakarta Sans', size: 10 }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Lunghezza Password', color: '#8a99ad' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8a99ad', stepSize: 2 },
                    min: 6,
                    max: 18
                },
                y: {
                    title: { display: true, text: 'Entropia (Bit)', color: '#8a99ad' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8a99ad' },
                    min: 0,
                    max: 120
                }
            }
        }
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
});
