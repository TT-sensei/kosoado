import assert from 'node:assert/strict';
import {
  QUESTION_BANK,
  QUESTION_BY_ID,
  QUESTION_TEMPLATES,
  SCENES,
  SCENE_BY_ID,
  SERIES_LABELS,
  STARTER_QUESTIONS,
  WORD_FORMS
} from '../data.js';

const seen = new Set();
for (const question of QUESTION_BANK) {
  assert(!seen.has(question.id), `重複した問題ID: ${question.id}`);
  seen.add(question.id);
  assert(SCENE_BY_ID[question.sceneId], `Sceneがありません: ${question.sceneId}`);
  assert.equal(question.targetRelation === 'unknown', false, `unknownは禁止: ${question.id}`);
  assert(Object.values(WORD_FORMS[question.targetKind]).includes(question.answer), `正解が語彙表にありません: ${question.id}`);
  assert(question.choices.includes(question.answer), `正解が選択肢にありません: ${question.id}`);
  assert.equal(new Set(question.choices).size, 4, `4系列がそろっていません: ${question.id}`);
  assert.equal(question.questionType === 'interrogative', question.series === 'do', `ど系列の分類が不一致: ${question.id}`);
  if (question.questionType === 'interrogative') {
    assert.equal(question.targetRelation, null, `疑問問題に距離関係を入れない: ${question.id}`);
  } else {
    assert(['speaker', 'listener', 'far'].includes(question.targetRelation), `距離関係が不正です: ${question.id}`);
  }
  assert.equal(question.answerFocus, question.questionType === 'interrogative' ? 'interrogativeWord' : 'deicticRelation', `答えの焦点が不一致: ${question.id}`);
  assert.equal(question.candidateCount, question.questionType === 'interrogative' ? 3 : 1, `候補数が不一致: ${question.id}`);
  const scene = SCENE_BY_ID[question.sceneId];
  const template = QUESTION_TEMPLATES[question.targetKind]?.[question.templateId];
  assert(template, `テンプレートがありません: ${question.id}`);
  if (question.targetKind !== 'place') assert(template.allowedObjects.includes(scene.objects[0].type), `互換性のない組み合わせ: ${question.id}`);
}

for (const scene of SCENES) {
  assert.equal(scene.people.length, 2, `通常場面は2人: ${scene.id}`);
  assert(typeof scene.backgroundImage === 'string' && scene.backgroundImage.endsWith('.webp'), `場面背景がありません: ${scene.id}`);
  assert(scene.people.some((person) => person.slot === 'A') && scene.people.some((person) => person.slot === 'B'), `人物位置が不足: ${scene.id}`);
  assert(scene.objects.length >= 1, `対象物がありません: ${scene.id}`);
  assert(scene.places.some((place) => place.id === scene.focusPlaceId), `焦点場所がありません: ${scene.id}`);
  for (const kind of ['object', 'determiner', 'place']) {
    const deicticTemplateId = scene.templateByKind[kind];
    const interrogativeTemplateId = scene.interrogativeTemplateByKind[kind];
    assert(QUESTION_TEMPLATES[kind]?.[deicticTemplateId], `通常テンプレートがありません: ${scene.id}/${kind}`);
    assert(QUESTION_TEMPLATES[kind]?.[interrogativeTemplateId], `疑問テンプレートがありません: ${scene.id}/${kind}`);
    if (kind !== 'place') {
      assert(QUESTION_TEMPLATES[kind][deicticTemplateId].allowedObjects.includes(scene.objects[0].type), `通常テンプレートの互換性がありません: ${scene.id}/${kind}`);
      assert(QUESTION_TEMPLATES[kind][interrogativeTemplateId].allowedObjects.includes(scene.objects[0].type), `疑問テンプレートの互換性がありません: ${scene.id}/${kind}`);
    }
    const deicticQuestions = QUESTION_BANK.filter((question) => question.sceneId === scene.id && question.targetKind === kind && question.questionType === 'deictic');
    assert.equal(deicticQuestions.length, 2, `通常問題が2視点ありません: ${scene.id}/${kind}`);
    assert(deicticQuestions.some((question) => question.speakerId === scene.people[0].id && question.listenerId === scene.people[1].id), `1つ目の視点がありません: ${scene.id}/${kind}`);
    assert(deicticQuestions.some((question) => question.speakerId === scene.people[1].id && question.listenerId === scene.people[0].id), `2つ目の視点がありません: ${scene.id}/${kind}`);
    const hasFarTarget = deicticQuestions.some((question) => question.targetRelation === 'far');
    assert.equal(new Set(deicticQuestions.map((question) => question.pairKey).filter(Boolean)).size, hasFarTarget ? 0 : 1, `視点ペアの設定が不一致: ${scene.id}/${kind}`);
    assert.equal(QUESTION_BANK.filter((question) => question.sceneId === scene.id && question.targetKind === kind && question.questionType === 'interrogative').length, 1, `疑問問題がありません: ${scene.id}/${kind}`);
  }
}

assert.equal(new Set(QUESTION_BANK.map((question) => question.sceneId)).size, SCENES.length, '未使用のSceneがあります');

for (const key of ['ko', 'so', 'a', 'do']) {
  assert(QUESTION_BANK.filter((question) => question.series === key).length >= 4, `系列が少なすぎます: ${key}`);
}
for (const key of ['object', 'determiner', 'place']) {
  assert(QUESTION_BANK.filter((question) => question.targetKind === key).length >= 4, `種類が少なすぎます: ${key}`);
}

assert.equal(STARTER_QUESTIONS.length, 4, '最初の4問がそろっていません');
assert.equal(new Set(STARTER_QUESTIONS.map((question) => question.id)).size, 4, '最初の4問が重複しています');
assert(STARTER_QUESTIONS.every((question) => SCENE_BY_ID[question.sceneId].starter), 'スターター問題がstarter場面にありません');
assert.equal(Object.keys(QUESTION_BY_ID).length, QUESTION_BANK.length, '問題一覧の索引が不一致です');
assert.equal(Object.keys(SERIES_LABELS).length, 4, '系列ラベルが不足しています');

console.log(`OK: ${SCENES.length} scenes / ${QUESTION_BANK.length} questions / ${STARTER_QUESTIONS.length} starters`);
