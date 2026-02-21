// Character Stats State (Points invested)
let points = { hp: 0, atk: 0, speed: 0, size: 0, cooldown: 0 };
const BASE_STATS = { hp: 100, atk: 10, speed: 5, size: 30 };
const MIN_STATS = { hp: 100, atk: 10, speed: 0, size: 10 };
const MAX_STATS = { speed: 30, size_larger: 100, size_smaller: 10 };

let followerCount = 0;
let totalBudget = 0;
let remainingPoints = 0;
let currentSort = 'latest';

// [기본 캐릭터 데이터 - 6인의 투사 + No. 7]
const INITIAL_GLADIATORS = [
    { id: 1, 활동명: "No. 1 우직한 철퇴", 인스타그램ID: "@gladiator_01", 최종_HP: 150, 최종_ATK: "12.0", 최종_SPEED: "15.0", 최종_SIZE: 50, 스킬설명: "정직하고 강력한 몸체 충돌 데미지. 물리적인 압박으로 승부합니다.", likes: 42, comments: ["정말 묵직하네요!", "근본 캐릭터"], timestamp: "2026-02-15T10:00:00Z" },
    { id: 2, 활동명: "No. 2 황금의 폭풍", 인스타그램ID: "@gladiator_02", 최종_HP: 100, 최종_ATK: "8.5", 최종_SPEED: "25.0", 최종_SIZE: 30, 스킬설명: "3개의 회전하는 검이 주변을 초토화합니다. 빠른 속도로 적을 유린합니다.", likes: 88, comments: ["칼 돌리는 거 간지나요", "속도감이 미쳤음"], timestamp: "2026-02-16T12:00:00Z" },
    { id: 3, 활동명: "No. 3 마른하늘의 날벼락", 인스타그램ID: "@gladiator_03", 최종_HP: 90, 최종_ATK: "25.0", 최종_SPEED: "20.0", 최종_SIZE: 25, 스킬설명: "텔레포트 후 적에게 강력한 번개 타격을 가합니다. 순간 화력이 압도적입니다.", likes: 124, comments: ["번개 뎀지 실화?", "갑자기 나타나서 무서워요"], timestamp: "2026-02-17T14:00:00Z" },
    { id: 4, 활동명: "No. 4 납탄의 빗자루", 인스타그램ID: "@gladiator_04", 최종_HP: 110, 최종_ATK: "5.0", 최종_SPEED: "18.0", 최종_SIZE: 35, 스킬설명: "AK-47로 120도 범위를 휩쓸며 사격합니다. 원거리 견제에 특화되어 있습니다.", likes: 75, comments: ["총이 최고지", "와이퍼 사격 신기함"], timestamp: "2026-02-18T09:00:00Z" },
    { id: 5, 활동명: "No. 5 낡은 도살자", 인스타그램ID: "@gladiator_05", 최종_HP: 130, 최종_ATK: "10.0", 최종_SPEED: "12.0", 최종_SIZE: 45, 스킬설명: "피 묻은 소방 도끼를 투척합니다. 5초간 치명적인 출혈 데미지를 부여합니다.", likes: 93, comments: ["출혈 무시 못함", "도끼 디자인 무서워요"], timestamp: "2026-02-19T11:00:00Z" },
    { id: 6, 활동명: "No. 6 공허의 불꽃", 인스타그램ID: "@gladiator_06", 최종_HP: 100, 최종_ATK: "7.0", 최종_SPEED: "16.0", 최종_SIZE: 30, 스킬설명: "보라색 필드를 생성하여 적을 1.5초간 속박하고 쿨타임을 정지시킵니다.", likes: 156, comments: ["필드 사기캐", "보라색 이펙트 너무 예뻐요"], timestamp: "2026-02-20T16:00:00Z" },
    { id: 7, 활동명: "No. 7 맹독 버섯", 인스타그램ID: "@gladiator_07", 최종_HP: 120, 최종_ATK: "11.0", 최종_SPEED: "14.0", 최종_SIZE: 40, 스킬설명: "독버섯 지뢰를 매설합니다. 밟으면 10초간 중독 데미지와 3초간 둔화를 입힙니다.", likes: 210, comments: ["버섯 밟으면 골로 감", "중독 데미지 ㄷㄷ"], timestamp: "2026-02-21T08:00:00Z" }
];

// [DB 시뮬레이션] 데이터 관리
function getSubmissions() {
    const saved = localStorage.getItem('bt_submissions');
    if (!saved) {
        // 데이터가 없으면 기본 캐릭터들로 채워줌
        localStorage.setItem('bt_submissions', JSON.stringify(INITIAL_GLADIATORS));
        return INITIAL_GLADIATORS;
    }
    return JSON.parse(saved);
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

// 1. Sync Follower Data (기존 유지)
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

function renderGallery() {
    const list = document.getElementById('gallery-list');
    let subs = getSubmissions();
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
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
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
    if (document.querySelector('input[name="size-dir"]:checked').value === 'smaller') sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
    else sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));

    const data = { 활동명: name, 인스타그램ID: instaId, 최종_HP: BASE_STATS.hp + points.hp, 최종_ATK: (BASE_STATS.atk + (points.atk * 0.1)).toFixed(1), 최종_SPEED: speedVal, 최종_SIZE: Math.round(sizeVal), 스킬설명: skillDesc };
    saveSubmission(data);
    alert("캐릭터 등록 및 갤러리 게시 완료!");
    setView('gallery');
}

function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `<div class="card" style="text-align:center;"><p>관리 데이터는 로컬 저장소에서 관리됩니다.</p></div>`;
}

syncFollowerData();
updateUI();
