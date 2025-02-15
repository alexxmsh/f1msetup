// --- Etichette per gli slider ---
const etichetteA = ["0.0", "0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10.0"];
const etichetteB = ["9.0", "9.5", "10.0", "10.5", "11.0", "11.5", "12.0", "12.5", "13.0", "13.5", "14.0", "14.5", "15.0", "15.5", "16.0"];
const etichetteC = ["9:1", "8:2", "7:3", "6:4", "5:5", "4:6", "3:7", "2:8", "1:9"];
const etichetteD = ["-2.70°", "-2.75°", "-2.80°", "-2.85°", "-2.90°", "-2.95°", "-3.00°", "-3.05°", "-3.10°", "-3.15°", "-3.20°", "-3.25°", "-3.30°", "-3.35°", "-3.40°", "-3.45°", "-3.50°"];
const etichetteE = ["0.00°", "0.05°", "0.10°", "0.15°", "0.20°", "0.25°", "0.30°", "0.35°", "0.40°", "0.45°", "0.50°", "0.55°", "0.60°", "0.65°", "0.70°", "0.75°", "0.80°", "0.85°", "0.90°", "0.95°", "1.00°"];

// Mappa slider ID alle etichette corrispondenti
const sliderLabels = {
    'slider-A': etichetteA,
    'slider-B': etichetteB,
    'slider-C': etichetteC,
    'slider-D': etichetteD,
    'slider-E': etichetteE,
    'slider-A_2': etichetteA,
    'slider-B_2': etichetteB,
    'slider-C_2': etichetteC,
    'slider-D_2': etichetteD,
    'slider-E_2': etichetteE
};

// Inizializza i listener per gli slider
handleSliderChange('slider-A', 'value-A');
handleSliderChange('slider-B', 'value-B');
handleSliderChange('slider-C', 'value-C');
handleSliderChange('slider-D', 'value-D');
handleSliderChange('slider-E', 'value-E');
handleSliderChange('slider-A_2', 'value-A_2');
handleSliderChange('slider-B_2', 'value-B_2');
handleSliderChange('slider-C_2', 'value-C_2');
handleSliderChange('slider-D_2', 'value-D_2');
handleSliderChange('slider-E_2', 'value-E_2');

// Inizializzazione variabili
let matrice_combinazioni = genera_combinazioni();
let matrice_combinazioni_2 = genera_combinazioni();
let iteration_count = 0;
let iteration_count_2 = 0;
let matrice_combinazioni_history = [];
let matrice_combinazioni_history_2 = [];
let intervals_history = [];
let intervals_history_2 = [];
let suggestedCombination = [0, 0, 0, 0, 0];
let suggestedCombination_2 = [0, 0, 0, 0, 0];
let current_A, current_B, current_C, current_D, current_E;
let current_A_2, current_B_2, current_C_2, current_D_2, current_E_2;
let calculated_a, calculated_b, calculated_c, calculated_d, calculated_e;
let calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2;
const initial_intervals = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1]];
let intervals = initial_intervals;
let intervals_2 = initial_intervals;
let previousIntervals = initial_intervals;
let previousIntervals_2 = initial_intervals;

// Inizializzazione
loadPresets();
updateIntervalsDisplay();
updateIntervalsDisplay_2();
updateSuggestedMarkers();
updateSuggestedMarkers_2();
updateCurrentMarkers();
updateCurrentMarkers_2();


// Funzione per calcolare le variabili secondarie
function calcola_secondarie(A, B, C, D, E) {
    let a = 0.5 + A * 2 / 100 + B * (-1 / 35) + C * (-1 / 80) + D * 1 / 160;
    let b = 0.45 + A * (-1 / 100) + B * 1 / 70 + C * 3 / 160 + D * (-1 / 64) + E * 1 / 100;
    let c = 0.2 + A * 3 / 200 + B * 1 / 56 + C * (-3 / 160) + D * 1 / 64 + E * (-1 / 400);
    let d = 0.25 + A * (-3 / 400) + B * 1 / 56 + C * 1 / 16 + D * (-1 / 160);
    let e = 1 + A * (-1 / 200) + B * (-9 / 140);
    return [a, b, c, d, e];
}

// Funzione per calcolare l'intersezione tra due intervalli
function calcola_intersezione_intervalli(intervallo_corrente, nuovo_intervallo) {
    let nuovo_min = Math.max(intervallo_corrente[0], nuovo_intervallo[0]);
    let nuovo_max = Math.min(intervallo_corrente[1], nuovo_intervallo[1]);
    if (nuovo_min > nuovo_max) {
        return null; // Nessuna intersezione valida
    }
    return [nuovo_min, nuovo_max];
}

// Funzione per aggiornare gli intervalli in base ai giudizi
function aggiorna_intervalli(valore_calcolato, giudizio, intervallo_corrente, tuning_o = 0.006964, tuning_g = 0.040001, tuning_d = 0.100001, tuning_plus = 0.1, tuning_minus = 0.1) {
    let nuovo_intervallo;
    if (giudizio === "o") {
        nuovo_intervallo = [valore_calcolato - tuning_o, valore_calcolato + tuning_o];
    } else if (giudizio === "g") {
        nuovo_intervallo = [valore_calcolato - tuning_g, valore_calcolato + tuning_g];
    } else if (giudizio === "d") {
        nuovo_intervallo = [valore_calcolato - tuning_d, valore_calcolato + tuning_d];
    } else if (giudizio === "p") {
        nuovo_intervallo = [valore_calcolato + tuning_plus, 1];
    } else if (giudizio === "m") {
        nuovo_intervallo = [0, valore_calcolato - tuning_minus];
    } else if (giudizio === "u") {
        return intervallo_corrente; // Mantiene l'intervallo precedente
    }

    return calcola_intersezione_intervalli(intervallo_corrente, nuovo_intervallo);
}


// Funzione per resettare gli intervalli
function resetIntervals() {
    intervals = initial_intervals;
}
function resetIntervals_2() {
    intervals_2 = initial_intervals;
}


// Funzione per gestire il cambio di valore degli slider
function handleSliderChange(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueId);
    const labels = sliderLabels[sliderId];

    slider.addEventListener('input', function () {
        // Aggiorna l'etichetta mostrata accanto allo slider
        const label = labels[this.value];
        valueSpan.textContent = label;
        updateCurrentMarkers();
        updateCurrentMarkers_2();
    });
}


// Funzione per gestire il click sui bottoni dei giudizi
function handleJudgmentButtonClick(button) {
    const currentJudgment = button.getAttribute('data-judgment');
    const judgments = ["u", "o", "g", "d", "p", "m"];
    const nextIndex = (judgments.indexOf(currentJudgment) + 1) % judgments.length;
    const nextJudgment = judgments[nextIndex];

    // Rimuovi tutte le classi di stato precedenti
    button.classList.remove("u", "o", "g", "d", "p", "m");

    // Aggiungi la classe di stato corrente
    button.classList.add(nextJudgment);

    // Aggiorna l'attributo data-judgment e il testo del bottone
    button.setAttribute('data-judgment', nextJudgment);
    button.textContent = nextJudgment.toUpperCase();
    if (nextJudgment === "u") {
        button.textContent = "Unknown";
    } else if (nextJudgment === "o") {
        button.textContent = "Optimal";
    } else if (nextJudgment === "g") {
        button.textContent = "Great";
    } else if (nextJudgment === "d") {
        button.textContent = "Good";
    } else if (nextJudgment === "p") {
        button.textContent = "Bad +";
    } else if (nextJudgment === "m") {
        button.textContent = "Bad -";
    }
}

// Inizializza i listener per i bottoni dei giudizi
const buttons = ['button-a', 'button-b', 'button-c', 'button-d', 'button-e'];
buttons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    button.setAttribute('data-judgment', 'u');
    button.classList.add('u');
    button.textContent = 'Unknown';
    button.addEventListener('click', function(){
        handleJudgmentButtonClick(button);
    });
});
const buttons_2 = ['button-a_2', 'button-b_2', 'button-c_2', 'button-d_2', 'button-e_2'];
buttons_2.forEach(buttonId => {
    const button_2 = document.getElementById(buttonId);
    button_2.setAttribute('data-judgment', 'u');
    button_2.classList.add('u');
    button_2.textContent = 'Unknown';
    button_2.addEventListener('click', function(){
        handleJudgmentButtonClick(button_2);
    });
});


// Funzione per aggiornare il testo nell'output
function updateOutput(message) {
    document.getElementById('messages').textContent = message;
}
function updateOutput_2(message) {
    document.getElementById('messages_2').textContent = message;
}


// Gestione click bottone CALCOLA
document.getElementById('calculate-button').addEventListener('click', function () {
    // Aggiorna le variabili correnti con i valori degli slider
    current_A = parseInt(document.getElementById('slider-A').value);
    current_B = parseInt(document.getElementById('slider-B').value);
    current_C = parseInt(document.getElementById('slider-C').value);
    current_D = parseInt(document.getElementById('slider-D').value);
    current_E = parseInt(document.getElementById('slider-E').value);

    // Calcola le variabili secondarie
    [calculated_a, calculated_b, calculated_c, calculated_d, calculated_e] = calcola_secondarie(current_A, current_B, current_C, current_D, current_E);

    // Stampa i valori calcolati nella console
    console.log("Variabili secondarie calcolate:", calculated_a, calculated_b, calculated_c, calculated_d, calculated_e);

    // Ottieni i giudizi correnti dai bottoni
    const judgment_a = document.getElementById('button-a').getAttribute('data-judgment');
    const judgment_b = document.getElementById('button-b').getAttribute('data-judgment');
    const judgment_c = document.getElementById('button-c').getAttribute('data-judgment');
    const judgment_d = document.getElementById('button-d').getAttribute('data-judgment');
    const judgment_e = document.getElementById('button-e').getAttribute('data-judgment');

    // Verifica se almeno un giudizio è diverso da 'o' e 'u'
    const judge = [judgment_a, judgment_b, judgment_c, judgment_d, judgment_e];
    const isAnyJudgmentNotOptimalOrUnknown = judge.some(judgment => judgment !== 'o' && judgment !== 'u');

    // Aggiorna gli intervalli in base ai giudizi
    try {
        const new_intervals_a = aggiorna_intervalli(calculated_a, judgment_a, intervals[0]);
        const new_intervals_b = aggiorna_intervalli(calculated_b, judgment_b, intervals[1]);
        const new_intervals_c = aggiorna_intervalli(calculated_c, judgment_c, intervals[2]);
        const new_intervals_d = aggiorna_intervalli(calculated_d, judgment_d, intervals[3]);
        const new_intervals_e = aggiorna_intervalli(calculated_e, judgment_e, intervals[4]);

        // Se uno degli intervalli è nullo, interrompi l'aggiornamento e mostra un messaggio di errore
        if (!new_intervals_a || !new_intervals_b || !new_intervals_c || !new_intervals_d || !new_intervals_e) {
            updateOutput("Error! Invalid intersection. Try again.");
            return; // Interrompe l'esecuzione della funzione
        }
        // Altrimenti, aggiorna gli intervalli
        previousIntervals = intervals.map(intervallo => [...intervallo]); // Memorizza gli intervalli precedenti
        intervals = [new_intervals_a, new_intervals_b, new_intervals_c, new_intervals_d, new_intervals_e];

        // Salva la versione corrente di matrice_combinazioni e intervals nella cronologia
        matrice_combinazioni_history.push(matrice_combinazioni.map(riga => [...riga])); // Crea una copia profonda
        intervals_history.push(intervals.map(intervallo => [...intervallo])); // Crea una copia profonda

        // Aggiorna la matrice delle combinazioni
        if (isAnyJudgmentNotOptimalOrUnknown) {
            // Rimuovi la combinazione corrente da matrice_combinazioni
            matrice_combinazioni = matrice_combinazioni.filter(combination => {
                return combination[0] !== current_A ||
                       combination[1] !== current_B ||
                       combination[2] !== current_C ||
                       combination[3] !== current_D ||
                       combination[4] !== current_E;
            });
        }
        matrice_combinazioni = aggiorna_soluzioni(matrice_combinazioni, intervals);

        // Sposta gli slider sulla posizione suggerita, se ci sono combinazioni rimaste
        if (matrice_combinazioni.length > 0) {
            suggestedCombination = matrice_combinazioni[0]; // Aggiorna suggestedCombination con la prima combinazione rimasta
        } else {
            suggestedCombination = [0, 0, 0, 0, 0]; // Resetta suggestedCombination se non ci sono combinazioni
        }
        highlightSuggestedCombination();

        // Resetta la visualizzazione degli intervalli
        updateIntervalsDisplay();
        updateCurrentMarkers();
    } catch (error) {
        updateOutput("Error!");
    }


    // Aggiorna i bottoni a UNKNOWN se il giudizio non è 'u'
    const buttons = ['button-a', 'button-b', 'button-c', 'button-d', 'button-e'];
    const judgments = [judgment_a, judgment_b, judgment_c, judgment_d, judgment_e];

    for (let i = 0; i < buttons.length; i++) {
        if (judgments[i] !== 'u') {
            const button = document.getElementById(buttons[i]);
            button.setAttribute('data-judgment', 'u');
            button.classList.remove(...button.classList);
            button.classList.add('judgment-button', 'u');
            button.textContent = 'Unknown';
        }
    }

    updateOutput("Calculationg...");
    console.log("Calcolo effettuato");
    // Incrementa il contatore delle iterazioni
    iteration_count++; 

    // Aggiorna il numero di combinazioni rimanenti e il messaggio
    if(matrice_combinazioni.length === 1){
        updateOutput(`Iteration ${iteration_count}, ${matrice_combinazioni.length} combination left.  The solution has been found.`);
    } else if (matrice_combinazioni.length > 0){ 
        updateOutput(`Iteration ${iteration_count}, ${matrice_combinazioni.length} combinations left.`); 
    } else {
        updateOutput(`No combination found that met the criteria.`);
    }
    
    console.log("Calcolo effettuato");
});
document.getElementById('calculate-button_2').addEventListener('click', function () {
    // Aggiorna le variabili correnti con i valori degli slider
    current_A_2 = parseInt(document.getElementById('slider-A_2').value);
    current_B_2 = parseInt(document.getElementById('slider-B_2').value);
    current_C_2 = parseInt(document.getElementById('slider-C_2').value);
    current_D_2 = parseInt(document.getElementById('slider-D_2').value);
    current_E_2 = parseInt(document.getElementById('slider-E_2').value);

    // Calcola le variabili secondarie
    [calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2] = calcola_secondarie(current_A_2, current_B_2, current_C_2, current_D_2, current_E_2);

    // Stampa i valori calcolati nella console
    console.log("Variabili secondarie calcolate:", calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2);

    // Ottieni i giudizi correnti dai bottoni
    const judgment_a_2 = document.getElementById('button-a_2').getAttribute('data-judgment');
    const judgment_b_2 = document.getElementById('button-b_2').getAttribute('data-judgment');
    const judgment_c_2 = document.getElementById('button-c_2').getAttribute('data-judgment');
    const judgment_d_2 = document.getElementById('button-d_2').getAttribute('data-judgment');
    const judgment_e_2 = document.getElementById('button-e_2').getAttribute('data-judgment');

    // Verifica se almeno un giudizio è diverso da 'o' e 'u'
    const judge = [judgment_a_2, judgment_b_2, judgment_c_2, judgment_d_2, judgment_e_2];
    const isAnyJudgmentNotOptimalOrUnknown = judge.some(judgment => judgment !== 'o' && judgment !== 'u');

    // Aggiorna gli intervalli in base ai giudizi
    try {
        const new_intervals_a_2 = aggiorna_intervalli(calculated_a_2, judgment_a_2, intervals_2[0]);
        const new_intervals_b_2 = aggiorna_intervalli(calculated_b_2, judgment_b_2, intervals_2[1]);
        const new_intervals_c_2 = aggiorna_intervalli(calculated_c_2, judgment_c_2, intervals_2[2]);
        const new_intervals_d_2 = aggiorna_intervalli(calculated_d_2, judgment_d_2, intervals_2[3]);
        const new_intervals_e_2 = aggiorna_intervalli(calculated_e_2, judgment_e_2, intervals_2[4]);

        // Se uno degli intervalli è nullo, interrompi l'aggiornamento e mostra un messaggio di errore
        if (!new_intervals_a_2 || !new_intervals_b_2 || !new_intervals_c_2 || !new_intervals_d_2 || !new_intervals_e_2) {
            updateOutput("Errore!", "Intersezione non valida. Riprova.");
            return; // Interrompe l'esecuzione della funzione
        }
        // Altrimenti, aggiorna gli intervalli
        previousIntervals_2 = intervals_2.map(intervallo => [...intervallo]); // Memorizza gli intervalli precedenti
        intervals_2 = [new_intervals_a_2, new_intervals_b_2, new_intervals_c_2, new_intervals_d_2, new_intervals_e_2];

        // Salva la versione corrente di matrice_combinazioni e intervals nella cronologia
        matrice_combinazioni_history_2.push(matrice_combinazioni_2.map(riga => [...riga])); // Crea una copia profonda
        intervals_history_2.push(intervals_2.map(intervallo => [...intervallo])); // Crea una copia profonda

        // Aggiorna la matrice delle combinazioni
        if (isAnyJudgmentNotOptimalOrUnknown) {
            // Rimuovi la combinazione corrente da matrice_combinazioni
            matrice_combinazioni_2 = matrice_combinazioni_2.filter(combination => {
                return combination[0] !== current_A_2 ||
                       combination[1] !== current_B_2 ||
                       combination[2] !== current_C_2 ||
                       combination[3] !== current_D_2 ||
                       combination[4] !== current_E_2;
            });
        }
        matrice_combinazioni_2 = aggiorna_soluzioni(matrice_combinazioni_2, intervals_2);

        // Sposta gli slider sulla posizione suggerita, se ci sono combinazioni rimaste
        if (matrice_combinazioni_2.length > 0) {
            suggestedCombination_2 = matrice_combinazioni_2[0]; // Aggiorna suggestedCombination con la prima combinazione rimasta
        } else {
            suggestedCombination_2 = [0, 0, 0, 0, 0]; // Resetta suggestedCombination se non ci sono combinazioni
        }
        highlightSuggestedCombination_2();

        // Resetta la visualizzazione degli intervalli
        updateIntervalsDisplay_2();
        updateCurrentMarkers_2();

    } catch (error) {
        console.log("Errore calcolo");
        updateOutput_2("Error!");
    }


    // Aggiorna i bottoni a UNKNOWN se il giudizio non è 'u'
    const buttons_2 = ['button-a_2', 'button-b_2', 'button-c_2', 'button-d_2', 'button-e_2'];
    const judgments_2 = [judgment_a_2, judgment_b_2, judgment_c_2, judgment_d_2, judgment_e_2];

    for (let i = 0; i < buttons_2.length; i++) {
        if (judgments_2[i] !== 'u') {
            const button = document.getElementById(buttons_2[i]);
            button.setAttribute('data-judgment', 'u');
            button.classList.remove(...button.classList);
            button.classList.add('judgment-button', 'u');
            button.textContent = 'Unknown';
        }
    }

    updateOutput_2("Calculationg...");
    console.log("Calcolo effettuato");
    // Incrementa il contatore delle iterazioni
    iteration_count_2++;

    // Aggiorna il numero di combinazioni rimanenti e il messaggio
    if(matrice_combinazioni_2.length === 1){
        updateOutput_2(`Iteration ${iteration_count_2}, ${matrice_combinazioni_2.length} combination left.  The solution has been found.`);
    } else if (matrice_combinazioni_2.length > 0){ 
        updateOutput_2(`Iteration ${iteration_count_2}, ${matrice_combinazioni_2.length} combinations left.`); 
    } else {
        updateOutput_2(`No combination found that met the criteria.`);
    }
    console.log("Calcolo effettuato");
});



// Gestione click bottone RICOMINCIA
document.getElementById('reset-button').addEventListener('click', function () {
    // Resetta i valori degli slider
    document.getElementById('slider-A').value = 0;
    document.getElementById('slider-B').value = 0;
    document.getElementById('slider-C').value = 0;
    document.getElementById('slider-D').value = 0;
    document.getElementById('slider-E').value = 0;

    // Resetta i bottoni dei giudizi
    const buttons = ['button-a', 'button-b', 'button-c', 'button-d', 'button-e'];
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        button.setAttribute('data-judgment', 'u');
        button.classList.remove("o", "g", "d", "p", "m");
        button.classList.add('u');
        button.textContent = 'Unknown';
    });

    // Resetta gli intervalli
    resetIntervals();

    // Resetta la cronologia
    matrice_combinazioni_history = [];
    intervals_history = [];

    // Resetta il contatore delle iterazioni
    iteration_count = 0;

    // Rigenera la matrice delle combinazioni
    matrice_combinazioni = genera_combinazioni();

    // Resetta l'output
    updateOutput("Reset performed.");

    // Resetta la visualizzazione degli intervalli
    updateIntervalsDisplay();

    // Ripristina i valori al preset corrente
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect.value) {
        const selectedPreset = JSON.parse(presetSelect.value);
        setSliderValuesFromPreset(selectedPreset);
    }

    console.log("Ricomincia cliccato");
});
document.getElementById('reset-button_2').addEventListener('click', function () {
    // Resetta i valori degli slider
    document.getElementById('slider-A_2').value = 0;
    document.getElementById('slider-B_2').value = 0;
    document.getElementById('slider-C_2').value = 0;
    document.getElementById('slider-D_2').value = 0;
    document.getElementById('slider-E_2').value = 0;

    // Resetta i bottoni dei giudizi
    const buttons_2 = ['button-a_2', 'button-b_2', 'button-c_2', 'button-d_2', 'button-e_2'];
    buttons_2.forEach(buttonId => {
        const button_2 = document.getElementById(buttonId);
        button_2.setAttribute('data-judgment', 'u');
        button_2.classList.remove("o", "g", "d", "p", "m");
        button_2.classList.add('u');
        button_2.textContent = 'Unknown';
    });

    // Resetta gli intervalli
    resetIntervals_2();

    // Resetta la cronologia
    matrice_combinazioni_history_2 = [];
    intervals_history_2 = [];

    // Resetta il contatore delle iterazioni
    iteration_count_2 = 0;

    // Rigenera la matrice delle combinazioni
    matrice_combinazioni_2 = genera_combinazioni();

    // Resetta l'output
    updateOutput_2("Reset performed.");

    // Resetta la visualizzazione degli intervalli
    updateIntervalsDisplay_2();

    // Ripristina i valori al preset corrente
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect.value) {
        const selectedPreset = JSON.parse(presetSelect.value);
        setSliderValuesFromPreset_2(selectedPreset);
    }

    console.log("Ricomincia cliccato");
});


// Funzione per generare tutte le combinazioni possibili (convertita da Python)
function genera_combinazioni() {
    let combinazioni_primarie = [];
    for (let A = 0; A <= 20; A++) {
        for (let B = 0; B <= 14; B++) {
            for (let C = 0; C <= 8; C++) {
                for (let D = 0; D <= 16; D++) {
                    for (let E = 0; E <= 20; E++) {
                        combinazioni_primarie.push([A, B, C, D, E]);
                    }
                }
            }
        }
    }

    let matrice = [];
    for (let i = 0; i < combinazioni_primarie.length; i++) {
        let [A, B, C, D, E] = combinazioni_primarie[i];
        let [a, b, c, d, e] = calcola_secondarie(A, B, C, D, E);
        matrice.push([A, B, C, D, E, a, b, c, d, e]);
    }

    return matrice;
}


// Funzione per filtrare la matrice delle combinazioni in base agli intervalli (convertita da Python)
function aggiorna_soluzioni(matrice, soluzioni) {
    return matrice.filter(riga => {
        return (
            riga[5] >= soluzioni[0][0] && riga[5] <= soluzioni[0][1] && // Intervallo per 'a'
            riga[6] >= soluzioni[1][0] && riga[6] <= soluzioni[1][1] && // Intervallo per 'b'
            riga[7] >= soluzioni[2][0] && riga[7] <= soluzioni[2][1] && // Intervallo per 'c'
            riga[8] >= soluzioni[3][0] && riga[8] <= soluzioni[3][1] && // Intervallo per 'd'
            riga[9] >= soluzioni[4][0] && riga[9] <= soluzioni[4][1]    // Intervallo per 'e'
        );
    });
}


// Funzione per aggiornare la visualizzazione degli intervalli
function updateIntervalsDisplay() {
    for (let i = 0; i < intervals.length; i++) {
        const intervalBar = document.getElementById(`interval-bar-${String.fromCharCode(97 + i)}`);
        const intervalBarPrevious = document.getElementById(`interval-bar-previous-${String.fromCharCode(97 + i)}`);
        const range = intervals[i][1] - intervals[i][0];
        const left = intervals[i][0];

        // Calcola la larghezza e la posizione del rettangolo blu
        const widthPercentage = (range / 1) * 100; // Assumendo che il range massimo sia 1
        const leftPercentage = (left / 1) * 100; // Assumendo che il valore minimo sia 0

        intervalBar.style.width = `${widthPercentage}%`;
        intervalBar.style.marginLeft = `${leftPercentage}%`;

        // Calcola la larghezza e la posizione del rettangolo rosso (intervallo precedente)
        if (previousIntervals) {
            const prevRange = previousIntervals[i][1] - previousIntervals[i][0];
            const prevLeft = previousIntervals[i][0];
            const prevWidthPercentage = (prevRange / 1) * 100;
            const prevLeftPercentage = (prevLeft / 1) * 100;

            intervalBarPrevious.style.width = `${prevWidthPercentage}%`;
            intervalBarPrevious.style.marginLeft = `${prevLeftPercentage}%`;
        }
    }
}
function updateIntervalsDisplay_2() {
    for (let i = 0; i < intervals_2.length; i++) {
        const intervalBar_2 = document.getElementById(`interval-bar-${String.fromCharCode(97 + i)}_2`);
        const intervalBarPrevious_2 = document.getElementById(`interval-bar-previous-${String.fromCharCode(97 + i)}_2`);
        const range_2 = intervals_2[i][1] - intervals_2[i][0];
        const left_2 = intervals_2[i][0];
        console.log("Variabili  calcolate:", range_2, left_2 );
        // Calcola la larghezza e la posizione del rettangolo blu
        const widthPercentage_2 = (range_2 / 1) * 100; // Assumendo che il range massimo sia 1
        const leftPercentage_2 = (left_2 / 1) * 100; // Assumendo che il valore minimo sia 0

        intervalBar_2.style.width = `${widthPercentage_2}%`;
        intervalBar_2.style.marginLeft = `${leftPercentage_2}%`;

        // Calcola la larghezza e la posizione del rettangolo rosso (intervallo precedente)
        if (previousIntervals_2) {
            const prevRange_2 = previousIntervals_2[i][1] - previousIntervals_2[i][0];
            const prevLeft_2 = previousIntervals_2[i][0];
            const prevWidthPercentage_2 = (prevRange_2 / 1) * 100;
            const prevLeftPercentage_2 = (prevLeft_2 / 1) * 100;

            intervalBarPrevious_2.style.width = `${prevWidthPercentage_2}%`;
            intervalBarPrevious_2.style.marginLeft = `${prevLeftPercentage_2}%`;
        }
    }
}





// Funzione per evidenziare la combinazione suggerita sugli slider
function highlightSuggestedCombination() {
    if (matrice_combinazioni.length > 0) {
        document.getElementById('slider-A').value = suggestedCombination[0];
        document.getElementById('slider-B').value = suggestedCombination[1];
        document.getElementById('slider-C').value = suggestedCombination[2];
        document.getElementById('slider-D').value = suggestedCombination[3];
        document.getElementById('slider-E').value = suggestedCombination[4];

        // Aggiorna le etichette degli slider
        document.getElementById('value-A').textContent = etichetteA[suggestedCombination[0]];
        document.getElementById('value-B').textContent = etichetteB[suggestedCombination[1]];
        document.getElementById('value-C').textContent = etichetteC[suggestedCombination[2]];
        document.getElementById('value-D').textContent = etichetteD[suggestedCombination[3]];
        document.getElementById('value-E').textContent = etichetteE[suggestedCombination[4]];

        // Chiama la funzione per aggiornare la posizione dei marker
        updateSuggestedMarkers();
    }
}
function highlightSuggestedCombination_2() {
    if (matrice_combinazioni_2.length > 0) {
        document.getElementById('slider-A_2').value = suggestedCombination_2[0];
        document.getElementById('slider-B_2').value = suggestedCombination_2[1];
        document.getElementById('slider-C_2').value = suggestedCombination_2[2];
        document.getElementById('slider-D_2').value = suggestedCombination_2[3];
        document.getElementById('slider-E_2').value = suggestedCombination_2[4];

        // Aggiorna le etichette degli slider
        document.getElementById('value-A_2').textContent = etichetteA[suggestedCombination_2[0]];
        document.getElementById('value-B_2').textContent = etichetteB[suggestedCombination_2[1]];
        document.getElementById('value-C_2').textContent = etichetteC[suggestedCombination_2[2]];
        document.getElementById('value-D_2').textContent = etichetteD[suggestedCombination_2[3]];
        document.getElementById('value-E_2').textContent = etichetteE[suggestedCombination_2[4]];

        // Chiama la funzione per aggiornare la posizione dei marker
        updateSuggestedMarkers_2();
    }
}

// Funzione per aggiornare la posizione dei marker che indicano i valori suggeriti
function updateSuggestedMarkers() {
    if (matrice_combinazioni.length > 0) {
        for (let i = 0; i < 5; i++) {
            const marker = document.getElementById(`suggested-marker-${String.fromCharCode(97 + i)}`);
            const suggestedValue = suggestedCombination[i + 5]; // +5 perché i valori a,b,c,d,e sono in posizione 5,6,7,8,9

            // Calcola la posizione del marker in base al valore suggerito
            const leftPercentage = (suggestedValue / 1) * 99.5; // Assumendo che il range massimo sia 1

            marker.style.left = `${leftPercentage}%`;
        }
    }
}
function updateSuggestedMarkers_2() {
    if (matrice_combinazioni_2.length > 0) {
        for (let i = 0; i < 5; i++) {
            const marker = document.getElementById(`suggested-marker-${String.fromCharCode(97 + i)}_2`);
            const suggestedValue = suggestedCombination_2[i + 5]; // +5 perché i valori a,b,c,d,e sono in posizione 5,6,7,8,9

            // Calcola la posizione del marker in base al valore suggerito
            const leftPercentage = (suggestedValue / 1) * 99.5; // Assumendo che il range massimo sia 1

            marker.style.left = `${leftPercentage}%`;
        }
    }
}





// Funzione per aggiornare la posizione dei marker che indicano i valori correnti
function updateCurrentMarkers() {
    current_A = parseInt(document.getElementById('slider-A').value);
    current_B = parseInt(document.getElementById('slider-B').value);
    current_C = parseInt(document.getElementById('slider-C').value);
    current_D = parseInt(document.getElementById('slider-D').value);
    current_E = parseInt(document.getElementById('slider-E').value);

    // Calcola le variabili secondarie
    [calculated_a, calculated_b, calculated_c, calculated_d, calculated_e] = calcola_secondarie(current_A, current_B, current_C, current_D, current_E);
    const markers = ['a', 'b', 'c', 'd', 'e'];
    const calculated_values = [calculated_a, calculated_b, calculated_c, calculated_d, calculated_e];

    for (let i = 0; i < markers.length; i++) {
        const marker = document.getElementById(`current-marker-${markers[i]}`);
        const calculatedValue = calculated_values[i];

        // Calcola la posizione del marker in base al valore calcolato
        const leftPercentage = calculatedValue * 99.5;

        marker.style.left = `${leftPercentage}%`;
    }
}
function updateCurrentMarkers_2() {
    current_A_2 = parseInt(document.getElementById('slider-A_2').value);
    current_B_2 = parseInt(document.getElementById('slider-B_2').value);
    current_C_2 = parseInt(document.getElementById('slider-C_2').value);
    current_D_2 = parseInt(document.getElementById('slider-D_2').value);
    current_E_2 = parseInt(document.getElementById('slider-E_2').value);

    // Calcola le variabili secondarie
    [calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2] = calcola_secondarie(current_A_2, current_B_2, current_C_2, current_D_2, current_E_2);
    const markers = ['a_2', 'b_2', 'c_2', 'd_2', 'e_2'];
    const calculated_values = [calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2];

    for (let i = 0; i < markers.length; i++) {
        const marker = document.getElementById(`current-marker-${markers[i]}`);
        const calculatedValue = calculated_values[i];

        // Calcola la posizione del marker in base al valore calcolato
        const leftPercentage = calculatedValue * 99.5;

        marker.style.left = `${leftPercentage}%`;
    }
}

// Funzione per caricare i preset da un file JSON
function loadPresets() {
    fetch('presets.json')
      .then(response => response.json())
      .then(presets => {
        const presetSelect = document.getElementById('preset-select');
        presets.forEach(preset => {
          const option = document.createElement('option');
          option.value = JSON.stringify(preset);
          option.textContent = preset.name;
          presetSelect.appendChild(option);
        });
  
        // Carica il primo preset automaticamente
        if (presets.length > 0) {
          setSliderValuesFromPreset(presets[0]);
          setSliderValuesFromPreset_2(presets[0]);
          presetSelect.value = JSON.stringify(presets[0]); // Imposta il valore selezionato nel menu a tendina
        }
      })
      .catch(error => console.error('Errore nel caricamento dei preset:', error));
}

// Funzione per impostare gli slider ai valori di un preset
function setSliderValuesFromPreset(preset) {
    document.getElementById('slider-A').value = preset.A;
    document.getElementById('slider-B').value = preset.B;
    document.getElementById('slider-C').value = preset.C;
    document.getElementById('slider-D').value = preset.D;
    document.getElementById('slider-E').value = preset.E;
  
    // Aggiorna le etichette degli slider
    document.getElementById('value-A').textContent = etichetteA[preset.A];
    document.getElementById('value-B').textContent = etichetteB[preset.B];
    document.getElementById('value-C').textContent = etichetteC[preset.C];
    document.getElementById('value-D').textContent = etichetteD[preset.D];
    document.getElementById('value-E').textContent = etichetteE[preset.E];

    // Calcola le variabili secondarie per i marker verdi
    [calculated_a, calculated_b, calculated_c, calculated_d, calculated_e] = calcola_secondarie(preset.A, preset.B, preset.C, preset.D, preset.E);
    suggestedCombination = [preset.A, preset.B, preset.C, preset.D, preset.E, calculated_a, calculated_b, calculated_c, calculated_d, calculated_e];

    updateSuggestedMarkers(); // Aggiorna i marker verdi
    updateCurrentMarkers(); // Aggiorna i marker gialli
}
function setSliderValuesFromPreset_2(preset) {
    document.getElementById('slider-A_2').value = preset.A;
    document.getElementById('slider-B_2').value = preset.B;
    document.getElementById('slider-C_2').value = preset.C;
    document.getElementById('slider-D_2').value = preset.D;
    document.getElementById('slider-E_2').value = preset.E;
  
    // Aggiorna le etichette degli slider
    document.getElementById('value-A_2').textContent = etichetteA[preset.A];
    document.getElementById('value-B_2').textContent = etichetteB[preset.B];
    document.getElementById('value-C_2').textContent = etichetteC[preset.C];
    document.getElementById('value-D_2').textContent = etichetteD[preset.D];
    document.getElementById('value-E_2').textContent = etichetteE[preset.E];

    // Calcola le variabili secondarie per i marker verdi
    [calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2] = calcola_secondarie(preset.A, preset.B, preset.C, preset.D, preset.E);
    suggestedCombination_2 = [preset.A, preset.B, preset.C, preset.D, preset.E, calculated_a_2, calculated_b_2, calculated_c_2, calculated_d_2, calculated_e_2];

    updateSuggestedMarkers_2(); // Aggiorna i marker verdi
    updateCurrentMarkers_2(); // Aggiorna i marker gialli
}

// Gestione del cambio di preset
document.getElementById('preset-select').addEventListener('change', function() {
    if (this.value) {
      const selectedPreset = JSON.parse(this.value);
      setSliderValuesFromPreset(selectedPreset);
      setSliderValuesFromPreset_2(selectedPreset);
    }
});

// Gestione click bottone PRESET
document.getElementById('preset-button').addEventListener('click', function() {
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect.value) {
      const selectedPreset = JSON.parse(presetSelect.value);
      setSliderValuesFromPreset(selectedPreset);
      updateCurrentMarkers(); // Aggiorna i marker gialli
    } else {
      alert("Seleziona un preset!");
    }
});
document.getElementById('preset-button_2').addEventListener('click', function() {
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect.value) {
      const selectedPreset = JSON.parse(presetSelect.value);
      setSliderValuesFromPreset_2(selectedPreset);
      updateCurrentMarkers_2(); // Aggiorna i marker gialli
    } else {
      alert("Seleziona un preset!");
    }
});

// Gestione click bottone SUCCESSIVO
document.getElementById('next-button').addEventListener('click', function() {
    // Resetta tutto come fa il bottone "Ricomincia"
    document.getElementById('slider-A').value = 0;
    document.getElementById('slider-B').value = 0;
    document.getElementById('slider-C').value = 0;
    document.getElementById('slider-D').value = 0;
    document.getElementById('slider-E').value = 0;
    document.getElementById('slider-A_2').value = 0;
    document.getElementById('slider-B_2').value = 0;
    document.getElementById('slider-C_2').value = 0;
    document.getElementById('slider-D_2').value = 0;
    document.getElementById('slider-E_2').value = 0;
    const buttons = ['button-a', 'button-b', 'button-c', 'button-d', 'button-e'];
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      button.setAttribute('data-judgment', 'u');
      button.classList.remove("o", "g", "d", "p", "m");
      button.classList.add('u');
      button.textContent = 'Unknown';
    });
    const buttons_2 = ['button-a_2', 'button-b_2', 'button-c_2', 'button-d_2', 'button-e_2'];
    buttons_2.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      button.setAttribute('data-judgment', 'u');
      button.classList.remove("o", "g", "d", "p", "m");
      button.classList.add('u');
      button.textContent = 'Unknown';
    });
    resetIntervals();
    resetIntervals_2();
    matrice_combinazioni_history = [];
    matrice_combinazioni_history_2 = [];
    intervals_history = [];
    intervals_history_2 = [];
    iteration_count = 0;
    iteration_count_2 = 0;
    matrice_combinazioni = genera_combinazioni();
    matrice_combinazioni_2 = genera_combinazioni();
    updateOutput("Reset performed. Next preset loaded.");
    updateOutput_2("Reset performed. Next preset loaded.");
    updateIntervalsDisplay();
    updateIntervalsDisplay_2();
  
    // Seleziona il preset successivo
    const presetSelect = document.getElementById('preset-select');
    const currentSelectedIndex = presetSelect.selectedIndex;
    const nextSelectedIndex = (currentSelectedIndex + 1) % presetSelect.options.length; // Passa al successivo, tornando a 0 se si è alla fine
    presetSelect.selectedIndex = nextSelectedIndex;
  
    // Carica il preset selezionato
    if (presetSelect.value) {
      const selectedPreset = JSON.parse(presetSelect.value);
      setSliderValuesFromPreset(selectedPreset);
      setSliderValuesFromPreset_2(selectedPreset);
    }
  
    console.log("Successivo cliccato");
});
