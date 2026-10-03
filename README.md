# KR Book Info

![CI](https://github.com/kmsk99/kr-book-info-plugin/actions/workflows/ci.yml/badge.svg)

-   This plugin imports the book information of Yes24 into Front Matter in the document.
-   이 플러그인은 예스24의 책 정보를 문서 내 프론트매터로 가져옵니다.

## 사용 방법 (1.5.0)

1. 정보를 넣을 Markdown 노트를 열고 `Add Book Info` 명령이나 리본 버튼을 실행합니다.
2. 노트 제목으로 검색한 목록에서 저자·출판사·발행월·판본을 확인합니다.
3. 원하는 도서를 누르면 해당 상품의 정보를 가져옵니다. 결과가 하나여도 직접 선택합니다.

제목, 저자 또는 ISBN으로 다시 검색할 수 있습니다. 국내도서·외국도서·전자책을
전환하고 이전/다음 페이지로 이동할 수 있습니다. 품절 도서도 검색에 포함됩니다.
취소하거나 검색 결과가 없으면 노트를 변경하지 않습니다.

- 기존 `status`, `my_rate`, `book_note`, 독서 날짜, `tag`와 사용자 속성을 보존합니다.
- 제목·저자·ISBN 등 도서 속성은 선택한 도서로 갱신합니다.
- 본문의 `kr-book-info` 주석 사이만 재실행 시 교체합니다. 그 밖의 본문은 보존합니다.
  생성 영역 안에 쓴 내용은 다음 실행 시 교체되므로 독서 메모는 영역 밖에 작성하세요.
- 같은 파일 이름이 이미 있으면 저장 전에 중단합니다.
- 검색어를 YES24에 보내며 계정·API 키는 필요하지 않습니다.
- 새 도서 속성: `publisher`, `isbn`, `yes24_url`.

YES24의 검색 API와 상세 페이지 구조에 의존합니다. 검색 API는 HTML 조각을 담은
JSON을 반환하며, 상세정보는 JSON-LD를 우선 사용합니다.
[조사 및 검증 기록](docs/yes24-integration.md)

## 개발

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

`main.js`, `manifest.json`, `styles.css`가 배포 파일입니다. `1.5.0`처럼 manifest 버전과
일치하는 태그를 푸시하면 테스트·빌드를 거쳐 **초안 릴리스**가 생성됩니다.
Obsidian에서 검증한 뒤 릴리스 노트를 확인하고 게시하세요.

## 저장되는 정보 예시

```yaml
---
title: 데미안
author: 헤르만 헤세
publisher: 민음사
isbn: "9788937460449"
total_page: 239
publish_date: 2000-12-20
cover_url: https://image.yes24.com/goods/176787/xl
yes24_url: https://www.yes24.com/Product/Goods/176787
status: 읽는 중
my_rate: 5
---
```

기본 Tag, Status, Rate, Book Note와 본문 제목·책소개·목차 삽입 여부는 설정에서
바꿀 수 있습니다. 기본값은 해당 속성이 없는 노트에만 적용합니다.

## English

Run **Add Book Info** from the command palette or ribbon with a Markdown note open.
Search by title, author or ISBN, then choose the edition you want. The list shows
publication details and supports Korean books, foreign books, ebooks and pagination.
Cancelling leaves your note unchanged. Personal reading properties and text outside
the generated section are preserved. Text inside the generated section is replaced
on the next import.

The plugin sends search terms to YES24. No account or API key is required.
YES24 can change its unofficial endpoints or page structure; see the linked research
and verification notes for the current assumptions and test scope.

## Tests

97 unit, integration and release bundle tests cover recorded YES24 responses, selection/cancellation,
request failures, persistence and collisions. Coverage thresholds cover main.ts and src/ at
100% statements, lines and functions, and 95% branches. Native Obsidian testing is
recorded separately in the verification notes.

```sh
pnpm exec jest --watch
pnpm run dev
```
