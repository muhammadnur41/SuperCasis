// ==================== DATA PSIKOTES ====================
const psikotesGroups = [
    { 
        group: "Tes Kecerdasan", 
        icon: "fa-brain", 
        folder: "kecerdasan",
        sub: [
            { name: "Tes Kemampuan Verbal", icon: "fa-message", total: 20 },
            { name: "Tes Kemampuan Numerik", icon: "fa-calculator", total: 20 },
            { name: "Tes Kemampuan Figural", icon: "fa-shapes", total: 20 }
        ],
        color: "purple-gradient"
    },
    { 
        group: "Tes Kecermatan", 
        icon: "fa-eye", 
        folder: "kecermatan",
        sub: [
            { name: "Tes Angka Hilang", icon: "fa-table", total: 20 },
            { name: "Tes Huruf Hilang", icon: "fa-font", total: 20 },
            { name: "Tes Simbol Hilang", icon: "fa-font", total: 20 },
            { name: "Tes Gambar Hilang", icon: "fa-newspaper", total: 20 }
        ],
        color: "blue-gradient"
    },
    { 
        group: "Tes Kepribadian", 
        icon: "fa-user-check", 
        folder: "kepribadian",
        sub: [
            { name: "Tes Kuesioner 5 Pilihan", icon: "fa-clipboard-list", total: 20 },
            { name: "Tes Papi Kostick", icon: "fa-chart-pie", total: 20 }
        ],
        color: "green-gradient"
    },
    { 
        group: "Try Out", 
        icon: "fa-vial", 
        folder: "tryout",
        sub: [
            { name: "Try Out", icon: "fa-flask", total: 20 }
        ],
        color: "orange-gradient"
    }
];

// Data akademik
const akademikCategories = {
    matematika: { 
        title: 'Matematika', 
        prefix: 'matematika', 
        folder: 'matematika', 
        icon: 'fa-calculator',
        color: 'purple-gradient'
    },
    inggris: { 
        title: 'Bahasa Inggris', 
        prefix: 'inggris', 
        folder: 'bahasa-inggris', 
        icon: 'fa-language',
        color: 'blue-gradient'
    },
    umum: { 
        title: 'Pengetahuan Umum', 
        prefix: 'umum', 
        folder: 'pengetahuan-umum', 
        icon: 'fa-globe',
        color: 'green-gradient'
    },
    wawasan: { 
        title: 'Wawasan Kebangsaan', 
        prefix: 'wawasan', 
        folder: 'wawasan-kebangsaan', 
        icon: 'fa-flag',
        color: 'orange-gradient'
    }
};

// ==================== STATE MANAGEMENT ====================
let currentPsikotesCategory = null;
let currentSubCategory = null;
let currentAkademikCategory = null;
let currentFilter = 'semua';
let timerInterval = null;

// Auto-next state
let autoNextInterval = null;
let autoNextCountdownInterval = null;
let autoNextDuration = 0;
let autoNextCountdownValue = 0;
let isKecermatanTest = false;

// Test tracking state
let currentTestTitle = '';
let currentTestCategory = '';
let currentTestPath = '';
let currentPaketNumber = 0;
let currentParentCategory = '';
let currentKecermatanSession = null;
let _scoreSavedForCurrentTest = false; // Flag mencegah duplikat simpan skor

// === KECERMATAN SEQUENTIAL MODE STATE ===
let isKecermatanSequentialMode = false;
let kecermatanSeqPackages = [];      // Array of {file, originalNumber, displayIndex}
let kecermatanSeqCurrentIdx = 0;     // Current package index (0-9)
let kecermatanSeqAccCorrect = 0;     // Accumulated correct answers
let kecermatanSeqAccTotal = 0;       // Accumulated total questions
let kecermatanSeqSubTestName = '';   // e.g. "Tes Angka Hilang"
let kecermatanSeqIsQuizType = true;  // true for angka/huruf/simbol, false for koran
let kecermatanQuestionSpeed = 0;     // Per-question auto-next speed (1-5 seconds)
let kecermatanSeqPackageResults = []; // Per-package results [{correct, total}, ...]

// ==================== TEST STATE PERSISTENCE (Reload Restore) ====================
const TEST_STATE_KEY = 'appTestState';
let _timerCurrentValue = 0;    // Tracks current timer value every second
let _timerIsCountdown = false; // true = countdown, false = count-up

/** Hapus saved test state (dipanggil saat tes selesai normal) */
function clearTestState() {
    sessionStorage.removeItem(TEST_STATE_KEY);
}

/** Simpan full state tes ke sessionStorage (dipanggil saat beforeunload) */
function saveFullTestState() {
    const testFrame = document.getElementById('testFrame');
    if (!testFrame || testFrame.style.display === 'none') {
        sessionStorage.removeItem(TEST_STATE_KEY);
        return;
    }
    const state = {
        active: true,
        testTitle: currentTestTitle,
        testPath: currentTestPath,
        testCategory: currentTestCategory,
        parentCategory: currentParentCategory,
        paketNumber: currentPaketNumber,
        isKecermatanTest: isKecermatanTest,
        isKecermatanSequentialMode: isKecermatanSequentialMode,
        autoNextDuration: autoNextDuration,
        timerCurrentValue: _timerCurrentValue,
        timerIsCountdown: _timerIsCountdown,
        currentKecermatanSession: currentKecermatanSession,
        kecermatanSeqCurrentIdx: kecermatanSeqCurrentIdx,
        kecermatanSeqAccCorrect: kecermatanSeqAccCorrect,
        kecermatanSeqAccTotal: kecermatanSeqAccTotal,
        kecermatanSeqPackages: kecermatanSeqPackages,
        kecermatanSeqSubTestName: kecermatanSeqSubTestName,
        kecermatanSeqIsQuizType: kecermatanSeqIsQuizType,
        kecermatanSeqPackageResults: kecermatanSeqPackageResults,
        kecermatanQuestionSpeed: kecermatanQuestionSpeed,
    };
    // Simpan state quiz dari iframe (jawaban + posisi soal)
    try {
        const iframe = document.getElementById('testIframe');
        const win = iframe.contentWindow;
        if (win && win.userAnswers !== undefined && win.currentIdx !== undefined) {
            state.userAnswers = Array.from(win.userAnswers);
            state.currentIdx = win.currentIdx;
        }
    } catch(e) {}
    sessionStorage.setItem(TEST_STATE_KEY, JSON.stringify(state));
}

/** Restore state tes setelah reload halaman */
function restoreTestState(savedState) {
    if (!savedState || !savedState.active) return;

    // Restore variabel global
    currentTestTitle = savedState.testTitle || '';
    currentTestPath = savedState.testPath || '';
    currentTestCategory = savedState.testCategory || '';
    currentParentCategory = savedState.parentCategory || '';
    currentPaketNumber = savedState.paketNumber || 0;
    isKecermatanTest = !!savedState.isKecermatanTest;
    isKecermatanSequentialMode = !!savedState.isKecermatanSequentialMode;
    autoNextDuration = savedState.autoNextDuration || 0;
    currentKecermatanSession = savedState.currentKecermatanSession || null;
    _timerCurrentValue = savedState.timerCurrentValue || 0;
    _timerIsCountdown = !!savedState.timerIsCountdown;
    kecermatanSeqCurrentIdx = savedState.kecermatanSeqCurrentIdx || 0;
    kecermatanSeqAccCorrect = savedState.kecermatanSeqAccCorrect || 0;
    kecermatanSeqAccTotal = savedState.kecermatanSeqAccTotal || 0;
    kecermatanSeqPackages = savedState.kecermatanSeqPackages || [];
    kecermatanSeqSubTestName = savedState.kecermatanSeqSubTestName || '';
    kecermatanSeqIsQuizType = savedState.kecermatanSeqIsQuizType !== undefined ? savedState.kecermatanSeqIsQuizType : true;
    kecermatanSeqPackageResults = savedState.kecermatanSeqPackageResults || [];
    kecermatanQuestionSpeed = savedState.kecermatanQuestionSpeed || 0;

    // Tampilkan test overlay
    document.getElementById('testFrame').style.display = 'flex';
    document.getElementById('testTitle').textContent = currentTestTitle;
    document.getElementById('testCategory').textContent = currentTestCategory;
    const authBtns = document.querySelectorAll('.btn-history-modern, .btn-logout-modern');
    authBtns.forEach(btn => btn.style.display = 'none');

    const autoNextIndicator = document.getElementById('autoNextIndicator');
    const timerTag = document.getElementById('timer').parentElement;

    if (isKecermatanSequentialMode) {
        // --- Restore Kecermatan Sequential ---
        if (autoNextIndicator) autoNextIndicator.style.display = 'flex';
        timerTag.style.display = 'none';
        const testNav = document.querySelector('.test-nav');
        if (testNav) testNav.style.display = 'none';
        window.removeEventListener('message', handleIframeMessage);
        window.addEventListener('message', handleIframeMessage);
        addPackageProgressBar();
        updatePackageProgress(kecermatanSeqCurrentIdx);

        const pkg = kecermatanSeqPackages[kecermatanSeqCurrentIdx];
        if (pkg) {
            const iframe = document.getElementById('testIframe');
            const sep = pkg.file.includes('?') ? '&' : '?';
            iframe.src = pkg.file + sep + 'packageTime=60&questionSpeed=' + kecermatanQuestionSpeed;
            iframe.onload = function() {
                setTimeout(() => {
                    _exposeIframeVarsOnWindow(iframe);
                    injectIframeOverrides(iframe);
                    _restoreIframeAnswers(iframe, savedState);
                }, 300);
            };
        }
    } else {
        // --- Restore Tes Normal ---
        if (autoNextIndicator) autoNextIndicator.style.display = 'none';
        timerTag.style.display = 'flex';
        const iframe = document.getElementById('testIframe');
        iframe.src = currentTestPath;
        iframe.onload = function() {
            setTimeout(() => {
                _exposeIframeVarsOnWindow(iframe);
                injectIframeOverrides(iframe);
                _restoreIframeAnswers(iframe, savedState);
                // Resume timer dari nilai tersimpan
                startTimer(
                    _timerIsCountdown ? _timerCurrentValue : 0,
                    _timerCurrentValue
                );
            }, 300);
        };
    }
}

/** Helper: inject jawaban & posisi soal yang tersimpan ke dalam iframe */
function _restoreIframeAnswers(iframe, savedState) {
    if (!savedState.userAnswers) return;
    try {
        const win = iframe.contentWindow;
        if (!win || !win.userAnswers) return;
        savedState.userAnswers.forEach((ans, i) => {
            if (ans !== null && ans !== undefined) win.userAnswers[i] = ans;
        });
        if (savedState.currentIdx !== undefined) win.currentIdx = savedState.currentIdx;
        if (win.showQuestion) win.showQuestion();
        if (win.renderStatus) win.renderStatus();
    } catch(e) {}
}

// Simpan state sebelum halaman ditutup/reload
window.addEventListener('beforeunload', saveFullTestState);

// ==================== NAVIGATION HISTORY (Back Button + Reload Restore) ====================
const NAV_SESSION_KEY = 'appNavState';

/**
 * Push a new navigation state into browser History API and save to sessionStorage.
 * Call this every time a new menu is opened.
 */
function pushNavState(stateObj) {
    saveNavToSession(stateObj);
    history.pushState(stateObj, '');
}

/**
 * Replace current history entry without adding a new one.
 * Used for the initial page load state.
 */
function replaceNavState(stateObj) {
    saveNavToSession(stateObj);
    history.replaceState(stateObj, '');
}

/**
 * Persist nav state to sessionStorage so it survives page reload.
 */
function saveNavToSession(stateObj) {
    try {
        sessionStorage.setItem(NAV_SESSION_KEY, JSON.stringify(stateObj));
    } catch(e) {}
}

/**
 * Restore the UI to match a saved nav state object.
 * Handles all menu levels without triggering additional pushState calls.
 */
function restoreNavState(state) {
    if (!state || !state.menu) { _showMain(); return; }

    switch (state.menu) {
        case 'main':
            _showMain();
            break;
        case 'psikotesMain':
            _showMain();
            _openPsikotesMain();
            break;
        case 'psikotesSub':
            _showMain();
            _openPsikotesMain();
            if (state.psikotesCategory) _openPsikotesSub(state.psikotesCategory);
            break;
        case 'psikotesDetail':
            _showMain();
            _openPsikotesMain();
            if (state.psikotesCategory) _openPsikotesSub(state.psikotesCategory);
            if (state.subCategory) _openPsikotesDetail(state.psikotesCategory, state.subCategory);
            break;
        case 'akademik':
            _showMain();
            _openAkademik();
            break;
        case 'kategoriDetail':
            _showMain();
            _openAkademik();
            if (state.akademikCategory) _openKategori(state.akademikCategory);
            break;
        default:
            _showMain();
    }
}

// ---- Private "silent" navigation helpers (no pushState) ----
function _showMain() {
    hideAllMenus();
    currentPsikotesCategory = null;
    currentSubCategory = null;
    currentAkademikCategory = null;
    currentFilter = 'semua';
    document.querySelector('.main-menu-grid').style.display = 'grid';
    document.querySelector('.modern-header').style.display = 'block';
}

function _openPsikotesMain() {
    currentAkademikCategory = null;
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
    document.getElementById('psikotesMainMenu').style.display = 'block';
}

function _openPsikotesSub(category) {
    currentPsikotesCategory = category;
    document.getElementById('psikotesMainMenu').style.display = 'none';
    let title = '', subItems = [], desc = '';
    switch(category) {
        case 'kecerdasan': title = 'Tes Kecerdasan'; subItems = psikotesGroups[0].sub; desc = '3 jenis tes tersedia'; break;
        case 'kecermatan': title = 'Tes Kecermatan'; subItems = psikotesGroups[1].sub; desc = '4 jenis tes tersedia'; break;
        case 'kepribadian': title = 'Tes Kepribadian'; subItems = psikotesGroups[2].sub; desc = '2 jenis tes tersedia'; break;
        case 'tryout':     title = 'Try Out';         subItems = psikotesGroups[3].sub; desc = '1 jenis tes tersedia'; break;
    }
    document.getElementById('psikotesSubTitle').textContent = title;
    document.getElementById('psikotesSubDesc').textContent = desc;
    renderSubCategoryGrid(subItems, category);
    document.getElementById('psikotesSubMenu').style.display = 'block';
}

function _openPsikotesDetail(category, subCategory) {
    currentSubCategory = subCategory;
    document.getElementById('psikotesSubMenu').style.display = 'none';
    document.getElementById('psikotesDetailTitle').textContent = subCategory;
    const totalPackages = 20;
    const subCategorySlug = subCategory.toLowerCase().replace(/\s+/g, '-');
    const items = [];
    for (let i = 1; i <= totalPackages; i++) {
        const folderName = `${subCategorySlug}${i}`;
        const fileName = `${subCategorySlug}${i}.html`;
        items.push({
            name: `${subCategory} ${i}`,
            number: i,
            paketNumber: 0,
            file: `psikotes/${category}/${folderName}/${fileName}`
        });
    }
    const detailMenu = document.getElementById('psikotesDetailMenu');
    detailMenu.dataset.items = JSON.stringify(items);
    renderPsikotesDetailGrid(items);
    document.getElementById('psikotesDetailMenu').style.display = 'block';
}

function _openAkademik() {
    currentPsikotesCategory = null;
    currentSubCategory = null;
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
    document.getElementById('akademikMenu').style.display = 'block';
}

function _openKategori(key) {
    currentAkademikCategory = key;
    document.getElementById('akademikMenu').style.display = 'none';
    const cat = akademikCategories[key];
    if (!cat) return;
    document.getElementById('categoryTitle').textContent = cat.title;
    document.getElementById('categorySubtitle').textContent = '20 Paket Soal Tersedia';
    renderAkademikGrid(key);
    document.getElementById('categoryDetailMenu').style.display = 'block';
}

// ---- popstate handler: fired when user presses Back / Forward ----
window.addEventListener('popstate', function(e) {
    // 1. Jika test overlay sedang aktif, tutup dulu
    const testFrame = document.getElementById('testFrame');
    if (testFrame && testFrame.style.display !== 'none') {
        closeTest();
        // Push kembali state saat ini agar history tidak maju ke depan
        const currentSaved = sessionStorage.getItem(NAV_SESSION_KEY);
        if (currentSaved) history.pushState(JSON.parse(currentSaved), '');
        return;
    }

    // 2. Jika ada modal yang terbuka, tutup modal
    const modals = ['kecermatanFinalResult', 'autoNextModal', 'scoreHistoryModal'];
    for (const id of modals) {
        const m = document.getElementById(id);
        if (m) {
            m.remove();
            const currentSaved = sessionStorage.getItem(NAV_SESSION_KEY);
            if (currentSaved) history.pushState(JSON.parse(currentSaved), '');
            return;
        }
    }

    // 3. Restore menu dari state history
    const state = e.state;
    if (state) {
        saveNavToSession(state);
        restoreNavState(state);
    } else {
        saveNavToSession({ menu: 'main' });
        _showMain();
    }
});

// ---- Initialize history state on first load (replaceState, no push) ----
// This is called after DOMContentLoaded in index.html

// ========== FUNGSI NAVIGASI UTAMA ==========
function showPsikotesMainMenu() {
    hideAllMenus();
    // Reset akademik state saat masuk psikotes
    currentAkademikCategory = null;
    document.getElementById('psikotesMainMenu').style.display = 'block';
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
    pushNavState({ menu: 'psikotesMain' });
}

function showAkademikMenu() {
    hideAllMenus();
    // Reset psikotes state saat masuk akademik
    currentPsikotesCategory = null;
    currentSubCategory = null;
    document.getElementById('akademikMenu').style.display = 'block';
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
    pushNavState({ menu: 'akademik' });
}

function backToMain() {
    hideAllMenus();
    // Reset semua state kategori saat kembali ke menu utama
    currentPsikotesCategory = null;
    currentSubCategory = null;
    currentAkademikCategory = null;
    currentFilter = 'semua';
    document.querySelector('.main-menu-grid').style.display = 'grid';
    document.querySelector('.modern-header').style.display = 'block';
    replaceNavState({ menu: 'main' });
}

function hideAllMenus() {
    const menus = ['psikotesMainMenu', 'psikotesSubMenu', 'psikotesDetailMenu', 'akademikMenu', 'categoryDetailMenu'];
    menus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// ========== FUNGSI PSIKOTES ==========
function showPsikotesSubMenu(category) {
    currentPsikotesCategory = category;
    document.getElementById('psikotesMainMenu').style.display = 'none';
    
    let title = "";
    let subItems = [];
    let desc = "";
    
    switch(category) {
        case 'kecerdasan':
            title = "Tes Kecerdasan";
            subItems = psikotesGroups[0].sub;
            desc = "3 jenis tes tersedia";
            break;
        case 'kecermatan':
            title = "Tes Kecermatan";
            subItems = psikotesGroups[1].sub;
            desc = "4 jenis tes tersedia";
            break;
        case 'kepribadian':
            title = "Tes Kepribadian";
            subItems = psikotesGroups[2].sub;
            desc = "2 jenis tes tersedia";
            break;
        case 'tryout':
            title = "Try Out";
            subItems = psikotesGroups[3].sub;
            desc = "1 jenis tes tersedia";
            break;
    }
    
    document.getElementById('psikotesSubTitle').textContent = title;
    document.getElementById('psikotesSubDesc').textContent = desc;
    
    renderSubCategoryGrid(subItems, category);
    document.getElementById('psikotesSubMenu').style.display = 'block';
    pushNavState({ menu: 'psikotesSub', psikotesCategory: category });
}

function renderSubCategoryGrid(subItems, category) {
    const grid = document.getElementById('subcategoryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    subItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'subcategory-card';
        card.onclick = () => showPsikotesDetail(category, item.name);
        
        const gradientClass = getGradientByIndex(index);
        
        // Untuk kecermatan, tampilkan info random 10 dari 20
        const paketInfo = category === 'kecermatan' ? '10 dari 20 Paket (Acak)' : '20 Paket';
        
        card.innerHTML = `
            <div class="subcategory-icon ${gradientClass}">
                <i class="fas ${item.icon}"></i>
            </div>
            <h4>${item.name}</h4>
            <div class="subcategory-stats">
                <span><i class="fas fa-file"></i> ${item.total} Soal</span>
            </div>
            <span class="subcategory-badge">${paketInfo}</span>
        `;
        
        grid.appendChild(card);
    });
}

function getGradientByIndex(index) {
    const gradients = ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient'];
    return gradients[index % gradients.length];
}

// ========== FUNGSI showPsikotesDetail (MODIFIED: Sequential for Kecermatan) ==========
function showPsikotesDetail(category, subCategory) {
    currentSubCategory = subCategory;
    document.getElementById('psikotesSubMenu').style.display = 'none';
    document.getElementById('psikotesDetailTitle').textContent = subCategory;
    
    const items = [];
    const totalPackages = 20;
    const subCategorySlug = subCategory.toLowerCase().replace(/\s+/g, '-');
    
    if (currentPsikotesCategory === 'kecermatan') {
        // === KECERMATAN: Sequential mode â€” langsung ke auto-next modal ===
        currentKecermatanSession = 'kec_' + Date.now();
        
        // Generate array [1..20] dan shuffle (Fisher-Yates)
        const indices = Array.from({length: totalPackages}, (_, i) => i + 1);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const selected = indices.slice(0, 10);
        
        // Simpan packages untuk sequential session
        kecermatanSeqPackages = selected.map((pkgNum, displayIndex) => {
            const folderName = `${subCategorySlug}${pkgNum}`;
            const fileName = `${subCategorySlug}${pkgNum}.html`;
            return {
                file: `psikotes/${category}/${folderName}/${fileName}`,
                originalNumber: pkgNum,
                displayIndex: displayIndex + 1
            };
        });
        kecermatanSeqSubTestName = subCategory;
        kecermatanSeqIsQuizType = !subCategory.toLowerCase().includes('koran');
        
        // Set state untuk openTest flow
        currentTestCategory = subCategory;
        currentParentCategory = 'kecermatan';
        isKecermatanTest = true;
        isKecermatanSequentialMode = true;
        
        // Langsung tampilkan auto-next modal (skip package cards)
        showAutoNextModal();
        return;
    }
    
    // Non-kecermatan: tampilkan semua 20 paket seperti biasa
    for (let i = 1; i <= totalPackages; i++) {
        const folderName = `${subCategorySlug}${i}`;
        const fileName = `${subCategorySlug}${i}.html`;
        
        items.push({
            name: `${subCategory} ${i}`,
            number: i,
            paketNumber: 0,
            file: `psikotes/${category}/${folderName}/${fileName}`
        });
    }
    
    // Store items in dataset
    const detailMenu = document.getElementById('psikotesDetailMenu');
    detailMenu.dataset.items = JSON.stringify(items);
    
    renderPsikotesDetailGrid(items);
    document.getElementById('psikotesDetailMenu').style.display = 'block';
    pushNavState({ menu: 'psikotesDetail', psikotesCategory: category, subCategory: subCategory });
}

function renderPsikotesDetailGrid(items, filter = "") {
    const grid = document.getElementById('psikotesDetailGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const searchTerm = filter.toLowerCase();
    
    const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.number.toString().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Tidak ditemukan</div>';
        return;
    }
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'soal-item';
        
        // Random difficulty for visual variety
        const difficulties = ['mudah', 'sedang', 'sulit'];
        const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        div.innerHTML = `
            <span class="difficulty-indicator difficulty-${randomDiff}"></span>
            <span class="soal-number">${item.number}</span>
            <span class="soal-label">Paket Soal</span>
        `;
        
        div.onclick = () => openTest(item.name, item.file, currentSubCategory, item.paketNumber || 0);
        grid.appendChild(div);
    });
}

function searchPsikotesDetail() {
    const searchValue = document.getElementById('psikotesDetailSearch').value;
    const itemsData = document.getElementById('psikotesDetailMenu').dataset.items;
    
    if (itemsData) {
        const items = JSON.parse(itemsData);
        renderPsikotesDetailGrid(items, searchValue);
    }
}

function backToPsikotesMain() {
    document.getElementById('psikotesSubMenu').style.display = 'none';
    document.getElementById('psikotesDetailMenu').style.display = 'none';
    document.getElementById('psikotesMainMenu').style.display = 'block';
    document.getElementById('psikotesDetailSearch').value = '';
    replaceNavState({ menu: 'psikotesMain' });
}

function backToPsikotesSub() {
    document.getElementById('psikotesDetailMenu').style.display = 'none';
    document.getElementById('psikotesSubMenu').style.display = 'block';
    document.getElementById('psikotesDetailSearch').value = '';
    replaceNavState({ menu: 'psikotesSub', psikotesCategory: currentPsikotesCategory });
}

// ========== FUNGSI AKADEMIK ==========
function showCategory(key) {
    currentAkademikCategory = key;
    document.getElementById('akademikMenu').style.display = 'none';
    
    const cat = akademikCategories[key];
    document.getElementById('categoryTitle').textContent = cat.title;
    document.getElementById('categorySubtitle').textContent = '20 Paket Soal Tersedia';
    
    renderAkademikGrid(key);
    document.getElementById('categoryDetailMenu').style.display = 'block';
    pushNavState({ menu: 'kategoriDetail', akademikCategory: key });
}

function renderAkademikGrid(key, filter = "") {
    const cat = akademikCategories[key];
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const searchTerm = filter.toLowerCase();
    
    for (let i = 1; i <= 20; i++) {
        const soalName = `${cat.title} ${i}`;
        if (searchTerm && !soalName.toLowerCase().includes(searchTerm)) continue;
        
        const div = document.createElement('div');
        div.className = 'soal-item';
        
        // Assign difficulty based on number
        let difficulty = 'mudah';
        if (i > 13) difficulty = 'sulit';
        else if (i > 6) difficulty = 'sedang';
        
        // Filter by difficulty
        if (currentFilter !== 'semua' && difficulty !== currentFilter) continue;
        
        div.innerHTML = `
            <span class="difficulty-indicator difficulty-${difficulty}"></span>
            <span class="soal-number">${i}</span>
            <span class="soal-label">Paket ${i}</span>
        `;
        
        // Untuk akademik, struktur folder per soal juga
        const folderName = `${cat.prefix}${i}`;
        const fileName = `${cat.prefix}${i}.html`;
        const filePath = `akademik/${cat.folder}/${folderName}/${fileName}`;
        
        div.onclick = () => openTest(soalName, filePath, cat.title, 0);
        grid.appendChild(div);
    }
    
    if (grid.children.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Tidak ada soal dengan filter ini</div>';
    }
}

function filterSoal(difficulty, element) {
    currentFilter = difficulty;
    
    // Update active tab
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
    
    if (currentAkademikCategory) {
        renderAkademikGrid(currentAkademikCategory, document.getElementById('akademikSearch').value);
    }
}

function searchAkademik() {
    if (currentAkademikCategory) {
        renderAkademikGrid(currentAkademikCategory, document.getElementById('akademikSearch').value);
    }
}

function backToAkademik() {
    document.getElementById('categoryDetailMenu').style.display = 'none';
    document.getElementById('akademikMenu').style.display = 'block';
    currentAkademikCategory = null;
    currentFilter = 'semua';
    document.getElementById('akademikSearch').value = '';
    replaceNavState({ menu: 'akademik' });
}

// ========== FUNGSI TEST OVERLAY (MODIFIED) ==========
function openTest(title, path, category, paketNum) {
    currentTestTitle = title;
    currentTestPath = path;
    currentTestCategory = category;
    currentPaketNumber = paketNum || 0;
    _scoreSavedForCurrentTest = false; // Reset flag simpan skor
    
    // Determine parent category
    if (currentPsikotesCategory) {
        currentParentCategory = currentPsikotesCategory;
    } else if (currentAkademikCategory) {
        currentParentCategory = 'akademik';
    } else {
        currentParentCategory = '';
    }
    
    // Kecermatan sequential mode sudah di-handle oleh showPsikotesDetail
    // Ini hanya untuk non-kecermatan
    isKecermatanTest = false;
    isKecermatanSequentialMode = false;
    autoNextDuration = 0;
    launchTest();
}

function launchTest() {
    document.getElementById('testTitle').textContent = currentTestTitle;
    document.getElementById('testCategory').textContent = currentTestCategory;
    document.getElementById('testIframe').src = currentTestPath;
    document.getElementById('testFrame').style.display = 'flex';
    
    // Sembunyikan tombol Riwayat Nilai & Logout saat tes berlangsung
    const authBtns = document.querySelectorAll('.btn-history-modern, .btn-logout-modern');
    authBtns.forEach(btn => btn.style.display = 'none');
    
    const autoNextIndicator = document.getElementById('autoNextIndicator');
    const timerTag = document.getElementById('timer').parentElement;
    
    if (isKecermatanTest && autoNextDuration > 0) {
        // Kecermatan: tampilkan indikator auto-next, sembunyikan timer global
        if (autoNextIndicator) autoNextIndicator.style.display = 'flex';
        timerTag.style.display = 'none';
    } else {
        // Non-kecermatan: tampilkan timer countdown
        if (autoNextIndicator) autoNextIndicator.style.display = 'none';
        timerTag.style.display = 'flex';
        
        const timeLimit = getTimeLimitSeconds();
        startTimer(timeLimit);
    }
    
    // Setup iframe injection saat iframe selesai dimuat
    const iframe = document.getElementById('testIframe');
    iframe.onload = function() {
        setTimeout(function() {
            _exposeIframeVarsOnWindow(iframe);
            // Beri waktu bridge script dieksekusi browser sebelum override
            setTimeout(function() {
                injectIframeOverrides(iframe);
            }, 150);
        }, 300);
    };
}

/**
 * Inject script ke dalam iframe untuk:
 * 1. Expose variabel quiz (const/let) sebagai window properties
 * 2. Wrap showResult() agar otomatis kirim skor via postMessage ke parent
 */
function _exposeIframeVarsOnWindow(iframe) {
    try {
        const win = iframe.contentWindow;
        if (!win || !win.document) return;
        const bridge = win.document.createElement('script');
        bridge.textContent = `
            (function() {
                try {
                    // Expose variabel quiz ke window
                    if (typeof quizData !== 'undefined' && !window.hasOwnProperty('quizData')) window.quizData = quizData;
                    if (typeof userAnswers !== 'undefined' && !window.hasOwnProperty('userAnswers')) window.userAnswers = userAnswers;
                    if (typeof currentIdx !== 'undefined' && !window.hasOwnProperty('currentIdx')) {
                        Object.defineProperty(window, 'currentIdx', {
                            get: function() { return currentIdx; },
                            set: function(v) { currentIdx = v; },
                            configurable: true
                        });
                    }
                    if (typeof isReviewMode !== 'undefined' && !window.hasOwnProperty('isReviewMode')) {
                        Object.defineProperty(window, 'isReviewMode', {
                            get: function() { return isReviewMode; },
                            set: function(v) { isReviewMode = v; },
                            configurable: true
                        });
                    }

                    // Wrap showResult agar kirim skor ke parent via postMessage
                    if (typeof showResult === 'function' && !window._showResultWrapped) {
                        var _origShowResult = showResult;
                        showResult = function() {
                            _origShowResult.apply(this, arguments);
                            try {
                                var qd = window.quizData || (typeof quizData !== 'undefined' ? quizData : []);
                                var ua = window.userAnswers || (typeof userAnswers !== 'undefined' ? userAnswers : []);
                                var correct = 0;
                                ua.forEach(function(ans, i) {
                                    if (qd[i] && ans === qd[i].a) correct++;
                                });
                                var total = qd.length;
                                var score = total > 0 ? Math.round((correct / total) * 100) : 0;
                                window.parent.postMessage({
                                    type: 'quizResult',
                                    score: score,
                                    correct: correct,
                                    total: total
                                }, '*');
                            } catch(pe) {}
                        };
                        window._showResultWrapped = true;
                    }
                } catch(e) {}
            })();
        `;
        win.document.head.appendChild(bridge);
    } catch(e) {}
}

/**
 * Otomatis simpan skor ke riwayat sebelum tes ditutup.
 * Dipanggil sebelum iframe dihancurkan agar jawaban masih bisa diakses.
 * Mencegah skor hilang saat user menutup tes di tengah jalan.
 */
function _autoSaveScoreBeforeClose() {
    try {
        const iframe = document.getElementById('testIframe');
        if (!iframe || !iframe.contentWindow) return;
        const win = iframe.contentWindow;

        // Pastikan variabel iframe ter-expose di window
        _exposeIframeVarsOnWindow(iframe);

        if (isKecermatanSequentialMode) {
            // Kecermatan Sequential: simpan skor parsial dari paket yang sudah selesai
            // Juga hitung jawaban paket yang sedang dikerjakan
            let extraCorrect = 0, extraTotal = 0;
            if (win.quizData && win.userAnswers) {
                win.userAnswers.forEach(function(ans, i) {
                    if (ans !== null && ans !== undefined) {
                        extraTotal++;
                        if (ans === win.quizData[i].a) extraCorrect++;
                    }
                });
            }
            const totalCorrect = kecermatanSeqAccCorrect + extraCorrect;
            const totalAnswered = kecermatanSeqAccTotal + extraTotal;
            if (totalAnswered > 0) {
                const finalScore = Math.round((totalCorrect / totalAnswered) * 100);
                // Gabungkan hasil paket yang sudah selesai + paket parsial saat ini
                var allResults = (kecermatanSeqPackageResults || []).slice();
                if (extraTotal > 0) {
                    allResults.push({ correct: extraCorrect, total: extraTotal });
                }
                saveScore(
                    (kecermatanSeqSubTestName || currentTestTitle) + ' (Parsial ' + allResults.length + ' Paket)',
                    kecermatanSeqSubTestName || currentTestCategory,
                    finalScore,
                    totalCorrect,
                    totalAnswered,
                    0,
                    'kecermatan',
                    currentKecermatanSession,
                    allResults
                );
            }
        } else {
            // Tes Normal (non-kecermatan): hitung skor dari jawaban di iframe
            if (!win.quizData || !win.userAnswers) return;
            // Cek apakah skor sudah tersimpan via override showResult
            if (_scoreSavedForCurrentTest) return;

            let correct = 0, answered = 0;
            win.userAnswers.forEach(function(ans, i) {
                if (ans !== null && ans !== undefined) {
                    answered++;
                    if (ans === win.quizData[i].a) correct++;
                }
            });
            if (answered > 0) {
                const score = Math.round((correct / win.quizData.length) * 100);
                saveScore(
                    currentTestTitle,
                    currentTestCategory,
                    score,
                    correct,
                    win.quizData.length,
                    currentPaketNumber,
                    currentParentCategory,
                    currentKecermatanSession
                );
                _scoreSavedForCurrentTest = true;
            }
        }
    } catch(e) {
        // Silently fail — iframe mungkin sudah cross-origin atau destroyed
    }
}

function closeTest() {
    // Simpan skor otomatis sebelum menutup tes (agar semua skor masuk riwayat)
    _autoSaveScoreBeforeClose();

    // Hapus test state tersimpan (tes ditutup manual)
    clearTestState();
    
    // Simpan flag sebelum reset
    const wasSequentialMode = isKecermatanSequentialMode;
    
    // Tampilkan kembali tombol Riwayat Nilai & Logout
    const authBtns = document.querySelectorAll('.btn-history-modern, .btn-logout-modern');
    authBtns.forEach(btn => btn.style.display = '');
    
    // Bersihkan semua timer
    stopAutoNext();
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Reset timer warning state
    const timerTag = document.getElementById('timer');
    if (timerTag && timerTag.parentElement) {
        timerTag.parentElement.classList.remove('timer-warning');
    }
    
    document.getElementById('testFrame').style.display = 'none';
    document.getElementById('testIframe').src = 'about:blank';
    
    // Remove package progress bar if exists
    const progBar = document.getElementById('kecermatanProgressBar');
    if (progBar) progBar.remove();
    
    // Tampilkan kembali test-nav default
    const testNav = document.querySelector('.test-nav');
    if (testNav) testNav.style.display = 'flex';
    
    // Reset state
    isKecermatanTest = false;
    isKecermatanSequentialMode = false;
    autoNextDuration = 0;
    kecermatanSeqCurrentIdx = 0;
    kecermatanSeqAccCorrect = 0;
    kecermatanSeqAccTotal = 0;
    _scoreSavedForCurrentTest = false;
    
    // Jika dari sequential kecermatan, kembali ke menu Tes Kecermatan
    if (wasSequentialMode) {
        hideAllMenus();
        document.querySelector('.main-menu-grid').style.display = 'none';
        document.querySelector('.modern-header').style.display = 'none';
        showPsikotesSubMenu('kecermatan');
        return;
    }

    // Cek apakah semua menu tersembunyi (kondisi setelah restore dari reload)
    // Jika ya, restore nav state dari sessionStorage agar user kembali ke menu yang benar
    const menuIds = ['psikotesMainMenu','psikotesSubMenu','psikotesDetailMenu','akademikMenu','categoryDetailMenu'];
    const allMenusHidden = menuIds.every(id => {
        const el = document.getElementById(id);
        return !el || el.style.display === 'none' || el.style.display === '';
    });
    const mainGrid = document.querySelector('.main-menu-grid');
    const mainGridHidden = !mainGrid || mainGrid.style.display === 'none' || mainGrid.style.display === '';

    if (allMenusHidden && mainGridHidden) {
        // Tidak ada menu yang terlihat — restore dari sessionStorage
        try {
            const savedNav = sessionStorage.getItem(NAV_SESSION_KEY);
            if (savedNav) {
                const navState = JSON.parse(savedNav);
                restoreNavState(navState);
            } else {
                _showMain();
            }
        } catch(e) {
            _showMain();
        }
    }
}

function toggleFullscreen() {
    const iframe = document.getElementById('testIframe');
    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
    }
}

// ========== KECERMATAN START MODAL ==========
function showAutoNextModal() {
    const existing = document.getElementById('autoNextModal');
    if (existing) existing.remove();
    
    autoNextDuration = 60;
    kecermatanQuestionSpeed = 0;
    
    const modal = document.createElement('div');
    modal.id = 'autoNextModal';
    modal.style.cssText = `
        position:fixed; inset:0; z-index:3000;
        background:rgba(0,0,0,0.8); backdrop-filter:blur(15px);
        display:flex; align-items:center; justify-content:center;
        padding:20px; animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background:linear-gradient(145deg,#141927,#1a2035);
            border:1px solid rgba(255,255,255,0.12); border-radius:28px;
            max-width:480px; width:100%; padding:40px 36px;
            box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 40px rgba(59,130,246,0.1);
            text-align:center; animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);">
            
            <div style="width:68px;height:68px;border-radius:20px;
                background:linear-gradient(135deg,#3b82f6,#06b6d4);
                display:flex;align-items:center;justify-content:center;
                margin:0 auto 18px;font-size:1.8rem;color:white;
                box-shadow:0 10px 30px rgba(59,130,246,0.35);">
                <i class="fas fa-stopwatch"></i>
            </div>
            
            <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:6px;color:#f1f5f9;">
                Tes Kecermatan
            </h3>
            <p style="color:#94a3b8;font-size:0.85rem;margin-bottom:20px;line-height:1.6;">
                ${kecermatanSeqSubTestName} â€” <strong style="color:#f1f5f9;">10 Paket Soal</strong> (acak)
            </p>
            
            <!-- Info Cards -->
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:22px;">
                <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);
                    border-radius:14px;padding:14px;">
                    <div style="font-size:1.6rem;font-weight:900;color:#3b82f6;">60</div>
                    <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Detik / Paket</div>
                </div>
                <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);
                    border-radius:14px;padding:14px;">
                    <div style="font-size:1.6rem;font-weight:900;color:#10b981;">10</div>
                    <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Total Paket</div>
                </div>
            </div>
            
            <!-- Speed Selection -->
            <p style="color:#cbd5e1;font-size:0.82rem;font-weight:600;margin-bottom:12px;">
                <i class="fas fa-tachometer-alt" style="color:#f59e0b;"></i>
                Pilih Kecepatan Pergantian Soal:
            </p>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">
                ${[1,2,3,4,5].map(s => `
                    <button onclick="selectQuestionSpeed(${s})" id="speedBtn${s}"
                        style="width:58px;height:58px;border-radius:16px;
                        background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);
                        color:white;font-size:1.2rem;font-weight:800;cursor:pointer;
                        transition:all 0.3s cubic-bezier(0.23,1,0.32,1);
                        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
                        ${s}<span style="font-size:0.55rem;font-weight:500;opacity:0.5;">detik</span>
                    </button>
                `).join('')}
            </div>
            
            <button onclick="confirmAutoNext()" id="confirmAutoNextBtn"
                style="width:100%;padding:15px;border-radius:16px;
                background:linear-gradient(135deg,#3b82f6,#06b6d4);
                color:white;font-weight:700;font-size:0.95rem;cursor:pointer;
                border:none;opacity:0.4;pointer-events:none;
                transition:all 0.3s;box-shadow:0 8px 25px rgba(59,130,246,0.3);
                display:flex;align-items:center;justify-content:center;gap:10px;
                font-family:inherit;">
                <i class="fas fa-play"></i> Mulai Tes
            </button>
            
            <button onclick="cancelAutoNext()"
                style="width:100%;padding:12px;border-radius:16px;
                background:transparent;color:#64748b;font-weight:600;
                font-size:0.85rem;cursor:pointer;border:1px solid rgba(255,255,255,0.08);
                transition:all 0.3s;margin-top:10px;font-family:inherit;">
                Batal
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function selectQuestionSpeed(seconds) {
    kecermatanQuestionSpeed = seconds;
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById('speedBtn' + i);
        if (!btn) continue;
        if (i === seconds) {
            btn.style.background = 'linear-gradient(135deg,#f59e0b,#f97316)';
            btn.style.borderColor = '#f59e0b';
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 8px 25px rgba(245,158,11,0.4)';
        } else {
            btn.style.background = 'rgba(255,255,255,0.04)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        }
    }
    const confirmBtn = document.getElementById('confirmAutoNextBtn');
    if (confirmBtn) {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.pointerEvents = 'auto';
    }
}

function confirmAutoNext() {
    if (kecermatanQuestionSpeed <= 0) return; // Harus pilih kecepatan dulu
    autoNextDuration = 60;
    
    // Tutup modal
    const modal = document.getElementById('autoNextModal');
    if (modal) modal.remove();
    
    // Jika sequential mode, mulai sesi sequential
    if (isKecermatanSequentialMode) {
        startKecermatanSequentialSession();
    } else {
        launchTest();
    }
}

function cancelAutoNext() {
    autoNextDuration = 0;
    isKecermatanTest = false;
    const wasSequential = isKecermatanSequentialMode;
    isKecermatanSequentialMode = false;
    const modal = document.getElementById('autoNextModal');
    if (modal) modal.remove();
    
    // Kembali ke menu Tes Kecermatan
    if (wasSequential) {
        hideAllMenus();
        document.querySelector('.main-menu-grid').style.display = 'none';
        document.querySelector('.modern-header').style.display = 'none';
        showPsikotesSubMenu('kecermatan');
    }
}

function startAutoNextTimer(iframeWindow) {
    autoNextCountdownValue = autoNextDuration;
    updateAutoNextDisplay(autoNextCountdownValue);
    resetAutoNextBar();
    
    // Timer countdown per detik untuk display
    autoNextCountdownInterval = setInterval(() => {
        autoNextCountdownValue--;
        updateAutoNextDisplay(Math.max(0, autoNextCountdownValue));
    }, 1000);
    
    // Timer utama untuk advance soal
    autoNextInterval = setInterval(() => {
        try {
            if (!iframeWindow || iframeWindow.closed) {
                stopAutoNext();
                return;
            }
            
            if (iframeWindow.isReviewMode) {
                stopAutoNext();
                return;
            }
            
            if (iframeWindow.currentIdx < iframeWindow.quizData.length - 1) {
                iframeWindow.currentIdx++;
                iframeWindow.showQuestion();
                
                // Reset countdown
                autoNextCountdownValue = autoNextDuration;
                updateAutoNextDisplay(autoNextCountdownValue);
                resetAutoNextBar();
            } else {
                // Soal terakhir dari paket ini
                stopAutoNext();
                
                if (isKecermatanSequentialMode) {
                    // Akumulasi skor paket ini dan lanjut ke paket berikutnya
                    accumulatePackageScores(iframeWindow);
                    
                    if (kecermatanSeqCurrentIdx < kecermatanSeqPackages.length - 1) {
                        kecermatanSeqCurrentIdx++;
                        setTimeout(() => loadKecermatanPackageByIndex(kecermatanSeqCurrentIdx), 500);
                    } else {
                        // Semua 10 paket selesai
                        setTimeout(() => showKecermatanFinalResult(), 500);
                    }
                } else {
                    iframeWindow.showResult();
                }
            }
        } catch(e) {
            stopAutoNext();
        }
    }, autoNextDuration * 1000);
}

function stopAutoNext() {
    if (autoNextInterval) {
        clearInterval(autoNextInterval);
        autoNextInterval = null;
    }
    if (autoNextCountdownInterval) {
        clearInterval(autoNextCountdownInterval);
        autoNextCountdownInterval = null;
    }
    const indicator = document.getElementById('autoNextIndicator');
    if (indicator) indicator.style.display = 'none';
}

function updateAutoNextDisplay(seconds) {
    const el = document.getElementById('autoNextCountdown');
    if (el) el.textContent = seconds + 's';
    // Also update sequential mode countdown
    const seqEl = document.getElementById('kecSeqCountdown');
    if (seqEl) seqEl.textContent = seconds + 's';
}

function resetAutoNextBar() {
    const fill = document.getElementById('autoNextFill');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0%';
    fill.offsetWidth; // Force reflow
    fill.style.transition = `width ${autoNextDuration}s linear`;
    fill.style.width = '100%';
}

// ========== IFRAME INJECTION ==========
function injectIframeOverrides(iframe) {
    try {
        const win = iframe.contentWindow;
        // PENTING: JANGAN cek win.quizData — const/let BUKAN properti window!
        // Bridge script sudah expose ke window, tapi cek showResult saja cukup
        if (!win || !win.showResult) return;
        
        if (isKecermatanSequentialMode) {
            // === KECERMATAN SEQUENTIAL MODE ===
            
            // 1. Sembunyikan navigasi manual (sidebar, tombol prev/next, akhiri tes)
            const style = win.document.createElement('style');
            style.textContent = `
                .sidebar-numbers, #sidebar-nav { display: none !important; }
                .nav-buttons { display: none !important; }
                #finish-quiz-btn { display: none !important; }
                #back-to-result-btn { display: none !important; }
                #result-screen { display: none !important; }
                .main-wrapper { justify-content: center; }
                .quiz-container { max-width: 900px; margin: 0 auto; }
            `;
            win.document.head.appendChild(style);
            
            // 2. Override selectAnswer â€” hanya record jawaban, TIDAK auto-advance
            win.selectAnswer = function(i) {
                if (win.isReviewMode) return;
                win.userAnswers[win.currentIdx] = i;
                win.showQuestion();
                // TIDAK auto-advance â€” biarkan timer yang handle
            };
            
            // 3. Override showResult â€” jangan tampilkan hasil di iframe
            win.showResult = function() {
                // Do nothing â€” biarkan auto-next timer yang handle transisi
            };
            
            // 4. Disable navigasi via klik nomor soal
            win.renderStatus = function() {};
            
            // 5. Mulai auto-next timer
            startAutoNextTimer(win);
            
        } else {
            // === MODE NORMAL (non-kecermatan) ===
            
            // Override showResult untuk kirim skor ke parent
            const origShowResult = win.showResult;
            win.showResult = function() {
                origShowResult.call(this);
                
                // Cegah duplikat simpan skor
                if (_scoreSavedForCurrentTest) return;
                
                try {
                    // Re-expose variabel dari iframe (karena const/let)
                    _exposeIframeVarsOnWindow(iframe);
                    
                    // Ambil quizData & userAnswers — coba window dulu, fallback ke scope lokal iframe
                    var qd = win.quizData;
                    var ua = win.userAnswers;
                    if (!qd || !ua) {
                        console.log('[Score] quizData/userAnswers belum tersedia di window');
                        return;
                    }
                    
                    let correct = 0;
                    ua.forEach((ans, i) => {
                        if (qd[i] && ans === qd[i].a) correct++;
                    });
                    const score = Math.round((correct / qd.length) * 100);
                    
                    saveScore(
                        currentTestTitle,
                        currentTestCategory,
                        score,
                        correct,
                        qd.length,
                        currentPaketNumber,
                        currentParentCategory,
                        currentKecermatanSession
                    );
                    _scoreSavedForCurrentTest = true;
                    console.log('[Score] ✅ Skor tersimpan via showResult override:', currentTestTitle, score);
                } catch(e) {
                    console.log('[Score] ❌ Gagal simpan dari showResult override:', e.message);
                }
                
                stopAutoNext();
            };
            
            // Untuk kecermatan single-mode (tidak digunakan lagi, tapi sebagai fallback)
            if (isKecermatanTest && autoNextDuration > 0) {
                win.selectAnswer = function(i) {
                    if (win.isReviewMode) return;
                    win.userAnswers[win.currentIdx] = i;
                    win.showQuestion();
                };
                startAutoNextTimer(win);
            }
        }
    } catch(e) {
        console.log('Iframe injection skipped:', e.message);
    }
}

// ========== KECERMATAN SEQUENTIAL SESSION ==========
function startKecermatanSequentialSession() {
    // Reset akumulator
    kecermatanSeqCurrentIdx = 0;
    kecermatanSeqAccCorrect = 0;
    kecermatanSeqAccTotal = 0;
    kecermatanSeqPackageResults = []; // Reset per-package results
    
    // Tampilkan test overlay
    document.getElementById('testFrame').style.display = 'flex';
    
    // Sembunyikan tombol Riwayat Nilai & Logout saat tes berlangsung
    const authBtns = document.querySelectorAll('.btn-history-modern, .btn-logout-modern');
    authBtns.forEach(btn => btn.style.display = 'none');
    
    // Setup auto-next indicator
    const autoNextIndicator = document.getElementById('autoNextIndicator');
    const timerTag = document.getElementById('timer').parentElement;
    if (autoNextIndicator) autoNextIndicator.style.display = 'flex';
    timerTag.style.display = 'none';
    
    // Setup postMessage listener untuk menerima skor dari iframe
    window.removeEventListener('message', handleIframeMessage);
    window.addEventListener('message', handleIframeMessage);
    
    // Tambah progress bar untuk paket
    addPackageProgressBar();
    
    // Mulai paket pertama
    loadKecermatanPackageByIndex(0);
}

// Handler untuk postMessage dari iframe test files
function handleIframeMessage(event) {
    if (!isKecermatanSequentialMode) return;
    if (!event.data || event.data.type !== 'packageDone') return;
    
    // Simpan hasil per-paket
    const pkgCorrect = event.data.correct || 0;
    const pkgTotal = event.data.total || 0;
    kecermatanSeqPackageResults.push({ correct: pkgCorrect, total: pkgTotal });
    
    // Akumulasi skor keseluruhan
    kecermatanSeqAccCorrect += pkgCorrect;
    kecermatanSeqAccTotal += pkgTotal;
    
    // Pindah ke paket berikutnya atau tampilkan hasil akhir
    if (kecermatanSeqCurrentIdx < kecermatanSeqPackages.length - 1) {
        kecermatanSeqCurrentIdx++;
        setTimeout(() => loadKecermatanPackageByIndex(kecermatanSeqCurrentIdx), 500);
    } else {
        // Semua 10 paket selesai
        window.removeEventListener('message', handleIframeMessage);
        setTimeout(() => showKecermatanFinalResult(), 500);
    }
}

function addPackageProgressBar() {
    // Hapus progress bar lama jika ada
    const existing = document.getElementById('kecermatanProgressBar');
    if (existing) existing.remove();
    
    const progBar = document.createElement('div');
    progBar.id = 'kecermatanProgressBar';
    progBar.style.cssText = `
        position:fixed; top:0; left:0; right:0; z-index:2100;
        display:flex; flex-direction:column; align-items:center;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(10px);
        padding:10px 20px; border-bottom:1px solid rgba(255,255,255,0.1);
    `;
    
    progBar.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:800px;gap:15px;">
            <button onclick="closeTest()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);
                color:white;padding:6px 14px;border-radius:30px;cursor:pointer;font-size:0.85rem;
                display:flex;align-items:center;gap:6px;font-family:inherit;flex-shrink:0;">
                <i class="fas fa-times"></i> Keluar
            </button>
            <div style="flex:1;text-align:center;">
                <div style="font-weight:700;font-size:0.95rem;color:#f1f5f9;" id="kecSeqTitle">
                    ${kecermatanSeqSubTestName}
                </div>
                <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;" id="kecSeqPaketInfo">
                    Paket 1 / ${kecermatanSeqPackages.length}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <div style="font-size:0.72rem;color:#06b6d4;">
                    <i class="fas fa-clock"></i> 60s/Paket
                </div>
                <div style="font-size:0.72rem;color:#f59e0b;">
                    <i class="fas fa-forward"></i> ${kecermatanQuestionSpeed}s/Soal
                </div>
            </div>
        </div>
        <div style="width:100%;max-width:800px;margin-top:8px;">
            <div style="display:flex;gap:4px;" id="kecSeqDots">
                ${kecermatanSeqPackages.map((_, i) => `
                    <div class="kec-seq-dot" data-idx="${i}" style="
                        flex:1;height:6px;border-radius:3px;
                        background:${i === 0 ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(255,255,255,0.1)'};
                        transition:background 0.3s;
                    "></div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(progBar);
}

function updatePackageProgress(idx) {
    // Update paket info text
    const paketInfo = document.getElementById('kecSeqPaketInfo');
    if (paketInfo) paketInfo.textContent = `Paket ${idx + 1} / ${kecermatanSeqPackages.length}`;
    
    // Update dots
    const dots = document.querySelectorAll('.kec-seq-dot');
    dots.forEach((dot, i) => {
        if (i < idx) {
            dot.style.background = '#10b981'; // completed - green
        } else if (i === idx) {
            dot.style.background = 'linear-gradient(135deg,#3b82f6,#06b6d4)'; // current - blue
        } else {
            dot.style.background = 'rgba(255,255,255,0.1)'; // upcoming - dim
        }
    });
}

function loadKecermatanPackageByIndex(idx) {
    const pkg = kecermatanSeqPackages[idx];
    if (!pkg) return;
    
    // Stop timer sebelumnya
    stopAutoNext();
    
    // Update state
    currentTestTitle = `${kecermatanSeqSubTestName} â€” Paket ${idx + 1}/${kecermatanSeqPackages.length}`;
    currentTestPath = pkg.file;
    currentPaketNumber = idx + 1;
    
    // Update header display
    document.getElementById('testTitle').textContent = currentTestTitle;
    document.getElementById('testCategory').textContent = 'Kecermatan';
    
    // Hide default test-nav (kita pakai custom progress bar)
    const testNav = document.querySelector('.test-nav');
    if (testNav) testNav.style.display = 'none';
    
    // Update progress bar
    updatePackageProgress(idx);
    
    // Tampilkan transisi antar paket
    showPackageTransition(idx, () => {
        // Load iframe dengan parameter packageTime + questionSpeed
        const iframe = document.getElementById('testIframe');
        const separator = pkg.file.includes('?') ? '&' : '?';
        iframe.src = pkg.file + separator + 'packageTime=60&questionSpeed=' + kecermatanQuestionSpeed;
    });
}

function showPackageTransition(idx, callback) {
    // Hapus transisi lama
    const existing = document.getElementById('packageTransition');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'packageTransition';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:2050;
        background:rgba(0,0,0,0.9); backdrop-filter:blur(20px);
        display:flex; align-items:center; justify-content:center;
        animation:fadeIn 0.3s ease;
    `;
    
    const isFirst = idx === 0;
    const title = isFirst ? 'Tes Dimulai!' : `Paket ${idx + 1}`;
    const subtitle = isFirst 
        ? `${kecermatanSeqSubTestName} â€” ${kecermatanSeqPackages.length} Paket`
        : `${kecermatanSeqSubTestName} â€” ${kecermatanSeqPackages.length - idx} paket tersisa`;
    
    overlay.innerHTML = `
        <div style="text-align:center;animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);">
            <div style="width:80px;height:80px;border-radius:24px;
                background:linear-gradient(135deg,#3b82f6,#06b6d4);
                display:flex;align-items:center;justify-content:center;
                margin:0 auto 20px;font-size:2rem;color:white;
                box-shadow:0 15px 40px rgba(59,130,246,0.4);">
                <i class="fas ${isFirst ? 'fa-play' : 'fa-arrow-right'}"></i>
            </div>
            <h2 style="font-size:2rem;font-weight:800;color:#f1f5f9;margin-bottom:8px;">
                ${title}
            </h2>
            <p style="color:#94a3b8;font-size:0.95rem;margin-bottom:6px;">${subtitle}</p>
            <p style="color:#64748b;font-size:0.8rem;">
                Auto-next: <span style="color:#06b6d4;font-weight:700;">${autoNextDuration} detik</span> per soal
            </p>
            <div style="margin-top:20px;">
                <div style="display:flex;gap:4px;justify-content:center;">
                    ${kecermatanSeqPackages.map((_, i) => `
                        <div style="width:24px;height:4px;border-radius:2px;
                            background:${i < idx ? '#10b981' : i === idx ? '#3b82f6' : 'rgba(255,255,255,0.15)'};
                        "></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-dismiss setelah 1.5 detik
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    }, 1500);
}

function accumulatePackageScores(iframeWindow) {
    try {
        // Pastikan variabel quiz ter-expose di window iframe
        const iframe = document.getElementById('testIframe');
        if (iframe) _exposeIframeVarsOnWindow(iframe);
        
        let correct = 0;
        const total = iframeWindow.quizData.length;
        
        iframeWindow.userAnswers.forEach((ans, i) => {
            if (ans === iframeWindow.quizData[i].a) correct++;
        });
        
        kecermatanSeqPackageResults.push({ correct: correct, total: total });
        
        kecermatanSeqAccCorrect += correct;
        kecermatanSeqAccTotal += total;
    } catch(e) {
        console.log('Error accumulating scores:', e.message);
    }
}

function showKecermatanFinalResult() {
    // Hitung skor akhir 0-100
    const finalScore = kecermatanSeqAccTotal > 0 
        ? Math.round((kecermatanSeqAccCorrect / kecermatanSeqAccTotal) * 100)
        : 0;
    const totalWrong = kecermatanSeqAccTotal - kecermatanSeqAccCorrect;
    
    // Simpan skor ke riwayat (dengan detail per-paket)
    saveScore(
        kecermatanSeqSubTestName + ' (10 Paket)',
        kecermatanSeqSubTestName,
        finalScore,
        kecermatanSeqAccCorrect,
        kecermatanSeqAccTotal,
        0,
        'kecermatan',
        currentKecermatanSession,
        kecermatanSeqPackageResults
    );
    
    // Hapus progress bar
    const progBar = document.getElementById('kecermatanProgressBar');
    if (progBar) progBar.remove();
    
    // Sembunyikan test overlay
    document.getElementById('testFrame').style.display = 'none';
    document.getElementById('testIframe').src = 'about:blank';
    
    // Tampilkan default test nav kembali
    const testNav = document.querySelector('.test-nav');
    if (testNav) testNav.style.display = 'flex';
    
    // Stop semua timer
    stopAutoNext();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    
    // Determine grade color and text
    let gradeColor, gradeText, gradeIcon;
    if (finalScore >= 90) { gradeColor = '#10b981'; gradeText = 'Sangat Baik'; gradeIcon = 'fa-trophy'; }
    else if (finalScore >= 75) { gradeColor = '#3b82f6'; gradeText = 'Baik'; gradeIcon = 'fa-medal'; }
    else if (finalScore >= 60) { gradeColor = '#f59e0b'; gradeText = 'Cukup'; gradeIcon = 'fa-star-half-alt'; }
    else { gradeColor = '#ef4444'; gradeText = 'Perlu Latihan'; gradeIcon = 'fa-redo'; }
    
    // Buat modal hasil â€” two-panel layout (score card + chart)
    const resultModal = document.createElement('div');
    resultModal.id = 'kecermatanFinalResult';
    resultModal.style.cssText = `
        position:fixed; inset:0; z-index:3000;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(20px);
        display:flex; align-items:center; justify-content:center;
        padding:20px; animation:fadeIn 0.3s ease;
        overflow-y:auto;
    `;
    
    // Build per-package chart data labels
    const pkgLabels = kecermatanSeqPackageResults.map((_, i) => 'P' + (i + 1));
    const pkgData = kecermatanSeqPackageResults.map(p => p.correct);
    
    resultModal.innerHTML = `
        <div style="display:flex;gap:24px;max-width:960px;width:100%;align-items:stretch;
            animation:slideUp 0.5s cubic-bezier(0.23,1,0.32,1);flex-wrap:wrap;justify-content:center;">
            
            <!-- LEFT: Score Card -->
            <div style="background:linear-gradient(145deg,#141927,#1a2035);
                border:1px solid rgba(255,255,255,0.12); border-radius:32px;
                flex:1;min-width:300px;max-width:380px; padding:40px 32px;
                box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 50px rgba(59,130,246,0.1);
                text-align:center;display:flex;flex-direction:column;align-items:center;">
                
                <!-- Icon -->
                <div style="width:72px;height:72px;border-radius:22px;
                    background:linear-gradient(135deg,${gradeColor},${gradeColor}88);
                    display:flex;align-items:center;justify-content:center;
                    margin-bottom:20px;font-size:2rem;color:white;
                    box-shadow:0 12px 35px ${gradeColor}55;">
                    <i class="fas ${gradeIcon}"></i>
                </div>
                
                <!-- Title -->
                <h2 style="font-size:1.4rem;font-weight:800;color:#f1f5f9;margin-bottom:4px;">
                    Tes Selesai!
                </h2>
                <p style="color:#94a3b8;font-size:0.82rem;margin-bottom:24px;">
                    ${kecermatanSeqSubTestName} â€” 10 Paket
                </p>
                
                <!-- Score Circle -->
                <div style="position:relative;width:130px;height:130px;margin-bottom:20px;">
                    <svg width="130" height="130" style="transform:rotate(-90deg);">
                        <circle cx="65" cy="65" r="55" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
                        <circle cx="65" cy="65" r="55" fill="none" stroke="${gradeColor}" stroke-width="10"
                            stroke-linecap="round" stroke-dasharray="${Math.round(finalScore * 3.46)} 346"
                            style="transition:stroke-dasharray 1.5s cubic-bezier(0.23,1,0.32,1);"/>
                    </svg>
                    <div style="position:absolute;inset:0;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;">
                        <span style="font-size:2.2rem;font-weight:900;color:${gradeColor};">${finalScore}</span>
                        <span style="font-size:0.65rem;color:#64748b;font-weight:600;">/ 100</span>
                    </div>
                </div>
                
                <!-- Grade Badge -->
                <div style="background:${gradeColor}22;color:${gradeColor};padding:7px 18px;
                    border-radius:50px;font-weight:700;font-size:0.82rem;
                    border:1px solid ${gradeColor}44;margin-bottom:24px;">
                    ${gradeText}
                </div>
                
                <!-- Stats -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;width:100%;
                    background:rgba(255,255,255,0.05);border-radius:18px;overflow:hidden;margin-bottom:24px;">
                    <div style="background:#141927;padding:16px 10px;">
                        <div style="font-size:1.4rem;font-weight:800;color:#10b981;">${kecermatanSeqAccCorrect}</div>
                        <div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Benar</div>
                    </div>
                    <div style="background:#141927;padding:16px 10px;">
                        <div style="font-size:1.4rem;font-weight:800;color:#ef4444;">${totalWrong}</div>
                        <div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Salah</div>
                    </div>
                    <div style="background:#141927;padding:16px 10px;">
                        <div style="font-size:1.4rem;font-weight:800;color:#3b82f6;">${kecermatanSeqAccTotal}</div>
                        <div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Total Soal</div>
                    </div>
                </div>
                
                <!-- Button -->
                <button onclick="closeKecermatanResult()" style="width:100%;padding:14px;border-radius:16px;
                    background:linear-gradient(135deg,#3b82f6,#06b6d4);color:white;font-weight:700;
                    font-size:0.95rem;cursor:pointer;border:none;font-family:inherit;
                    box-shadow:0 8px 25px rgba(59,130,246,0.3);transition:all 0.3s;
                    display:flex;align-items:center;justify-content:center;gap:10px;">
                    <i class="fas fa-check-circle"></i> Kembali ke Menu
                </button>
            </div>
            
            <!-- RIGHT: Chart Panel -->
            <div style="background:linear-gradient(145deg,#141927,#1a2035);
                border:1px solid rgba(255,255,255,0.12); border-radius:32px;
                flex:1.2;min-width:340px;max-width:540px; padding:36px 32px;
                box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 50px rgba(59,130,246,0.1);
                display:flex;flex-direction:column;">
                
                <!-- Chart Title -->
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
                    <i class="fas fa-chart-line" style="color:#8b5cf6;font-size:1.1rem;"></i>
                    <span style="font-size:1rem;font-weight:700;color:#e2e8f0;">Grafik Jawaban Benar per Paket</span>
                </div>
                
                <!-- Chart Container -->
                <div style="flex:1;position:relative;min-height:250px;background:rgba(0,0,0,0.15);
                    border-radius:20px;padding:20px;">
                    <canvas id="kecFinalChart"></canvas>
                </div>
                
                <!-- Per-package summary below chart -->
                <div style="display:flex;gap:6px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
                    ${kecermatanSeqPackageResults.map((p, i) => {
                        const pct = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
                        const dotColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                        return `<div style="text-align:center;padding:6px 8px;background:rgba(255,255,255,0.03);
                            border-radius:10px;border:1px solid rgba(255,255,255,0.06);min-width:50px;">
                            <div style="font-size:0.65rem;color:#64748b;margin-bottom:2px;">P${i+1}</div>
                            <div style="font-size:0.85rem;font-weight:800;color:${dotColor};">${p.correct}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(resultModal);
    
    // Render Chart.js line chart
    const _chartLabels = pkgLabels;
    const _chartData = pkgData;
    const _chartPkgResults = JSON.parse(JSON.stringify(kecermatanSeqPackageResults));
    const _chartMax = kecermatanSeqPackageResults.length > 0 ? Math.max(Math.max(...kecermatanSeqPackageResults.map(p => p.total)), 50) : 50;
    
    setTimeout(() => {
        const canvas = document.getElementById('kecFinalChart');
        if (!canvas || typeof Chart === 'undefined') return;
        
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: _chartLabels,
                datasets: [{
                    label: 'Jawaban Benar',
                    data: _chartData,
                    borderColor: '#8b5cf6',
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx: c, chartArea} = chart;
                        if (!chartArea) return 'rgba(139,92,246,0.1)';
                        const gradient = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(139,92,246,0.02)');
                        gradient.addColorStop(1, 'rgba(139,92,246,0.15)');
                        return gradient;
                    },
                    borderWidth: 3,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#1a2035',
                    pointBorderWidth: 3,
                    pointRadius: 7,
                    pointHoverRadius: 10,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        callbacks: {
                            label: function(ctx) {
                                const idx = ctx.dataIndex;
                                const pkg = _chartPkgResults[idx];
                                return pkg ? 'Benar: ' + pkg.correct + ' / ' + pkg.total : 'Benar: ' + ctx.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: _chartMax,
                        ticks: { 
                            color: '#64748b', 
                            font: { size: 11, family: "'Plus Jakarta Sans'" },
                            stepSize: 10
                        },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { 
                            color: '#94a3b8', 
                            font: { size: 12, weight: 'bold', family: "'Plus Jakarta Sans'" } 
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }, 200);
    
    // Reset sequential state
    isKecermatanTest = false;
    isKecermatanSequentialMode = false;
    autoNextDuration = 0;
    clearTestState(); // Tes selesai normal, hapus state tersimpan
}

function closeKecermatanResult() {
    const modal = document.getElementById('kecermatanFinalResult');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s';
        setTimeout(() => modal.remove(), 300);
    }
    
    // Tampilkan kembali tombol Riwayat Nilai & Logout
    const authBtns = document.querySelectorAll('.btn-history-modern, .btn-logout-modern');
    authBtns.forEach(btn => btn.style.display = '');
    
    // Reset state
    kecermatanSeqCurrentIdx = 0;
    kecermatanSeqAccCorrect = 0;
    kecermatanSeqAccTotal = 0;
    
    // Tampilkan test nav kembali
    const testNav = document.querySelector('.test-nav');
    if (testNav) testNav.style.display = 'flex';
    
    // Kembali ke menu Tes Kecermatan
    hideAllMenus();
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
    showPsikotesSubMenu('kecermatan');
}

// ========== TIMER COUNTDOWN (MODIFIED) ==========
function getTimeLimitSeconds() {
    if (currentPsikotesCategory === 'kecerdasan') return 90 * 60;   // 90 menit
    if (currentPsikotesCategory === 'kepribadian') return 50 * 60;  // 50 menit
    if (currentPsikotesCategory === 'kecermatan') return 0;          // Tidak ada batas global
    if (currentPsikotesCategory === 'tryout') return 90 * 60;       // 90 menit
    if (currentAkademikCategory) return 90 * 60;                     // 90 menit untuk semua akademik
    return 0; // Default tanpa batas
}

function startTimer(totalSeconds, startFromValue) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const timerEl = document.getElementById('timer');
    const timerTag = timerEl.parentElement;
    timerTag.classList.remove('timer-warning');
    _timerIsCountdown = totalSeconds > 0;
    
    if (totalSeconds <= 0) {
        // Mode count-up (tanpa batas waktu)
        let seconds = (startFromValue !== undefined) ? startFromValue : 0;
        _timerCurrentValue = seconds;
        updateTimerDisplay(seconds, timerEl);
        timerInterval = setInterval(() => {
            seconds++;
            _timerCurrentValue = seconds;
            updateTimerDisplay(seconds, timerEl);
        }, 1000);
        return;
    }
    
    // Mode countdown — gunakan startFromValue jika ada (restore dari reload)
    let remaining = (startFromValue !== undefined) ? startFromValue : totalSeconds;
    _timerCurrentValue = remaining;
    updateTimerDisplay(remaining, timerEl);
    
    timerInterval = setInterval(() => {
        remaining--;
        _timerCurrentValue = remaining;
        updateTimerDisplay(remaining, timerEl);
        
        // Warning saat sisa < 5 menit
        if (remaining <= 300 && remaining > 0) {
            timerTag.classList.add('timer-warning');
        }
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay(seconds, el) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    el.textContent = `${mins}:${secs}`;
}

function handleTimeUp() {
    // Coba trigger showResult di iframe
    try {
        const iframe = document.getElementById('testIframe');
        const win = iframe.contentWindow;
        if (win && win.showResult && !win.isReviewMode) {
            win.showResult();
        }
    } catch(e) {}
    
    // Tampilkan notifikasi waktu habis
    showTimeUpNotification();
    
    // Tutup tes setelah delay
    setTimeout(() => {
        closeTest();
    }, 3500);
}

function showTimeUpNotification() {
    const notif = document.createElement('div');
    notif.id = 'timeUpNotification';
    notif.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:linear-gradient(135deg,#ef4444,#dc2626);
        color:white;padding:40px 60px;border-radius:28px;
        font-size:1.5rem;font-weight:800;text-align:center;
        z-index:9999;box-shadow:0 25px 60px rgba(239,68,68,0.5);
        animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);
    `;
    notif.innerHTML = `
        <i class="fas fa-clock" style="font-size:3rem;display:block;margin-bottom:16px;"></i>
        Waktu Habis!
        <p style="font-size:0.9rem;font-weight:400;margin-top:12px;opacity:0.85;">
            Tes akan ditutup dalam beberapa detik...
        </p>
    `;
    document.body.appendChild(notif);
    setTimeout(() => { if (notif.parentNode) notif.remove(); }, 3500);
}

// ========== CLOUD SCORE INTEGRATION ==========
const SCORE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMDqapWZQnBPeqzkZThKcYUeImNNTTc2E1SPgIso1rvroMxcG9F2ugddSEcqNFQJ1G/exec';
let _cloudSyncStatus = 'idle';
let _cloudSyncPromise = null;

// ========== RIWAYAT NILAI (ENHANCED with Chart + Cloud) ==========
function getScoreHistoryKey() {
    const username = localStorage.getItem('userUsername') || 'anonymous';
    return 'scoreHistory_' + username;
}

function _getUserEmail() {
    return localStorage.getItem('userUsername') || '';
}

function saveScore(testName, category, score, correct, total, paketNumber, parentCategory, sessionId, packageResults) {
    const key = getScoreHistoryKey();
    let history = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = {
        testName: testName,
        category: category,
        parentCategory: parentCategory || '',
        score: score,
        correct: correct,
        total: total,
        paketNumber: paketNumber || 0,
        sessionId: sessionId || '',
        date: new Date().toISOString()
    };
    if (packageResults && packageResults.length > 0) {
        entry.packageResults = packageResults;
    }
    history.unshift(entry);
    if (history.length > 200) history = history.slice(0, 200);
    localStorage.setItem(key, JSON.stringify(history));

    // === KIRIM KE GOOGLE SHEETS ===
    _saveScoreToCloud(entry);
}

function _saveScoreToCloud(entry) {
    var email = _getUserEmail();
    if (!email) return;

    // Gunakan FormData — pattern yang sama dengan login.html & register.html
    var formData = new FormData();
    formData.append('action', 'save_score');
    formData.append('email', email);
    formData.append('testName', entry.testName || '');
    formData.append('category', entry.category || '');
    formData.append('parentCategory', entry.parentCategory || '');
    formData.append('score', String(entry.score || 0));
    formData.append('correct', String(entry.correct || 0));
    formData.append('total', String(entry.total || 0));
    formData.append('paketNumber', String(entry.paketNumber || 0));
    formData.append('sessionId', entry.sessionId || '');
    formData.append('date', entry.date || new Date().toISOString());
    if (entry.packageResults && entry.packageResults.length > 0) {
        formData.append('packageResults', JSON.stringify(entry.packageResults));
    }

    // Fetch POST — sama persis dengan pola login.html
    fetch(SCORE_SCRIPT_URL, { method: 'POST', body: formData })
        .then(function(response) { return response.json(); })
        .then(function(result) {
            if (result.status === 'success') {
                console.log('[Cloud] ✅ Skor disimpan ke Google Sheets');
                _showCloudSyncToast('success');
            } else {
                console.warn('[Cloud] ❌ Gagal simpan:', result.message);
                _showCloudSyncToast('error');
            }
        })
        .catch(function(err) {
            console.warn('[Cloud] ⚠️ Error jaringan saat simpan skor:', err);
            _showCloudSyncToast('error');
        });
}

// Ambil semua skor user dari Google Sheets lalu gabungkan dengan data lokal
function syncScoresFromCloud(forceRefresh) {
    var email = _getUserEmail();
    if (!email) return Promise.resolve(getScoreHistory());

    if (_cloudSyncStatus === 'synced' && !forceRefresh) {
        return Promise.resolve(getScoreHistory());
    }
    if (_cloudSyncStatus === 'syncing' && _cloudSyncPromise) {
        return _cloudSyncPromise;
    }

    _cloudSyncStatus = 'syncing';

    // GET request — Apps Script doGet() handle action=get_scores
    var url = SCORE_SCRIPT_URL + '?action=get_scores&email=' + encodeURIComponent(email) + '&t=' + Date.now();

    _cloudSyncPromise = fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(result) {
            if (result.status === 'success' && Array.isArray(result.data)) {
                var cloudData = result.data;
                var key = getScoreHistoryKey();
                var localData = JSON.parse(localStorage.getItem(key) || '[]');

                if (cloudData.length > 0) {
                    // Buat fingerprint dari cloud untuk cegah duplikat
                    var cloudFP = {};
                    cloudData.forEach(function(c) {
                        cloudFP[(c.testName||'') + '|' + (c.date||'') + '|' + c.score] = true;
                    });

                    // Gabung: cloud + data lokal yang belum ter-upload
                    var merged = cloudData.slice();
                    localData.forEach(function(l) {
                        var fp = (l.testName||'') + '|' + (l.date||'') + '|' + l.score;
                        if (!cloudFP[fp]) merged.push(l);
                    });

                    // Urutkan terbaru dulu
                    merged.sort(function(a, b) {
                        return new Date(b.date) - new Date(a.date);
                    });
                    if (merged.length > 200) merged = merged.slice(0, 200);

                    localStorage.setItem(key, JSON.stringify(merged));
                    console.log('[Cloud] ✅ Sync berhasil: ' + cloudData.length + ' dari cloud, total ' + merged.length);
                } else {
                    console.log('[Cloud] ℹ️ Tidak ada data cloud, pakai data lokal');
                }

                _cloudSyncStatus = 'synced';
                return getScoreHistory();
            } else {
                _cloudSyncStatus = 'error';
                return getScoreHistory();
            }
        })
        .catch(function(err) {
            console.warn('[Cloud] ⚠️ Gagal sync:', err);
            _cloudSyncStatus = 'error';
            return getScoreHistory();
        });

    return _cloudSyncPromise;
}

function _showCloudSyncToast(type) {
    var old = document.getElementById('cloudSyncToast');
    if (old) old.remove();

    var toast = document.createElement('div');
    toast.id = 'cloudSyncToast';
    var bg = type === 'success' ? 'linear-gradient(135deg,#10b981,#059669)'
           : type === 'syncing' ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
           : 'linear-gradient(135deg,#f59e0b,#d97706)';
    var ic = type === 'success' ? 'fa-cloud-arrow-up'
           : type === 'syncing' ? 'fa-sync fa-spin'
           : 'fa-exclamation-triangle';
    var tx = type === 'success' ? 'Skor tersimpan ke cloud ☁️'
           : type === 'syncing' ? 'Menyinkronkan...'
           : 'Sinkronisasi gagal';

    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;background:' + bg +
        ';color:white;padding:10px 18px;border-radius:14px;font-size:0.78rem;font-weight:600;' +
        'display:flex;align-items:center;gap:8px;box-shadow:0 8px 25px rgba(0,0,0,0.3);' +
        'animation:slideUp 0.3s ease;font-family:inherit;pointer-events:none;opacity:0.95;';
    toast.innerHTML = '<i class="fas ' + ic + '"></i> ' + tx;
    document.body.appendChild(toast);

    if (type !== 'syncing') {
        setTimeout(function() {
            toast.style.transition = 'opacity 0.5s';
            toast.style.opacity = '0';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 500);
        }, 2500);
    }
}

function getScoreHistory() {
    const key = getScoreHistoryKey();
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function showScoreHistory(activeFilter) {
    activeFilter = activeFilter || 'semua';
    
    const history = getScoreHistory();
    
    // Remove existing modal
    const existing = document.getElementById('scoreHistoryModal');
    if (existing) existing.remove();
    
    // Destroy existing chart
    if (window._kecermatanChartInstance) {
        window._kecermatanChartInstance.destroy();
        window._kecermatanChartInstance = null;
    }

    // Filter data berdasarkan tab aktif
    let filtered = history;
    if (activeFilter === 'psikotes') {
        // Psikotes = kecerdasan + kecermatan + kepribadian + tryout
        const psikotesCats = ['kecerdasan', 'kecermatan', 'kepribadian', 'tryout'];
        filtered = history.filter(h => psikotesCats.includes(h.parentCategory));
    } else if (activeFilter === 'akademik') {
        filtered = history.filter(h => h.parentCategory === 'akademik');
    }
    // 'semua' => no filter, show all

    const modal = document.createElement('div');
    modal.id = 'scoreHistoryModal';
    modal.style.cssText = `
        position:fixed; inset:0; z-index:3000;
        background:rgba(0,0,0,0.7); backdrop-filter:blur(10px);
        display:flex; align-items:center; justify-content:center;
        padding:20px; animation: fadeIn 0.3s ease;
    `;
    modal.onclick = function(e) { if (e.target === modal) closeScoreHistory(); };

    // Build table rows
    let tableRows = '';
    if (filtered.length === 0) {
        tableRows = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">
            <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.5;"></i>
            Belum ada riwayat tes untuk kategori ini.
        </td></tr>`;
    } else {
        filtered.forEach((item, idx) => {
            const date = new Date(item.date);
            const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const scoreColor = item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444';
            const hasDetail = item.packageResults && item.packageResults.length > 0;
            const detailBtn = hasDetail 
                ? `<button onclick="showKecermatanDetailChart(${idx}, '${activeFilter}')" 
                    style="background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:white;border:none;
                    padding:5px 12px;border-radius:50px;font-size:0.72rem;font-weight:600;cursor:pointer;
                    transition:all 0.3s;font-family:inherit;"
                    onmouseenter="this.style.transform='scale(1.05)'"
                    onmouseleave="this.style.transform='scale(1)'">
                    <i class="fas fa-chart-bar"></i> Detail
                </button>`
                : `<span style="color:#475569;font-size:0.72rem;">â€”</span>`;
            tableRows += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s;"
                    onmouseenter="this.style.background='rgba(139,92,246,0.08)'"
                    onmouseleave="this.style.background='transparent'">
                    <td style="padding:14px 16px;font-size:0.85rem;white-space:nowrap;">${dateStr}<br><span style="color:#64748b;font-size:0.75rem;">${timeStr}</span></td>
                    <td style="padding:14px 16px;font-size:0.85rem;font-weight:600;">${item.testName}</td>
                    <td style="padding:14px 16px;"><span style="background:rgba(139,92,246,0.15);color:#c4b5fd;padding:3px 10px;border-radius:50px;font-size:0.72rem;font-weight:600;">${item.category}</span></td>
                    <td style="padding:14px 16px;text-align:center;font-size:0.82rem;color:#94a3b8;">${item.correct}/${item.total}</td>
                    <td style="padding:14px 16px;text-align:center;">
                        <span style="background:${scoreColor};color:white;padding:5px 14px;border-radius:50px;font-weight:800;font-size:0.85rem;display:inline-block;min-width:50px;">${item.score}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">${detailBtn}</td>
                </tr>
            `;
        });
    }

    // Tab definitions - 3 main tabs: Semua, Psikotes, Akademik
    const psikotesParentCategories = ['kecerdasan', 'kecermatan', 'kepribadian', 'tryout'];
    const tabs = [
        { key: 'semua', label: 'Semua', icon: 'fa-list' },
        { key: 'psikotes', label: 'Psikotes', icon: 'fa-puzzle-piece' },
        { key: 'akademik', label: 'Akademik', icon: 'fa-graduation-cap' }
    ];

    // Build chart section (untuk tab psikotes jika ada data kecermatan)
    const hasKecermatanData = activeFilter === 'psikotes' && history.some(h => h.parentCategory === 'kecermatan');
    const chartSection = hasKecermatanData ? `
        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                <i class="fas fa-chart-line" style="color:#8b5cf6;"></i>
                <span style="font-size:0.88rem;font-weight:700;color:#e2e8f0;">Grafik Performa Kecermatan</span>
            </div>
            <div style="position:relative;height:220px;background:rgba(0,0,0,0.2);border-radius:16px;padding:16px;">
                <canvas id="kecermatanChart"></canvas>
            </div>
        </div>
    ` : '';

    // Stats summary - calculate based on filter
    const statsData = filtered.length > 0 ? filtered : [];
    const statsTotal = statsData.length;
    const statsAvg = statsTotal > 0 ? Math.round(statsData.reduce((a,b) => a+b.score, 0) / statsTotal) : 0;
    const statsMax = statsTotal > 0 ? Math.max(...statsData.map(h => h.score)) : 0;

    modal.innerHTML = `
        <div style="background:linear-gradient(145deg,#141927,#1a2035);border:1px solid rgba(255,255,255,0.1);
            border-radius:28px;max-width:800px;width:100%;max-height:88vh;overflow:hidden;
            box-shadow:0 30px 80px rgba(0,0,0,0.5),0 0 40px rgba(139,92,246,0.1);
            animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);display:flex;flex-direction:column;">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2));
                padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:50px;height:50px;border-radius:16px;
                        background:linear-gradient(135deg,#8b5cf6,#3b82f6);
                        display:flex;align-items:center;justify-content:center;font-size:1.3rem;
                        box-shadow:0 8px 20px rgba(139,92,246,0.3);">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h3 style="font-size:1.3rem;font-weight:800;margin:0;">Riwayat Nilai</h3>
                        <p style="color:#94a3b8;font-size:0.82rem;margin:4px 0 0;">${history.length} hasil tes tercatat</p>
                    </div>
                </div>
                <button onclick="closeScoreHistory()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
                    color:white;width:40px;height:40px;border-radius:12px;cursor:pointer;font-size:1rem;
                    display:flex;align-items:center;justify-content:center;transition:all 0.3s;"
                    onmouseenter="this.style.background='#ef4444';this.style.borderColor='#ef4444'"
                    onmouseleave="this.style.background='rgba(255,255,255,0.08)';this.style.borderColor='rgba(255,255,255,0.15)'">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Stats Summary -->
            ${statsTotal > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.05);margin:0;flex-shrink:0;">
                <div style="background:#141927;padding:18px;text-align:center;">
                    <div style="font-size:1.5rem;font-weight:800;color:#10b981;">${statsTotal}</div>
                    <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">Total Tes</div>
                </div>
                <div style="background:#141927;padding:18px;text-align:center;">
                    <div style="font-size:1.5rem;font-weight:800;color:#3b82f6;">${statsAvg}</div>
                    <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">Rata-rata</div>
                </div>
                <div style="background:#141927;padding:18px;text-align:center;">
                    <div style="font-size:1.5rem;font-weight:800;color:#f59e0b;">${statsMax}</div>
                    <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">Skor Tertinggi</div>
                </div>
            </div>` : ''}

            <!-- Category Tabs -->
            <div style="padding:16px 24px 0;flex-shrink:0;">
                <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;">
                    ${tabs.map(t => `
                        <button onclick="showScoreHistory('${t.key}')"
                            style="padding:8px 16px;border-radius:50px;border:1px solid ${t.key === activeFilter ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'};
                            background:${t.key === activeFilter ? 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(59,130,246,0.25))' : 'rgba(255,255,255,0.03)'};
                            color:${t.key === activeFilter ? '#c4b5fd' : '#64748b'};font-size:0.78rem;font-weight:600;
                            cursor:pointer;white-space:nowrap;transition:all 0.3s;display:flex;align-items:center;gap:6px;
                            font-family:inherit;">
                            <i class="fas ${t.icon}" style="font-size:0.7rem;"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            ${chartSection}
            
            <!-- Table -->
            <div style="overflow-y:auto;flex:1;padding:0 4px;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:2px solid rgba(255,255,255,0.08);position:sticky;top:0;background:#141927;z-index:1;">
                            <th style="padding:14px 16px;text-align:left;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Tanggal</th>
                            <th style="padding:14px 16px;text-align:left;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Nama Tes</th>
                            <th style="padding:14px 16px;text-align:left;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Kategori</th>
                            <th style="padding:14px 16px;text-align:center;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">B/S</th>
                            <th style="padding:14px 16px;text-align:center;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Skor</th>
                            <th style="padding:14px 16px;text-align:center;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Detail</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Render chart untuk psikotes tab (jika ada data kecermatan)
    if (hasKecermatanData) {
        renderKecermatanChart();
    }
}

function renderKecermatanChart() {
    const canvas = document.getElementById('kecermatanChart');
    if (!canvas) return;
    
    if (typeof Chart === 'undefined') {
        canvas.parentElement.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;font-size:0.85rem;">Chart.js belum dimuat. Grafik tidak dapat ditampilkan.</p>';
        return;
    }
    
    const history = getScoreHistory();
    const kecermatanScores = history.filter(h => h.parentCategory === 'kecermatan');
    
    if (kecermatanScores.length === 0) {
        canvas.parentElement.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px;font-size:0.85rem;"><i class="fas fa-chart-area" style="display:block;font-size:2rem;margin-bottom:10px;opacity:0.3;"></i>Belum ada data tes kecermatan untuk ditampilkan.</p>';
        return;
    }
    
    // Cari sesi terbaru
    let sessionScores = [];
    const latestWithSession = kecermatanScores.find(s => s.sessionId);
    
    if (latestWithSession) {
        const sessionId = latestWithSession.sessionId;
        sessionScores = kecermatanScores
            .filter(s => s.sessionId === sessionId)
            .sort((a, b) => (a.paketNumber || 0) - (b.paketNumber || 0));
    } else {
        // Fallback: ambil 10 skor kecermatan terakhir
        sessionScores = kecermatanScores.slice(0, 10).reverse();
    }
    
    if (sessionScores.length === 0) return;
    
    const labels = sessionScores.map((s, i) => `Paket ${s.paketNumber || (i + 1)}`);
    const data = sessionScores.map(s => s.score);
    
    try {
        window._kecermatanChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skor',
                    data: data,
                    borderColor: '#8b5cf6',
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return 'rgba(139,92,246,0.1)';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(139,92,246,0.02)');
                        gradient.addColorStop(1, 'rgba(139,92,246,0.25)');
                        return gradient;
                    },
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#1a2035',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `Skor: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            color: '#64748b', 
                            font: { size: 11, family: "'Plus Jakarta Sans'" },
                            stepSize: 20
                        },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    x: {
                        ticks: { 
                            color: '#64748b', 
                            font: { size: 10, family: "'Plus Jakarta Sans'" } 
                        },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    }
                }
            }
        });
    } catch(e) {
        canvas.parentElement.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Gagal memuat grafik.</p>';
    }
}

// ========== DETAIL CHART PER SESI KECERMATAN ==========
function showKecermatanDetailChart(filteredIdx, activeFilter) {
    const history = getScoreHistory();
    let filtered = history;
    const psikotesCats = ['kecerdasan', 'kecermatan', 'kepribadian', 'tryout'];
    if (activeFilter === 'psikotes') {
        filtered = history.filter(h => psikotesCats.includes(h.parentCategory));
    } else if (activeFilter === 'akademik') {
        filtered = history.filter(h => h.parentCategory === 'akademik');
    } else if (psikotesCats.includes(activeFilter)) {
        filtered = history.filter(h => h.parentCategory === activeFilter);
    } else if (activeFilter === 'matematika') {
        filtered = history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('matematika'));
    } else if (activeFilter === 'inggris') {
        filtered = history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('inggris'));
    } else if (activeFilter === 'umum') {
        filtered = history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('umum'));
    } else if (activeFilter === 'wawasan') {
        filtered = history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('wawasan'));
    }

    const item = filtered[filteredIdx];
    if (!item || !item.packageResults || item.packageResults.length === 0) return;

    const pkgResults = item.packageResults;
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const existing = document.getElementById('kecDetailModal');
    if (existing) existing.remove();
    if (window._kecDetailChartInst) { window._kecDetailChartInst.destroy(); window._kecDetailChartInst = null; }

    // Trend
    const firstHalf = pkgResults.slice(0, 5).reduce((a, b) => a + b.correct, 0);
    const secondHalf = pkgResults.slice(5).reduce((a, b) => a + b.correct, 0);
    const trendIcon = secondHalf > firstHalf ? 'fa-arrow-up' : secondHalf < firstHalf ? 'fa-arrow-down' : 'fa-equals';
    const trendColor = secondHalf > firstHalf ? '#10b981' : secondHalf < firstHalf ? '#ef4444' : '#f59e0b';
    const trendColorRgb = secondHalf > firstHalf ? '16,185,129' : secondHalf < firstHalf ? '239,68,68' : '245,158,11';
    const trendText = secondHalf > firstHalf ? 'Meningkat' : secondHalf < firstHalf ? 'Menurun' : 'Stabil';

    // Right-panel rows
    let pkgRows = '';
    pkgResults.forEach((pkg, i) => {
        const pct = pkg.total > 0 ? (pkg.correct / pkg.total) * 100 : 0;
        const badgeColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
        const barWidth = Math.max(pct, 6).toFixed(1);
        pkgRows += '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">'
            + '<div style="width:54px;font-size:0.78rem;font-weight:600;color:#94a3b8;flex-shrink:0;">Paket ' + (i+1) + '</div>'
            + '<div style="flex:1;height:30px;background:rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;position:relative;">'
            +   '<div style="position:absolute;top:4px;bottom:4px;left:4px;width:calc(' + barWidth + '% - 4px);'
            +        'background:' + badgeColor + ';border-radius:5px;display:flex;align-items:center;'
            +        'justify-content:center;min-width:28px;transition:width 0.6s ease;">'
            +     '<span style="font-size:0.75rem;font-weight:800;color:white;">' + pkg.correct + '</span>'
            +   '</div>'
            + '</div>'
            + '<div style="width:40px;text-align:right;font-size:0.74rem;color:#64748b;flex-shrink:0;">' + pkg.correct + '/' + pkg.total + '</div>'
            + '</div>';
    });

    const modal = document.createElement('div');
    modal.id = 'kecDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:3500;background:rgba(0,0,0,0.82);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.3s ease;overflow-y:auto;';
    modal.onclick = function(e) { if (e.target === modal) { modal.remove(); if(window._kecDetailChartInst){window._kecDetailChartInst.destroy();window._kecDetailChartInst=null;} } };

    modal.innerHTML = '<style>'
    + '#kecDetailModal .kd-panel{flex:1;min-width:260px;padding:24px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;}'
    + '#kecDetailModal .kd-stat{border-radius:12px;padding:12px 8px;text-align:center;}'
    + '#kecDetailModal .kd-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:white;width:32px;height:32px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;transition:all 0.2s;}'
    + '#kecDetailModal .kd-close:hover{background:#ef4444;border-color:#ef4444;}'
    + '@media(max-width:600px){#kecDetailModal .kd-wrap{flex-direction:column!important;}#kecDetailModal .kd-divider{display:none!important;}}'
    + '</style>'
    + '<div style="background:linear-gradient(145deg,#0f1624,#141e30);border:1px solid rgba(255,255,255,0.1);border-radius:24px;max-width:860px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.7);animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);overflow:hidden;">'
    +   '<div class="kd-wrap" style="display:flex;max-height:88vh;">'

    // LEFT PANEL
    +     '<div class="kd-panel" style="border-right:1px solid rgba(255,255,255,0.07);">'
    +       '<div style="display:flex;align-items:flex-start;justify-content:space-between;">'
    +         '<div style="display:flex;align-items:center;gap:11px;">'
    +           '<div style="width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:1rem;color:white;flex-shrink:0;box-shadow:0 6px 18px rgba(99,102,241,0.35);">'
    +             '<i class="fas fa-list-alt"></i>'
    +           '</div>'
    +           '<div>'
    +             '<div style="font-size:0.98rem;font-weight:800;color:#f1f5f9;">Detail Nilai</div>'
    +             '<div style="font-size:0.7rem;color:#64748b;margin-top:2px;">' + item.testName + '</div>'
    +           '</div>'
    +         '</div>'
    +         '<button class="kd-close" onclick="document.getElementById(\'kecDetailModal\').remove();if(window._kecDetailChartInst){window._kecDetailChartInst.destroy();window._kecDetailChartInst=null;}">'
    +           '<i class="fas fa-times"></i>'
    +         '</button>'
    +       '</div>'

    // 3 stat cards
    +       '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">'
    +         '<div class="kd-stat" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.22);">'
    +           '<div style="font-size:1.6rem;font-weight:900;color:#10b981;line-height:1;">' + item.score + '</div>'
    +           '<div style="font-size:0.62rem;color:#94a3b8;margin-top:4px;">Skor Akhir</div>'
    +         '</div>'
    +         '<div class="kd-stat" style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.22);">'
    +           '<div style="font-size:1.05rem;font-weight:900;color:#3b82f6;line-height:1;">' + item.correct + '/' + item.total + '</div>'
    +           '<div style="font-size:0.62rem;color:#94a3b8;margin-top:4px;">Benar/Total</div>'
    +         '</div>'
    +         '<div class="kd-stat" style="background:rgba(' + trendColorRgb + ',0.12);border:1px solid rgba(' + trendColorRgb + ',0.22);">'
    +           '<div style="font-size:1.2rem;font-weight:900;color:' + trendColor + ';line-height:1;"><i class="fas ' + trendIcon + '"></i></div>'
    +           '<div style="font-size:0.62rem;color:#94a3b8;margin-top:4px;">' + trendText + '</div>'
    +         '</div>'
    +       '</div>'

    // Date
    +       '<div style="text-align:center;font-size:0.72rem;color:#475569;">'
    +         '<i class="fas fa-calendar-alt" style="color:#6366f1;"></i> ' + dateStr + ' ' + timeStr
    +       '</div>'

    // Chart
    +       '<div style="flex:1;display:flex;flex-direction:column;min-height:170px;">'
    +         '<div style="font-size:0.78rem;font-weight:700;color:#e2e8f0;margin-bottom:8px;display:flex;align-items:center;gap:6px;">'
    +           '<i class="fas fa-chart-line" style="color:#8b5cf6;"></i> Grafik Jawaban Benar per Paket'
    +         '</div>'
    +         '<div style="flex:1;background:rgba(0,0,0,0.18);border-radius:12px;padding:10px;position:relative;min-height:160px;">'
    +           '<canvas id="kecDetailCanvas"></canvas>'
    +         '</div>'
    +       '</div>'
    +     '</div>'

    // RIGHT PANEL
    +     '<div class="kd-panel">'
    +       '<div style="font-size:0.82rem;font-weight:700;color:#e2e8f0;margin-bottom:4px;display:flex;align-items:center;gap:7px;">'
    +         '<i class="fas fa-list-ol" style="color:#f59e0b;"></i> Rincian per Paket'
    +       '</div>'
    +       '<div style="flex:1;">' + pkgRows + '</div>'
    +     '</div>'
    +   '</div>'
    + '</div>';

    document.body.appendChild(modal);

    // Chart
    setTimeout(function() {
        var canvas = document.getElementById('kecDetailCanvas');
        if (!canvas || typeof Chart === 'undefined') return;
        var ctx2 = canvas.getContext('2d');
        var labels = pkgResults.map(function(_, i) { return 'P' + (i + 1); });
        var data = pkgResults.map(function(p) { return p.correct; });
        var maxVal = pkgResults.length > 0 ? Math.max.apply(null, pkgResults.map(function(p){return p.total;})) : 50;
        if (maxVal < 10) maxVal = 10;

        window._kecDetailChartInst = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jawaban Benar',
                    data: data,
                    borderColor: '#8b5cf6',
                    backgroundColor: function(context) {
                        var chart = context.chart;
                        var ca = chart.chartArea;
                        if (!ca) return 'rgba(139,92,246,0.08)';
                        var g = chart.ctx.createLinearGradient(0, ca.bottom, 0, ca.top);
                        g.addColorStop(0, 'rgba(139,92,246,0.01)');
                        g.addColorStop(1, 'rgba(139,92,246,0.22)');
                        return g;
                    },
                    borderWidth: 2.5,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#141e30',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    tension: 0.35,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 10,
                        callbacks: {
                            label: function(c) {
                                var pkg = pkgResults[c.dataIndex];
                                return pkg ? 'Benar: ' + pkg.correct + ' / ' + pkg.total : 'Benar: ' + c.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxVal,
                        ticks: { color: '#64748b', font: { size: 10 }, stepSize: 10 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }, 150);
}

function closeScoreHistory() {
    // Destroy chart instance first
    if (window._kecermatanChartInstance) {
        window._kecermatanChartInstance.destroy();
        window._kecermatanChartInstance = null;
    }
    
    const modal = document.getElementById('scoreHistoryModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 200);
    }
}

// ========== POSTMESSAGE LISTENER ==========
window.addEventListener('message', function(event) {
    // Accept score data from test iframes (legacy support)
    if (event.data && event.data.type === 'testScore') {
        const { testName, category, score, correct, total } = event.data;
        if (testName && typeof score === 'number') {
            saveScore(
                testName || 'Unknown Test',
                category || 'Umum',
                score,
                correct || 0,
                total || 0,
                0,
                currentParentCategory || '',
                ''
            );
        }
    }
});

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: { value: 0.2, random: false },
                size: { value: 3, random: true },
                line_linked: { 
                    enable: true, 
                    distance: 150, 
                    color: "#ffffff", 
                    opacity: 0.1, 
                    width: 1 
                },
                move: { 
                    enable: true, 
                    speed: 1.5, 
                    direction: "none", 
                    random: true, 
                    straight: false, 
                    out_mode: "out", 
                    bounce: false 
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
});

// ========== POSTMESSAGE LISTENER — Tangkap skor dari iframe ==========
window.addEventListener('message', function(event) {
    try {
        var data = event.data;
        if (!data || data.type !== 'quizResult') return;
        
        // Cegah duplikat simpan
        if (_scoreSavedForCurrentTest) return;
        
        var score = data.score || 0;
        var correct = data.correct || 0;
        var total = data.total || 0;
        
        if (total > 0 && currentTestTitle) {
            saveScore(
                currentTestTitle,
                currentTestCategory,
                score,
                correct,
                total,
                currentPaketNumber,
                currentParentCategory,
                currentKecermatanSession
            );
            _scoreSavedForCurrentTest = true;
            console.log('[PostMessage] ✅ Skor ditangkap:', currentTestTitle, score);
        }
    } catch(e) {}
});
