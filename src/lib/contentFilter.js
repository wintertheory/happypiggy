// 나중에 자유롭게 수정할 수 있는 최소 금칙어 배열입니다.
// 너무 공격적으로 막으면 평범한 기록도 저장되지 않을 수 있으니,
// 운영하면서 천천히 추가하는 방식을 권장합니다.
const BANNED_WORDS = [
  '광고',
  '홍보',
  '도박',
  '카지노',
  '대출',
  '성인사이트',
  'http://',
  'https://',
  'www.'
];

export function normalizeContent(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function validateHappinessNote(rawValue) {
  const content = normalizeContent(rawValue);

  if (!content) {
    return { ok: false, message: '빈 내용은 저금할 수 없어요.', content };
  }

  if (content.length > 60) {
    return { ok: false, message: '60자 이내로 적어주세요.', content };
  }

  const lowerContent = content.toLowerCase();
  const blockedWord = BANNED_WORDS.find((word) => lowerContent.includes(word.toLowerCase()));

  if (blockedWord) {
    return { ok: false, message: '저장할 수 없는 표현이 포함되어 있어요.', content };
  }

  return { ok: true, message: '', content };
}
