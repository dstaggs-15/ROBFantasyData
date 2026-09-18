(() => {
  'use strict';

  const app = document.querySelector('#app');
  const navButtons = [...document.querySelectorAll('[data-route]')];
  const validRoutes = new Set(['home', 'history', 'managers', 'rivalries', 'trophies', 'drafts', 'records']);
  let league;
  let schedule;
  let standings;

  const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function manager(id) {
    return league.managers.find(item => item.id === id);
  }

  function managerByScheduleTeam(team) {
    return league.managers.find(item => item.scheduleTeam === team);
  }

  function initials(name) {
    const words = String(name).replace(/\/.*$/, '').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  }

  function avatar(person, large = false) {
    return `<span class="avatar${large ? ' large' : ''}" aria-hidden="true">${escapeHtml(initials(person.name))}</span>`;
  }

  function division(value) {
    return `<span class="division ${value.toLowerCase()}">${escapeHtml(value)}</span>`;
  }

  function statusTag(status) {
    return `<span class="tag ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
  }

  function computeStandings() {
    const rows = new Map();
    league.managers.forEach(person => rows.set(person.scheduleTeam, {
      manager: person, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, games: 0
    }));

    schedule.filter(game => Number.isFinite(game.homeScore) && Number.isFinite(game.awayScore)).forEach(game => {
      const home = rows.get(game.home);
      const away = rows.get(game.away);
      if (!home || !away) return;
      home.games += 1; away.games += 1;
      home.pf += game.homeScore; home.pa += game.awayScore;
      away.pf += game.awayScore; away.pa += game.homeScore;
      if (game.homeScore > game.awayScore) { home.wins += 1; away.losses += 1; }
      else if (game.homeScore < game.awayScore) { away.wins += 1; home.losses += 1; }
      else { home.ties += 1; away.ties += 1; }
    });

    return [...rows.values()].filter(row => row.games).sort((a, b) => {
      const aPct = (a.wins + a.ties * .5) / a.games;
      const bPct = (b.wins + b.ties * .5) / b.games;
      return bPct - aPct || b.pf - a.pf;
    });
  }

  function route() {
    const requested = location.hash.replace('#', '') || 'home';
    return validRoutes.has(requested) ? requested : 'home';
  }

  function setNavigation(active) {
    navButtons.forEach(button => {
      if (button.dataset.route === active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function viewHeader(eyebrow, title, dek, chip = 'Verified + partial records') {
    return `<header class="view-head">
      <div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${title}</h1><p class="dek">${escapeHtml(dek)}</p></div>
      <span class="coverage-chip">${escapeHtml(chip)}</span>
    </header>`;
  }

  function standingsTable(limit = standings.length) {
    return `<div class="card table-wrap">
      <table>
        <thead><tr><th>#</th><th>Manager</th><th>Division</th><th>Record</th><th>PF</th><th>PA</th></tr></thead>
        <tbody>${standings.slice(0, limit).map((row, index) => `<tr>
          <td class="rank">${index + 1}</td>
          <td><div class="name-cell">${avatar(row.manager)}<strong>${escapeHtml(row.manager.shortName)}</strong></div></td>
          <td>${division(row.manager.division)}</td>
          <td class="record">${row.wins}-${row.losses}${row.ties ? `-${row.ties}` : ''}</td>
          <td>${fmt.format(row.pf)}</td><td>${fmt.format(row.pa)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  function homeView() {
    const leader = standings[0];
    const pointsLeader = [...standings].sort((a, b) => b.pf - a.pf)[0];
    return `<section class="view">
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">The official ROB archive</span>
          <h1>Six years of <span>history.</span><br>One place to settle it.</h1>
          <p class="dek">Championships, rivalries, manager profiles, draft tendencies, and the stories behind the standings. Every number says exactly how far the available records go.</p>
        </div>
        <div class="hero-side">
          <article class="stat-feature"><span class="metric-label">Recorded champions</span><div><strong>3</strong><p>Eli · James · Tucker</p></div></article>
          <article class="stat-feature"><span class="metric-label">Fish title streak</span><div><strong>3–0</strong><p>Every tracked championship, 2022–24</p></div></article>
        </div>
      </div>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">2025 snapshot</span><h2>Where the archive left off</h2></div><p>Calculated from ${escapeHtml(league.league.snapshot)}. These are not final 2025 standings.</p></div>
        <div class="snapshot">
          ${standingsTable()}
          <aside class="card card-pad">
            <h3>Snapshot leaders</h3>
            <ul class="story-list">
              <li><strong>${escapeHtml(leader.manager.shortName)} leads the table</strong><span>${leader.wins}-${leader.losses} through ${leader.games} recorded games.</span></li>
              <li><strong>${escapeHtml(pointsLeader.manager.shortName)} leads scoring</strong><span>${fmt.format(pointsLeader.pf)} points in the available snapshot.</span></li>
              <li><strong>Manager-first records</strong><span>Team-name changes never split a person's history.</span></li>
            </ul>
          </aside>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Record watch</span><h2>The marks that matter</h2></div><button class="nav-link" data-go="records">Open the record book →</button></div>
        <div class="grid grid-4">${league.recordBook.map(item => `<article class="card metric"><span class="metric-label">${escapeHtml(item.label)}</span><strong class="metric-value">${escapeHtml(item.value)}</strong><span class="metric-note">${escapeHtml(item.holder)} · ${escapeHtml(item.season)}</span></article>`).join('')}</div>
      </section>
    </section>`;
  }

  function historyView() {
    return `<section class="view">
      ${viewHeader('League history', 'Every season.<br>No fake certainty.', 'Known achievements are honored even when weekly data is missing. The early ROB era stays visible without inventing records.')}
      <div class="timeline">${league.seasons.slice().reverse().map(season => {
        const champ = season.champion ? manager(season.champion) : null;
        const runner = season.runnerUp ? manager(season.runnerUp) : null;
        return `<article class="card season-card">
          <div class="season-year">${season.year}</div>
          <div><h3>${escapeHtml(season.label)}</h3><p>${escapeHtml(season.story)}</p></div>
          <div class="season-result">${champ ? `<strong>${escapeHtml(champ.shortName)}</strong><span>Champion${runner ? ` · over ${escapeHtml(runner.shortName)}` : ''}</span>` : '<strong>Record pending</strong><span>Commissioner evidence needed</span>'}<br>${statusTag(season.status)}</div>
        </article>`;
      }).join('')}</div>
    </section>`;
  }

  function managersView() {
    return `<section class="view">
      ${viewHeader('The league', 'People over<br>team names.', 'A manager keeps one permanent record across every rename, rebrand, and season. Initials are used throughout the archive so the people remain the identity.')}
      <div class="grid grid-3">${league.managers.map(person => {
        const titles = league.champions.filter(champ => champ.managerId === person.id).length;
        const drafts = league.drafts.filter(draft => draft.managerId === person.id);
        const avgValue = drafts.length ? drafts.reduce((sum, draft) => sum + draft.value, 0) / drafts.length : null;
        return `<article class="card manager-card">
          <div class="manager-top">${avatar(person, true)}<div><h3>${escapeHtml(person.name)}</h3><div class="manager-meta">Active ${escapeHtml(person.active)}</div></div></div>
          <p>${escapeHtml(person.note)}</p>
          <div class="manager-footer">${division(person.division)}<span>${titles} title${titles === 1 ? '' : 's'}${avgValue === null ? '' : ` · ${avgValue >= 0 ? '+' : ''}${avgValue.toFixed(1)} draft value`}</span></div>
        </article>`;
      }).join('')}</div>
    </section>`;
  }

  function rivalryView() {
    const options = league.managers.filter(person => schedule.some(game => game.home === person.scheduleTeam || game.away === person.scheduleTeam));
    return `<section class="view">
      ${viewHeader('Head-to-head', 'Who owns who?', 'Choose two managers to compare every completed game in the current weekly-score dataset.', '2025 Weeks 1–11')}
      <div class="rivalry-layout">
        <aside class="card card-pad controls">
          <label>First manager<select id="rival-a">${options.map((person, index) => `<option value="${person.id}"${index === 0 ? ' selected' : ''}>${escapeHtml(person.name)}</option>`).join('')}</select></label>
          <label>Second manager<select id="rival-b">${options.map((person, index) => `<option value="${person.id}"${index === 1 ? ' selected' : ''}>${escapeHtml(person.name)}</option>`).join('')}</select></label>
          <button class="button" id="compare-rivalry">Compare rivalry</button>
          <p class="metric-note">The comparison expands automatically as more verified weekly schedules are added.</p>
        </aside>
        <article class="card card-pad rivalry-result" id="rivalry-result"><p class="empty-state">Select two managers to open the matchup file.</p></article>
      </div>
    </section>`;
  }

  function compareRivalry() {
    const first = manager(document.querySelector('#rival-a').value);
    const second = manager(document.querySelector('#rival-b').value);
    const result = document.querySelector('#rivalry-result');
    if (first.id === second.id) {
      result.innerHTML = '<p class="empty-state">Choose two different managers.</p>';
      return;
    }

    const games = schedule.filter(game => Number.isFinite(game.homeScore) && Number.isFinite(game.awayScore) &&
      [game.home, game.away].includes(first.scheduleTeam) && [game.home, game.away].includes(second.scheduleTeam));
    if (!games.length) {
      result.innerHTML = `<div class="versus"><div class="combatant">${avatar(first, true)}<strong>${escapeHtml(first.shortName)}</strong></div><span class="vs">VS</span><div class="combatant">${avatar(second, true)}<strong>${escapeHtml(second.shortName)}</strong></div></div><p class="insight">No completed meeting appears in the available 2025 schedule snapshot.</p>`;
      return;
    }

    let firstWins = 0; let secondWins = 0; let ties = 0; let firstPoints = 0; let secondPoints = 0;
    const margins = [];
    games.forEach(game => {
      const firstScore = game.home === first.scheduleTeam ? game.homeScore : game.awayScore;
      const secondScore = game.home === second.scheduleTeam ? game.homeScore : game.awayScore;
      firstPoints += firstScore; secondPoints += secondScore;
      margins.push(Math.abs(firstScore - secondScore));
      if (firstScore > secondScore) firstWins += 1;
      else if (secondScore > firstScore) secondWins += 1;
      else ties += 1;
    });
    const leader = firstWins === secondWins ? null : firstWins > secondWins ? first : second;
    const pointEdge = Math.abs(firstPoints - secondPoints);
    const closest = Math.min(...margins);
    const sentence = leader
      ? `${leader.shortName} leads the available series ${Math.max(firstWins, secondWins)}-${Math.min(firstWins, secondWins)}. The total scoring edge is ${fmt.format(pointEdge)} points, and the closest meeting was decided by ${fmt.format(closest)}.`
      : `The available series is tied ${firstWins}-${secondWins}${ties ? ` with ${ties} tie${ties === 1 ? '' : 's'}` : ''}. The total scoring edge is ${fmt.format(pointEdge)} points.`;

    result.innerHTML = `<div class="versus">
      <div class="combatant">${avatar(first, true)}<strong>${escapeHtml(first.shortName)}</strong><span>${fmt.format(firstPoints)} total points</span></div>
      <span class="vs">VS</span>
      <div class="combatant">${avatar(second, true)}<strong>${escapeHtml(second.shortName)}</strong><span>${fmt.format(secondPoints)} total points</span></div>
    </div>
    <div class="series-score"><div><strong>${firstWins}-${secondWins}${ties ? `-${ties}` : ''}</strong><span>Series</span></div><div><strong>${games.length}</strong><span>Meetings</span></div><div><strong>${fmt.format(pointEdge)}</strong><span>Point edge</span></div></div>
    <p class="insight">${escapeHtml(sentence)}</p>`;
  }

  function trophiesView() {
    return `<section class="view">
      ${viewHeader('Trophy room', 'The champions’ wall.', 'Three tracked seasons. Three different champions. One division has owned every trophy so far.', 'Titles verified 2022–24')}
      <div class="trophy-case">${league.champions.map(champ => {
        const winner = manager(champ.managerId);
        const runner = manager(champ.runnerUpId);
        return `<article class="card trophy" data-year="${champ.year}"><span class="trophy-year">ROB CHAMPION · ${champ.year}</span>${avatar(winner, true)}<h3>${escapeHtml(winner.name)}</h3><p>${escapeHtml(champ.note)} Runner-up: ${escapeHtml(runner.shortName)}.</p>${division(champ.division)}</article>`;
      }).join('')}</div>
      <section class="section"><div class="card card-pad"><span class="eyebrow">Division dynasty</span><h2>Fish: 3 championships.<br>Everyone else: 0.</h2><p class="dek">The Fish Division won the 2022, 2023, and 2024 titles. This streak is commissioner-confirmed; fuller division-by-division records will appear as historical schedules are normalized.</p></div></section>
    </section>`;
  }

  function draftsView() {
    const totals = league.managers.map(person => {
      const drafts = league.drafts.filter(draft => draft.managerId === person.id);
      return { person, drafts, total: drafts.reduce((sum, draft) => sum + draft.value, 0) };
    }).filter(row => row.drafts.length).sort((a, b) => b.total - a.total);
    const max = Math.max(...totals.map(row => Math.abs(row.total)), 1);
    return `<section class="view">
      ${viewHeader('Draft lab', 'Three rounds.<br>Three years of tells.', 'Draft value compares draft slot with final finish: positive means a manager finished better than where they drafted.', 'Complete 2022–24')}
      <div class="card table-wrap"><table><thead><tr><th>Manager</th><th>Draft value</th><th>Tracked seasons</th><th>Pattern</th></tr></thead><tbody>${totals.map(row => `<tr>
        <td><div class="name-cell">${avatar(row.person)}<strong>${escapeHtml(row.person.shortName)}</strong></div></td>
        <td><div class="draft-bar"><strong class="record">${row.total >= 0 ? '+' : ''}${row.total}</strong><span class="draft-bar-track"><span class="draft-bar-fill ${row.total < 0 ? 'negative' : ''}" style="width:${Math.max(8, Math.abs(row.total) / max * 100)}%"></span></span></div></td>
        <td>${row.drafts.map(draft => draft.season).join(' · ')}</td>
        <td class="pick-list">${escapeHtml(row.person.note)}</td>
      </tr>`).join('')}</tbody></table></div>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Draft receipts</span><h2>First-round history</h2></div></div><div class="grid grid-3">${totals.map(row => `<article class="card card-pad"><div class="manager-top">${avatar(row.person)}<h3>${escapeHtml(row.person.shortName)}</h3></div><ul class="story-list">${row.drafts.map(draft => `<li><strong>${draft.season} · ${escapeHtml(draft.round1)}</strong><span>Drafted ${draft.slot}${ordinal(draft.slot)} · Finished ${draft.finish}${ordinal(draft.finish)}</span></li>`).join('')}</ul></article>`).join('')}</div></section>
    </section>`;
  }

  function ordinal(number) {
    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) return 'th';
    return ({ 1: 'st', 2: 'nd', 3: 'rd' })[number % 10] || 'th';
  }

  function recordsView() {
    return `<section class="view">
      ${viewHeader('Record book', 'The best. The worst.<br>The provable.', 'Computed records are separated from commissioner-reported achievements, and every category carries its coverage period.')}
      <div class="grid grid-4">${league.recordBook.map(item => `<article class="card record-card"><div><span class="metric-label">${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><h3>${escapeHtml(item.holder)}</h3><p>${escapeHtml(item.season)}</p></div>${statusTag(item.status)}</article>`).join('')}</div>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Data ledger</span><h2>What “all-time” means here</h2></div><p>No card claims more history than the source data can support.</p></div><div class="card">${league.coverage.map(item => `<div class="coverage-row"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.range)}</span><p>${escapeHtml(item.note)}</p>${statusTag(item.status)}</div>`).join('')}</div></section>
    </section>`;
  }

  function render() {
    const active = route();
    setNavigation(active);
    const views = { home: homeView, history: historyView, managers: managersView, rivalries: rivalryView, trophies: trophiesView, drafts: draftsView, records: recordsView };
    app.innerHTML = views[active]();
    document.title = `${navButtons.find(button => button.dataset.route === active)?.textContent || 'League History'} — Rock or Bust`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (active === 'rivalries') {
      document.querySelector('#compare-rivalry').addEventListener('click', compareRivalry);
      compareRivalry();
    }
    document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.go; }));
  }

  navButtons.forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.route; }));
  window.addEventListener('hashchange', render);

  Promise.all([
    fetch('data/league.json').then(response => response.ok ? response.json() : Promise.reject(new Error('league data'))),
    fetch('schedule.json').then(response => response.ok ? response.json() : Promise.reject(new Error('schedule data')))
  ]).then(([leagueData, scheduleData]) => {
    league = leagueData;
    schedule = scheduleData;
    standings = computeStandings();
    render();
  }).catch(error => {
    console.error(error);
    app.innerHTML = '<div class="error">The league archive could not be loaded. Please refresh the page.</div>';
  });
})();
