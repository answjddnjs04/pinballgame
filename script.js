// Character Stats State
let stats = {
    hp: 100,
    atk: 5,
    spd: 5,
    size: 25
};

const MIN_STATS = { hp: 100, atk: 5, spd: 5, size: 20 };
const MAX_SPD = 15;

const STAT_COSTS = {
    hp: 1,
    atk: 20,
    spd: 50,
    size: 10
};

let baseBudget = 1000;
let followerBonus = 0;
let totalBudget = 1000;
let remainingPoints = 1000;

// 1. ball_tournament 팔로워 정보를 가져오는 실시간 API 연동 (Mock API for Demo)
// 실제 인스타그램은 브라우저에서 직접 스크래핑이 불가능하므로, 
// 공용 API 또는 프록시 서버를 통해 정보를 가져오는 형태를 시뮬레이션합니다.
async function syncFollowerData() {
    const coreStatus = document.getElementById('core-status');
    const TARGET_ID = 'ball_tournament';
    
    try {
        // 인스타그램은 CORS 이슈로 직접 Fetch가 어렵습니다.
        // 여기서는 실시간 정보를 제공하는 가상의 API 또는 공개 통계 서비스를 호출하는 로직을 작성합니다.
        // 현재는 실제 수치가 있다고 가정하거나, 데이터가 없을 경우 기본값을 사용하는 로직입니다.
        
        // 시나리오: API 호출 시뮬레이션 (실제 구현 시 본인의 백엔드 또는 API 키가 있는 프록시 사용 권장)
        // const response = await fetch(`https://social-api-proxy.com/instagram/${TARGET_ID}`);
        // const data = await response.json();
        // followerBonus = data.followers_count;

        // 데모용: 실제 작동 시뮬레이션 (API가 없으면 기본 보너스를 500으로 설정)
        // 실제 운영 시에는 이 부분을 본인의 서버 API 주소로 바꾸시면 됩니다.
        followerBonus = 2300; // 예시: 현재 ball_tournament 계정의 팔로워 보너스 수치
        
        coreStatus.innerText = `● SYNCED: ${followerBonus.toLocaleString()} 에너지 충전됨`;
        coreStatus.style.color = "var(--neon-blue)";
        
        totalBudget = baseBudget + followerBonus;
        initBudget();
    } catch (err) {
        console.error("동기화 실패:", err);
        coreStatus.innerText = "● OFFLINE: 데이터 동기화 실패";
        coreStatus.style.color = "#ff4757";
        
        // 실패 시 기본값이라도 사용
        totalBudget = baseBudget;
        initBudget();
    }
}

// 2. Budget 관리 및 UI 업데이트
function initBudget() {
    // 사용한 포인트 계산
    const spent = 
        (stats.hp - MIN_STATS.hp) * STAT_COSTS.hp +
        (stats.atk - MIN_STATS.atk) * STAT_COSTS.atk +
        (stats.spd - MIN_STATS.spd) * STAT_COSTS.spd +
        (stats.size - MIN_STATS.size) * STAT_COSTS.size;
        
    remainingPoints = totalBudget - spent;
    updateUI();
}

function changeStat(statName, delta) {
    const costPerUnit = STAT_COSTS[statName];
    const totalCost = delta * costPerUnit;

    if (delta > 0 && remainingPoints < totalCost) {
        alert("에너지가 부족합니다! ball_tournament 계정이 더 커져야 합니다.");
        return;
    }

    if (delta < 0 && stats[statName] + delta < MIN_STATS[statName]) {
        return;
    }

    if (statName === 'spd' && delta > 0 && stats.spd + delta > MAX_SPD) {
        alert("속도는 최대 15까지만 가능합니다!");
        return;
    }

    stats[statName] += delta;
    remainingPoints -= totalCost;
    updateUI();
}

function updateUI() {
    document.getElementById('hp-val').innerText = stats.hp;
    document.getElementById('atk-val').innerText = stats.atk;
    document.getElementById('spd-val').innerText = stats.spd;
    document.getElementById('size-val').innerText = stats.size;
    
    const budgetEl = document.getElementById('budget-val');
    budgetEl.innerText = remainingPoints.toLocaleString();
    
    if (remainingPoints < 0) {
        budgetEl.style.color = "#ff4757";
    } else {
        budgetEl.style.color = "#fff";
    }
}

// 3. View Management
function setView(mode) {
    const submitView = document.getElementById('submit-view');
    const adminView = document.getElementById('admin-view');
    const submitBtn = document.getElementById('submit-mode-btn');
    const adminBtn = document.getElementById('admin-mode-btn');

    if (mode === 'submit') {
        submitView.style.display = 'block';
        adminView.style.display = 'none';
        submitBtn.classList.add('active');
        adminBtn.classList.remove('active');
    } else {
        submitView.style.display = 'none';
        adminView.style.display = 'block';
        submitBtn.classList.remove('active');
        adminBtn.classList.add('active');
        renderAdminMessage();
    }
}

// 4. Form Submission
async function submitForm() {
    const name = document.getElementById('name-input').value;
    const instaId = document.getElementById('insta-input').value;
    const skillDesc = document.getElementById('skill-desc').value;
    
    if (!name || !instaId) {
        alert("활동명과 본인의 인스타 계정을 입력해 주세요.");
        return;
    }

    if (remainingPoints < 0) {
        alert("포인트를 초과 사용했습니다.");
        return;
    }

    const formData = new FormData();
    formData.append("활동명", name);
    formData.append("인스타그램ID", instaId);
    formData.append("대회계정_팔로워수", followerBonus);
    formData.append("HP", stats.hp);
    formData.append("ATK", stats.atk);
    formData.append("SPD", stats.spd);
    formData.append("SIZE", stats.size);
    formData.append("스킬설명", skillDesc);

    try {
        const response = await fetch('https://formspree.io/f/mwvnqprn', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            alert("감사합니다. 캐릭터 심사 후 제작이 완료되어 출전이 확정되면 DM으로 연락드리겠습니다!");
            location.reload();
        } else {
            alert("등록 실패.");
        }
    } catch (err) {
        alert("서버 오류.");
    }
}

function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `
        <div class="card" style="text-align: center; border-left-color: var(--gold);">
            <div class="panel-label">관리자 대시보드</div>
            <p class="skill-text">제출된 캐릭터 정보는 Formspree에서 확인하세요.</p>
            <br>
            <button onclick="window.open('https://formspree.io/forms/mwvnqprn/submissions', '_blank')">데이터 확인하기</button>
        </div>
    `;
}

// 5. Initialize
syncFollowerData();
updateUI();
