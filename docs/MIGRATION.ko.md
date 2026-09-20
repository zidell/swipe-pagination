# 기존 `Pagination.svelte`에서 옮겨오기

기존 프로젝트에서 쓰던 `Pagination.svelte`(`legacy/Pagination.svelte`)를 `swipe-pagination`으로 바꾸는 방법입니다.
jQuery, Bootstrap Icons, 전역 CSS 변수(`--bg-*-rgb`)에 대한 의존이 모두 사라집니다.

## 1. 설치

```bash
npm i swipe-pagination
```

가져오는 경로는 쓰고 있는 Svelte 버전에 따라 다릅니다. **아래 예제는 Svelte 3 기준**입니다.

| Svelte | import |
| --- | --- |
| 3 | `swipe-pagination/svelte3` |
| 4 | `swipe-pagination/svelte4` |
| 5 | `swipe-pagination/svelte` |

3과 4는 같은 컴포넌트 파일을 쓰고 타입만 다릅니다. 5는 runes로 작성된 별도 파일입니다. Svelte 3·4에서 실수로 `/svelte`를 쓰면 어느 경로를 쓰라는 에러가 바로 납니다. 반대로 Svelte 5에서 `/svelte4`를 써도 그냥 동작하니(runes를 강제한 프로젝트만 예외) 급하게 바꿀 필요는 없습니다.

## 2. 가장 빠른 방법: 기존 파일을 얇은 래퍼로 교체

호출하는 쪽 코드는 그대로 두고, 기존 `Pagination.svelte` 파일 내용만 아래로 바꿉니다.
props 이름(`total`, `active`, `onClick`, `sideMargin`)이 같아서 호출부 수정이 필요 없습니다.

```svelte
<script>
	import { SwipePagination } from 'swipe-pagination/svelte3';
	import 'swipe-pagination/style.css'; // Bootstrap을 쓰는 프로젝트라면 'swipe-pagination/themes/bootstrap5.css'

	export let total = 1;
	export let active = 1;
	export let onClick = undefined;
	export let sideMargin = 10;
	// 더 이상 필요 없음. 호출부에서 넘겨도 에러가 나지 않도록 받기만 한다.
	export let bgVariable = undefined;
	export let responsiveWindow = undefined;
</script>

<SwipePagination
	{total}
	{active}
	{sideMargin}
	onChange={(page) => onClick?.(page)}
	prevIcon={'<i class="bi bi-chevron-left"></i>'}
	nextIcon={'<i class="bi bi-chevron-right"></i>'}
/>
```

`prevIcon`/`nextIcon`은 기존처럼 Bootstrap Icons를 쓰고 싶을 때만 넣으면 됩니다. 빼면 내장 SVG 화살표가 들어갑니다.

## 3. 새로 작성하는 코드는 이렇게

```svelte
<script>
	import { SwipePagination } from 'swipe-pagination/svelte3';
	import 'swipe-pagination/style.css';

	let page = 1;
	$: load(page);
</script>

<SwipePagination total={totalPages} bind:active={page} />
```

나중에 Svelte 5로 올리면 import를 `swipe-pagination/svelte`로 바꾸고, `let page = 1`과 `$:` 대신 `let page = $state(1)`과 `$effect`를 쓰면 됩니다. props는 그대로입니다.

## props 대응표

| 기존 | 새 모듈 | 비고 |
| --- | --- | --- |
| `total` | `total` | 동일 |
| `active` | `active` (`bind:active` 가능) | 바뀌면 전체를 다시 만들던 방식에서 해당 페이지로 부드럽게 스크롤하는 방식으로 바뀜 |
| `onClick(page)` | `onChange(page, event)` | 아래 "동작 차이" 참고 |
| `sideMargin` (기본 10) | `sideMargin` (기본 8) | 같은 의미 |
| `bgVariable` | **없음** | 양끝 페이드를 배경색 덧칠 대신 CSS mask로 처리하므로 배경색을 알 필요가 없음 |
| `responsiveWindow` | **없음** | 항상 반응형. 창 크기가 아니라 컨테이너 크기를 감지(`ResizeObserver`)해서 사이드바 접힘 같은 경우에도 반응함 |

## 동작 차이

- **현재 페이지를 다시 눌러도 `onChange`가 호출되지 않습니다.** 기존 `onClick`은 현재 페이지를 눌러도 호출됐습니다.
  현재 페이지를 다시 눌렀을 때 새로고침하는 동작에 기대고 있었다면, 호출부에서 따로 처리해야 합니다.
- **값을 넣는 것과 이벤트는 분리돼 있습니다.** `active` prop이나 `setActive()`로 페이지를 바꾸면 `onChange`가 호출되지 않습니다.
  그래서 상태를 되먹여도 무한 루프가 생기지 않습니다.
- **화살표를 연타하면 누적됩니다.** 여러 번 빠르게 누르면 그만큼 더 멀리 스크롤됩니다(기존에는 누를 때마다 애니메이션이 처음부터 다시 시작됨).
- **창 크기가 바뀌어도 인스턴스를 다시 만들지 않습니다.** 가운데 보이던 위치를 유지한 채 폭만 다시 계산합니다.
- **jQuery `resize` 트리거가 없습니다.** 기존에는 props가 바뀌면 `jQuery(window).trigger('resize')`로 페이지 전체의 resize 핸들러를 실행시켰습니다. 이제 그런 부작용이 없습니다.

## 기존 CSS를 커스텀했다면: 클래스 대응표

| 기존 | 새 모듈 |
| --- | --- |
| `.pagination-root` | 호스트 요소(직접 넘기는 `div`) |
| `.pagination-wrapper` | `.swipe-pagination` (`<nav>`) |
| `.pagination-left` / `.pagination-right` | `.swipe-pagination__arrow--prev` / `--next` |
| `.pagination-center`, `.pagination-scrollbar-margin` | `.swipe-pagination__viewport` |
| `.pagination-inner` | `.swipe-pagination__track` |
| `.pagination-item` | `.swipe-pagination__item` |
| `.pagination-item.active` | `.swipe-pagination__item[aria-current='page']` 또는 `.swipe-pagination__item--active` |
| `--bg-back` | 사용 안 함. 페이드 폭은 `--sp-fade`로 조절 |

색상과 크기는 가능하면 CSS를 덮어쓰기보다 [CSS 변수](../README.md#css-variables)(`--sp-active-bg`, `--sp-size` 등)로 바꾸는 편이 간단합니다.

## 기존 코드에 있던 버그 (새 모듈에서 해결됨)

이전하면 아래 문제가 함께 사라집니다.

- `destroyPagination()`에 `destory` 오타가 있어서 해제가 한 번도 실행되지 않았습니다. 그 결과 창 크기나 `total`이 바뀌어도 다시 만들어지지 않았습니다.
- `style="--innerWidth:${innerWidth}px"`는 Svelte 문법이 아니어서 값이 들어가지 않았습니다.
- 인스턴스가 만들어지기 전에 `active` 반응형 블록이 실행되면 `undefined.setActive`로 오류가 날 수 있었습니다.
- id를 `Date.now()`로 만들어서, 같은 밀리초에 두 개가 마운트되면 서로의 DOM을 잡을 수 있었습니다.
- 스크롤할 때마다 아이템을 전부 지우고 다시 만들었습니다. 이제는 보이는 범위에서 들어오고 나가는 것만 추가·제거합니다.

## React / Vue 프로젝트

사용법은 [README](../README.md#quick-start)를 참고하세요. props는 Svelte와 같습니다.
