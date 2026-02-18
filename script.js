// Stat Calculation Logic
function calculateStats() {
    const followers = parseInt(document.getElementById('follower-input').value) || 0;
    
    // HP: 100 base + 1 per 10 followers
    const hp = Math.max(100, Math.floor(100 + (followers / 10)));
    // ATK: Log base + 5
    const atk = Math.max(5, Math.floor(Math.log10(followers + 1) * 10) + 5);
    // SPD: Max 15
    const spd = Math.min(15, Math.floor(followers / 5000) + 5);
    // SIZE: Log base + 20
    const size = Math.max(20, Math.floor(Math.log10(followers + 1) * 5) + 20);

    document.getElementById('hp-val').innerText = hp;
    document.getElementById('atk-val').innerText = atk;
    document.getElementById('spd-val').innerText = spd;
    document.getElementById('size-val').innerText = size;

    return { hp, atk, spd, size };
}

// View Management
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

// Form Submission to Formspree
async function submitForm() {
    const name = document.getElementById('name-input').value;
    const followers = parseInt(document.getElementById('follower-input').value) || 0;
    const skillDesc = document.getElementById('skill-desc').value;
    
    if (!name || followers < 0) {
        alert("이름과 팔로워 수를 정확히 입력해 주세요.");
        return;
    }

    const stats = calculateStats();
    
    // Formspree is a form processing service. It requires name-value pairs.
    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Followers", followers);
    formData.append("HP", stats.hp);
    formData.append("ATK", stats.atk);
    formData.append("SPD", stats.spd);
    formData.append("SIZE", stats.size);
    formData.append("SkillDescription", skillDesc);

    try {
        const response = await fetch('https://formspree.io/f/mwvnqprn', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            alert("캐릭터 등록이 성공적으로 완료되었습니다! Formspree 대시보드에서 확인하세요.");
            // Reset form
            document.getElementById('name-input').value = '';
            document.getElementById('follower-input').value = '';
            document.getElementById('skill-desc').value = '';
            calculateStats();
        } else {
            alert("등록에 실패했습니다. Formspree 설정을 확인해 주세요.");
        }
    } catch (err) {
        console.error(err);
        alert("서버 연결에 실패했습니다.");
    }
}

// Render Admin View Message
function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `
        <div class="card" style="text-align: center; border-left-color: var(--gold);">
            <div class="panel-label">ADMIN DASHBOARD</div>
            <p class="skill-text">이 사이트는 Cloudflare Pages로 배포된 정적 사이트이므로, 실시간 데이터 조회가 브라우저에서 직접 불가능합니다.</p>
            <p class="skill-text" style="color: var(--gold); font-weight: 700;">제출된 모든 데이터는 아래 링크(Formspree 대시보드)에서 로그인 후 확인하실 수 있습니다.</p>
            <br>
            <button onclick="window.open('https://formspree.io/forms/mwvnqprn/submissions', '_blank')">FORMSPREE 데이터 확인하기</button>
        </div>
    `;
}

// Initialize
calculateStats();
