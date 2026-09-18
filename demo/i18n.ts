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
  'nav.playground': '플레이그라운드',
  'nav.themes': '테마',
  'nav.usage': '사용법',
  'hero.title': '<em>스와이프</em> 페이지네이션',
  'hero.lead':
    '모바일에 최적화된 반응형 페이지네이션입니다. 전통적인 페이지네이션의 문제인 직관성과 여러 번의 중복 클릭을 개선하여 사용자 경험을 향상시키기 위해 제작되었습니다.',
  'hero.page': '<strong id="hero-page">1,234</strong> / 5,000 페이지',
  'hero.dom': 'DOM 노드 <strong id="hero-dom">–</strong>개',
  'hero.range': '<strong id="hero-range">–</strong> 표시 중',
  'hero.hint':
    '숫자를 스와이프하거나 끌어서 스크롤하고, 화살표를 눌러 보세요(빠르게 연타도 해 보세요). Tab으로 들어가 ← → Home End로도 움직일 수 있습니다.',
  'why.title': '만든 이유',
  'why.1.title': '원하는 페이지까지 한 번에',
  'why.1.body':
    '기존 페이지네이션으로 1페이지에서 50페이지로 가려면 중간 페이지를 여러 번 거쳐야 하고, 그때마다 페이지가 새로 열립니다. 여기서는 50페이지까지 스와이프해서 한 번만 누르면 됩니다.',
  'why.2.title': '모바일 반응형',
  'why.2.body':
    '페이지가 수천 개를 넘어가면 버튼이 넓어져서 모바일에서는 여러 줄로 쪼개집니다. 모든 페이지가 하나의 스크롤 영역 안에 있어서 320px에서도 한 줄을 유지합니다. 폭이 넓어지면 페이지가 더 많이 보일 뿐입니다.',
  'why.3.title': '무한 페이지 표시',
  'why.3.body':
    '버튼 5,000개를 한꺼번에 그리면 화면이 멈춥니다. 화면에 보이는 번호만 그리고, 각 번호는 자릿수만큼의 폭만 차지해서 낭비되는 공간이 없습니다.',
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
  'how.title': '동작 원리',
  'how.1':
    '<strong>브라우저 기본 스크롤 영역.</strong> 번호들은 가로로 스크롤되는 상자 안의 넓고 빈 트랙 위에 놓입니다. 터치, 트랙패드, 휠 스크롤과 관성까지 브라우저가 그대로 처리합니다.',
  'how.2':
    '<strong>자릿수별 폭.</strong> 시작할 때 자릿수마다 번호 하나(8, 88, 888 …)의 폭을 잽니다. 자릿수가 같은 페이지는 폭도 같습니다.',
  'how.3':
    '<strong>좌표 ⇄ 페이지를 O(자릿수)로.</strong> 페이지의 왼쪽 좌표는 자릿수 구간별 합입니다. 15페이지는 <code>9 × w₁ + 5 × w₂</code> 위치에 있습니다. 반대로 스크롤 위치로부터 페이지를 구할 수도 있습니다.',
  'how.4':
    '<strong>보이는 것만 그리기.</strong> 스크롤할 때마다 화면 안의 페이지(와 약간의 여유분)만 절대 위치로 그리고, 요소는 재사용합니다. 페이지가 1,000,000개여도 요소는 20개 안팎입니다.',
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
