# KR Book Info

![CI](https://github.com/YOUR_USERNAME/kr-book-info-plugin/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/kr-book-info-plugin/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/kr-book-info-plugin)

-   This plugin imports the book information of Yes24 into Front Matter in the document.
-   이 플러그인은 예스24의 책 정보를 문서 내 프론트매터로 가져옵니다.

## Features

-   An example of the frontmatter format is as follows
-   프론트매터 형식의 예시는 아래와 같습니다

```
---
created: 2022-04-00 00:00
tag: 📚독서 국내도서 경제경영 경제 경제상식/경제이야기
title: 부의 추월차선：부자들이 말해 주지 않는 진정한 부를 얻는 방법
author: 엠제이 드마코, 신소영
category: 경제경영
total_page: 392
publish_date: 2022-02-00
cover_url: http://image.yes24.com/goods/106369008/XL
status: 🟩 완료
start_read_date: 2022-04-00
finish_read_date: 2022-04-00
my_rate: 0
book_note: ❌
---

# 부의 추월차선：부자들이 말해 주지 않는 진정한 부를 얻는 방법
```

## Usage

-   Click the Add Book Info button on the left to run it
-   왼쪽의 Add Book Info 버튼을 눌러 실행합니다
-   When executed, the title and content of the document are changed, and a Front Matter is inserted over the existing content.
-   실행 시 문서 제목과 내용이 변경되며, 기존 내용 위에 프론트매터가 삽입됩니다.
-   Execution time is around 5 to 10 seconds.
-   실행 시간은 5 ~ 10초 내외입니다.
-   설정에서 Tag, Status, Rate, Book Note의 기본값과 본문 내 제목 삽입 유무를 설정 가능합니다

## Development

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage
```

### Building

```bash
# Development build
pnpm run dev

# Production build
pnpm run build
```

## Test Coverage

This project maintains high test coverage:
- **src/ directory**: 100% line coverage, 100% function coverage
- **Overall**: 75%+ line coverage
- Tests include unit tests, integration tests, and E2E tests

