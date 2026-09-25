export type Lang = 'en' | 'ko';

/** Korean if the browser's preferred language is Korean, English otherwise. `?lang=` overrides. */
function detect(): Lang {
  const forced = new URLSearchParams(location.search).get('lang');
  if (forced === 'en' || forced === 'ko') return forced;
  const preferred = navigator.languages?.[0] ?? navigator.language ?? '';
  return preferred.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export const lang = detect();

export const tx = (en: string, ko: string) => (lang === 'ko' ? ko : en);

/** Korean markup for elements marked `data-i18n` in index.html (English lives in the HTML itself). */
const KO: Record<string, string> = {
  'hero.title': '<em>스와이프</em> 페이지네이션',
  'hero.lead':
    '모바일에 최적화된 반응형 페이지네이션입니다. 전통적인 페이지네이션의 문제인 직관성과 여러 번의 중복 클릭을 개선하여 사용자 경험을 향상시키기 위해 제작되었습니다.',
  'hero.desktop': '데스크탑',
  'hero.mobile': '모바일',
  'why.title': '만든 이유',
  'why.1.title': '원하는 페이지까지 한 번에',
  'why.1.body':
    '사용법이 헷갈리지 않으며 원하는 페이지까지 한 번에 갈 수 있습니다.',
  'why.2.title': '모바일 반응형',
  'why.2.body':
    '넓은 데스크탑과 좁은 모바일에서도 디자인이 깨지지 않고 반응형으로 표시됩니다.',
  'why.3.title': '무한 페이지 표시',
  'why.3.body':
    '페이지가 아무리 많아도 성능저하 없이 Virtual DOM 방식으로 렌더링합니다.',
  'pg.title': '플레이그라운드',
  'pg.lead': '상자 오른쪽 아래 모서리를 끌어 폭을 바꿔 보세요. 모든 컨트롤은 옵션이나 메서드에 그대로 대응합니다.',
  'pg.dom': 'DOM 노드',
  'pg.href': 'href → &lt;a&gt; 링크로 렌더링',
  'pg.hint.sideMargin': '첫 페이지 앞과 마지막 페이지 뒤의 여백입니다. 양 끝까지 스크롤해야 보입니다.',
  'pg.hint.scrollStep': '화살표 한 번에 이동하는 거리입니다. 화살표를 눌러 확인하세요.',
  'pg.hint.duration': '화살표나 페이지를 누를 때의 애니메이션 시간입니다. 화살표를 눌러 확인하세요.',
  'pg.hint.overscan': '화면 밖에 미리 그려 두는 폭입니다. 왼쪽 ‘DOM 노드’ 수가 바뀝니다.',
  'themes.title': '테마',
  'themes.lead':
    '각 테마는 해당 UI 라이브러리의 CSS 변수를 읽어서 브랜드 색상, 모서리, 다크 모드를 그대로 따라갑니다. 파일 하나만 import하면 됩니다. Tailwind처럼 유틸리티 클래스를 쓴다면 대신 <code>classNames</code>를 넘기세요.',
  'usage.title': '사용법',
  'api.options': '옵션',
  'api.methods': '메서드',
  'api.vars': 'CSS 변수',
  'api.classes': '클래스 이름',
  'api.classes.lead':
    '기본 클래스는 항상 붙어 있습니다. <code>classNames</code>에 넣은 문자열은 그 뒤에 덧붙기 때문에, 스타일을 더할 뿐 레이아웃을 대체하지 않습니다.',
  'how.title': '기타',
  'how.aside':
    '“<a href="https://maxzidell.medium.com/c4252df8dca7">모바일을 위한 새로운 페이지네이션</a>”에서의 구상을 토대로 구현',
  'how.production': '<a href="https://videostew.com">비디오스튜(videostew.com)</a>에서 실사용하며 검증함',
  'footer.license': 'MIT 라이선스',
};

export function applyStaticText() {
  document.documentElement.lang = lang;
  if (lang !== 'ko') return;
  requestAnimationFrame(() => document.documentElement.classList.remove('i18n-pending'));
  document.title = 'swipe-pagination — 스와이프 페이지네이션';
  document.querySelector('#theme-toggle')?.setAttribute('aria-label', '다크 모드 전환');
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const text = KO[el.dataset.i18n!];
    if (text) el.innerHTML = text;
  }
  for (const el of document.querySelectorAll<HTMLElement>('.copy')) el.textContent = '복사';
}
