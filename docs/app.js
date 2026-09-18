(() => {
  'use strict';

  const app = document.querySelector('#app');
  const navButtons = [...document.querySelectorAll('[data-route]')];
  const validRoutes = new Set(['home', 'history', 'managers', 'rivalries', 'trophies', 'drafts', 'statistics', 'records', 'rules']);
  let league;
  let matchups;

  const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function manager(id) {
    return league.managers.find(item => item.id === id);
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

  function allGames() {
    return Object.values(matchups.seasons).flat();
  }

  function careerStats(id) {
    let wins = 0; let losses = 0; let ties = 0; let points = 0; let seasons = 0;
    Object.values(league.seasonStandings).forEach(rows => {
      const row = rows.find(item => item.managerId === id);
      if (!row) return;
      const [w = 0, l = 0, t = 0] = row.record.split('-').map(Number);
      wins += w; losses += l; ties += t; points += row.pf; seasons += 1;
    });
    return { wins, losses, ties, points, seasons };
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

  function finalStandingsTable(year, limit) {
    const rows = league.seasonStandings[String(year)] || [];
    const shown = Number.isFinite(limit) ? rows.slice(0, limit) : rows;
    return `<div class="card table-wrap">
      <table>
        <thead><tr><th>Finish</th><th>Manager</th><th>Record</th><th>PF</th><th>PA</th><th>Diff/G</th><th>Moves</th></tr></thead>
        <tbody>${shown.map(row => {
          const person = row.managerId ? manager(row.managerId) : null;
          const name = person?.name || row.name || 'Unknown';
          return `<tr>
          <td class="rank">${row.rank}</td>
          <td><div class="name-cell">${avatar({ name })}<strong>${escapeHtml(name)}</strong>${row.rank === 1 ? '<span class="mini-trophy" title="Champion">🏆</span>' : ''}</div></td>
          <td class="record">${escapeHtml(row.record)}</td>
          <td>${fmt.format(row.pf)}</td><td>${fmt.format(row.pa)}</td>
          <td class="${row.diff >= 0 ? 'positive' : 'negative'}">${row.diff >= 0 ? '+' : ''}${row.diff.toFixed(1)}</td>
          <td>${row.moves}</td>
        </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
  }

  function homeView() {
    return `<section class="view">
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">2026 season · The official ROB archive</span>
          <h1>ROB Fantasy League.<br><span>Founded 2020.</span></h1>
          <p class="dek">Championships, final standings, rivalries, draft tendencies, and the stories the box scores cannot explain.</p>
        </div>
        <div class="hero-side">
          <article class="stat-feature champion-feature"><span class="metric-label">Reigning champion</span><div><span class="hero-trophy">🏆</span><strong>Mark</strong><p>2025 champion · won from 7–7</p></div></article>
          <article class="stat-feature"><span class="metric-label">Known title seasons</span><div><strong>5</strong><p>James ×2 · Eli · Tucker · Mark</p></div></article>
        </div>
      </div>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">2025 final standings</span><h2>The season Mark survived</h2></div><p>Five managers finished 7–7. Mark came out of the tiebreaker pile and won the whole thing.</p></div>
        <div class="snapshot">
          ${finalStandingsTable(2025)}
          <aside class="card card-pad">
            <h3>2025 in three facts</h3>
            <ul class="story-list">
              <li><strong>Mark won at 7–7</strong><span>He beat Dalton 185.00–146.05 in the championship.</span></li>
              <li><strong>Five teams tied at 7–7</strong><span>Fish alone had a three-way tie fighting for position.</span></li>
              <li><strong>Eli scored 2,417.35</strong><span>The top point total and a +27.1 average scoring margin.</span></li>
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
        const championName = season.championName || champ?.shortName;
        return `<article class="card season-card">
          <div class="season-year">${season.year}</div>
          <div><h3>${escapeHtml(season.label)}</h3><p>${escapeHtml(season.story)}</p></div>
          <div class="season-result">${champ ? `<strong>${escapeHtml(championName)} 🏆</strong><span>Champion${runner ? ` · over ${escapeHtml(runner.shortName)}` : ''}</span>` : season.status === 'current' ? '<strong>In progress</strong><span>2026 season</span>' : '<strong>Unknown champion</strong><span>No surviving record</span>'}<br>${statusTag(season.status)}</div>
        </article>`;
      }).join('')}</div>
      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Final standings</span><h2>Season-by-season records</h2></div><label class="season-picker">Season<select id="history-season"><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></label></div>
        <div id="history-standings">${finalStandingsTable(2025)}</div>
      </section>
      <section class="section"><article class="card lore-card">
        <span class="eyebrow">League lore · 2022</span>
        <h2>14–2. The win was sitting there.<br>Then football stopped.</h2>
        <p>Cameron dominated the regular season and posted the best record in league history. He reached the playoffs needing Joe Burrow to hit a very doable number on Monday night.</p>
        <blockquote>“Damar Hamlin died on the field, the game got canceled, and Cameron got screwed.”</blockquote>
        <p class="lore-footnote">That is the league's intentionally over-the-top retelling. For the record, Hamlin suffered cardiac arrest and survived; the Bills–Bengals game was suspended and later canceled, Burrow's remaining points were never played, and Cameron lost.</p>
        <span class="tag reported">Official ROB lore</span>
      </article></section>
      <section class="section"><article class="card lore-card tie-lore">
        <span class="eyebrow">League lore · 2025</span>
        <h2>Five teams at 7–7.<br>Mark won the trophy.</h2>
        <p>Mark, Jacob, Noah, Daniel, and Cameron all finished at .500. Fish alone had Mark, Jacob, and Cameron locked in a three-way tie. Mark survived the tiebreakers, reached the championship, and beat Dalton 185.00–146.05.</p>
        <span class="tag verified">Verified by final standings</span>
      </article></section>
    </section>`;
  }

  function managersView() {
    return `<section class="view">
      ${viewHeader('The league', 'Managers', 'Career totals use every complete regular-season standings record available from 2022 through 2025.')}
      <div class="grid grid-3">${league.managers.map(person => {
        const titles = league.champions.filter(champ => champ.managerId === person.id).length;
        const career = careerStats(person.id);
        return `<article class="card manager-card">
          <div class="manager-top">${avatar(person, true)}<div><h3>${escapeHtml(person.name)}${titles ? ` <span class="title-trophies" title="${titles} championship${titles === 1 ? '' : 's'}">${'🏆'.repeat(titles)}</span>` : ''}</h3><div class="manager-meta">Active ${escapeHtml(person.active)}</div></div></div>
          <div class="career-line"><strong>${career.wins}-${career.losses}${career.ties ? `-${career.ties}` : ''}</strong><span>tracked regular-season record</span><strong>${fmt.format(career.points)}</strong><span>career points · ${career.seasons} season${career.seasons === 1 ? '' : 's'}</span></div>
          <p>${escapeHtml(person.note)}</p>
          <div class="manager-footer">${division(person.division)}<span>${titles ? `${titles} championship${titles === 1 ? '' : 's'}` : 'No titles yet'}</span></div>
        </article>`;
      }).join('')}</div>
    </section>`;
  }

  function rivalryView() {
    const games = allGames();
    const options = league.managers.filter(person => games.some(game => game.home === person.id || game.away === person.id));
    return `<section class="view">
      ${viewHeader('Head-to-head', 'Who owns who?', 'Choose two managers to compare every verified regular-season and playoff meeting in the archive.', '2022–2026 W1')}
      <div class="rivalry-layout">
        <aside class="card card-pad controls">
          <label>First manager<select id="rival-a">${options.map((person, index) => `<option value="${person.id}"${index === 0 ? ' selected' : ''}>${escapeHtml(person.name)}</option>`).join('')}</select></label>
          <label>Second manager<select id="rival-b">${options.map((person, index) => `<option value="${person.id}"${index === 1 ? ' selected' : ''}>${escapeHtml(person.name)}</option>`).join('')}</select></label>
          <button class="button" id="compare-rivalry">Compare rivalry</button>
          <p class="metric-note">Coverage: complete 2022–24 schedules, 2025 Weeks 1–11, and 2026 Week 1. Missing weeks are never guessed.</p>
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

    const games = allGames().filter(game => Number.isFinite(game.homeScore) && Number.isFinite(game.awayScore) &&
      [game.home, game.away].includes(first.id) && [game.home, game.away].includes(second.id));
    if (!games.length) {
      result.innerHTML = `<div class="versus"><div class="combatant">${avatar(first, true)}<strong>${escapeHtml(first.shortName)}</strong></div><span class="vs">VS</span><div class="combatant">${avatar(second, true)}<strong>${escapeHtml(second.shortName)}</strong></div></div><p class="insight">No completed meeting appears in the available multi-season archive.</p>`;
      return;
    }

    let firstWins = 0; let secondWins = 0; let ties = 0; let firstPoints = 0; let secondPoints = 0;
    const margins = [];
    games.forEach(game => {
      const firstScore = game.home === first.id ? game.homeScore : game.awayScore;
      const secondScore = game.home === second.id ? game.homeScore : game.awayScore;
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
    <p class="insight">${escapeHtml(sentence)}</p>
    <div class="meeting-list"><strong>Most recent meetings</strong>${games.slice().sort((a, b) => b.season - a.season || b.week - a.week).slice(0, 5).map(game => {
      const firstScore = game.home === first.id ? game.homeScore : game.awayScore;
      const secondScore = game.home === second.id ? game.homeScore : game.awayScore;
      return `<span>${game.season} · W${game.week}${game.stage === 'playoffs' ? ' playoff' : ''}<b>${escapeHtml(first.shortName)} ${fmt.format(firstScore)} — ${fmt.format(secondScore)} ${escapeHtml(second.shortName)}</b></span>`;
    }).join('')}</div>`;
  }

  function trophiesView() {
    return `<section class="view">
      ${viewHeader('Trophy room', 'The champions’ wall.', 'Five recognized titles and one regular-season record nobody has touched.', 'Champions 2021–25')}
      <div class="trophy-case">${league.champions.map(champ => {
        const winner = manager(champ.managerId);
        const runner = champ.runnerUpId ? manager(champ.runnerUpId) : null;
        const third = champ.thirdId ? manager(champ.thirdId) : null;
        const winnerName = champ.winnerName || winner.name;
        return `<article class="card trophy" data-year="${champ.year}"><span class="trophy-year">ROB CHAMPION · ${champ.year}</span><span class="trophy-icon" aria-hidden="true">🏆</span>${avatar({ name: winnerName }, true)}<h3>${escapeHtml(winnerName)}</h3><p>${escapeHtml(champ.note)}</p>${champ.championshipScore ? `<div class="champ-score">${escapeHtml(champ.championshipScore)}</div>` : ''}<div class="podium-note">${runner ? `2nd: ${escapeHtml(runner.shortName)}` : 'Full podium unavailable'}${third ? ` · 3rd: ${escapeHtml(third.shortName)}` : ''}</div>${champ.division ? division(champ.division) : '<span class="tag verified">Champion verified</span>'}</article>`;
      }).join('')}</div>
      <section class="section">
        <div class="section-head"><div><span class="eyebrow">Record honors</span><h2>More than championships</h2></div></div>
        <div class="grid grid-2">
          <article class="card honor-card"><span class="honor-icon">🏅</span><div><span class="eyebrow">Best regular season ever</span><h2>Cameron · 14–2</h2><p>The 2022 record still stands as the best regular-season mark in ROB history.</p></div></article>
          <article class="card honor-card"><span class="honor-icon">🦀</span><div><span class="eyebrow">Division fact check</span><h2>Tucker · Crabs</h2><p>The saved 2025 standings and current 2026 ESPN standings both place Tucker in Crabs. The old four-straight Fish claim was removed because it projected current divisions backward.</p></div></article>
        </div>
      </section>
    </section>`;
  }

  function draftsView() {
    const totals = league.managers.map(person => {
      const drafts = league.drafts.filter(draft => draft.managerId === person.id);
      const valued = drafts.filter(draft => Number.isFinite(draft.value));
      return { person, drafts, valued, total: valued.reduce((sum, draft) => sum + draft.value, 0) };
    }).filter(row => row.drafts.length).sort((a, b) => b.total - a.total);
    const max = Math.max(...totals.map(row => Math.abs(row.total)), 1);
    return `<section class="view">
      ${viewHeader('Draft lab', 'Five drafts.<br>Plenty of receipts.', 'Draft recaps now run through the completed 2026 draft. Draft value can only be calculated after final standings exist.', 'Drafts 2022–26')}
      <article class="card explainer"><div><span class="eyebrow">What draft value means</span><h2>Draft slot minus final finish.</h2></div><p>If you drafted 8th and finished 3rd, your value is <strong>+5</strong>. If you drafted 2nd and finished 7th, it is <strong>−5</strong>. Positive means the team beat its draft position; negative means it finished lower. It measures finish versus slot—not whether every pick was good. The 2026 values are pending.</p></article>
      <div class="card table-wrap"><table><thead><tr><th>Manager</th><th>Draft value</th><th>Tracked seasons</th><th>Pattern</th></tr></thead><tbody>${totals.map(row => `<tr>
        <td><div class="name-cell">${avatar(row.person)}<strong>${escapeHtml(row.person.shortName)}</strong></div></td>
        <td><div class="draft-bar"><strong class="record">${row.total >= 0 ? '+' : ''}${row.total}</strong><span class="draft-bar-track"><span class="draft-bar-fill ${row.total < 0 ? 'negative' : ''}" style="width:${Math.max(8, Math.abs(row.total) / max * 100)}%"></span></span></div></td>
        <td>${row.drafts.map(draft => `${draft.season}${Number.isFinite(draft.value) ? '' : '*'}`).join(' · ')}</td>
        <td class="pick-list">${escapeHtml(row.person.note)}</td>
      </tr>`).join('')}</tbody></table></div>
      <p class="data-note">* 2026 draft value is pending. James drafted the 2025 team later finished by Dalton, so that season's value follows the drafted team and is labeled in the receipt.</p>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Draft receipts</span><h2>First-round history</h2></div></div><div class="grid grid-3">${totals.map(row => `<article class="card card-pad"><div class="manager-top">${avatar(row.person)}<h3>${escapeHtml(row.person.shortName)}</h3></div><ul class="story-list">${row.drafts.slice().sort((a,b) => b.season-a.season).map(draft => `<li><strong>${draft.season} · ${escapeHtml(draft.round1)}</strong><span>Drafted ${draft.slot}${ordinal(draft.slot)} · ${Number.isFinite(draft.finish) ? `Finished ${draft.finish}${ordinal(draft.finish)} · Value ${draft.value >= 0 ? '+' : ''}${draft.value}` : 'Finish TBD · Value pending'}${draft.note ? `<br>${escapeHtml(draft.note)}` : ''}</span></li>`).join('')}</ul></article>`).join('')}</div></section>
    </section>`;
  }

  function ordinal(number) {
    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) return 'th';
    return ({ 1: 'st', 2: 'nd', 3: 'rd' })[number % 10] || 'th';
  }

  function statisticsView() {
    const games = allGames();
    const observations = games.flatMap(game => [
      { id: game.away, score: game.awayScore, opponent: game.home, opponentScore: game.homeScore, game },
      { id: game.home, score: game.homeScore, opponent: game.away, opponentScore: game.awayScore, game }
    ]);
    const thresholds = [100, 125, 150, 175, 200].map(threshold => {
      const sample = observations.filter(row => row.score >= threshold);
      const wins = sample.filter(row => row.score > row.opponentScore).length;
      return { threshold, games: sample.length, wins, rate: sample.length ? wins / sample.length * 100 : 0 };
    });
    const career = league.managers.map(person => ({ person, ...careerStats(person.id) })).filter(row => row.seasons).sort((a, b) => b.points - a.points);
    const maxPoints = Math.max(...career.map(row => row.points), 1);
    const highest = observations.slice().sort((a, b) => b.score - a.score)[0];
    const closest = games.slice().sort((a, b) => Math.abs(a.awayScore - a.homeScore) - Math.abs(b.awayScore - b.homeScore))[0];
    const blowout = games.slice().sort((a, b) => Math.abs(b.awayScore - b.homeScore) - Math.abs(a.awayScore - a.homeScore))[0];
    const pairMap = new Map();
    games.forEach(game => {
      const ids = [game.away, game.home].sort(); const key = ids.join('|');
      if (!pairMap.has(key)) pairMap.set(key, { ids, wins: { [ids[0]]: 0, [ids[1]]: 0 }, games: 0 });
      const pair = pairMap.get(key); pair.games += 1;
      if (game.awayScore > game.homeScore) pair.wins[game.away] += 1;
      if (game.homeScore > game.awayScore) pair.wins[game.home] += 1;
    });
    const rivalries = [...pairMap.values()].filter(pair => pair.games >= 3).map(pair => {
      const [a, b] = pair.ids; const leader = pair.wins[a] >= pair.wins[b] ? a : b; const other = leader === a ? b : a;
      return { leader, other, wins: pair.wins[leader], losses: pair.wins[other], games: pair.games, gap: Math.abs(pair.wins[a] - pair.wins[b]) };
    }).sort((a, b) => b.gap - a.gap || b.games - a.games).slice(0, 4);
    const gameLabel = row => `${row.game.season} W${row.game.week}${row.game.stage === 'playoffs' ? ' playoff' : ''}`;
    const resultCard = (label, row, subline) => `<article class="card metric"><span class="metric-label">${label}</span><strong class="metric-value">${escapeHtml(subline)}</strong><span class="metric-note">${escapeHtml(gameLabel(row))}</span></article>`;
    return `<section class="view">
      ${viewHeader('Data analysis', 'Statistics', 'Patterns computed from 271 verified ESPN matchups plus complete regular-season standings from 2022 through 2025.', 'Updated through 2026 W1')}
      <div class="grid grid-3 stat-callouts">
        ${resultCard('Highest verified weekly score', highest, `${manager(highest.id).shortName} · ${fmt.format(highest.score)}`)}
        ${resultCard('Closest verified game', { ...closest, game: closest }, `${fmt.format(Math.abs(closest.awayScore - closest.homeScore))} pts`)}
        ${resultCard('Biggest verified blowout', { ...blowout, game: blowout }, `${fmt.format(Math.abs(blowout.awayScore - blowout.homeScore))} pts`)}
      </div>
      <section class="section analytics-grid">
        <article class="card card-pad"><span class="eyebrow">Score threshold</span><h2>How often does it win?</h2><p class="chart-intro">Every team-week in the matchup archive, including playoffs.</p><div class="bar-chart">${thresholds.map(row => `<div class="bar-row"><span>${row.threshold}+ points</span><div class="bar-track"><i style="width:${row.rate}%"></i></div><strong>${row.rate.toFixed(0)}%</strong><small>${row.wins}/${row.games}</small></div>`).join('')}</div></article>
        <article class="card card-pad"><span class="eyebrow">Career scoring</span><h2>All-time points leaders</h2><p class="chart-intro">Regular-season points from complete 2022–2025 final standings.</p><div class="bar-chart career-chart">${career.slice(0, 8).map(row => `<div class="bar-row"><span>${escapeHtml(row.person.shortName)}</span><div class="bar-track"><i style="width:${row.points / maxPoints * 100}%"></i></div><strong>${fmt.format(row.points)}</strong></div>`).join('')}</div></article>
      </section>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Matchup trouble</span><h2>The most lopsided rivalries</h2></div><p>Minimum three verified meetings. These change as more archived weeks are added.</p></div><div class="grid grid-4">${rivalries.map(row => `<article class="card record-card"><div><span class="metric-label">${row.games} meetings</span><strong>${row.wins}-${row.losses}</strong><h3>${escapeHtml(manager(row.leader).shortName)} over ${escapeHtml(manager(row.other).shortName)}</h3><p>Available matchup archive</p></div><span class="tag computed">Computed</span></article>`).join('')}</div></section>
      <p class="data-note">Coverage note: 2022–2024 schedules are complete. The matchup archive has 2025 through Week 11 and 2026 Week 1; career totals use complete 2022–2025 final standings.</p>
    </section>`;
  }

  function recordsView() {
    return `<section class="view">
      ${viewHeader('Record book', 'The best. The worst.<br>The provable.', 'Computed records are separated from commissioner-reported achievements, and every category carries its coverage period.')}
      <div class="grid grid-4">${league.recordBook.map(item => `<article class="card record-card"><div><span class="metric-label">${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><h3>${escapeHtml(item.holder)}</h3><p>${escapeHtml(item.season)}</p></div>${statusTag(item.status)}</article>`).join('')}</div>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Data ledger</span><h2>What “all-time” means here</h2></div><p>No card claims more history than the source data can support.</p></div><div class="card">${league.coverage.map(item => `<div class="coverage-row"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.range)}</span><p>${escapeHtml(item.note)}</p>${statusTag(item.status)}</div>`).join('')}</div></section>
    </section>`;
  }

  function rulesView() {
    return `<section class="view rules-view">
      ${viewHeader('League governance', 'Rules & regulations', 'The official rulebook will live here so future arguments can be settled with one link.', '2026 rulebook')}
      <article class="card coming-soon">
        <span class="coming-icon" aria-hidden="true">📘</span>
        <h2>League rules and regulations<br>for fair play coming soon.</h2>
      </article>
    </section>`;
  }

  function render() {
    const active = route();
    setNavigation(active);
    const views = { home: homeView, history: historyView, managers: managersView, rivalries: rivalryView, trophies: trophiesView, drafts: draftsView, statistics: statisticsView, records: recordsView, rules: rulesView };
    app.innerHTML = views[active]();
    document.title = `${navButtons.find(button => button.dataset.route === active)?.textContent || 'League History'} — Rock or Bust`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (active === 'rivalries') {
      document.querySelector('#compare-rivalry').addEventListener('click', compareRivalry);
      compareRivalry();
    }
    if (active === 'history') {
      document.querySelector('#history-season').addEventListener('change', event => {
        document.querySelector('#history-standings').innerHTML = finalStandingsTable(Number(event.target.value));
      });
    }
    document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.go; }));
  }

  navButtons.forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.route; }));
  window.addEventListener('hashchange', render);

  Promise.all([
    fetch('data/league.json').then(response => response.ok ? response.json() : Promise.reject(new Error('league data'))),
    fetch('data/matchups.json').then(response => response.ok ? response.json() : Promise.reject(new Error('matchup data')))
  ]).then(([leagueData, matchupData]) => {
    league = leagueData;
    matchups = matchupData;
    render();
  }).catch(error => {
    console.error(error);
    app.innerHTML = '<div class="error">The league archive could not be loaded. Please refresh the page.</div>';
  });
})();
