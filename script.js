// Character Stats State (Points invested)
let points = { hp: 0, atk: 0, speed: 0, size: 0, cooldown: 0 };
const BASE_STATS = { hp: 100, atk: 10, speed: 5, size: 30 };
const MIN_STATS = { hp: 100, atk: 10, speed: 0, size: 10 };
const MAX_STATS = { speed: 30, size_larger: 100, size_smaller: 10 };

let followerCount = 0;
let totalBudget = 0;
let remainingPoints = 0;
let currentSort = 'latest';

// [DB 시뮬레이션] 데이터 저장 및 불러오기 (Local Storage)
function getSubmissions() {
    const saved = localStorage.getItem('bt_submissions');
    return saved ? JSON.parse(saved) : [];
}

function saveSubmission(data) {
    const subs = getSubmissions();
    subs.push({
        ...data,
        id: Date.now(),
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('bt_submissions', JSON.stringify(subs));
}

// 1. Sync Follower Data
async function syncFollowerData() {
    const coreStatus = document.getElementById('core-status');
    try {
        const response = await fetch('/api/followers');
        const data = await response.json();
        followerCount = data.followers || 0;
        totalBudget = followerCount * 10; 
        coreStatus.innerText = `● SYNCED: ${followerCount.toLocaleString()} 에너지 충전됨 (@ball_tournament)`;
        coreStatus.style.color = "var(--neon-blue)";
        initBudget();
    } catch (err) {
        coreStatus.innerText = "● OFFLINE: 데이터 동기화 실패";
        coreStatus.style.color = "#ff4757";
        totalBudget = 0; initBudget();
    }
}

function initBudget() {
    const spent = Object.values(points).reduce((a, b) => a + b, 0);
    remainingPoints = totalBudget - spent;
    updateUI();
}

function changeStat(statName, delta) {
    if (totalBudget > 0 && (statName === 'speed' || statName === 'size')) {
        const limit = totalBudget * 0.3;
        if (delta > 0 && (points[statName] + delta) > limit) {
            alert(`해당 능력치는 전체 에너지의 30% (${limit.toFixed(1)}P)까지만 투자할 수 있습니다!`);
            return;
        }
    }
    if (delta > 0 && remainingPoints < delta) { alert("에너지가 부족합니다!"); return; }
    if (delta < 0 && points[statName] + delta < 0) return;
    points[statName] += delta;
    initBudget();
}

function updateUI() {
    let speedVal = BASE_STATS.speed;
    const speedLimit = totalBudget * 0.3;
    if (totalBudget > 0) speedVal = BASE_STATS.speed + ((points.speed / (speedLimit || 1)) * (MAX_STATS.speed - BASE_STATS.speed));
    document.getElementById('speed-display').innerText = Math.min(30, speedVal.toFixed(1));

    let sizeVal = BASE_STATS.size;
    const sizeDir = document.querySelector('input[name="size-dir"]:checked').value;
    const sizeLimit = totalBudget * 0.3;
    if (totalBudget > 0) {
        const sizeRatio = points.size / (sizeLimit || 1);
        if (sizeDir === 'smaller') sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
        else sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));
    }
    document.getElementById('size-display').innerText = Math.round(sizeVal);
    document.getElementById('hp-val').innerText = BASE_STATS.hp + points.hp;
    document.getElementById('atk-val').innerText = (BASE_STATS.atk + (points.atk * 0.1)).toFixed(1);
    document.getElementById('cooldown-points').innerText = points.cooldown + "P";
    const budgetEl = document.getElementById('budget-val');
    budgetEl.innerText = remainingPoints.toLocaleString();
}

function setView(mode) {
    const views = ['submit-view', 'gallery-view', 'admin-view'];
    views.forEach(v => document.getElementById(v).style.display = v.startsWith(mode) ? 'block' : 'none');
    
    document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-mode-btn`).classList.add('active');
    
    if (mode === 'gallery') renderGallery();
    if (mode === 'admin') renderAdminMessage();
}

// [갤러리 렌더링]
function renderGallery() {
    const list = document.getElementById('gallery-list');
    let subs = getSubmissions();
    
    // 정렬
    if (currentSort === 'latest') subs.sort((a, b) => b.id - a.id);
    else subs.sort((a, b) => b.likes - a.likes);

    list.innerHTML = subs.map(sub => `
        <div class="card" style="border-left-color: ${sub.id % 2 ? 'var(--neon-blue)' : 'var(--gold)'}">
            <div class="card-header">
                <div>
                    <div class="char-name">${sub.활동명}</div>
                    <div class="char-insta">${sub.인스타그램ID}</div>
                </div>
                <div class="char-insta" style="text-align: right;">${new Date(sub.timestamp).toLocaleDateString()}</div>
            </div>
            
            <div class="stat-row-display">
                <span class="stat-tag">❤️ HP ${sub.최종_HP}</span>
                <span class="stat-tag">⚔️ ATK ${sub.최종_ATK}</span>
                <span class="stat-tag">⚡ SPD ${sub.최종_SPEED}</span>
                <span class="stat-tag">📏 SIZE ${sub.최종_SIZE}</span>
            </div>

            <div class="skill-desc-box">${sub.스킬설명 || "설명이 없습니다."}</div>

            <div class="interaction-bar">
                <button class="like-btn" onclick="addLike(${sub.id})">🔥 LIKE ${sub.likes}</button>
                <div class="comment-count">💬 댓글 ${sub.comments.length}개</div>
            </div>

            <div class="comment-section">
                <div class="comment-list">
                    ${sub.comments.map(c => `<div class="comment-item">● ${c}</div>`).join('')}
                </div>
                <div class="comment-input-row">
                    <input type="text" id="cmt-${sub.id}" class="comment-input" placeholder="댓글을 입력하세요...">
                    <button class="sort-btn" onclick="addComment(${sub.id})">등록</button>
                </div>
            </div>
        </div>
    `).join('');
}

function sortGallery(type) {
    currentSort = type;
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.toggle('active', btn.innerText.includes(type === 'latest' ? '최신' : '좋아요')));
    renderGallery();
}

function addLike(id) {
    let subs = getSubmissions();
    const target = subs.find(s => s.id === id);
    if (target) {
        target.likes++;
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderGallery();
    }
}

function addComment(id) {
    const input = document.getElementById(`cmt-${id}`);
    if (!input.value.trim()) return;
    
    let subs = getSubmissions();
    const target = subs.find(s => s.id === id);
    if (target) {
        target.comments.push(input.value.trim());
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderGallery();
    }
}

async function submitForm() {
    const name = document.getElementById('name-input').value;
    const instaId = document.getElementById('insta-input').value;
    const skillDesc = document.getElementById('skill-desc').value;
    if (!name || !instaId) { alert("이름과 인스타 계정을 입력해 주세요."); return; }

    const speedLimit = totalBudget * 0.3;
    const speedVal = (BASE_STATS.speed + ((points.speed / (speedLimit || 1)) * (MAX_STATS.speed - BASE_STATS.speed))).toFixed(1);
    
    const sizeLimit = totalBudget * 0.3;
    let sizeVal = BASE_STATS.size;
    const sizeRatio = points.size / (sizeLimit || 1);
    if (document.querySelector('input[name="size-dir"]:checked').value === 'smaller') {
        sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
    } else {
        sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));
    }

    const data = {
        활동명: name, 인스타그램ID: instaId,
        최종_HP: BASE_STATS.hp + points.hp,
        최종_ATK: (BASE_STATS.atk + (points.atk * 0.1)).toFixed(1),
        최종_SPEED: speedVal, 최종_SIZE: Math.round(sizeVal),
        스킬설명: skillDesc
    };

    saveSubmission(data);
    alert("캐릭터 등록 및 갤러리 게시 완료!");
    setView('gallery');
}

function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `<div class="card" style="text-align:center;"><p>관리 데이터는 Formspree 및 로컬 저장소에서 관리됩니다.</p></div>`;
}

syncFollowerData();
updateUI();
