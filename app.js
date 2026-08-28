import {
  AnswerChecker,
  ComboManager,
  QuestionPool,
  RetryWrong,
  ScoreManager,
  StorageManager
} from 'https://tt-sensei.github.io/edu-components/index.js';
import { EDU_EVENTS } from 'https://tt-sensei.github.io/edu-components/js/core/events.js';
import {
  KIND_LABELS,
  NAVI,
  NAVI_IDS,
  QUESTION_BANK,
  QUESTION_BY_ID,
  SCENE_BY_ID,
  SERIES_LABELS,
  STARTER_QUESTIONS,
  WORD_FORMS,
  getSituation
} from './data.js';

let soundList = [];
try {
  ({ soundList } = await import('https://tt-sensei.github.io/sounds-recipe-/sounds.js'));
} catch {
  // 音は補助要素。読み込めなくても学習本体は続けられるようにする。
  soundList = [];
}

const root = document.querySelector('#app');
const storage = new StorageManager('kosoado', { eventTarget: document });
const checker = new AnswerChecker({ eventTarget: document });
const retryWrong = new RetryWrong({ eventTarget: document });
const scoreManager = new ScoreManager({ eventTarget: document });
const comboManager = new ComboManager({ eventTarget: document, milestones: [3, 5, 10] });

const DEFAULT_SETTINGS = { sound: true };
const SERIES = ['ko', 'so', 'a', 'do'];
const KINDS = ['object', 'determiner', 'place'];
const SESSION_TOTAL = 10;

const READING_MAP = {
  '教室': 'きょうしつ',
  '校庭': 'こうてい',
  '図書室': 'としょしつ',
  '図工室': 'ずこうしつ',
  '黒板': 'こくばん',
  '時計': 'とけい',
  '本': 'ほん',
  '消しゴム': 'けしゴム',
  '木': 'き',
  '場所': 'ばしょ',
  '近く': 'ちかく',
  '対象': 'たいしょう',
  '先生': 'せんせい',
  '席': 'せき'
};

function bucket() {
  return { total: 0, correct: 0, wrong: 0, lastWrongAt: 0 };
}

function defaultStats() {
  return {
    schemaVersion: 1,
    answers: 0,
    ko: bucket(),
    so: bucket(),
    a: bucket(),
    do: bucket(),
    object: bucket(),
    determiner: bucket(),
    place: bucket()
  };
}

function normalizeStats(raw) {
  const result = defaultStats();
  if (!raw || typeof raw !== 'object') return result;
  result.answers = Number(raw.answers) || 0;
  for (const key of [...SERIES, ...KINDS]) {
    result[key] = { ...result[key], ...(raw[key] || {}) };
    result[key].total = Number(result[key].total) || 0;
    result[key].correct = Number(result[key].correct) || 0;
    result[key].wrong = Number(result[key].wrong) || 0;
    result[key].lastWrongAt = Number(result[key].lastWrongAt) || 0;
  }
  return result;
}

function defaultReviewQueue() {
  return [];
}

function loadState() {
  return {
    stats: normalizeStats(storage.load('stats', defaultStats())),
    reviewQueue: Array.isArray(storage.load('reviewQueue', defaultReviewQueue()))
      ? storage.load('reviewQueue', defaultReviewQueue())
      : [],
    recentResults: Array.isArray(storage.load('recentResults', []))
      ? storage.load('recentResults', [])
      : [],
    settings: { ...DEFAULT_SETTINGS, ...(storage.load('settings', DEFAULT_SETTINGS) || {}) }
  };
}

const state = loadState();
let screen = 'home';
let session = null;
let lastResult = null;
let detectiveSpeakerId = 'riku';

class SoundController {
  constructor() {
    this.context = null;
    this.recipes = Array.isArray(soundList) ? soundList : [];
  }

  play(id) {
    if (!state.settings.sound || !this.recipes.length) return;
    const recipe = this.recipes.find((item) => item.id === id);
    if (!recipe) return;
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.context = new AudioContextClass();
      }
      if (this.context.state === 'suspended') this.context.resume();
      recipe.play(this.context, 0.72);
    } catch {
      // 効果音の失敗で問題操作を止めない。
    }
  }
}

const sounds = new SoundController();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function formatJapanese(value) {
  let result = escapeHtml(value);
  Object.entries(READING_MAP)
    .sort(([first], [second]) => second.length - first.length)
    .forEach(([word, reading]) => {
      result = result.split(word).join(`<ruby>${word}<rt>${reading}</rt></ruby>`);
    });
  return result;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function accuracy(key) {
  const item = state.stats[key];
  return item?.total ? item.correct / item.total : 0.5;
}

function accuracyText(key) {
  const item = state.stats[key];
  if (!item?.total) return 'これから';
  return `${Math.round((item.correct / item.total) * 100)}%`;
}

function persistState() {
  storage.save('stats', state.stats);
  storage.save('reviewQueue', state.reviewQueue);
  storage.save('recentResults', state.recentResults.slice(0, 5));
  storage.save('settings', state.settings);
}

function renderShell(content, options = {}) {
  const soundLabel = state.settings.sound ? '音あり' : '音なし';
  const practiceHome = screen === 'practice' || screen === 'result' || screen === 'detective';
  root.innerHTML = `
    <div class="edu-app kosoado-app">
      <header class="edu-shell-header app-header">
        <button class="app-brand" data-action="home" aria-label="こそあど！のホームへ">
          <span class="brand-mark">こ</span>
          <span><strong>こそあど！</strong><small>ことばの距離を見つけよう</small></span>
        </button>
        <div class="header-actions">
          ${practiceHome ? '<button class="edu-btn edu-btn-quiet header-home" data-action="home">ホーム</button>' : ''}
          <button class="sound-toggle" data-action="toggle-sound" aria-pressed="${state.settings.sound}" title="音の設定">
            <span aria-hidden="true">${state.settings.sound ? '🔊' : '🔇'}</span>${soundLabel}
          </button>
        </div>
      </header>
      <main class="edu-main kosoado-main" id="main">
        <div class="edu-container kosoado-container">${content}</div>
      </main>
      <div class="edu-toast" id="toast" role="status" aria-live="polite" hidden></div>
    </div>`;
  root.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('image-failed');
      image.removeAttribute('src');
    }, { once: true });
  });
  if (options.focusSelector) {
    requestAnimationFrame(() => root.querySelector(options.focusSelector)?.focus());
  }
}

function render() {
  if (screen === 'practice') {
    renderShell(renderPractice(), { focusSelector: session?.focusSelector || null });
  } else if (screen === 'result') {
    renderShell(renderResult(), { focusSelector: '[data-action="restart-practice"]' });
  } else if (screen === 'detective') {
    renderShell(renderDetective());
  } else {
    renderShell(renderHome(), { focusSelector: null });
  }
}

function renderHome() {
  const reviewCount = state.reviewQueue.filter((item) => item.availableAfter <= state.stats.answers).length;
  const recent = state.recentResults[0];
  const naviTiles = NAVI_IDS.map((id) => `
    <div class="navi-tile">
      <img src="${NAVI[id].image}" alt="${escapeHtml(NAVI[id].alt)}" loading="lazy">
      <span>${escapeHtml(NAVI[id].name)}</span>
    </div>`).join('');

  return `
    <section class="home-layout" aria-labelledby="home-title">
      <div class="home-intro edu-card edu-card-pad">
        <div class="eyebrow"><span class="eyebrow-dot"></span>ことばの探検</div>
        <h1 id="home-title">こそあど！<span>ことばの距離を見つけよう</span></h1>
        <p class="home-lead">場面を見て、だれから見たことばかを考えよう。<br>「これ？」「それ？」と、すぐに答えてみよう！</p>
        <div class="home-actions">
          <button class="edu-btn edu-btn-primary edu-btn-block edu-kinetic-button start-button" data-action="start-practice">
            <span class="button-icon" aria-hidden="true">▶</span><span>れんしゅうをはじめる</span>
          </button>
          <button class="edu-btn edu-btn-secondary edu-btn-block detective-button" data-action="open-detective">
            <span class="button-icon" aria-hidden="true">🔎</span><span>ことば探偵をひらく</span>
          </button>
        </div>
        <p class="home-note"><span aria-hidden="true">✦</span> 10問ずつ、どんどんチャレンジ</p>
      </div>

      <aside class="home-side" aria-label="学習のようす">
        <section class="navi-card edu-card edu-card-pad">
          <div class="side-heading"><div><span class="section-kicker">NAVI TEAM</span><h2>いっしょに考えよう</h2></div><span class="speech-mini" aria-hidden="true">？</span></div>
          <div class="navi-team">${naviTiles}</div>
          <p class="side-caption">毎回ちがう組み合わせで、場面の関係を見つけます。</p>
        </section>
        <section class="progress-card edu-card edu-card-pad" aria-labelledby="progress-title">
          <div class="side-heading"><div><span class="section-kicker">MY NOTE</span><h2 id="progress-title">学習メモ</h2></div><span class="note-icon" aria-hidden="true">✎</span></div>
          <div class="home-stat-row"><strong>${state.stats.answers}</strong><span>問にチャレンジ</span></div>
          <div class="mini-stat-grid">
            ${SERIES.map((key) => `<div class="mini-stat"><span>「${SERIES_LABELS[key]}」</span><strong>${accuracyText(key)}</strong></div>`).join('')}
          </div>
          <p class="review-note ${reviewCount ? 'has-review' : ''}"><span aria-hidden="true">${reviewCount ? '↻' : '✓'}</span>${reviewCount ? `少し後で、${reviewCount}問がもう一度出ます。` : (recent ? '今日も学びを続けよう。' : 'まずは1問、見てみよう。')}</p>
        </section>
      </aside>
    </section>
    <section class="home-principle" aria-label="このアプリの学び方">
      <div class="principle-line"><span class="principle-symbol">●</span><span><strong>はなす人の近く</strong>なら「こ」</span></div>
      <div class="principle-line"><span class="principle-symbol listener">◎</span><span><strong>きく人の近く</strong>なら「そ」</span></div>
      <div class="principle-line"><span class="principle-symbol far">★</span><span><strong>2人から遠い</strong>なら「あ」</span></div>
      <div class="principle-line"><span class="principle-symbol question">？</span><span><strong>えらぶ・たずねる</strong>なら「ど」</span></div>
    </section>`;
}

function renderPractice() {
  if (!session?.current) return '<p>準備中です。</p>';
  const question = session.current;
  const scene = SCENE_BY_ID[question.sceneId];
  const speaker = NAVI[question.speakerId];
  const listener = NAVI[question.listenerId];
  const situation = getSituation(scene, question);
  const feedback = session.feedback;
  const choices = session.choiceOrder || question.choices;
  const progress = Math.round((session.questions.length / SESSION_TOTAL) * 100);
  const changeBanner = question.isViewpointChange ? `
    <div class="viewpoint-banner edu-kinetic-pop" role="status">
      <span class="viewpoint-icon" aria-hidden="true">↔</span>
      <div><strong>視点チェンジ！</strong><span>同じ場面を、${escapeHtml(speaker.name)}の立場から見てみよう。</span></div>
    </div>` : '';
  const starterCue = question.starterOrder === 3 ? `
    <div class="starter-cue" role="status">
      <span class="starter-cue-icon" aria-hidden="true">★</span>
      <div><strong>場面の見方をひろげよう</strong><span>今度は、2人から遠いものに注目してみよう。</span></div>
    </div>` : question.starterOrder === 4 ? `
    <div class="starter-cue" role="status">
      <span class="starter-cue-icon" aria-hidden="true">？</span>
      <div><strong>たずねる場面も見てみよう</strong><span>いくつかのものから、たずねることばをえらぼう。</span></div>
    </div>` : '';

  return `
    <section class="practice-screen" aria-labelledby="practice-title">
      <div class="practice-head">
        <div>
          <span class="section-kicker">れんしゅう</span>
          <h1 id="practice-title">場面を見て、ことばをえらぼう</h1>
        </div>
        <div class="session-count" aria-label="全10問のうち${session.questions.length}問目"><strong>${session.questions.length}</strong><span>/ 10問</span></div>
      </div>
      <div class="edu-progress session-progress" aria-label="れんしゅうの進み具合">
        <div class="edu-progress-head"><span>チャレンジ中</span><span>${progress}%</span></div>
        <div class="edu-progress-track"><div class="edu-progress-value" style="width:${progress}%"></div></div>
      </div>
      ${changeBanner}
      ${starterCue}
      <div class="practice-layout">
        <article class="scene-panel edu-card edu-card-pad" aria-labelledby="scene-title">
          <div class="scene-panel-head"><div><span class="section-kicker">SCENE</span><h2 id="scene-title">${formatJapanese(scene.place)}</h2></div><span class="scene-tag">見て考える</span></div>
          <div class="speech-bubble" aria-label="${escapeHtml(speaker.name)}が話しています">
            <div class="speech-person"><img src="${speaker.image}" alt="${escapeHtml(speaker.alt)}"><span>${escapeHtml(speaker.name)}</span><small>● はなす人</small></div>
            <div class="speech-content"><span class="speech-label">${escapeHtml(speaker.name)}のことば</span><p>「${formatJapanese(question.sentence)}」</p></div>
          </div>
          <div class="listener-note"><span class="role-symbol listener-symbol" aria-hidden="true">◎</span><span><strong>${escapeHtml(listener.name)}</strong>がきく人</span></div>
          <p class="situation-text"><span class="situation-mark" aria-hidden="true">i</span>${formatJapanese(situation)}</p>
          <div class="scene-figure" id="scene-figure">${renderSceneSvg(question, scene)}</div>
          <p class="scene-legend"><span>● はなす人</span><span>◎ きく人</span><span>★ 対象</span></p>
        </article>

        <aside class="answer-panel">
          <div class="edu-question answer-card ${feedback?.isCorrect ? 'answer-correct' : feedback && !feedback.isCorrect ? 'answer-wrong' : ''}" id="answer-card">
            <div class="question-label"><span class="label-dot" aria-hidden="true"></span>ことばをえらぼう</div>
            <p class="question-prompt">${formatJapanese(question.sentence)}</p>
            <div class="edu-answer-grid edu-answer-grid-4 answer-grid" role="group" aria-label="答えの選択肢">
              ${choices.map((choice) => renderChoice(question, choice)).join('')}
            </div>
            <div class="answer-helper">
              <button class="hint-button" data-action="toggle-hint" aria-expanded="${Boolean(session.hintOpen)}" ${session.answered ? 'disabled' : ''}>？ ヒント</button>
              <div class="hint-box ${session.hintOpen ? 'is-open' : ''}" ${session.hintOpen ? '' : 'hidden'} id="hint-box">
                ${question.questionType === 'interrogative'
                  ? '<strong>「ど」のヒント</strong><span>ものや場所が、いくつあるか見てみよう。</span>'
                  : '<strong>★の対象に注目</strong><span>はなす人・きく人の、どちらの近くかな？</span>'}
              </div>
            </div>
          </div>
          <div class="feedback-area" aria-live="polite">
            ${feedback ? renderFeedback(feedback, speaker, question) : '<p class="feedback-placeholder">場面をよく見て、ひとつえらんでね。</p>'}
          </div>
        </aside>
      </div>
    </section>`;
}

function renderChoice(question, choice) {
  const selected = session.selectedAnswer === choice;
  let stateClass = '';
  let suffix = '';
  if (session.answered && selected) {
    stateClass = session.feedback?.isCorrect ? 'is-correct' : 'is-wrong';
    suffix = session.feedback?.isCorrect ? '<span class="choice-mark" aria-label="正解">○</span>' : '<span class="choice-mark" aria-label="選んだ答え">×</span>';
  }
  return `<button class="edu-choice choice-card ${stateClass} edu-press" data-answer="${escapeHtml(choice)}" ${session.answered ? 'disabled' : ''} aria-pressed="${selected}"><span>${escapeHtml(choice)}</span>${suffix}</button>`;
}

function renderFeedback(feedback, speaker, question) {
  if (feedback.isCorrect) {
    const relationText = question.questionType === 'interrogative'
      ? 'たずねることばだね。'
      : question.targetRelation === 'speaker'
        ? `${speaker.name}の近くだね。`
        : question.targetRelation === 'listener'
          ? `${NAVI[question.listenerId].name}の近くだね。`
          : '2人から遠いところだね。';
    return `<div class="feedback-message feedback-success edu-status edu-status-success"><span class="edu-correct-mark" aria-hidden="true">○</span><div><strong>そう！ ${formatJapanese(relationText)}</strong><span>${feedback.combo > 1 ? `${feedback.combo}問れんぞく正解！` : 'つぎの場面へ進もう。'}</span></div></div><button class="edu-btn edu-btn-primary next-button" data-action="next-question">つぎへ <span aria-hidden="true">→</span></button>`;
  }
  const hint = question.questionType === 'interrogative'
    ? 'ものや場所が、いくつあるかな？'
    : 'だれの近くかな？ ★をもう一度見てみよう。';
  return `<div class="feedback-message feedback-retry edu-status edu-status-warning"><span class="edu-wrong-mark" aria-hidden="true">×</span><div><strong>もう一度、場面を見てみよう。</strong><span>${formatJapanese(hint)}</span></div></div><button class="edu-btn edu-btn-secondary next-button" data-action="next-question">つぎの場面へ <span aria-hidden="true">→</span></button>`;
}

function renderSceneSvg(question, scene) {
  const speaker = NAVI[question.speakerId];
  const listener = NAVI[question.listenerId];
  const people = scene.people;
  const object = scene.objects[0];
  const target = question.targetKind === 'place'
    ? scene.places.find((place) => place.id === question.focusPlaceId)
    : object;
  const showMultiple = question.candidateCount > 1;
  const showMultipleObjects = showMultiple && question.targetKind !== 'place';
  const objectPositions = showMultipleObjects
    ? [{ x: 330, y: 165 }, { x: 400, y: 150 }, { x: 470, y: 165 }]
    : [{ x: zoneX(object.zone), y: 165 }];
  const spotMarkup = scene.places.map((place) => {
    const active = !showMultiple && question.targetKind === 'place' && place.id === target?.id;
    return `<g class="svg-place ${active ? 'is-target' : ''}">
      <rect x="${place.x - 58}" y="${active ? 175 : 184}" width="116" height="${active ? 72 : 58}" rx="16"/>
      <text x="${place.x}" y="${active ? 205 : 214}" text-anchor="middle">${escapeHtml(place.label)}</text>
      ${active ? '<text x="' + place.x + '" y="234" text-anchor="middle" class="svg-marker-text">★ たいしょう</text>' : ''}
    </g>`;
  }).join('');
  const objectMarkup = question.targetKind === 'place'
    ? drawObject(object, zoneX(object.zone), 155, false)
    : objectPositions.map((position, index) => drawObject(object, position.x, position.y, !showMultipleObjects && index === 0)).join('');
  const roleMarkup = people.map((person) => {
    const isSpeaker = person.id === question.speakerId;
    const character = NAVI[person.id];
    const x = person.slot === 'A' ? 72 : 578;
    return `<g class="svg-person ${isSpeaker ? 'is-speaker' : 'is-listener'}">
      <rect class="svg-role-pill" x="${x - 12}" y="34" width="164" height="31" rx="15"/>
      <text class="svg-role-text" x="${x + 70}" y="55" text-anchor="middle">${isSpeaker ? '● はなす人' : '◎ きく人'}</text>
      <image href="${character.image}" x="${x}" y="90" width="140" height="215" preserveAspectRatio="xMidYMax meet" aria-label="${escapeHtml(character.alt)}"/>
      <text class="svg-name" x="${x + 70}" y="345" text-anchor="middle">${escapeHtml(character.name)}</text>
    </g>`;
  }).join('');
  const sourceX = question.speakerId === people[0].id ? 210 : 590;
  const targetX = question.targetKind === 'place' ? target?.x || 360 : (showMultiple ? 400 : zoneX(object.zone));
  const relationLine = !showMultiple
    ? `<path class="svg-relation-line" d="M ${sourceX} 118 Q ${(sourceX + targetX) / 2} 80 ${targetX} 150" marker-end="url(#arrow)"/><text class="svg-relation-note" x="${(sourceX + targetX) / 2}" y="86" text-anchor="middle">${question.targetRelation === 'far' ? 'はなれた場所' : '近く'}</text>`
    : '<text class="svg-question-mark" x="400" y="125" text-anchor="middle">？ どれかな？</text>';
  const description = `${scene.place}。${speaker.name}がはなす人、${listener.name}がきく人。${scene.description}`;

  return `<svg class="scene-svg" viewBox="0 0 800 380" role="img" aria-label="${escapeHtml(description)}">
    <title>${escapeHtml(description)}</title>
    <desc>${escapeHtml(showMultiple ? '同じなかまのもの、または場所が3つ表示されています。' : '話し手、聞き手、対象の位置を記号でも示しています。')}</desc>
    <defs>
      <pattern id="scene-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#dbeafe" stroke-width="1"/></pattern>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker>
    </defs>
    <rect class="svg-bg" x="0" y="0" width="800" height="380" rx="20"/>
    <rect class="svg-grid" x="18" y="18" width="764" height="344" rx="16"/>
    <text class="svg-place-title" x="35" y="27">${escapeHtml(scene.place)}</text>
    <line class="svg-floor" x1="28" y1="318" x2="772" y2="318"/>
    ${spotMarkup}
    ${objectMarkup}
    ${relationLine}
    ${roleMarkup}
  </svg>`;
}

function zoneX(zone) {
  return zone === 'A' ? 274 : zone === 'B' ? 526 : 400;
}

function drawObject(object, x, y, isTarget) {
  const label = escapeHtml(object.name);
  const targetClass = isTarget ? ' is-target' : '';
  let icon = '';
  switch (object.type) {
    case 'book':
    case 'notebook':
      icon = `<rect x="-28" y="-28" width="56" height="52" rx="6" fill="#fb7185" stroke="#9f1239" stroke-width="3"/><path d="M 0 -25 V 20" stroke="#9f1239" stroke-width="3"/><path d="M -18 -12 H -6 M -18 -2 H -6 M 8 -12 H 20 M 8 -2 H 20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'eraser':
      icon = `<g transform="rotate(-18)"><rect x="-32" y="-18" width="64" height="36" rx="8" fill="#a78bfa" stroke="#5b21b6" stroke-width="3"/><path d="M 12 -18 V 18" stroke="#ede9fe" stroke-width="6"/></g>`;
      break;
    case 'ball':
      icon = `<circle r="30" fill="#fbbf24" stroke="#a16207" stroke-width="3"/><path d="M -20 -18 Q 0 -4 20 -18 M -22 16 Q 0 2 22 16" fill="none" stroke="#fff" stroke-width="4"/>`;
      break;
    case 'card':
      icon = `<rect x="-28" y="-35" width="56" height="70" rx="8" fill="#34d399" stroke="#047857" stroke-width="3"/><circle r="14" fill="#fef3c7" stroke="#b45309" stroke-width="3"/><path d="M 0 -8 L 4 0 L 13 1 L 6 7 L 8 16 L 0 11 L -8 16 L -6 7 L -13 1 L -4 0 z" fill="#f59e0b"/>`;
      break;
    case 'bag':
      icon = `<path d="M -30 -12 Q -28 -28 0 -28 Q 28 -28 30 -12 L 26 30 H -26 Z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="3"/><path d="M -13 -14 Q -13 -38 0 -38 Q 13 -38 13 -14" fill="none" stroke="#1d4ed8" stroke-width="4"/><path d="M -20 2 H 20" stroke="#dbeafe" stroke-width="4"/>`;
      break;
    case 'pencil':
      icon = `<g transform="rotate(-28)"><path d="M -32 -10 L 22 -10 L 32 0 L 22 10 L -32 10 Z" fill="#facc15" stroke="#a16207" stroke-width="3"/><path d="M 22 -10 L 34 0 L 22 10" fill="#f5f5f4" stroke="#57534e" stroke-width="3"/><path d="M -22 -10 V 10 M 12 -10 V 10" stroke="#fff" stroke-width="3"/></g>`;
      break;
    case 'blackboard':
      icon = `<rect x="-55" y="-28" width="110" height="56" rx="5" fill="#166534" stroke="#713f12" stroke-width="7"/><path d="M -36 -8 H 15 M -36 8 H 30" stroke="#dcfce7" stroke-width="4" stroke-linecap="round"/><path d="M -42 36 H 42" stroke="#713f12" stroke-width="6"/>`;
      break;
    case 'clock':
      icon = `<circle r="31" fill="#fff" stroke="#475569" stroke-width="4"/><circle r="4" fill="#475569"/><path d="M 0 0 V -20 M 0 0 L 16 10" stroke="#475569" stroke-width="4" stroke-linecap="round"/>`;
      break;
    case 'tree':
      icon = `<path d="M -10 18 H 10 V 45 H -10 Z" fill="#92400e" stroke="#78350f" stroke-width="3"/><circle cx="0" cy="0" r="38" fill="#4ade80" stroke="#166534" stroke-width="4"/><circle cx="-25" cy="8" r="22" fill="#86efac" stroke="#166534" stroke-width="3"/><circle cx="26" cy="10" r="22" fill="#22c55e" stroke="#166534" stroke-width="3"/>`;
      break;
    case 'poster':
      icon = `<rect x="-33" y="-38" width="66" height="76" rx="5" fill="#fde68a" stroke="#b45309" stroke-width="3"/><circle cx="0" cy="-13" r="12" fill="#fb7185"/><path d="M -20 10 H 20 M -20 21 H 12" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>`;
      break;
    default:
      icon = '<circle r="28" fill="#cbd5e1" stroke="#475569" stroke-width="3"/>';
  }
  return `<g class="svg-object${targetClass}" transform="translate(${x} ${y})">
    ${isTarget ? '<circle class="svg-target-ring" r="54"/>' : ''}
    ${icon}
    <text class="svg-object-label" x="0" y="67" text-anchor="middle">${label}</text>
    ${isTarget ? '<text class="svg-marker-text" x="0" y="88" text-anchor="middle">★ たいしょう</text>' : ''}
  </g>`;
}

function renderDetective() {
  const scene = SCENE_BY_ID['classroom-book'];
  const listenerId = detectiveSpeakerId === 'riku' ? 'nami' : 'riku';
  const focusQuestion = {
    sceneId: scene.id,
    questionType: 'deictic',
    targetKind: 'object',
    targetRelation: detectiveSpeakerId === 'riku' ? 'speaker' : 'listener',
    speakerId: detectiveSpeakerId,
    listenerId,
    objectId: scene.objects[0].id,
    focusPlaceId: scene.focusPlaceId,
    targetZone: 'A'
  };
  const word = focusQuestion.targetRelation === 'speaker' ? 'これ' : 'それ';
  const speaker = NAVI[detectiveSpeakerId];
  return `
    <section class="detective-screen" aria-labelledby="detective-title">
      <div class="screen-back"><button class="edu-btn edu-btn-secondary" data-action="home">← ホームへ</button></div>
      <div class="detective-heading"><span class="section-kicker">ことば探偵</span><h1 id="detective-title">同じ本でも、ことばが変わる？</h1><p>はなす人を入れかえて、場面の見え方をくらべてみよう。</p></div>
      <div class="detective-layout">
        <article class="detective-demo edu-card edu-card-pad">
          <div class="scene-panel-head"><div><span class="section-kicker">同じ場面</span><h2>教室の本</h2></div><span class="scene-tag">視点を入れかえる</span></div>
          <div class="detective-speaker-row">
            <span>いまのはなす人</span>
            <div class="detective-speaker-buttons" role="group" aria-label="はなす人を選ぶ">
              ${['riku', 'nami'].map((id) => `<button class="detective-speaker ${detectiveSpeakerId === id ? 'is-active' : ''}" data-action="detective-view" data-speaker="${id}" aria-pressed="${detectiveSpeakerId === id}"><img src="${NAVI[id].image}" alt=""><span>${NAVI[id].name}</span></button>`).join('')}
            </div>
          </div>
          <div class="detective-scene">${renderSceneSvg(focusQuestion, scene)}</div>
          <div class="detective-sentence"><span>${escapeHtml(speaker.name)}が言うと…</span><strong>「${formatJapanese(`${word}本を見せて。`)}」</strong><div class="detective-answer"><span>こたえ</span><b>${word}</b></div></div>
        </article>
        <aside class="detective-guide">
          <div class="detective-rule edu-card edu-card-pad"><div class="section-kicker">ことばの地図</div><h2>だれから見た？</h2><div class="rule-list">
            <div class="rule-item ko"><b>これ・この・ここ</b><span>はなす人の近く</span></div>
            <div class="rule-item so"><b>それ・その・そこ</b><span>きく人の近く</span></div>
            <div class="rule-item a"><b>あれ・あの・あそこ</b><span>2人から遠い</span></div>
            <div class="rule-item do"><b>どれ・どの・どこ</b><span>たずねるとき</span></div>
          </div></div>
          <div class="detective-tip edu-status edu-status-info"><span class="tip-icon" aria-hidden="true">✦</span><div><strong>こつ</strong><span>まず「はなす人」を見つけよう。そこから近さを考えると分かりやすいよ。</span></div></div>
        </aside>
      </div>
      <div class="detective-start"><button class="edu-btn edu-btn-primary" data-action="start-practice">分かった！ れんしゅうへ →</button></div>
    </section>`;
}

function renderResult() {
  const result = lastResult || session?.result || { correct: 0, maxCombo: 0, weakSeries: 'ko', weakKind: 'object' };
  const weakSeriesLabel = result.weakSeries === 'do' ? '「ど」' : `「${SERIES_LABELS[result.weakSeries] || result.weakSeries}」`;
  const weakKindLabel = KIND_LABELS[result.weakKind] || 'ことば';
  const resultMessage = result.correct >= 9 ? 'ことばの距離が、よく見えているね！' : result.correct >= 6 ? '場面を見て考える力が育っているね。' : 'いろいろな場面を見て、もう一度ためしてみよう。';
  return `
    <section class="result-screen" aria-labelledby="result-title">
      <div class="result-hero edu-card edu-card-pad ${result.correct >= 8 ? 'is-great' : ''}">
        <span class="section-kicker">CHALLENGE COMPLETE</span>
        <h1 id="result-title">10問、おつかれさま！</h1>
        <div class="result-score"><strong>${result.correct}</strong><span>もん正解</span></div>
        <p>${formatJapanese(resultMessage)}</p>
      </div>
      <div class="result-grid">
        <div class="result-stat edu-stat edu-stat-primary"><span class="edu-stat-label">れんぞく正解</span><strong class="edu-stat-value">${result.maxCombo}<small>問</small></strong><span class="edu-stat-note">一番つづいた数</span></div>
        <div class="result-stat edu-stat edu-stat-success"><span class="edu-stat-label">今回の正答率</span><strong class="edu-stat-value">${result.accuracy}<small>%</small></strong><span class="edu-stat-note">見つけた関係</span></div>
        <div class="result-stat edu-stat"><span class="edu-stat-label">もう一度出る問題</span><strong class="edu-stat-value">${state.reviewQueue.length}<small>問</small></strong><span class="edu-stat-note">少し時間をあけて復習</span></div>
      </div>
      <div class="result-message edu-status edu-status-info"><span class="tip-icon" aria-hidden="true">🔎</span><div><strong>${weakSeriesLabel} × ${weakKindLabel}</strong><span>この組み合わせを、別の場面でもう少し見てみよう。</span></div></div>
      <div class="result-actions"><button class="edu-btn edu-btn-primary" data-action="restart-practice">もう10問</button><button class="edu-btn edu-btn-secondary" data-action="home">ホームへ</button></div>
    </section>`;
}

function buildSeriesPlan() {
  const weakFirst = [...SERIES].sort((first, second) => accuracy(first) - accuracy(second));
  return ['ko', 'so', 'a', 'do', weakFirst[0], weakFirst[1], weakFirst[2], weakFirst[3], weakFirst[0], weakFirst[1]];
}

function buildKindPlan() {
  return ['object', 'object', 'object', 'determiner', 'place', 'determiner', 'place', 'object', 'place', 'determiner'];
}

function startPractice() {
  scoreManager.reset();
  comboManager.reset();
  session = {
    questions: [],
    usedIds: new Set(),
    usedPairKeys: new Set(),
    seriesPlan: buildSeriesPlan(),
    kindPlan: buildKindPlan(),
    cooldowns: { ko: 0, so: 0, a: 0, do: 0 },
    correct: 0,
    wrong: 0,
    selectedAnswer: null,
    choiceOrder: null,
    feedback: null,
    hintOpen: false,
    pendingPairId: null,
    lastQuestionId: null,
    startedAt: Date.now(),
    focusSelector: null,
    result: null
  };
  screen = 'practice';
  appendNextQuestion();
  sounds.play('start');
  render();
}

function appendNextQuestion() {
  if (!session || session.questions.length >= SESSION_TOTAL) return;
  let question = null;

  if (session.pendingPairId && !session.usedIds.has(session.pendingPairId)) {
    question = QUESTION_BY_ID[session.pendingPairId] || null;
    session.pendingPairId = null;
  }

  if (!question && session.questions.length < STARTER_QUESTIONS.length) {
    const starter = STARTER_QUESTIONS[session.questions.length];
    if (starter && !session.usedIds.has(starter.id)) question = starter;
  }

  if (!question && session.questions.length >= 4 && session.questions.length <= 8 && Math.random() < 0.28) {
    question = pickViewpointStart();
  }
  if (!question) question = pickNextQuestion();
  if (!question) question = QUESTION_BANK.find((item) => !session.usedIds.has(item.id));
  if (!question) return;

  session.questions.push(question);
  session.usedIds.add(question.id);
  if (question.pairKey) session.usedPairKeys.add(question.pairKey);
  session.lastQuestionId = question.id;
  session.current = question;
  session.selectedAnswer = null;
  session.choiceOrder = shuffle(question.choices);
  session.feedback = null;
  session.hintOpen = false;
  session.focusSelector = '.choice-card';
  for (const key of SERIES) if (session.cooldowns[key] > 0) session.cooldowns[key] -= 1;
}

function candidateQuestions() {
  const unused = QUESTION_BANK.filter((question) => !session.usedIds.has(question.id) && question.id !== session.lastQuestionId);
  const cooled = unused.filter((question) => session.cooldowns[question.series] === 0);
  return cooled.length ? cooled : unused;
}

function pickNextQuestion() {
  let candidates = candidateQuestions();
  if (!candidates.length) return null;
  const desiredSeries = session.seriesPlan[session.questions.length] || 'ko';
  const desiredKind = session.kindPlan[session.questions.length] || 'object';
  const sameSeries = candidates.filter((question) => question.series === desiredSeries);
  if (sameSeries.length) candidates = sameSeries;
  const sameKind = candidates.filter((question) => question.targetKind === desiredKind);
  if (sameKind.length) candidates = sameKind;
  return chooseWeighted(candidates);
}

function pickViewpointStart() {
  let candidates = candidateQuestions().filter((question) => question.pairNextId && !question.isViewpointChange && question.pairKey && !session.usedPairKeys.has(question.pairKey));
  if (!candidates.length) return null;
  const desiredSeries = session.seriesPlan[session.questions.length];
  const sameSeries = candidates.filter((question) => question.series === desiredSeries);
  if (sameSeries.length) candidates = sameSeries;
  return chooseWeighted(candidates);
}

function chooseWeighted(candidates) {
  const weighted = [];
  candidates.forEach((question) => {
    const review = state.reviewQueue.find((item) => item.questionId === question.id);
    let weight = 1;
    if (review && review.availableAfter <= state.stats.answers) weight += 5;
    if (question.series === session.seriesPlan[session.questions.length]) weight += 3;
    if (question.targetKind === session.kindPlan[session.questions.length]) weight += 2;
    if (question.questionType === 'interrogative' && question.series === 'do') weight += 1;
    for (let index = 0; index < weight; index += 1) weighted.push(question);
  });
  // QuestionPoolを、確認済み候補の重み付き抽選に使う。
  const pool = new QuestionPool(weighted, { mode: 'random' });
  return pool.next() || candidates[0];
}

function recordAnswer(question, isCorrect) {
  state.stats.answers += 1;
  for (const key of [question.series, question.targetKind]) {
    const item = state.stats[key];
    item.total += 1;
    if (isCorrect) item.correct += 1;
    else {
      item.wrong += 1;
      item.lastWrongAt = state.stats.answers;
    }
  }

  const existing = state.reviewQueue.find((item) => item.questionId === question.id);
  if (isCorrect) {
    if (existing) {
      existing.streak = (existing.streak || 0) + 1;
      if (existing.streak >= 2) state.reviewQueue = state.reviewQueue.filter((item) => item.questionId !== question.id);
      else existing.availableAfter = state.stats.answers + 2;
    }
  } else if (existing) {
    existing.streak = 0;
    existing.availableAfter = state.stats.answers + 3;
    existing.lastWrongAt = state.stats.answers;
  } else {
    state.reviewQueue.push({ questionId: question.id, streak: 0, availableAfter: state.stats.answers + 3, lastWrongAt: state.stats.answers });
  }
  persistState();
}

function answerQuestion(answer) {
  if (!session || !session.current || session.feedback) return;
  const question = session.current;
  const isCorrect = checker.check(answer, question.answer, { detail: { question } });
  session.selectedAnswer = answer;
  const combo = isCorrect ? comboManager.correct() : comboManager.wrong();
  if (isCorrect) {
    scoreManager.correct(1);
    session.correct += 1;
    sounds.play(combo >= 3 ? 'combo3' : 'correct');
  } else {
    scoreManager.wrong(0);
    session.wrong += 1;
    session.cooldowns[question.series] = 3;
    sounds.play('softFail');
  }
  recordAnswer(question, isCorrect);
  session.feedback = { isCorrect, combo, correct: question.answer };
  session.focusSelector = '[data-action="next-question"]';
  render();
  requestAnimationFrame(() => {
    const answerCard = root.querySelector('#answer-card');
    window.EduEffects?.play(answerCard, isCorrect ? 'effect-correct-pop' : 'effect-wrong-shake');
  });
}

function advanceQuestion() {
  if (!session?.current || !session.feedback) return;
  const current = session.current;
  if (session.questions.length >= SESSION_TOTAL) {
    finishSession();
    return;
  }
  if (current.pairNextId && !current.isViewpointChange && !session.usedIds.has(current.pairNextId)) {
    session.pendingPairId = current.pairNextId;
  }
  appendNextQuestion();
  render();
}

function finishSession() {
  const result = {
    correct: session.correct,
    wrong: session.wrong,
    maxCombo: comboManager.getMax(),
    accuracy: Math.round((session.correct / SESSION_TOTAL) * 100),
    weakSeries: [...SERIES].sort((first, second) => accuracy(first) - accuracy(second))[0],
    weakKind: [...KINDS].sort((first, second) => accuracy(first) - accuracy(second))[0],
    finishedAt: new Date().toISOString()
  };
  lastResult = result;
  session.result = result;
  state.recentResults.unshift(result);
  persistState();
  screen = 'result';
  sounds.play(result.correct >= 8 ? 'clear' : 'practice');
  render();
  requestAnimationFrame(() => {
    if (result.correct >= 8) window.EduEffects?.confetti(root.querySelector('.result-hero'), 16);
  });
}

function showToast(message) {
  const toast = root.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 1800);
}

root.addEventListener('click', (event) => {
  const answerButton = event.target.closest('[data-answer]');
  if (answerButton) {
    event.preventDefault();
    answerQuestion(answerButton.dataset.answer);
    return;
  }
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === 'start-practice' || action === 'restart-practice') startPractice();
  else if (action === 'home') {
    screen = 'home';
    session = null;
    render();
  } else if (action === 'open-detective') {
    screen = 'detective';
    render();
  } else if (action === 'detective-view') {
    detectiveSpeakerId = actionTarget.dataset.speaker || 'riku';
    sounds.play('compare');
    render();
  } else if (action === 'next-question') advanceQuestion();
  else if (action === 'toggle-sound') {
    state.settings.sound = !state.settings.sound;
    persistState();
    if (state.settings.sound) sounds.play('soundOn');
    render();
  } else if (action === 'toggle-hint') {
    if (!session || session.feedback) return;
    session.hintOpen = !session.hintOpen;
    sounds.play('hint');
    render();
  }
});

root.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('[data-answer]')) {
    event.preventDefault();
    answerQuestion(event.target.dataset.answer);
  }
});

document.addEventListener(EDU_EVENTS.COMBO, (event) => {
  if (event.detail?.current >= 3) {
    const combo = root.querySelector('.session-count');
    combo?.classList.add('edu-kinetic-number');
  }
});

render();
