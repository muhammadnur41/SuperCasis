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
            { name: "Tes Koran Pauli dan Kreapelin", icon: "fa-newspaper", total: 20 }
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

// State management
let currentPsikotesCategory = null;
let currentSubCategory = null;
let currentAkademikCategory = null;
let currentFilter = 'semua';
let timerInterval = null;

// ========== FUNGSI NAVIGASI UTAMA ==========
function showPsikotesMainMenu() {
    hideAllMenus();
    document.getElementById('psikotesMainMenu').style.display = 'block';
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
}

function showAkademikMenu() {
    hideAllMenus();
    document.getElementById('akademikMenu').style.display = 'block';
    document.querySelector('.main-menu-grid').style.display = 'none';
    document.querySelector('.modern-header').style.display = 'none';
}

function backToMain() {
    hideAllMenus();
    document.querySelector('.main-menu-grid').style.display = 'grid';
    document.querySelector('.modern-header').style.display = 'block';
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
        
        card.innerHTML = `
            <div class="subcategory-icon ${gradientClass}">
                <i class="fas ${item.icon}"></i>
            </div>
            <h4>${item.name}</h4>
            <div class="subcategory-stats">
                <span><i class="fas fa-file"></i> ${item.total} Soal</span>
            </div>
            <span class="subcategory-badge">20 Paket</span>
        `;
        
        grid.appendChild(card);
    });
}

function getGradientByIndex(index) {
    const gradients = ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient'];
    return gradients[index % gradients.length];
}

function showPsikotesDetail(category, subCategory) {
    currentSubCategory = subCategory;
    document.getElementById('psikotesSubMenu').style.display = 'none';
    document.getElementById('psikotesDetailTitle').textContent = subCategory;
    
    // Generate items for this sub category dengan struktur folder per soal
    const items = [];
    for (let i = 1; i <= 20; i++) {
        // Format nama folder: lower case, tanpa spasi, dengan nomor
        const subCategorySlug = subCategory.toLowerCase().replace(/\s+/g, '-');
        const folderName = `${subCategorySlug}${i}`;
        const fileName = `${subCategorySlug}${i}.html`;
        
        items.push({
            name: `${subCategory} ${i}`,
            number: i,
            file: `psikotes/${category}/${folderName}/${fileName}`
        });
    }
    
    // Store items in dataset
    const detailMenu = document.getElementById('psikotesDetailMenu');
    detailMenu.dataset.items = JSON.stringify(items);
    
    renderPsikotesDetailGrid(items);
    document.getElementById('psikotesDetailMenu').style.display = 'block';
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
        
        div.onclick = () => openTest(item.name, item.file, currentSubCategory);
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
}

function backToPsikotesSub() {
    document.getElementById('psikotesDetailMenu').style.display = 'none';
    document.getElementById('psikotesSubMenu').style.display = 'block';
    document.getElementById('psikotesDetailSearch').value = '';
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
        
        div.onclick = () => openTest(soalName, filePath, cat.title);
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
}

// ========== FUNGSI TEST OVERLAY ==========
function openTest(title, path, category = 'Umum') {
    document.getElementById('testTitle').textContent = title;
    document.getElementById('testCategory').textContent = category;
    document.getElementById('testIframe').src = path;
    document.getElementById('testFrame').style.display = 'flex';
    startTimer();
}

function closeTest() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('testFrame').style.display = 'none';
    document.getElementById('testIframe').src = 'about:blank';
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    let seconds = 0;
    const timerEl = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
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