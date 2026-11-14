
'use strict';

const KEY = 'toep.app.v1';

const DEFAULTS = {
    maxPoints: 15,
    povertyOffset: 1,
    startPoints: 0,
    penaltyPoints: 1,
    scoreMode: 'manual',
    theme: 'purple'
};

const THEMES = [
    'purple',
    'blue',
    'green',
    'red',
    'orange',
    'light'
];

const $ = id => document.getElementById(id);

const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    ('id-' + Date.now() + '-' + Math.random().toString(36).slice(2));

const escapeHTML = s =>
    String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

const initial = () => ({
    settings: { ...DEFAULTS },
    players: [],
    game: null,
    history: []
});

function isValidData(d) {
    return d &&
        typeof d === 'object' &&
        d.settings &&
        Array.isArray(d.players) &&
        Array.isArray(d.history) &&
        (!d.game || Array.isArray(d.game.entries));
}

function load() {
    try {
        const d = JSON.parse(localStorage.getItem(KEY));

        if (isValidData(d)) {
            return {
                ...initial(),
                ...d,
                settings: {
                    ...DEFAULTS,
                    ...d.settings
                }
            };
        }
    } catch (e) {
        console.warn('Opslag niet leesbaar', e);
    }

    return initial();
}

let state = load();
let selectedIds = new Set();
let lastPage = 'home';

// ============================
// OPSLAG
// ============================

function persist() {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
    } catch (err) {
        showModal(
            'Opslaan mislukt',
            'De opslag is vol of geblokkeerd. Exporteer je gegevens en maak ruimte.'
        );

        console.error(err);
        return false;
    }
}

// ============================
// MELDINGEN
// ============================

function showModal(
    title,
    message,
    buttons = [{ title: 'Oké', action: () => { } }]
) {
    $('modalTitle').textContent = title;
    $('modalText').textContent = message;

    const wrap = $('modalActions');
    wrap.replaceChildren();

    for (const b of buttons) {
        let btn = document.createElement('button');

        btn.textContent = b.title;
        btn.className = b.primary ? 'primary' : '';

        btn.onclick = () => {
            $('modal').classList.add('hidden');
            b.action();
        };

        wrap.appendChild(btn);
    }

    $('modal').classList.remove('hidden');
}

function confirmAction(title, message, action) {
    showModal(title, message, [
        {
            title: 'Annuleren',
            action: () => { }
        },
        {
            title: 'Bevestigen',
            primary: true,
            action
        }
    ]);
}

// ============================
// NAVIGATIE
// ============================

function navigate(page) {
    if (page === 'game' && !state.game) {
        page = 'home';
    }

    lastPage = page;

    document.querySelectorAll('.page').forEach(x => {
        x.classList.toggle('active', x.id === 'page-' + page);
    });

    document.querySelectorAll('.bottomnav button').forEach(x => {
        x.classList.toggle('selected', x.dataset.page === page);
    });

    if (page === 'new') renderPlayers();
    if (page === 'settings') renderSettings();
    if (page === 'game') renderGame();
    if (page === 'history') renderHistory();
    if (page === 'ranking') renderRanking();
    if (page === 'stats') renderStats();
    if (page === 'premium') TOEPMonetization.render();

    $('resumeBtn').classList.toggle('hidden', !state.game);

    window.scrollTo(0, 0);
}

// ============================
// INSTELLINGEN
// ============================

function settingsFromForm() {
    const s = {
        maxPoints: Number($('maxPoints').value),
        povertyOffset: Number($('povertyOffset').value),
        startPoints: Number($('startPoints').value),
        penaltyPoints: Number($('penaltyPoints').value),
        scoreMode: $('scoreMode').value,
        theme: state.settings.theme
    };

    if (
        !Object.values(s).slice(0, 4).every(Number.isInteger) ||
        s.maxPoints < 1 ||
        s.maxPoints > 999 ||
        s.povertyOffset < 0 ||
        s.povertyOffset > s.maxPoints ||
        s.startPoints < 0 ||
        s.startPoints >= s.maxPoints ||
        s.penaltyPoints < 1 ||
        s.penaltyPoints > 999
    ) {
        showModal(
            'Controleer de spelregels',
            'Gebruik gehele getallen; de beginstand moet lager zijn dan het maximum en armoede mag niet groter zijn dan het maximum.'
        );

        return null;
    }

    return s;
}

function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
}

function renderSettings() {
    for (let key of [
        'maxPoints',
        'povertyOffset',
        'startPoints',
        'penaltyPoints',
        'scoreMode'
    ]) {
        $(key).value = state.settings[key];
    }

    $('themes').innerHTML = THEMES.map(t => `
        <button
            type="button"
            data-theme-choice="${t}"
            data-color="${t}"
            class="theme ${t === state.settings.theme ? 'selected' : ''}"
        >
            ${({
            purple: 'Paars',
            blue: 'Blauw',
            green: 'Groen',
            red: 'Rood',
            orange: 'Oranje',
            light: 'Licht'
        })[t]}
        </button>
    `).join('');
}

// ============================
// SPELERS
// ============================

function renderPlayers() {
    $('playerSelect').innerHTML = state.players.length
        ? state.players.map(p => `
            <div class="panel select-row">
                <input
                    aria-label="Selecteer ${escapeHTML(p.name)}"
                    type="checkbox"
                    data-select="${p.id}"
                    ${selectedIds.has(p.id) ? 'checked' : ''}
                >
                <label>${escapeHTML(p.name)}</label>
                <button data-delete="${p.id}" type="button">✕</button>
            </div>
        `).join('')
        : '<p class="muted">Voeg eerst minimaal twee spelers toe.</p>';
}

// ============================
// NIEUW POTJE
// ============================

function startGame() {
    const ids = [...selectedIds];

    if (ids.length < 2) {
        showModal(
            'Nog niet genoeg spelers',
            'Selecteer minimaal twee spelers.'
        );
        return;
    }

    if (state.game) {
        showModal(
            'Er loopt al een potje',
            'Rond eerst het bestaande potje af of hervat het.'
        );
        return;
    }

    state.game = {
        id: uid(),
        startedAt: new Date().toISOString(),
        settings: { ...state.settings },

        entries: ids.map(id => ({
            playerId: id,
            name: state.players.find(p => p.id === id).name,
            points: state.settings.startPoints
        })),

        undo: [],
        alerted: []
    };

    persist();
    navigate('game');
}

// ============================
// SCORES AANPASSEN
// ============================

// BELANGRIJKE AANPASSING:
// De scoregrens bepaalt wanneer iemand afvalt,
// maar beperkt niet langer de ingevoerde score.

function updatePoints(id, delta) {
    const game = state.game;

    if (!game) return;

    const entry = game.entries.find(e => e.playerId === id);

    if (!entry) return;

    const prev = entry.points;

    // Geen maximum van 15 meer.
    // Alleen voorkomen dat de score negatief wordt.
    const next = Math.max(0, prev + delta);

    if (next === prev) return;

    // Vorige stand bewaren voor ongedaan maken.
    game.undo.push(
        game.entries.map(e => ({
            playerId: e.playerId,
            points: e.points
        }))
    );

    if (game.undo.length > 100) {
        game.undo.shift();
    }

    entry.points = next;

    persist();
    renderGame();

    const threshold =
        game.settings.maxPoints - game.settings.povertyOffset;

    // Armoede
    if (
        game.settings.povertyOffset > 0 &&
        prev < threshold &&
        next >= threshold &&
        next < game.settings.maxPoints
    ) {
        showModal(
            '⚠ Armoede!',
            `${entry.name} staat op armoede (${next} van ${game.settings.maxPoints} strafpunten).`
        );
    }

    // Afgevallen
    else if (
        prev < game.settings.maxPoints &&
        next >= game.settings.maxPoints
    ) {
        showModal(
            'Speler afgevallen',
            `${entry.name} heeft ${next} strafpunten en is afgevallen.`
        );
    }
}

// ============================
// RONDESYSTEEM
// ============================

function addRoundWinner(winnerId) {
    const g = state.game;

    if (!g || g.settings.scoreMode !== 'round') return;

    const losers = g.entries.filter(
        e =>
            e.playerId !== winnerId &&
            e.points < g.settings.maxPoints
    );

    if (!losers.length) return;

    g.undo.push(
        g.entries.map(e => ({
            playerId: e.playerId,
            points: e.points
        }))
    );

    if (g.undo.length > 100) {
        g.undo.shift();
    }

    const alerts = [];

    for (const e of losers) {
        const prev = e.points;

        e.points += g.settings.penaltyPoints;

        const threshold =
            g.settings.maxPoints - g.settings.povertyOffset;

        if (
            g.settings.povertyOffset > 0 &&
            prev < threshold &&
            e.points >= threshold &&
            e.points < g.settings.maxPoints
        ) {
            alerts.push(`${e.name} staat op armoede (${e.points})`);
        }

        if (
            prev < g.settings.maxPoints &&
            e.points >= g.settings.maxPoints
        ) {
            alerts.push(`${e.name} is afgevallen`);
        }
    }

    persist();
    renderGame();

    if (alerts.length) {
        showModal('Ronde verwerkt', alerts.join('\n'));
    }
}

// ============================
// SCOREBORD
// ============================

function renderGame() {
    const g = state.game;

    if (!g) return;

    $('gameLimit').textContent =
        `Tot ${g.settings.maxPoints} punten`;

    $('gameHint').textContent =
        g.settings.scoreMode === 'round'
            ? 'Kies onderaan een winnaar van de ronde. Elke andere actieve speler krijgt de ingestelde strafpunten.'
            : 'Gebruik + en − om punten toe te voegen of te corrigeren.';

    $('scoreboard').innerHTML = g.entries.map(e => {
        const out = e.points >= g.settings.maxPoints;

        const poverty =
            g.settings.povertyOffset > 0 &&
            e.points >=
            g.settings.maxPoints - g.settings.povertyOffset &&
            !out;

        return `
            <div class="score-row">
                <div class="score-top">
                    <div>
                        <div class="score-name">
                            ${escapeHTML(e.name)}
                            ${out ? '✕' : poverty ? '⚠' : ''}
                        </div>

                        <small class="${out ? 'out-text' : 'muted'}">
                            ${out
                ? 'Afgevallen'
                : poverty
                    ? 'Armoede'
                    : 'Actief'}
                        </small>
                    </div>

                    <div class="score-controls">
                        <b class="score-points">
                            ${e.points}
                        </b>

                        ${g.settings.scoreMode === 'manual'
                ? `
                                <button data-minus="${e.playerId}">
                                    −
                                </button>

                                <button data-plus="${e.playerId}">
                                    +
                                </button>
                            `
                : ''}
                    </div>
                </div>

                <div class="bar">
                    <div
                        class="bar-fill ${out ? 'out' : poverty ? 'poverty' : ''}"
                        style="width:${Math.min(
                    100,
                    e.points / g.settings.maxPoints * 100
                )}%"
                    ></div>
                </div>
            </div>
        `;
    }).join('') +

        (
            g.settings.scoreMode === 'round'
                ? `
                <div class="panel">
                    <h2>Wie won de ronde?</h2>

                    <div class="stack">
                        ${g.entries
                    .filter(e => e.points < g.settings.maxPoints)
                    .map(e => `
                                <button data-round-winner="${e.playerId}">
                                    ${escapeHTML(e.name)} won
                                </button>
                            `).join('')}
                    </div>
                </div>
            `
                : ''
        );

    $('undoBtn').disabled = !g.undo.length;
}

// ============================
// ONGEDAAN MAKEN
// ============================

function undo() {
    const g = state.game;

    if (!g || !g.undo.length) return;

    const old = g.undo.pop();

    for (const e of g.entries) {
        const before = old.find(
            x => x.playerId === e.playerId
        );

        if (before) {
            e.points = before.points;
        }
    }

    persist();
    renderGame();
}

// ============================
// POTJE AFRONDEN
// ============================

function finishGame() {
    const g = state.game;

    if (!g) return;

    const sorted = [...g.entries].sort(
        (a, b) => a.points - b.points
    );

    const best = sorted[0].points;

    const tied = sorted.filter(
        e => e.points === best
    );

    const names = tied.map(e => e.name).join(', ');

    showModal(
        'Potje beëindigen',
        'Wil je het potje afronden met een winnaar of stoppen zonder de scores op te slaan?',
        [
            {
                title: 'Terug naar het spel',
                action: () => { }
            },
            {
                title: 'Stoppen zonder winnaar',
                action: () => {
                    confirmAction(
                        'Potje stoppen?',
                        'Dit potje wordt niet opgeslagen. De scores tellen niet mee voor de statistieken en het klassement.',
                        () => {
                            // Lopend potje verwijderen
                            state.game = null;

                            // Nieuwe situatie opslaan
                            persist();

                            // Terug naar startscherm
                            navigate('home');

                            showModal(
                                'Potje gestopt',
                                'Het potje is beëindigd zonder winnaar. De scores zijn niet meegenomen in de statistieken.'
                            );
                        }
                    );
                }
            },
            {
                title: 'Afronden met winnaar',
                primary: true,
                action: () => {
                    showModal(
                        'Winnaar bevestigen',
                        `Laagste score: ${names} (${best} punten).\n${tied.length === 1
                            ? 'Deze speler wordt als winnaar opgeslagen.'
                            : 'Er is een gedeelde eerste plaats. Beide spelers tellen als winnaar.'
                        }`,
                        [
                            {
                                title: 'Terug',
                                action: () => finishGame()
                            },
                            {
                                title: 'Opslaan',
                                primary: true,
                                action: () => {
                                    state.history.unshift({
                                        id: g.id,
                                        date: new Date().toISOString(),
                                        startedAt: g.startedAt,
                                        settings: g.settings,
                                        entries: g.entries.map(
                                            e => ({ ...e })
                                        ),
                                        winnerIds: tied.map(
                                            e => e.playerId
                                        )
                                    });

                                    state.game = null;

                                    persist();
                                    navigate('history');

                                    showModal(
                                        'Opgeslagen',
                                        'Het potje is toegevoegd aan je geschiedenis en statistieken.'
                                    );
                                }
                            }
                        ]
                    );
                }
            }
        ]
    );
}


// ============================
// STATISTIEKEN BEREKENEN
// ============================

function statsForPlayer(id) {
    const games = state.history.filter(
        g => g.entries.some(e => e.playerId === id)
    );

    const scores = games.map(
        g => g.entries.find(e => e.playerId === id).points
    );

    const won = games.filter(
        g => g.winnerIds.includes(id)
    ).length;

    const total = scores.reduce(
        (sum, points) => sum + points,
        0
    );

    // Aantal potjes waarin de speler de
    // ingestelde afvalgrens bereikte.
    const eliminated = games.filter(g => {
        const entry = g.entries.find(
            e => e.playerId === id
        );

        return entry.points >= g.settings.maxPoints;
    }).length;

    return {
        played: games.length,

        won,

        percent: games.length
            ? 100 * won / games.length
            : 0,

        average: games.length
            ? total / games.length
            : 0,

        highest: scores.length
            ? Math.max(...scores)
            : null,

        eliminated
    };
}

// ============================
// KLASSEMENT
// ============================

function renderRanking() {
    const players = state.players
        .map(p => ({
            ...p,
            ...statsForPlayer(p.id)
        }))
        .sort(
            (a, b) =>
                b.won - a.won ||
                b.percent - a.percent ||
                a.name.localeCompare(b.name)
        );

    $('rankingContent').innerHTML = players.length
        ? players.map((p, i) => `
            <div class="rank-row">
                <b class="position">${i + 1}</b>

                <div style="flex:1">
                    <b>${escapeHTML(p.name)}</b>

                    <div class="muted small">
                        ${p.played} gespeeld ·
                        ${p.percent.toFixed(1)}% winst
                    </div>
                </div>

                <b>${p.won} 🏆</b>
            </div>
        `).join('')

        : '<p class="muted">Nog geen spelers aangemaakt.</p>';
}

// ============================
// STATISTIEKEN TONEN
// ============================

function renderStats() {
    const games = state.history;

    let html = `
        <div class="stat-grid">
            <div class="stat-card">
                <b>${games.length}</b>
                <small>Afgeronde potjes</small>
            </div>

            <div class="stat-card">
                <b>${state.players.length}</b>
                <small>Spelers</small>
            </div>
        </div>
    `;

    html += '<h2>Per speler</h2>';

    html += state.players.map(p => {
        const s = statsForPlayer(p.id);

        return `
            <div class="panel">
                <h2>${escapeHTML(p.name)}</h2>

                <div class="stat-grid">
                    <div>
                        <b>${s.played}</b>
                        <div class="muted small">
                            Gespeeld
                        </div>
                    </div>

                    <div>
                        <b>${s.won}</b>
                        <div class="muted small">
                            Gewonnen
                        </div>
                    </div>

                    <div>
                        <b>${s.percent.toFixed(1)}%</b>
                        <div class="muted small">
                            Winstpercentage
                        </div>
                    </div>

                    <div>
                        <b>${s.average.toFixed(1)}</b>
                        <div class="muted small">
                            Gem. eindscore
                        </div>
                    </div>

                    <div>
                        <b>${s.highest ?? '–'}</b>
                        <div class="muted small">
                            Hoogste eindscore
                        </div>
                    </div>

                    <div>
                        <b>${s.eliminated}</b>
                        <div class="muted small">
                            Keer afgevallen
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    $('statsContent').innerHTML = html;
}

// ============================
// GESCHIEDENIS
// ============================

function renderHistory() {
    $('historyContent').innerHTML = state.history.length
        ? state.history.map(g => {
            const winners = g.entries
                .filter(e => g.winnerIds.includes(e.playerId))
                .map(e => e.name)
                .join(', ');

            return `
                <div class="history-row">
                    <div>
                        <b>🏆 ${escapeHTML(winners)}</b>

                        <div class="muted small">
                            ${new Date(g.date).toLocaleString('nl-NL')}
                            · ${g.entries.length} spelers
                            · max ${g.settings.maxPoints}
                        </div>

                        <div class="small">
                            ${g.entries.map(e =>
                `${escapeHTML(e.name)}: ${e.points}`
            ).join(' · ')}
                        </div>
                    </div>

                    <button
                        data-delete-game="${g.id}"
                        aria-label="Verwijder potje"
                    >
                        ✕
                    </button>
                </div>
            `;
        }).join('')

        : '<p class="muted">Er zijn nog geen afgeronde potjes.</p>';
}

// ============================
// BACK-UP EXPORTEREN
// ============================

function exportData() {
    const blob = new Blob(
        [
            JSON.stringify(
                {
                    app: 'TOEP!',
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    data: state
                },
                null,
                2
            )
        ],
        {
            type: 'application/json'
        }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download =
        `toep-backup-${new Date().toISOString().slice(0, 10)}.json`;

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================
// BACK-UP IMPORTEREN
// ============================

async function importData(file) {
    try {
        if (file.size > 5_000_000) {
            throw Error('Bestand is groter dan 5 MB');
        }

        const obj = JSON.parse(await file.text());

        if (
            obj.app !== 'TOEP!' ||
            obj.version !== 1 ||
            !isValidData(obj.data) ||
            !Array.isArray(obj.data.players) ||
            obj.data.players.some(
                p => !p.id || typeof p.name !== 'string'
            ) ||
            obj.data.history.some(
                g =>
                    !Array.isArray(g.entries) ||
                    !Array.isArray(g.winnerIds)
            )
        ) {
            throw Error('Ongeldig back-upbestand');
        }

        confirmAction(
            'Back-up importeren',

            'Dit vervangt alle huidige spelers, statistieken en potjes. Maak eerst een export als je de huidige gegevens wilt bewaren.',

            () => {
                state = obj.data;

                state.settings = {
                    ...DEFAULTS,
                    ...state.settings
                };

                if (!THEMES.includes(state.settings.theme)) {
                    state.settings.theme = 'purple';
                }

                selectedIds = new Set();

                applyTheme();
                persist();
                navigate('home');

                showModal(
                    'Geïmporteerd',
                    'De back-up is ingeladen.'
                );
            }
        );
    } catch (err) {
        showModal(
            'Importeren mislukt',
            err.message
        );
    } finally {
        $('importInput').value = '';
    }
}

// ============================
// PREMIUM
// ============================

$('buyPremiumBtn').onclick = () =>
    TOEPMonetization.buy();

$('restorePremiumBtn').onclick = () =>
    TOEPMonetization.restore();

TOEPMonetization.init();

// ============================
// NAVIGATIEKNOPPEN
// ============================

$('homeBtn').onclick = () => navigate('home');

document.querySelectorAll('[data-page]').forEach(b => {
    b.addEventListener(
        'click',
        () => navigate(b.dataset.page)
    );
});

$('newGameBtn').onclick = () => navigate('new');

$('resumeBtn').onclick = () => navigate('game');

// ============================
// SPELER TOEVOEGEN
// ============================

$('addPlayerForm').onsubmit = e => {
    e.preventDefault();

    const name = $('newPlayerName').value.trim();

    if (!name || name.length > 32) return;

    if (
        state.players.some(
            p => p.name.toLowerCase() === name.toLowerCase()
        )
    ) {
        showModal(
            'Speler bestaat al',
            'Gebruik een andere naam.'
        );
        return;
    }

    const p = {
        id: uid(),
        name
    };

    state.players.push(p);
    selectedIds.add(p.id);

    persist();

    $('newPlayerName').value = '';

    renderPlayers();
};

// ============================
// SPELERS SELECTEREN
// ============================

$('playerSelect').addEventListener('change', e => {
    const id = e.target.dataset.select;

    if (!id) return;

    if (e.target.checked) {
        selectedIds.add(id);
    } else {
        selectedIds.delete(id);
    }
});

// ============================
// SPELER VERWIJDEREN
// ============================

$('playerSelect').addEventListener('click', e => {
    const id = e.target.dataset.delete;

    if (!id) return;

    const player = state.players.find(
        p => p.id === id
    );

    if (!player) return;

    confirmAction(
        'Speler verwijderen?',

        `Verwijder ${player.name} uit toekomstige selecties? Eerdere potjes blijven behouden.`,

        () => {
            state.players = state.players.filter(
                p => p.id !== id
            );

            selectedIds.delete(id);

            persist();
            renderPlayers();
        }
    );
});

$('startGameBtn').onclick = startGame;

// ============================
// INSTELLINGEN OPSLAAN
// ============================

$('settingsForm').onsubmit = e => {
    e.preventDefault();

    const s = settingsFromForm();

    if (!s) return;

    state.settings = s;

    applyTheme();
    persist();

    showModal(
        'Instellingen opgeslagen',
        'De gekozen instellingen worden bij nieuwe potjes gebruikt.'
    );
};

// ============================
// THEMA KIEZEN
// ============================

$('themes').addEventListener('click', e => {
    const btn = e.target.closest('[data-theme-choice]');

    if (!btn) return;

    state.settings.theme = btn.dataset.themeChoice;

    applyTheme();
    persist();
    renderSettings();
});

// ============================
// INSTELLINGEN HERSTELLEN
// ============================

$('restoreSettings').onclick = () => {
    confirmAction(
        'Instellingen herstellen?',

        'Alle spelregels en het thema worden teruggezet naar standaardwaarden.',

        () => {
            state.settings = { ...DEFAULTS };

            applyTheme();
            persist();
            renderSettings();
        }
    );
};

// ============================
// SCOREKNOPPEN
// ============================

$('scoreboard').addEventListener('click', e => {
    const plus = e.target.closest('[data-plus]');
    const minus = e.target.closest('[data-minus]');
    const round = e.target.closest('[data-round-winner]');

    if (plus) {
        updatePoints(
            plus.dataset.plus,
            state.game.settings.penaltyPoints
        );
    }

    if (minus) {
        updatePoints(
            minus.dataset.minus,
            -state.game.settings.penaltyPoints
        );
    }

    if (round) {
        addRoundWinner(round.dataset.roundWinner);
    }
});

// ============================
// ONGEDAAN MAKEN
// ============================

$('undoBtn').onclick = undo;

// ============================
// POTJE RESETTEN
// ============================

$('resetGameBtn').onclick = () => {
    confirmAction(
        'Potje resetten?',

        'De scores worden naar de beginstand teruggezet. Dit kan niet ongedaan worden gemaakt.',

        () => {
            const g = state.game;

            if (!g) return;

            g.entries.forEach(
                e => e.points = g.settings.startPoints
            );

            g.undo = [];

            persist();
            renderGame();
        }
    );
};

// ============================
// POTJE AFRONDEN
// ============================

$('endGameBtn').onclick = finishGame;

// ============================
// POTJE VERWIJDEREN
// ============================

$('historyContent').addEventListener('click', e => {
    const b = e.target.closest('[data-delete-game]');

    if (!b) return;

    confirmAction(
        'Potje verwijderen?',

        'Dit potje wordt ook uit de statistieken verwijderd.',

        () => {
            state.history = state.history.filter(
                g => g.id !== b.dataset.deleteGame
            );

            persist();
            renderHistory();
        }
    );
});

// ============================
// IMPORT / EXPORT
// ============================

$('exportBtn').onclick = exportData;

$('importInput').onchange = e => {
    const file = e.target.files?.[0];

    if (file) {
        importData(file);
    }
};

// ============================
// APP STARTEN
// ============================

applyTheme();
navigate('home');

// ============================
// SERVICE WORKER
// ============================

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js', {
        updateViaCache: 'none'
    })
        .then(registration => {
            // Bij het openen controleren op een nieuwe versie
            registration.update().catch(console.warn);
        })
        .catch(console.warn);
}


/* =============================================
   TOEP! - UITBREIDINGEN
   ============================================= */

(() => {
    const oldStartGame = startGame;
    const oldNavigate = navigate;
    const oldRenderGame = renderGame;
    const oldRenderSettings = renderSettings;
    const oldRenderStats = renderStats;
    const oldRenderRanking = renderRanking;
    const oldRenderHistory = renderHistory;
    const oldShowModal = showModal;

    const clean = value => escapeHTML(value ?? '');

    // ORANJE VERVANGEN DOOR NAYADE

    const orangeIndex = THEMES.indexOf('orange');

    if (orangeIndex !== -1) {
        THEMES.splice(orangeIndex, 1, 'nayade');
    }

    if (state.settings.theme === 'orange') {
        state.settings.theme = 'nayade';
        persist();
    }

    applyTheme();

    // NAAM AAN POTJE TOEVOEGEN

    function addGameNameField() {
        const start = $('startGameBtn');

        if (!start || $('gameName')) return;

        const field = document.createElement('div');

        field.className = 'panel toep-game-name';

        field.innerHTML = `
            <label for="gameName">
                <b>Naam potje (optioneel)</b>
            </label>
            <input
                id="gameName"
                type="text"
                maxlength="50"
                placeholder="Bijv. Nayade-avond"
            >
        `;

        start.parentNode.insertBefore(field, start);
    }

    addGameNameField();

    startGame = function () {
        const name = $('gameName')?.value.trim() || '';

        oldStartGame();

        if (state.game && !state.game.label) {
            state.game.label = name;
            persist();
            renderGame();
        }

        if (state.game && $('gameName')) {
            $('gameName').value = '';
        }
    };

    $('startGameBtn').onclick = startGame;

    // OPNIEUW SPELEN MET DEZELFDE SPELERS

    function replayLastGame() {
        const last = state.history[0];

        if (!last) return;

        if (state.game) {
            showModal(
                'Er loopt al een potje',
                'Rond eerst je huidige potje af.'
            );
            return;
        }

        const ids = last.entries
            .map(e => e.playerId)
            .filter(id =>
                state.players.some(p => p.id === id)
            );

        if (ids.length < 2) {
            showModal(
                'Spelers ontbreken',
                'Er zijn minimaal twee bestaande spelers nodig.'
            );
            return;
        }

        selectedIds = new Set(ids);

        navigate('new');

        if ($('gameName')) {
            $('gameName').value = last.label || '';
        }

        showModal(
            'Spelers geselecteerd',
            'Je kunt direct een nieuw potje starten.'
        );
    }

    // STARTSCHERM UITBREIDEN

    function renderHomeExtras() {
        const home = $('page-home');

        if (!home) return;

        let panel = $('toepHomeExtras');

        if (!panel) {
            panel = document.createElement('section');
            panel.id = 'toepHomeExtras';
            panel.className = 'panel toep-home-extras';
            home.appendChild(panel);
        }

        const last = state.history[0];

        const winners = last?.entries
            .filter(e => last.winnerIds.includes(e.playerId))
            .map(e => e.name)
            .join(', ');

        panel.innerHTML = `
            <div class="nayade-mark">
                <img
                    src="Nayade-1961-jpeg.jpg"
                    alt="Nayade-logo"
                    onerror="this.hidden=true"
                >
                <b>Nayade × TOEP!</b>
            </div>

            <h2>Laatste winnaar</h2>

            <p>
                ${winners
                ? '🏆 ' + clean(winners)
                : 'Nog geen afgeronde potjes'}
            </p>

            ${last
                ? `<button id="toepReplay" type="button">
                       Opnieuw met dezelfde spelers
                   </button>`
                : ''}
        `;

        $('toepReplay')?.addEventListener(
            'click',
            replayLastGame
        );
    }

    // POTJE STOPPEN OF OPSLAAN

    finishGame = function () {
        const g = state.game;

        if (!g) return;

        const ordered = [...g.entries].sort(
            (a, b) => a.points - b.points
        );

        const lowest = ordered[0].points;

        const tied = ordered.filter(
            e => e.points === lowest
        );

        showModal(
            'Potje beëindigen',
            'Hoe wil je dit potje afsluiten?',
            [
                {
                    title: 'Terug naar spel',
                    action: () => { }
                },
                {
                    title: 'Stoppen zonder winnaar',
                    action: () => {
                        confirmAction(
                            'Potje verwijderen?',
                            'Dit potje wordt volledig verwijderd en telt niet mee voor statistieken.',
                            () => {
                                state.game = null;
                                persist();
                                navigate('home');
                            }
                        );
                    }
                },
                {
                    title: 'Met winnaar afronden',
                    primary: true,
                    action: () => {
                        showModal(
                            'Winnaar bevestigen',
                            `${tied.map(e => e.name).join(', ')} wint met ${lowest} punten.`,
                            [
                                {
                                    title: 'Terug',
                                    action: finishGame
                                },
                                {
                                    title: 'Opslaan',
                                    primary: true,
                                    action: () => {
                                        state.history.unshift({
                                            id: g.id,
                                            date: new Date().toISOString(),
                                            startedAt: g.startedAt,
                                            label: g.label || '',
                                            settings: {
                                                ...g.settings
                                            },
                                            entries: g.entries.map(
                                                e => ({ ...e })
                                            ),
                                            winnerIds: tied.map(
                                                e => e.playerId
                                            )
                                        });

                                        state.game = null;

                                        persist();
                                        navigate('history');

                                        showModal(
                                            'Opgeslagen',
                                            'Het potje telt mee voor de statistieken.'
                                        );
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    $('endGameBtn').onclick = finishGame;

    // SCOREBORD UITBREIDEN

    renderGame = function () {
        oldRenderGame();

        const g = state.game;

        if (!g) return;

        let title = $('toepCurrentGameName');

        if (!title) {
            title = document.createElement('p');
            title.id = 'toepCurrentGameName';

            $('scoreboard').parentNode.insertBefore(
                title,
                $('scoreboard')
            );
        }

        title.textContent = g.label
            ? `Potje: ${g.label}`
            : '';

        const rows = $('scoreboard').querySelectorAll(
            '.score-row'
        );

        rows.forEach((row, index) => {
            const e = g.entries[index];

            if (!e) return;

            const out =
                e.points >= g.settings.maxPoints;

            const poverty =
                !out &&
                g.settings.povertyOffset > 0 &&
                e.points >=
                g.settings.maxPoints -
                g.settings.povertyOffset;

            row.classList.toggle('toep-out', out);

            row.classList.toggle(
                'toep-poverty',
                poverty
            );
        });
    };

    // NAYADE-THEMA IN INSTELLINGEN

    renderSettings = function () {
        oldRenderSettings();

        const btn = document.querySelector(
            '[data-theme-choice="nayade"]'
        );

        if (btn) {
            btn.textContent = 'Nayade 💙💛';
        }
    };

    // EXTRA STATISTIEKEN BEREKENEN

    function detailFor(id) {
        const games = [...state.history]
            .filter(g =>
                g.entries.some(e => e.playerId === id)
            )
            .sort(
                (a, b) =>
                    new Date(a.date) - new Date(b.date)
            );

        let streak = 0;
        let longest = 0;
        let lastPlace = 0;
        let positions = 0;

        for (const g of games) {
            const entry = g.entries.find(
                e => e.playerId === id
            );

            const points = entry.points;

            const ordered = g.entries
                .map(e => e.points)
                .sort((a, b) => a - b);

            const first =
                ordered.indexOf(points) + 1;

            const last =
                ordered.lastIndexOf(points) + 1;

            positions += (first + last) / 2;

            if (points === ordered.at(-1)) {
                lastPlace++;
            }

            if (g.winnerIds.includes(id)) {
                streak++;
                longest = Math.max(longest, streak);
            } else {
                streak = 0;
            }
        }

        return {
            lastPlace,
            longest,
            avgPosition: games.length
                ? positions / games.length
                : 0
        };
    }

    // ========================================
    // STATISTIEKEN-SCHERM
    // UITKLAPBARE SPELERSKAARTEN
    // ========================================

    let openProfileId = null;

    // Alle statistieken voor een spelerskaart
    function playerProfileHTML(playerId) {
        const s = statsForPlayer(playerId);
        const d = detailFor(playerId);

        const games = state.history.filter(g =>
            g.entries.some(e => e.playerId === playerId)
        );

        const scores = games.map(g =>
            g.entries.find(e => e.playerId === playerId).points
        );

        const highest = scores.length
            ? Math.max(...scores)
            : '–';

        const eliminated = games.filter(g => {
            const entry = g.entries.find(
                e => e.playerId === playerId
            );

            return entry.points >= g.settings.maxPoints;
        }).length;

        const percent = s.percent.toFixed(1);
        const average = s.played
            ? s.average.toFixed(1)
            : '–';

        const position = s.played
            ? d.avgPosition.toFixed(2)
            : '–';

        return `
            <div class="toep-card-details">

                <div class="toep-card-highlight">
                    <div>
                        <small>Winstpercentage</small>
                        <strong>${percent}%</strong>
                    </div>

                    <span class="toep-card-trophy">
                        🏆
                    </span>
                </div>

                <div class="toep-card-progress">
                    <div
                        style="width:${Math.min(100, s.percent)}%"
                    ></div>
                </div>

                <div class="toep-card-grid">

                    <div class="toep-card-stat">
                        <strong>${s.played}</strong>
                        <small>Gespeeld</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${s.won}</strong>
                        <small>Gewonnen</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${average}</strong>
                        <small>Gem. eindscore</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${highest}</strong>
                        <small>Hoogste score</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${eliminated}</strong>
                        <small>Keer afgevallen</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${d.lastPlace}</strong>
                        <small>Laatste plaats</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${position}</strong>
                        <small>Gem. eindpositie</small>
                    </div>

                    <div class="toep-card-stat">
                        <strong>${d.longest}</strong>
                        <small>Langste winstreeks</small>
                    </div>

                </div>
            </div>
        `;
    }

    // ========================================
    // SPELERSOVERZICHT
    // ========================================

    renderStats = function () {
        const target = $('statsContent');

        if (!target) return;

        const games = state.history;

        target.innerHTML = `
            <div class="stat-grid">

                <div class="stat-card">
                    <b>${games.length}</b>
                    <small>Afgeronde potjes</small>
                </div>

                <div class="stat-card">
                    <b>${state.players.length}</b>
                    <small>Spelers</small>
                </div>

            </div>

            <h2>Spelers</h2>

            <p class="muted small">
                Tik op een speler om alle statistieken
                te bekijken.
            </p>

            <div class="toep-player-list">

                ${state.players.map(p => {
            const s = statsForPlayer(p.id);

            const open =
                openProfileId === p.id;

            return `
                        <div
                            class="toep-player-card
                            ${open ? 'is-open' : ''}"
                            data-player-card="${p.id}"
                        >

                            <button
                                type="button"
                                class="toep-player-card-header"
                                data-profile="${p.id}"
                                aria-expanded="${open}"
                            >

                                <span class="toep-player-avatar">
                                    👤
                                </span>

                                <span class="toep-player-card-info">

                                    <strong>
                                        ${escapeHTML(p.name)}
                                    </strong>

                                    <small>
                                        ${s.played} gespeeld ·
                                        ${s.won} gewonnen
                                    </small>

                                </span>

                                <span class="toep-player-chevron">
                                    ${open ? '⌃' : '⌄'}
                                </span>

                            </button>

                            ${open
                    ? playerProfileHTML(p.id)
                    : ''}

                        </div>
                    `;
        }).join('')}

            </div>
        `;
    };

    // ========================================
    // SPELERSPROFIEL OPENEN EN SLUITEN
    // ========================================

    $('statsContent').addEventListener('click', event => {
        const button = event.target.closest(
            '[data-profile]'
        );

        if (!button) return;

        const playerId = button.dataset.profile;

        // Dezelfde speler opnieuw aanklikken:
        // profiel dichtklappen.
        //
        // Andere speler aanklikken:
        // vorig profiel sluiten en nieuwe openen.

        openProfileId =
            openProfileId === playerId
                ? null
                : playerId;

        renderStats();
    });

    // ========================================
    // HALL OF FAME
    // ========================================

    function topPlayers(players, metric, valid) {
        const candidates = players.filter(valid);

        if (!candidates.length) {
            return '–';
        }

        const best = Math.max(
            ...candidates.map(metric)
        );

        return candidates
            .filter(p => metric(p) === best)
            .map(p => p.name)
            .join(', ');
    }

    // ========================================
    // ONDERLINGE VERGELIJKING
    // ========================================

    function headToHead(a, b) {
        let aWins = 0;
        let bWins = 0;
        let ties = 0;

        for (const g of state.history) {
            const aa = g.entries.find(
                e => e.playerId === a
            );

            const bb = g.entries.find(
                e => e.playerId === b
            );

            if (!aa || !bb) continue;

            if (aa.points < bb.points) {
                aWins++;
            } else if (bb.points < aa.points) {
                bWins++;
            } else {
                ties++;
            }
        }

        return {
            aWins,
            bWins,
            ties
        };
    }

    // ========================================
    // KLASSEMENT-SCHERM
    // ========================================

    renderRanking = function () {
        oldRenderRanking();

        const target = $('rankingContent');

        if (!target) return;

        const all = state.players.map(p => {
            const games = state.history.filter(g =>
                g.entries.some(e => e.playerId === p.id)
            );

            const scores = games.map(g =>
                g.entries.find(
                    e => e.playerId === p.id
                ).points
            );

            return {
                ...p,
                ...statsForPlayer(p.id),
                ...detailFor(p.id),

                highest: scores.length
                    ? Math.max(...scores)
                    : null
            };
        });

        // ====================================
        // HALL OF FAME WEERGAVE
        // ====================================

        const records = `
            <div class="panel toep-records">

                <h2>🏅 Hall of Fame</h2>

                <p>
                    <b>Meeste overwinningen:</b>
                    ${clean(topPlayers(
            all,
            p => p.won,
            p => p.played > 0
        ))}
                </p>

                <p>
                    <b>Beste winpercentage:</b>
                    ${clean(topPlayers(
            all,
            p => p.percent,
            p => p.played >= 3
        ))}
                    <small>
                        (minimaal 3 potjes)
                    </small>
                </p>

                <p>
                    <b>Langste winstreeks:</b>
                    ${clean(topPlayers(
            all,
            p => p.longest,
            p => p.played > 0
        ))}
                </p>

                <p>
                    <b>Vaakst laatste:</b>
                    ${clean(topPlayers(
            all,
            p => p.lastPlace,
            p => p.played > 0
        ))}
                </p>

                <p>
                    <b>Hoogste score:</b>
                    ${clean(topPlayers(
            all,
            p => p.highest,
            p => p.highest !== null
        ))}
                </p>

            </div>
        `;

        // ====================================
        // SPELERSVERGELIJKING
        // ====================================

        const options = state.players.map(p => `
            <option value="${p.id}">
                ${clean(p.name)}
            </option>
        `).join('');

        const comparison = `
            <div class="panel">

                <h2>Spelers vergelijken</h2>

                <div class="toep-compare-row">

                    <select id="toepCompareA">
                        ${options}
                    </select>

                    <select id="toepCompareB">
                        ${options}
                    </select>

                </div>

                <p
                    id="toepCompareResult"
                    class="muted"
                ></p>

            </div>
        `;

        target.insertAdjacentHTML(
            'beforeend',
            records + comparison
        );

        // Standaard twee verschillende spelers
        // selecteren wanneer mogelijk.

        if (state.players.length > 1) {
            $('toepCompareB').selectedIndex = 1;
        }

        // ====================================
        // VERGELIJKING BEREKENEN
        // ====================================

        function updateComparison() {
            const a = $('toepCompareA').value;
            const b = $('toepCompareB').value;

            if (!a || !b || a === b) {
                $('toepCompareResult').textContent =
                    'Selecteer twee verschillende spelers.';

                return;
            }

            const result = headToHead(a, b);

            const playerA = state.players.find(
                p => p.id === a
            );

            const playerB = state.players.find(
                p => p.id === b
            );

            if (!playerA || !playerB) return;

            $('toepCompareResult').textContent =
                `${playerA.name}: ${result.aWins} gewonnen · ` +
                `${playerB.name}: ${result.bWins} gewonnen · ` +
                `${result.ties} gelijk`;
        }

        $('toepCompareA').addEventListener(
            'change',
            updateComparison
        );

        $('toepCompareB').addEventListener(
            'change',
            updateComparison
        );

        updateComparison();
    };

    // ========================================
    // GESCHIEDENIS MET POTJESNAAM
    // ========================================

    renderHistory = function () {
        oldRenderHistory();

        const cards = $('historyContent')
            .querySelectorAll('.history-row');

        cards.forEach((card, i) => {
            const label = state.history[i]?.label;

            if (!label) return;

            const element = document.createElement('div');

            element.className = 'muted small';

            element.textContent = `Potje: ${label}`;

            card.querySelector('div')?.prepend(element);
        });
    };

    // ========================================
    // ANIMATIES VOOR MELDINGEN
    // ========================================

    showModal = function (title, message, buttons) {
        oldShowModal(title, message, buttons);

        const modal = $('modal');

        modal.classList.remove(
            'toep-alert-animation'
        );

        if (
            /armoede|afgevallen|winnaar|opgeslagen/i
                .test(title)
        ) {
            void modal.offsetWidth;

            modal.classList.add(
                'toep-alert-animation'
            );
        }
    };

    // ========================================
    // STARTSCHERM BIJWERKEN BIJ NAVIGATIE
    // ========================================

    navigate = function (page) {
        oldNavigate(page);

        if (page === 'home') {
            renderHomeExtras();
        }
    };

    // ========================================
    // INITIALISATIE
    // ========================================

    renderHomeExtras();

})();
