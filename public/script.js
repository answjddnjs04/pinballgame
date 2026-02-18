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
        fetchSubmissions();
    }
}

// Form Submission
async function submitForm() {
    const name = document.getElementById('name-input').value;
    const followers = parseInt(document.getElementById('follower-input').value) || 0;
    const skillDesc = document.getElementById('skill-desc').value;
    
    if (!name || followers < 0) {
        alert("Please enter a name and follower count.");
        return;
    }

    const stats = calculateStats();
    const payload = {
        name,
        followers,
        stats,
        skillDesc
    };

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Character registered successfully!");
            // Reset form
            document.getElementById('name-input').value = '';
            document.getElementById('follower-input').value = '';
            document.getElementById('skill-desc').value = '';
            calculateStats();
        } else {
            alert("Failed to register character.");
        }
    } catch (err) {
        console.error(err);
        alert("Error connecting to server.");
    }
}

// Fetch and Render Submissions
async function fetchSubmissions() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = '<div class="card" style="text-align: center; opacity: 0.5;">Loading submissions...</div>';

    try {
        const response = await fetch('/api/submissions');
        const data = await response.json();

        if (data.length === 0) {
            list.innerHTML = '<div class="card" style="text-align: center; opacity: 0.5;">No submissions found.</div>';
            return;
        }

        list.innerHTML = '';
        data.reverse().forEach(entry => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-name">${entry.name}</span>
                    <span class="card-followers">${entry.followers.toLocaleString()} FOLLOWERS</span>
                </div>
                <div class="stat-grid">
                    <div class="stat-box"><label>HP</label><span class="val">${entry.stats.hp}</span></div>
                    <div class="stat-box"><label>ATK</label><span class="val">${entry.stats.atk}</span></div>
                    <div class="stat-box"><label>SPD</label><span class="val">${entry.stats.spd}</span></div>
                    <div class="stat-box"><label>SIZE</label><span class="val">${entry.stats.size}</span></div>
                </div>
                <div class="card-skill">
                    <span class="skill-label">BATTLE SKILL</span>
                    <p class="skill-text">${entry.skillDesc || 'No skill description provided.'}</p>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = '<div class="card" style="text-align: center; opacity: 0.5; color: red;">Failed to load data.</div>';
    }
}

// Initialize
calculateStats();
