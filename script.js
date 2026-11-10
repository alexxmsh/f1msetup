/**
 * F1 Manager 2024 Setup Calculator
 * Algoritmo avanzato a segmenti disgiunti (IntervalSet) con pesi ottimizzati via Grid Search:
 * - Esclusione rigorosa del campo Great per feedback Good
 * - Esclusione rigorosa del campo Optimal per feedback Great
 * - Rendering dinamico a segmenti multipli e zone escluse
 * - Selezione basata su centri di segmento e ottimizzazione box
 * - Selezione del prossimo setup con lookahead a 2 stinti (minimax ottimizzato)
 * - Supporto completo Undo e compatibilita' locale/web
 */

// --- Etichette per gli slider primari ---
const SLIDER_LABELS = {
    A: ["0.0", "0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10.0"],
    B: ["9.0", "9.5", "10.0", "10.5", "11.0", "11.5", "12.0", "12.5", "13.0", "13.5", "14.0", "14.5", "15.0", "15.5", "16.0"],
    C: ["9:1", "8:2", "7:3", "6:4", "5:5", "4:6", "3:7", "2:8", "1:9"],
    D: ["-2.70°", "-2.75°", "-2.80°", "-2.85°", "-2.90°", "-2.95°", "-3.00°", "-3.05°", "-3.10°", "-3.15°", "-3.20°", "-3.25°", "-3.30°", "-3.35°", "-3.40°", "-3.45°", "-3.50°"],
    E: ["0.00°", "0.05°", "0.10°", "0.15°", "0.20°", "0.25°", "0.30°", "0.35°", "0.40°", "0.45°", "0.50°", "0.55°", "0.60°", "0.65°", "0.70°", "0.75°", "0.80°", "0.85°", "0.90°", "0.95°", "1.00°"]
};

// --- Costanti di tolleranza di F1 Manager 2024 ---
const TUNING = {
    o: 0.006964, // Optimal (semi-ampiezza)
    g: 0.04,     // Great
    d: 0.10,     // Good
    plus: 0.10,  // Bad + (target >= test + 0.10)
    minus: 0.10  // Bad - (target <= test - 0.10)
};

// --- Classe IntervalSet: Rappresenta e manipola unioni finite di intervalli disgiunti ---
class IntervalSet {
    constructor(intervals = [[0, 1]]) {
        this.intervals = this.clean(intervals);
    }

    clean(raw) {
        const valid = [];
        for (const [start, end] of raw) {
            const s = Math.max(0, start);
            const e = Math.min(1, end);
            if (s <= e) {
                valid.push([s, e]);
            }
        }
        if (valid.length === 0) return [];
        valid.sort((a, b) => a[0] - b[0]);

        const merged = [valid[0]];
        for (let i = 1; i < valid.length; i++) {
            const last = merged[merged.length - 1];
            const curr = valid[i];
            if (curr[0] <= last[1] + 1e-7) {
                last[1] = Math.max(last[1], curr[1]);
            } else {
                merged.push(curr);
            }
        }
        return merged;
    }

    intersect(other) {
        const res = [];
        for (const [a1, a2] of this.intervals) {
            for (const [b1, b2] of other.intervals) {
                const s = Math.max(a1, b1);
                const e = Math.min(a2, b2);
                if (s <= e) {
                    res.push([s, e]);
                }
            }
        }
        return new IntervalSet(res);
    }

    contains(val, eps = 1e-6) {
        for (let i = 0; i < this.intervals.length; i++) {
            const [s, e] = this.intervals[i];
            if (val >= s - eps && val <= e + eps) return true;
        }
        return false;
    }

    isEmpty() {
        return this.intervals.length === 0;
    }

    clone() {
        return new IntervalSet(this.intervals.map(p => [...p]));
    }

    /**
     * Genera il vincolo ammissibile in base al feedback del pilota.
     * - 'o': [val - TUNING.o, val + TUNING.o]
     * - 'g': [val - TUNING.g, val - TUNING.o] U [val + TUNING.o, val + TUNING.g] (esclude Optimal)
     * - 'd': [val - TUNING.d, val - TUNING.g] U [val + TUNING.g, val + TUNING.d] (esclude Great e Optimal)
     * - 'p': [val + TUNING.plus, 1.0]
     * - 'm': [0.0, val - TUNING.minus]
     * - 'u': [0.0, 1.0]
     */
    static fromFeedback(val, fb) {
        if (fb === 'o') {
            return new IntervalSet([
                [val - TUNING.o, val + TUNING.o]
            ]);
        }
        if (fb === 'g') {
            return new IntervalSet([
                [val - TUNING.g, val - TUNING.o],
                [val + TUNING.o, val + TUNING.g]
            ]);
        }
        if (fb === 'd') {
            return new IntervalSet([
                [val - TUNING.d, val - TUNING.g],
                [val + TUNING.g, val + TUNING.d]
            ]);
        }
        if (fb === 'p') {
            return new IntervalSet([
                [val + TUNING.plus, 1.0]
            ]);
        }
        if (fb === 'm') {
            return new IntervalSet([
                [0.0, val - TUNING.minus]
            ]);
        }
        return new IntervalSet([[0, 1]]);
    }
}

// --- Calcolo delle 5 variabili secondarie dell'auto ---
function calcola_secondarie(A, B, C, D, E) {
    const a = 0.5 + A * 0.02 - B / 35 - C / 80 + D / 160;
    const b = 0.45 - A * 0.01 + B / 70 + C * 3 / 160 - D / 64 + E * 0.01;
    const c = 0.2 + A * 3 / 200 + B / 56 - C * 3 / 160 + D / 64 - E / 400;
    const d = 0.25 - A * 3 / 400 + B / 56 + C / 16 - D / 160;
    const e = 1.0 - A / 200 - B * 9 / 140;
    return [a, b, c, d, e];
}

// --- Spazio globale combinazioni in memoria contigua (TypedArray) ---
const TOTAL_COMBINATIONS = 21 * 15 * 9 * 17 * 21; // 1,012,095 combinazioni

const PRIMARY_A = new Uint8Array(TOTAL_COMBINATIONS);
const PRIMARY_B = new Uint8Array(TOTAL_COMBINATIONS);
const PRIMARY_C = new Uint8Array(TOTAL_COMBINATIONS);
const PRIMARY_D = new Uint8Array(TOTAL_COMBINATIONS);
const PRIMARY_E = new Uint8Array(TOTAL_COMBINATIONS);

const SEC_A = new Float32Array(TOTAL_COMBINATIONS);
const SEC_B = new Float32Array(TOTAL_COMBINATIONS);
const SEC_C = new Float32Array(TOTAL_COMBINATIONS);
const SEC_D = new Float32Array(TOTAL_COMBINATIONS);
const SEC_E = new Float32Array(TOTAL_COMBINATIONS);

function initCombinationsDB() {
    let idx = 0;
    for (let A = 0; A <= 20; A++) {
        for (let B = 0; B <= 14; B++) {
            for (let C = 0; C <= 8; C++) {
                for (let D = 0; D <= 16; D++) {
                    for (let E = 0; E <= 20; E++) {
                        PRIMARY_A[idx] = A;
                        PRIMARY_B[idx] = B;
                        PRIMARY_C[idx] = C;
                        PRIMARY_D[idx] = D;
                        PRIMARY_E[idx] = E;

                        const [a, b, c, d, e] = calcola_secondarie(A, B, C, D, E);
                        SEC_A[idx] = a;
                        SEC_B[idx] = b;
                        SEC_C[idx] = c;
                        SEC_D[idx] = d;
                        SEC_E[idx] = e;

                        idx++;
                    }
                }
            }
        }
    }
}
initCombinationsDB();

// --- Helper per il lookahead a 2 stinti ---
// Codice feedback per una singola dimensione, dato diff = target - test:
// 0 = Optimal, 1 = Great, 2 = Good, 3 = Bad + (target >= test + 0.10), 4 = Bad -
function fbCode(diff) {
    const a = Math.abs(diff);
    if (a <= TUNING.o) return 0;
    if (a <= TUNING.g) return 1;
    if (a <= TUNING.d) return 2;
    return diff >= TUNING.plus ? 3 : 4;
}

// Chiave del feedback completo (5 dimensioni, base 5 => 3125 esiti possibili)
function feedbackKey(testId, targetId) {
    return fbCode(SEC_A[targetId] - SEC_A[testId]) +
        fbCode(SEC_B[targetId] - SEC_B[testId]) * 5 +
        fbCode(SEC_C[targetId] - SEC_C[testId]) * 25 +
        fbCode(SEC_D[targetId] - SEC_D[testId]) * 125 +
        fbCode(SEC_E[targetId] - SEC_E[testId]) * 625;
}

const FB_KEYS = 3125;
const FB_COUNTS = new Uint16Array(FB_KEYS);
const FB_TOUCHED = [];

/**
 * Dato l'insieme di target ancora possibili dopo il primo feedback ("members"),
 * trova il miglior secondo setup C2: quello che minimizza la dimensione del
 * bucket piu' grande dopo il secondo feedback (caso peggiore), con la somma dei
 * quadrati come spareggio (dimensione attesa).
 * I candidati C2 sono presi tra i membri stessi del bucket (centrali + distribuiti).
 */
function bestSecondMove(members, maxCand) {
    const n = members.length;
    if (n === 1) return { worst: 1, sumSq: 1 };

    // Selezione dei candidati C2
    let cands;
    if (n <= maxCand) {
        cands = members;
    } else {
        let mA = 0, mB = 0, mC = 0, mD = 0, mE = 0;
        for (let i = 0; i < n; i++) {
            const id = members[i];
            mA += SEC_A[id]; mB += SEC_B[id]; mC += SEC_C[id]; mD += SEC_D[id]; mE += SEC_E[id];
        }
        mA /= n; mB /= n; mC /= n; mD /= n; mE /= n;

        const scored = new Array(n);
        for (let i = 0; i < n; i++) {
            const id = members[i];
            const dA = SEC_A[id] - mA, dB = SEC_B[id] - mB, dC = SEC_C[id] - mC,
                dD = SEC_D[id] - mD, dE = SEC_E[id] - mE;
            scored[i] = { id, d: dA * dA + dB * dB + dC * dC + dD * dD + dE * dE };
        }
        scored.sort((x, y) => x.d - y.d);

        const nearCount = maxCand >> 1;
        cands = [];
        for (let i = 0; i < nearCount; i++) cands.push(scored[i].id);
        const rest = n - nearCount;
        const extra = maxCand - nearCount;
        const stride = rest / extra;
        for (let i = 0; i < extra; i++) cands.push(scored[nearCount + Math.floor(i * stride)].id);
    }

    let bestWorst = Infinity;
    let bestSumSq = Infinity;

    for (let c = 0; c < cands.length; c++) {
        const cId = cands[c];
        FB_TOUCHED.length = 0;

        for (let t = 0; t < n; t++) {
            const key = feedbackKey(cId, members[t]);
            if (FB_COUNTS[key] === 0) FB_TOUCHED.push(key);
            FB_COUNTS[key]++;
        }

        let worst = 0, sumSq = 0;
        for (let b = 0; b < FB_TOUCHED.length; b++) {
            const k = FB_TOUCHED[b];
            const cnt = FB_COUNTS[k];
            sumSq += cnt * cnt;
            if (cnt > worst) worst = cnt;
            FB_COUNTS[k] = 0;
        }

        if (worst < bestWorst || (worst === bestWorst && sumSq < bestSumSq)) {
            bestWorst = worst;
            bestSumSq = sumSq;
        }
    }

    return { worst: bestWorst, sumSq: bestSumSq };
}

// --- Classe DriverSession: Gestisce un singolo pilota in modo modulare (DRY) ---
class DriverSession {
    constructor(suffix, name) {
        this.suffix = suffix; // "" per Driver 1, "_2" per Driver 2
        this.name = name;
        this.iterationCount = 0;

        // Riferimenti DOM
        this.sliders = {
            A: document.getElementById(`slider-A${this.suffix}`),
            B: document.getElementById(`slider-B${this.suffix}`),
            C: document.getElementById(`slider-C${this.suffix}`),
            D: document.getElementById(`slider-D${this.suffix}`),
            E: document.getElementById(`slider-E${this.suffix}`)
        };

        this.valueSpans = {
            A: document.getElementById(`value-A${this.suffix}`),
            B: document.getElementById(`value-B${this.suffix}`),
            C: document.getElementById(`value-C${this.suffix}`),
            D: document.getElementById(`value-D${this.suffix}`),
            E: document.getElementById(`value-E${this.suffix}`)
        };

        this.feedbackButtons = ['a', 'b', 'c', 'd', 'e'].map(ch =>
            document.getElementById(`button-${ch}${this.suffix}`)
        );

        this.messagesSpan = document.getElementById(this.suffix === "" ? "messages" : "messages_2");
        this.calcBtn = document.getElementById(`calculate-button${this.suffix}`);
        this.presetBtn = document.getElementById(`preset-button${this.suffix}`);
        this.undoBtn = document.getElementById(`undo-button${this.suffix}`);
        this.resetBtn = document.getElementById(`reset-button${this.suffix}`);

        // Stato ricerca
        this.validIndices = new Int32Array(TOTAL_COMBINATIONS);
        this.validCount = TOTAL_COMBINATIONS;
        for (let i = 0; i < TOTAL_COMBINATIONS; i++) {
            this.validIndices[i] = i;
        }

        this.suggestedIdx = 0;
        this.previousIntervals = null;
        this.currentIntervals = [
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]])
        ];

        // Cronologia per Undo
        this.history = [];

        this.initListeners();
    }

    initListeners() {
        ['A', 'B', 'C', 'D', 'E'].forEach(key => {
            const slider = this.sliders[key];
            const span = this.valueSpans[key];
            const labels = SLIDER_LABELS[key];

            slider.addEventListener('input', () => {
                const val = parseInt(slider.value, 10);
                span.textContent = labels[val];
                this.updateCurrentMarkers();
            });
        });

        this.feedbackButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.cycleJudgmentButton(button);
            });
        });

        this.calcBtn.addEventListener('click', () => this.calculate());
        this.presetBtn.addEventListener('click', () => {
            const presetSelect = document.getElementById('preset-select');
            if (presetSelect && presetSelect.value) {
                const preset = JSON.parse(presetSelect.value);
                this.setSliderValues(preset.A, preset.B, preset.C, preset.D, preset.E);
            }
        });
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => this.undo());
        }
        this.resetBtn.addEventListener('click', () => {
            const presetSelect = document.getElementById('preset-select');
            const preset = (presetSelect && presetSelect.value) ? JSON.parse(presetSelect.value) : null;
            this.reset(preset);
        });
    }

    cycleJudgmentButton(button) {
        const judgments = ["u", "o", "g", "d", "p", "m"];
        const labels = {
            u: "Unknown",
            o: "Optimal",
            g: "Great",
            d: "Good",
            p: "Bad +",
            m: "Bad -"
        };
        const current = button.getAttribute('data-judgment') || 'u';
        const nextIdx = (judgments.indexOf(current) + 1) % judgments.length;
        const next = judgments[nextIdx];

        button.classList.remove("u", "o", "g", "d", "p", "m");
        button.classList.add(next);
        button.setAttribute('data-judgment', next);
        button.textContent = labels[next];
    }

    getFeedbackState() {
        return this.feedbackButtons.map(btn => btn.getAttribute('data-judgment') || 'u');
    }

    resetFeedbacksToUnknown() {
        this.feedbackButtons.forEach(btn => {
            btn.classList.remove("o", "g", "d", "p", "m");
            btn.classList.add("u");
            btn.setAttribute('data-judgment', 'u');
            btn.textContent = "Unknown";
        });
    }

    updateCurrentMarkers() {
        const A = parseInt(this.sliders.A.value, 10);
        const B = parseInt(this.sliders.B.value, 10);
        const C = parseInt(this.sliders.C.value, 10);
        const D = parseInt(this.sliders.D.value, 10);
        const E = parseInt(this.sliders.E.value, 10);

        const [a, b, c, d, e] = calcola_secondarie(A, B, C, D, E);
        const values = [a, b, c, d, e];
        const chars = ['a', 'b', 'c', 'd', 'e'];

        chars.forEach((ch, i) => {
            const marker = document.getElementById(`current-marker-${ch}${this.suffix}`);
            if (marker) {
                const percent = Math.min(100, Math.max(0, values[i] * 100));
                marker.style.left = `${percent}%`;
            }
        });
    }

    updateSuggestedMarkers(suggestedValues) {
        const chars = ['a', 'b', 'c', 'd', 'e'];
        chars.forEach((ch, i) => {
            const marker = document.getElementById(`suggested-marker-${ch}${this.suffix}`);
            if (marker) {
                const percent = Math.min(100, Math.max(0, suggestedValues[i] * 100));
                marker.style.left = `${percent}%`;
            }
        });
    }

    /**
     * Renderizza i segmenti ammissibili dentro ciascuna barra orizzontale.
     * Se l'intervallo è diviso in due parti (es. dopo Good o Great),
     * vengono visualizzati due segmenti separati, rendendo visibile il varco escluso.
     */
    updateIntervalsDisplay() {
        const chars = ['a', 'b', 'c', 'd', 'e'];
        chars.forEach((ch, i) => {
            const currBar = document.getElementById(`interval-bar-${ch}${this.suffix}`);
            const prevBar = document.getElementById(`interval-bar-previous-${ch}${this.suffix}`);

            if (currBar) {
                currBar.innerHTML = '';
                const iSet = this.currentIntervals[i];
                if (iSet && !iSet.isEmpty()) {
                    iSet.intervals.forEach(([start, end]) => {
                        const seg = document.createElement('div');
                        seg.className = 'interval-segment';
                        seg.style.left = `${start * 100}%`;
                        seg.style.width = `${Math.max(0, end - start) * 100}%`;
                        currBar.appendChild(seg);
                    });
                }
            }

            if (prevBar) {
                prevBar.innerHTML = '';
                if (this.previousIntervals && this.previousIntervals[i] && !this.previousIntervals[i].isEmpty()) {
                    this.previousIntervals[i].intervals.forEach(([start, end]) => {
                        const seg = document.createElement('div');
                        seg.className = 'interval-segment-previous';
                        seg.style.left = `${start * 100}%`;
                        seg.style.width = `${Math.max(0, end - start) * 100}%`;
                        prevBar.appendChild(seg);
                    });
                }
            }
        });
    }

    setSliderValues(A, B, C, D, E) {
        this.sliders.A.value = A;
        this.sliders.B.value = B;
        this.sliders.C.value = C;
        this.sliders.D.value = D;
        this.sliders.E.value = E;

        this.valueSpans.A.textContent = SLIDER_LABELS.A[A];
        this.valueSpans.B.textContent = SLIDER_LABELS.B[B];
        this.valueSpans.C.textContent = SLIDER_LABELS.C[C];
        this.valueSpans.D.textContent = SLIDER_LABELS.D[D];
        this.valueSpans.E.textContent = SLIDER_LABELS.E[E];

        this.updateCurrentMarkers();
        const [a, b, c, d, e] = calcola_secondarie(A, B, C, D, E);
        this.updateSuggestedMarkers([a, b, c, d, e]);
    }

    setMessage(msg) {
        if (this.messagesSpan) {
            this.messagesSpan.textContent = msg;
        }
    }

    /**
     * Selezione del setup ottimale (Minimax a 2 stinti):
     * 1. Shortlist preliminare dei candidati C1 (centroide + centratura segmenti),
     *    piu' alcuni candidati distribuiti per diversita'.
     * 2. Per ogni C1 si simulano TUTTI i possibili feedback (partizione dei target
     *    campionati). Per ogni feedback si cerca il miglior C2 (quello che minimizza
     *    il bucket piu' grande al secondo stint). Il punteggio di C1 e' il caso
     *    peggiore a 2 stinti: max sui feedback di min sui C2 del bucket residuo.
     *    Spareggi: dimensione attesa a 2 stinti, caso peggiore a 1 stinto, cambio setup.
     */
    selectOptimalSetup(currentA, currentB, currentC, currentD, currentE) {
        if (this.validCount === 0) return 0;
        if (this.validCount <= 2) return this.validIndices[0];

        // 1. Calcola medie empiriche della popolazione di candidati validi rimasti
        let sumA = 0, sumB = 0, sumC = 0, sumD = 0, sumE = 0;
        const sampleStep = this.validCount > 10000 ? Math.ceil(this.validCount / 5000) : 1;
        let sampledCount = 0;

        for (let i = 0; i < this.validCount; i += sampleStep) {
            const id = this.validIndices[i];
            sumA += SEC_A[id];
            sumB += SEC_B[id];
            sumC += SEC_C[id];
            sumD += SEC_D[id];
            sumE += SEC_E[id];
            sampledCount++;
        }

        const muA = sumA / sampledCount;
        const muB = sumB / sampledCount;
        const muC = sumC / sampledCount;
        const muD = sumD / sampledCount;
        const muE = sumE / sampledCount;

        // STADIO 1: Valuta i candidati e costruisci la lista dei finalisti
        const scoredCandidates = [];

        const evalStep = this.validCount > 20000 ? Math.ceil(this.validCount / 8000) : 1;
        for (let i = 0; i < this.validCount; i += evalStep) {
            const id = this.validIndices[i];
            const vA = SEC_A[id], vB = SEC_B[id], vC = SEC_C[id], vD = SEC_D[id], vE = SEC_E[id];

            const dPop = (
                (vA - muA) * (vA - muA) +
                (vB - muB) * (vB - muB) +
                (vC - muC) * (vC - muC) +
                (vD - muD) * (vD - muD) +
                (vE - muE) * (vE - muE)
            );

            let segPenalty = 0;
            const vals = [vA, vB, vC, vD, vE];
            for (let k = 0; k < 5; k++) {
                const val = vals[k];
                const iSet = this.currentIntervals[k];
                let bestNormDist = 1.0;

                for (let j = 0; j < iSet.intervals.length; j++) {
                    const [s, e] = iSet.intervals[j];
                    if (val >= s - 1e-6 && val <= e + 1e-6) {
                        const mid = (s + e) * 0.5;
                        const halfSpan = Math.max(0.005, (e - s) * 0.5);
                        const dist = Math.abs(val - mid) / halfSpan;
                        if (dist < bestNormDist) {
                            bestNormDist = dist;
                        }
                    }
                }
                segPenalty += bestNormDist * bestNormDist;
            }

            const distChange = (
                Math.abs(PRIMARY_A[id] - currentA) / 20 +
                Math.abs(PRIMARY_B[id] - currentB) / 14 +
                Math.abs(PRIMARY_C[id] - currentC) / 8 +
                Math.abs(PRIMARY_D[id] - currentD) / 16 +
                Math.abs(PRIMARY_E[id] - currentE) / 20
            );

            const coarseScore = dPop * 5.0 + segPenalty * 0.5 + distChange * 0.05;
            scoredCandidates.push({ id, coarseScore, distChange });
        }

        scoredCandidates.sort((a, b) => a.coarseScore - b.coarseScore);

        const TOP_M = Math.min(24, scoredCandidates.length);
        const finalists = scoredCandidates.slice(0, TOP_M);

        // Candidati extra distribuiti lungo tutta la classifica (diversita')
        const EXTRA = Math.min(8, scoredCandidates.length - TOP_M);
        if (EXTRA > 0) {
            const stride = (scoredCandidates.length - TOP_M) / EXTRA;
            for (let x = 0; x < EXTRA; x++) {
                finalists.push(scoredCandidates[TOP_M + Math.floor(x * stride)]);
            }
        }

        // STADIO 2: Lookahead a 2 stinti con minimax sul caso peggiore
        const N_SAMPLE = Math.min(this.validCount, 400);
        const sStep = this.validCount / N_SAMPLE;
        const sampleIds = new Int32Array(N_SAMPLE);
        for (let i = 0; i < N_SAMPLE; i++) {
            sampleIds[i] = this.validIndices[Math.floor(i * sStep)];
        }

        const K2 = 16;               // candidati C2 valutati per ogni bucket
        const TIME_BUDGET_MS = 1200; // limite per non bloccare la UI
        const deadline = performance.now() + TIME_BUDGET_MS;

        let bestId = finalists[0].id;
        let bestScore = Infinity;

        for (let f = 0; f < finalists.length; f++) {

            const cand = finalists[f];
            const cId = cand.id;

            // Partizione dei target per feedback ottenuto con C1
            const buckets = new Map();
            for (let s = 0; s < N_SAMPLE; s++) {
                const tId = sampleIds[s];
                const key = feedbackKey(cId, tId);
                let arr = buckets.get(key);
                if (!arr) {
                    arr = [];
                    buckets.set(key, arr);
                }
                arr.push(tId);
            }

            let worst1 = 0;
            let worst2 = 0;
            let sumSq2 = 0;
            let pruned = false;

            for (const members of buckets.values()) {
                if (members.length > worst1) worst1 = members.length;

                const r = bestSecondMove(members, K2);
                if (r.worst > worst2) {
                    worst2 = r.worst;
                    // il punteggio e' >= worst2: se gia' peggiore del migliore, scarta
                    if (worst2 > bestScore) {
                        pruned = true;
                        break;
                    }
                }
                sumSq2 += r.sumSq;
            }

            if (pruned) continue;

            const expected2 = sumSq2 / N_SAMPLE;
            const score = worst2 * 0.7 +
                    expected2 * 0.575 +
                    worst1 * 0.0375 +
                    cand.distChange * 0.055;

            if (score < bestScore) {
                bestScore = score;
                bestId = cId;
            }
        }

        return bestId;
    }

    calculate() {
        const curA = parseInt(this.sliders.A.value, 10);
        const curB = parseInt(this.sliders.B.value, 10);
        const curC = parseInt(this.sliders.C.value, 10);
        const curD = parseInt(this.sliders.D.value, 10);
        const curE = parseInt(this.sliders.E.value, 10);

        const [cal_a, cal_b, cal_c, cal_d, cal_e] = calcola_secondarie(curA, curB, curC, curD, curE);
        const testVals = [cal_a, cal_b, cal_c, cal_d, cal_e];
        const feedbacks = this.getFeedbackState();

        const hasFeedback = feedbacks.some(f => f !== 'u');
        if (!hasFeedback) {
            this.setMessage("Please provide at least one feedback (different from Unknown).");
            return;
        }

        // 1. Calcola i nuovi insiemi di intervalli intersecando con i vincoli del feedback
        const candidateIntervals = [];
        for (let k = 0; k < 5; k++) {
            const fb = feedbacks[k];
            const constraint = IntervalSet.fromFeedback(testVals[k], fb);
            const updated = this.currentIntervals[k].intersect(constraint);
            if (updated.isEmpty()) {
                this.setMessage("Error! Inconsistent feedback: no solution exists in this range. Check your feedback and try again.");
                return;
            }
            candidateIntervals.push(updated);
        }

        // Esclusione combinazione esatta appena provata se non ottimale
        const excludeCurrentExact = feedbacks.some(f => f !== 'o' && f !== 'u');

        // 2. Filtra la griglia dei candidati
        const nextIndices = new Int32Array(this.validCount);
        let nextCount = 0;

        for (let i = 0; i < this.validCount; i++) {
            const id = this.validIndices[i];

            if (excludeCurrentExact &&
                PRIMARY_A[id] === curA &&
                PRIMARY_B[id] === curB &&
                PRIMARY_C[id] === curC &&
                PRIMARY_D[id] === curD &&
                PRIMARY_E[id] === curE) {
                continue;
            }

            const candSec = [SEC_A[id], SEC_B[id], SEC_C[id], SEC_D[id], SEC_E[id]];
            let satisfiesAll = true;

            for (let k = 0; k < 5; k++) {
                if (!candidateIntervals[k].contains(candSec[k])) {
                    satisfiesAll = false;
                    break;
                }
            }

            if (satisfiesAll) {
                nextIndices[nextCount++] = id;
            }
        }

        if (nextCount === 0) {
            this.setMessage("Error! No combination found that matches all criteria. Check your feedback and try again.");
            return;
        }

        // 3. Salva lo snapshot per Undo dopo aver trovato un risultato
        const snapshot = {
            validIndices: this.validIndices.slice(0, this.validCount),
            validCount: this.validCount,
            previousIntervals: this.previousIntervals ? this.previousIntervals.map(i => i.clone()) : null,
            currentIntervals: this.currentIntervals.map(i => i.clone()),
            sliderValues: { A: curA, B: curB, C: curC, D: curD, E: curE },
            suggestedIdx: this.suggestedIdx,
            iterationCount: this.iterationCount,
            message: this.messagesSpan ? this.messagesSpan.textContent : ""
        };
        this.history.push(snapshot);
        if (this.undoBtn) {
            this.undoBtn.disabled = false;
        }

        // 4. Aggiorna lo stato
        this.validIndices.set(nextIndices.subarray(0, nextCount));
        this.validCount = nextCount;
        this.iterationCount++;

        this.previousIntervals = this.currentIntervals.map(i => i.clone());
        this.currentIntervals = candidateIntervals;

        // 5. Seleziona il prossimo setup ottimale
        this.suggestedIdx = this.selectOptimalSetup(curA, curB, curC, curD, curE);
        const sugA = PRIMARY_A[this.suggestedIdx];
        const sugB = PRIMARY_B[this.suggestedIdx];
        const sugC = PRIMARY_C[this.suggestedIdx];
        const sugD = PRIMARY_D[this.suggestedIdx];
        const sugE = PRIMARY_E[this.suggestedIdx];

        // 6. Aggiorna slider, display intervalli e marker
        this.setSliderValues(sugA, sugB, sugC, sugD, sugE);
        this.updateIntervalsDisplay();
        this.updateSuggestedMarkers([
            SEC_A[this.suggestedIdx],
            SEC_B[this.suggestedIdx],
            SEC_C[this.suggestedIdx],
            SEC_D[this.suggestedIdx],
            SEC_E[this.suggestedIdx]
        ]);
        this.updateCurrentMarkers();

        this.resetFeedbacksToUnknown();

        if (this.validCount === 1) {
            this.setMessage(`Iteration ${this.iterationCount}: 1 combination left. The optimal solution has been found!`);
        } else {
            this.setMessage(`Iteration ${this.iterationCount}: ${this.validCount.toLocaleString()} combinations remaining.`);
        }
    }

    undo() {
        if (this.history.length === 0) return;

        const snapshot = this.history.pop();
        this.validIndices.set(snapshot.validIndices);
        this.validCount = snapshot.validCount;
        this.previousIntervals = snapshot.previousIntervals ? snapshot.previousIntervals.map(i => i.clone()) : null;
        this.currentIntervals = snapshot.currentIntervals.map(i => i.clone());
        this.suggestedIdx = snapshot.suggestedIdx;
        this.iterationCount = snapshot.iterationCount;

        this.setSliderValues(
            snapshot.sliderValues.A,
            snapshot.sliderValues.B,
            snapshot.sliderValues.C,
            snapshot.sliderValues.D,
            snapshot.sliderValues.E
        );

        this.updateIntervalsDisplay();
        this.setMessage(snapshot.message || "Undo performed.");

        if (this.history.length === 0 && this.undoBtn) {
            this.undoBtn.disabled = true;
        }
    }

    reset(preset) {
        this.history = [];
        if (this.undoBtn) {
            this.undoBtn.disabled = true;
        }

        this.iterationCount = 0;
        this.validCount = TOTAL_COMBINATIONS;
        for (let i = 0; i < TOTAL_COMBINATIONS; i++) {
            this.validIndices[i] = i;
        }

        this.previousIntervals = null;
        this.currentIntervals = [
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]]),
            new IntervalSet([[0, 1]])
        ];
        this.resetFeedbacksToUnknown();
        this.updateIntervalsDisplay();

        if (preset) {
            this.setSliderValues(preset.A, preset.B, preset.C, preset.D, preset.E);
            this.suggestedIdx = 0;
        } else {
            this.setSliderValues(0, 0, 0, 0, 0);
        }

        this.setMessage("Reset performed.");
    }
}

// --- Inizializzazione dei due piloti ---
const driver1 = new DriverSession("", "First Driver");
const driver2 = new DriverSession("_2", "Second Driver");

// Inizializza display intervalli al caricamento
driver1.updateIntervalsDisplay();
driver2.updateIntervalsDisplay();

// --- Gestione Track Presets ---
function applyPresetsList(presets) {
    const select = document.getElementById('preset-select');
    if (!select) return;

    select.innerHTML = '';
    presets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify(p);
        opt.textContent = p.name;
        select.appendChild(opt);
    });

    if (presets.length > 0) {
        const first = presets[0];
        select.value = JSON.stringify(first);
        driver1.setSliderValues(first.A, first.B, first.C, first.D, first.E);
        driver2.setSliderValues(first.A, first.B, first.C, first.D, first.E);
        driver1.setMessage("Ready.");
        driver2.setMessage("Ready.");
    }
}

const presetSelect = document.getElementById('preset-select');
if (presetSelect) {
    presetSelect.addEventListener('change', function () {
        if (!this.value) return;
        const p = JSON.parse(this.value);
        driver1.setSliderValues(p.A, p.B, p.C, p.D, p.E);
        driver2.setSliderValues(p.A, p.B, p.C, p.D, p.E);
    });
}

const nextButton = document.getElementById('next-button');
if (nextButton) {
    nextButton.addEventListener('click', function () {
        if (!presetSelect || presetSelect.options.length === 0) return;
        const nextIndex = (presetSelect.selectedIndex + 1) % presetSelect.options.length;
        presetSelect.selectedIndex = nextIndex;

        const nextPreset = JSON.parse(presetSelect.value);
        driver1.reset(nextPreset);
        driver2.reset(nextPreset);
        driver1.setMessage("Reset performed. Next preset loaded.");
        driver2.setMessage("Reset performed. Next preset loaded.");
    });
}

applyPresetsList(DEFAULT_PRESETS);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registrato:', reg.scope))
            .catch(err => console.log('Registrazione Service Worker fallita:', err));
    });
}
