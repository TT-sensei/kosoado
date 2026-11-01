// 「こそあど！」の学習データ。
// Scene（場面の状態）と Question（視点から何を判断するか）を分け、
// 文章は確認済みのテンプレートと対象物の組み合わせだけで作ります。

export const APP_VERSION = '1.1.0';

const NAVI_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web/characters';

export const NAVI = {
  riku: {
    id: 'riku', name: 'りく', role: '落ち着いて考える',
    image: `${NAVI_BASE}/riku/fullbody/pointing.webp`,
    alt: 'りく'
  },
  sora: {
    id: 'sora', name: 'そら', role: '元気に動く',
    image: `${NAVI_BASE}/sora/fullbody/reaching.webp`,
    alt: 'そら'
  },
  kai: {
    id: 'kai', name: 'かい', role: 'よく観察する',
    image: `${NAVI_BASE}/kai/fullbody/pointing.webp`,
    alt: 'かい'
  },
  saku: {
    id: 'saku', name: 'さく', role: 'やさしく伝える',
    image: `${NAVI_BASE}/saku/fullbody/waving.webp`,
    alt: 'さく'
  },
  tsuki: {
    id: 'tsuki', name: 'つき', role: 'すばやく見つける',
    image: `${NAVI_BASE}/tsuki/fullbody/reaching-out.webp`,
    alt: 'つき'
  },
  nami: {
    id: 'nami', name: 'なみ', role: 'ていねいに考える',
    image: `${NAVI_BASE}/nami/fullbody/reaching-out.webp`,
    alt: 'なみ'
  }
};

export const NAVI_IDS = Object.keys(NAVI);

export const WORD_FORMS = {
  object: { speaker: 'これ', listener: 'それ', far: 'あれ', interrogative: 'どれ' },
  determiner: { speaker: 'この', listener: 'その', far: 'あの', interrogative: 'どの' },
  place: { speaker: 'ここ', listener: 'そこ', far: 'あそこ', interrogative: 'どこ' }
};

export const SERIES_LABELS = {
  ko: 'こ', so: 'そ', a: 'あ', do: 'ど'
};

export const KIND_LABELS = {
  object: 'もの',
  determiner: '名詞つき',
  place: '場所'
};

const makeObject = (id, type, name, reading, zone) => ({
  id, type, name, reading, zone
});

const makePlace = (id, label, zone, x) => ({ id, label, zone, x });

const DAILY_BACKGROUND_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web/backgrounds/daily';
const SCENE_BACKGROUNDS = {
  classroom: `${DAILY_BACKGROUND_BASE}/daily-classroom.webp`,
  schoolyard: `${DAILY_BACKGROUND_BASE}/daily-schoolyard.webp`,
  library: `${DAILY_BACKGROUND_BASE}/daily-library.webp`,
  gymnasium: `${DAILY_BACKGROUND_BASE}/daily-gymnasium.webp`
};

// Sceneは「だれがどこにいるか」「何がどこにあるか」だけを持つ。
// A / Bは左右の人物の位置、farは2人から離れた位置を表す。
export const SCENES = [
  {
    id: 'classroom-book',
    place: '教室',
    description: '教室で、2人が本を見ています。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'riku', slot: 'A' }, { id: 'nami', slot: 'B' }],
    objects: [makeObject('book', 'book', '本', 'ほん', 'A')],
    places: [
      makePlace('riku-desk', 'りくのつくえ', 'A', 235),
      makePlace('nami-desk', 'なみのつくえ', 'B', 485),
      makePlace('blackboard-front', '黒板の前', 'far', 360)
    ],
    focusPlaceId: 'riku-desk',
    templateByKind: { object: 'show', determiner: 'show', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'read', place: 'go' },
    starter: true
  },
  {
    id: 'desk-eraser',
    place: '教室',
    description: 'つくえの上に、消しゴムがあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'sora', slot: 'A' }, { id: 'kai', slot: 'B' }],
    objects: [makeObject('eraser', 'eraser', '消しゴム', 'けしゴム', 'B')],
    places: [
      makePlace('sora-desk', 'そらのつくえ', 'A', 235),
      makePlace('kai-desk', 'かいのつくえ', 'B', 485),
      makePlace('teacher-desk', '先生のつくえ', 'far', 360)
    ],
    focusPlaceId: 'kai-desk',
    templateByKind: { object: 'take', determiner: 'take', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'wait' }
  },
  {
    id: 'playground-ball',
    place: '校庭',
    description: '校庭で、ボールを使って遊んでいます。',
    backgroundImage: SCENE_BACKGROUNDS.schoolyard,
    people: [{ id: 'tsuki', slot: 'A' }, { id: 'saku', slot: 'B' }],
    objects: [makeObject('ball', 'ball', 'ボール', 'ボール', 'A')],
    places: [
      makePlace('tsuki-corner', 'つきの近く', 'A', 235),
      makePlace('saku-corner', 'さくの近く', 'B', 485),
      makePlace('goal-post', 'ゴールの前', 'far', 360)
    ],
    focusPlaceId: 'tsuki-corner',
    templateByKind: { object: 'show', determiner: 'show', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'board-look',
    place: '教室',
    description: '黒板は、2人から離れたところにあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'riku', slot: 'A' }, { id: 'kai', slot: 'B' }],
    objects: [makeObject('blackboard', 'blackboard', '黒板', 'こくばん', 'far')],
    places: [
      makePlace('riku-seat', 'りくの席', 'A', 235),
      makePlace('kai-seat', 'かいの席', 'B', 485),
      makePlace('board-front', '黒板の前', 'far', 360)
    ],
    focusPlaceId: 'board-front',
    templateByKind: { object: 'look', determiner: 'look', place: 'wait' },
    interrogativeTemplateByKind: { object: 'look', determiner: 'look', place: 'go' },
    starter: true
  },
  {
    id: 'corridor-clock',
    place: 'ろうか',
    description: 'ろうかの時計を、2人が見上げています。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'nami', slot: 'A' }, { id: 'sora', slot: 'B' }],
    objects: [makeObject('clock', 'clock', '時計', 'とけい', 'far')],
    places: [
      makePlace('nami-side', 'なみの近く', 'A', 235),
      makePlace('sora-side', 'そらの近く', 'B', 485),
      makePlace('clock-side', '時計の下', 'far', 360)
    ],
    focusPlaceId: 'clock-side',
    templateByKind: { object: 'look', determiner: 'look', place: 'go' },
    interrogativeTemplateByKind: { object: 'look', determiner: 'look', place: 'go' }
  },
  {
    id: 'library-notebook',
    place: '図書室',
    description: '図書室で、ノートを読んでいます。',
    backgroundImage: SCENE_BACKGROUNDS.library,
    people: [{ id: 'kai', slot: 'A' }, { id: 'saku', slot: 'B' }],
    objects: [makeObject('notebook', 'notebook', 'ノート', 'ノート', 'B')],
    places: [
      makePlace('kai-table', 'かいのつくえ', 'A', 235),
      makePlace('saku-table', 'さくのつくえ', 'B', 485),
      makePlace('bookshelf', '本だなの前', 'far', 360)
    ],
    focusPlaceId: 'saku-table',
    templateByKind: { object: 'show', determiner: 'read', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'read', place: 'wait' }
  },
  {
    id: 'art-card',
    place: '図工室',
    description: '図工室で、カードを使って作品を作っています。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'saku', slot: 'A' }, { id: 'tsuki', slot: 'B' }],
    objects: [makeObject('card', 'card', 'カード', 'カード', 'B')],
    places: [
      makePlace('saku-table', 'さくのつくえ', 'A', 235),
      makePlace('tsuki-table', 'つきのつくえ', 'B', 485),
      makePlace('shelf', 'たなの前', 'far', 360)
    ],
    focusPlaceId: 'tsuki-table',
    templateByKind: { object: 'take', determiner: 'take', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'classroom-bag',
    place: '教室',
    description: 'かばんが、そらの近くに置いてあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'sora', slot: 'A' }, { id: 'nami', slot: 'B' }],
    objects: [makeObject('bag', 'bag', 'かばん', 'かばん', 'A')],
    places: [
      makePlace('sora-seat', 'そらの席', 'A', 235),
      makePlace('nami-seat', 'なみの席', 'B', 485),
      makePlace('door', '教室の入り口', 'far', 360)
    ],
    focusPlaceId: 'sora-seat',
    templateByKind: { object: 'take', determiner: 'show', place: 'go' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'schoolyard-tree',
    place: '校庭',
    description: '木が、2人から離れたところに立っています。',
    backgroundImage: SCENE_BACKGROUNDS.schoolyard,
    people: [{ id: 'tsuki', slot: 'A' }, { id: 'riku', slot: 'B' }],
    objects: [makeObject('tree', 'tree', '木', 'き', 'far')],
    places: [
      makePlace('tsuki-side', 'つきの近く', 'A', 235),
      makePlace('riku-side', 'りくの近く', 'B', 485),
      makePlace('tree-side', '木のそば', 'far', 360)
    ],
    focusPlaceId: 'tree-side',
    templateByKind: { object: 'look', determiner: 'look', place: 'go' },
    interrogativeTemplateByKind: { object: 'look', determiner: 'look', place: 'go' }
  },
  {
    id: 'hall-poster',
    place: 'ろうか',
    description: 'ろうかに、学校のお知らせがはってあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'riku', slot: 'A' }, { id: 'saku', slot: 'B' }],
    objects: [makeObject('poster', 'poster', 'ポスター', 'ポスター', 'B')],
    places: [
      makePlace('riku-side', 'りくの近く', 'A', 235),
      makePlace('saku-side', 'さくの近く', 'B', 485),
      makePlace('notice-board', 'けいじ板の前', 'far', 360)
    ],
    focusPlaceId: 'saku-side',
    templateByKind: { object: 'look', determiner: 'look', place: 'wait' },
    interrogativeTemplateByKind: { object: 'look', determiner: 'look', place: 'go' }
  },
  {
    id: 'classroom-pencil',
    place: '教室',
    description: 'えんぴつが、なみの近くにあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'nami', slot: 'A' }, { id: 'kai', slot: 'B' }],
    objects: [makeObject('pencil', 'pencil', 'えんぴつ', 'えんぴつ', 'A')],
    places: [
      makePlace('nami-seat', 'なみの席', 'A', 235),
      makePlace('kai-seat', 'かいの席', 'B', 485),
      makePlace('shelf', '道具だなの前', 'far', 360)
    ],
    focusPlaceId: 'nami-seat',
    templateByKind: { object: 'take', determiner: 'take', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'music-gakufu',
    place: '音楽室',
    description: '音楽室で、2人が楽譜を見ています。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'tsuki', slot: 'A' }, { id: 'riku', slot: 'B' }],
    objects: [makeObject('gakufu', 'book', '楽譜', 'がくふ', 'B')],
    places: [
      makePlace('tsuki-seat', 'つきの席', 'A', 235),
      makePlace('riku-seat', 'りくの席', 'B', 485),
      makePlace('piano-front', 'ピアノの前', 'far', 360)
    ],
    focusPlaceId: 'riku-seat',
    templateByKind: { object: 'show', determiner: 'read', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'read', place: 'go' }
  },
  {
    id: 'gym-ball',
    place: '体育館',
    description: '体育館で、ボールを使って遊んでいます。',
    backgroundImage: SCENE_BACKGROUNDS.gymnasium,
    people: [{ id: 'sora', slot: 'A' }, { id: 'tsuki', slot: 'B' }],
    objects: [makeObject('gym-ball', 'ball', 'ボール', 'ボール', 'A')],
    places: [
      makePlace('sora-corner', 'そらの近く', 'A', 235),
      makePlace('tsuki-corner', 'つきの近く', 'B', 485),
      makePlace('stage-front', 'ステージの前', 'far', 360)
    ],
    focusPlaceId: 'sora-corner',
    templateByKind: { object: 'take', determiner: 'take', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'entrance-bag',
    place: '昇降口',
    description: '昇降口に、かばんが置いてあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'nami', slot: 'A' }, { id: 'sora', slot: 'B' }],
    objects: [makeObject('entrance-bag', 'bag', 'かばん', 'かばん', 'B')],
    places: [
      makePlace('nami-getabako', 'なみの下駄箱', 'A', 235),
      makePlace('sora-getabako', 'そらの下駄箱', 'B', 485),
      makePlace('door-front', '扉の前', 'far', 360)
    ],
    focusPlaceId: 'sora-getabako',
    templateByKind: { object: 'show', determiner: 'take', place: 'wait' },
    interrogativeTemplateByKind: { object: 'choose', determiner: 'choose', place: 'go' }
  },
  {
    id: 'health-poster',
    place: '保健室',
    description: '保健室の壁に、ポスターがはってあります。',
    backgroundImage: SCENE_BACKGROUNDS.classroom,
    people: [{ id: 'kai', slot: 'A' }, { id: 'nami', slot: 'B' }],
    objects: [makeObject('health-poster', 'poster', 'ポスター', 'ポスター', 'far')],
    places: [
      makePlace('kai-side', 'かいの近く', 'A', 235),
      makePlace('nami-side', 'なみの近く', 'B', 485),
      makePlace('poster-front', 'ポスターの前', 'far', 360)
    ],
    focusPlaceId: 'poster-front',
    templateByKind: { object: 'look', determiner: 'look', place: 'wait' },
    interrogativeTemplateByKind: { object: 'look', determiner: 'look', place: 'go' }
  }
];

export const SCENE_BY_ID = Object.fromEntries(SCENES.map((scene) => [scene.id, scene]));

// 文章として確認済みの対象物グループ。
// SCENESから自動で作らず、新しい対象物を追加したときに
// 「どの文型で使ってよいか」を必ず人間が見直す形にする。
const PORTABLE_OBJECT_TYPES = ['book', 'notebook', 'eraser', 'ball', 'card', 'bag', 'pencil'];
const LOOKABLE_OBJECT_TYPES = ['book', 'notebook', 'blackboard', 'clock', 'tree', 'poster', 'card'];

// 自由作文ではなく、ここに書かれた組み合わせだけを使う。
export const QUESTION_TEMPLATES = {
  object: {
    show: {
      id: 'show', allowedObjects: PORTABLE_OBJECT_TYPES,
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）を見せますか。' : '（　）を見せて。'
    },
    take: {
      id: 'take', allowedObjects: ['book', 'eraser', 'ball', 'card', 'bag', 'pencil', 'notebook'],
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）を取りますか。' : '（　）を取って。'
    },
    look: {
      id: 'look', allowedObjects: LOOKABLE_OBJECT_TYPES,
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）を見ますか。' : '（　）を見て。'
    },
    choose: {
      id: 'choose', allowedObjects: ['book', 'eraser', 'ball', 'card', 'bag', 'pencil', 'notebook'],
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）を使いますか。' : '（　）を使って。'
    }
  },
  determiner: {
    show: {
      id: 'show', allowedObjects: PORTABLE_OBJECT_TYPES,
      render: ({ noun, questionType }) => questionType === 'interrogative' ? `（　）${noun}を見せますか。` : `（　）${noun}を見せて。`
    },
    take: {
      id: 'take', allowedObjects: ['book', 'eraser', 'ball', 'card', 'bag', 'pencil', 'notebook'],
      render: ({ noun, questionType }) => questionType === 'interrogative' ? `（　）${noun}を取りますか。` : `（　）${noun}を取って。`
    },
    look: {
      id: 'look', allowedObjects: ['book', 'notebook', 'blackboard', 'clock', 'tree', 'poster', 'card'],
      render: ({ noun, questionType }) => questionType === 'interrogative' ? `（　）${noun}を見ますか。` : `（　）${noun}を見て。`
    },
    read: {
      id: 'read', allowedObjects: ['book', 'notebook'],
      render: ({ noun, questionType }) => questionType === 'interrogative' ? `（　）${noun}を読みますか。` : `（　）${noun}を読んで。`
    },
    choose: {
      id: 'choose', allowedObjects: PORTABLE_OBJECT_TYPES,
      render: ({ noun, questionType }) => questionType === 'interrogative' ? `（　）${noun}を使いますか。` : `（　）${noun}を使って。`
    }
  },
  place: {
    wait: {
      id: 'wait', allowedObjects: null,
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）で待ちますか。' : '（　）で待っていて。'
    },
    go: {
      id: 'go', allowedObjects: null,
      render: ({ questionType }) => questionType === 'interrogative' ? '（　）に行きますか。' : '（　）に行って。'
    }
  }
};

const relationFromZone = (scene, zone, speakerId, listenerId) => {
  if (zone === 'far') return 'far';
  const nearPerson = scene.people.find((person) => person.slot === zone)?.id;
  if (nearPerson === speakerId) return 'speaker';
  if (nearPerson === listenerId) return 'listener';
  return 'far';
};

const seriesFromRelation = (relation) => ({ speaker: 'ko', listener: 'so', far: 'a' }[relation]);

const sceneFocus = (scene, targetKind) => {
  if (targetKind === 'place') return scene.places.find((place) => place.id === scene.focusPlaceId);
  return scene.objects[0];
};

const makeQuestionId = (sceneId, targetKind, templateId, speakerId, listenerId, questionType) =>
  `q-${sceneId}-${targetKind}-${templateId}-${speakerId}-${listenerId}-${questionType}`;

const makeQuestion = (scene, targetKind, templateId, speakerId, listenerId, questionType) => {
  const target = sceneFocus(scene, targetKind);
  const object = scene.objects[0];
  const template = QUESTION_TEMPLATES[targetKind]?.[templateId];
  if (!template) throw new Error(`未定義のテンプレートです: ${scene.id}/${targetKind}/${templateId}`);
  if (targetKind !== 'place' && !template.allowedObjects.includes(object.type)) {
    throw new Error(`互換性のないテンプレートです: ${scene.id}/${targetKind}/${templateId}/${object.type}`);
  }

  // 疑問問題は「どの距離か」ではなく「たずねる語を選べるか」を問う。
  // そのため targetRelation は null のままにし、候補の表示は candidateCount で管理する。
  const targetRelation = questionType === 'interrogative'
    ? null
    : relationFromZone(scene, target.zone, speakerId, listenerId);
  const series = questionType === 'interrogative' ? 'do' : seriesFromRelation(targetRelation);
  const answerKey = questionType === 'interrogative' ? 'interrogative' : targetRelation;
  const answer = WORD_FORMS[targetKind][answerKey];
  const noun = object.name;
  const sentence = template.render({ noun, questionType });
  const id = makeQuestionId(scene.id, targetKind, templateId, speakerId, listenerId, questionType);

  return {
    id,
    sceneId: scene.id,
    questionType,
    targetKind,
    targetRelation,
    series,
    speakerId,
    listenerId,
    templateId,
    sentence,
    answer,
    choices: Object.values(WORD_FORMS[targetKind]),
    // 「ど」問題は距離を答えず、疑問語を選ぶ。画面には候補を3つ見せる。
    answerFocus: questionType === 'interrogative' ? 'interrogativeWord' : 'deicticRelation',
    objectId: object.id,
    focusPlaceId: scene.focusPlaceId,
    // これは「同じ問題を何回出すか」ではなく、画面に置く候補の数。
    candidateCount: questionType === 'interrogative' ? 3 : 1,
    targetZone: target.zone,
    isViewpointChange: false,
    pairKey: null,
    pairNextId: null,
    starterOrder: null
  };
};

const bank = [];
const byId = new Map();

for (const scene of SCENES) {
  const [first, second] = scene.people;

  for (const targetKind of ['object', 'determiner', 'place']) {
    const templateId = scene.templateByKind[targetKind];
    const firstQuestion = makeQuestion(scene, targetKind, templateId, first.id, second.id, 'deictic');
    const secondQuestion = makeQuestion(scene, targetKind, templateId, second.id, first.id, 'deictic');
    bank.push(firstQuestion, secondQuestion);

    // 同じ場面で話し手・聞き手を入れ替えるペアを作る。
    if (firstQuestion && secondQuestion && firstQuestion.targetRelation !== 'far' && secondQuestion.targetRelation !== 'far') {
      const pairKey = `pair-${scene.id}-${targetKind}-${templateId}`;
      firstQuestion.pairKey = pairKey;
      secondQuestion.pairKey = pairKey;
      firstQuestion.pairNextId = secondQuestion.id;
      secondQuestion.pairNextId = firstQuestion.id;
      firstQuestion.isViewpointChange = false;
      secondQuestion.isViewpointChange = true;
    }
  }

  for (const targetKind of ['object', 'determiner', 'place']) {
    const templateId = scene.interrogativeTemplateByKind[targetKind];
    const question = makeQuestion(scene, targetKind, templateId, first.id, second.id, 'interrogative');
    bank.push(question);
  }
}

for (const question of bank) byId.set(question.id, question);

// 入口の最初の4問は、こ→そ→あ→どが読み取りやすい固定順。
const starterMatches = [
  ['classroom-book', 'object', 'show', 'riku', 'nami', 'deictic'],
  ['classroom-book', 'object', 'show', 'nami', 'riku', 'deictic'],
  ['board-look', 'object', 'look', 'riku', 'kai', 'deictic'],
  ['classroom-book', 'determiner', 'read', 'riku', 'nami', 'interrogative']
];

starterMatches.forEach((parts, index) => {
  const id = makeQuestionId(...parts);
  const question = byId.get(id);
  if (!question) throw new Error(`スターター問題が見つかりません: ${id}`);
  if (!SCENE_BY_ID[parts[0]]?.starter) throw new Error(`スターター場面の印がありません: ${parts[0]}`);
  question.starterOrder = index + 1;
});

export const QUESTION_BANK = bank;
export const QUESTION_BY_ID = Object.fromEntries(bank.map((question) => [question.id, question]));
export const STARTER_QUESTIONS = bank
  .filter((question) => question.starterOrder)
  .sort((a, b) => a.starterOrder - b.starterOrder);
export const VIEWPOINT_QUESTIONS = bank.filter((question) => question.pairNextId);

export function answerGroup(answer) {
  if (answer === 'これ' || answer === 'この' || answer === 'ここ') return 'ko';
  if (answer === 'それ' || answer === 'その' || answer === 'そこ') return 'so';
  if (answer === 'あれ' || answer === 'あの' || answer === 'あそこ') return 'a';
  return 'do';
}

export function getSituation(scene, question) {
  if (question.questionType === 'interrogative') {
    if (question.targetKind === 'place') return '行けそうな場所が3つあります。';
    return `${scene.objects[0].name}が3つあります。`;
  }

  const target = sceneFocus(scene, question.targetKind);
  const targetName = question.targetKind === 'place' ? '場所' : scene.objects[0].name;
  if (target.zone === 'far') return `${targetName}は、2人からはなれたところにあります。`;
  const nearPerson = scene.people.find((person) => person.slot === target.zone);
  return `${targetName}は、${NAVI[nearPerson.id].name}さんの近くにあります。`;
}
