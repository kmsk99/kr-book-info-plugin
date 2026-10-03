# YES24 integration research and verification

Date: 2026-10-03. Baseline: master `a9870a9`, release `1.4.0`, PR #19 `dd6b6f2`.

## Sources inspected

- [YES24 desktop search JavaScript](https://www.yes24.com/Product/Scripts/Search/search.js?v=20260526a)
- [YES24 mobile search JavaScript](https://m.yes24.com/Scripts/Search/searchResult.js?v=20260922a)
- [Example product](https://www.yes24.com/Product/Goods/108422348)
- [Obsidian: Modals](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/User%20interface/Modals.md)
- [Obsidian: Vault](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Vault.md)
- [Official TypeScript API](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts)
- [Obsidian: release workflow](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Releasing/Release%20your%20plugin%20with%20GitHub%20Actions.md)

## Findings

The old `/Product/searchapi/bulletsearch/goods` endpoint serves autocomplete.
It returns a small mixed-domain list. A title highlight does not distinguish a
single book from a set. For 채식주의자, both products 134872831 (set) and 108422348
(single volume) match. Never silently choose the first result.

The desktop search UI calls `GET /product/search/SearchContentsJson` with:

| Parameter | Observed value used |
| --- | --- |
| query | User's text, encoded once with URLSearchParams |
| domain | BOOK, FOREIGN, EBOOK |
| page / size | 1-based page, 24 |
| order | RELATION (the site's 정확도순 control) |
| isSchTotal / isQueryProcessed | false / false |

The endpoint returns `{listHtml, filterHtml, EventResult}`. It is a JSON envelope
around HTML fragments, not a structured book list. The mobile equivalent
`/Search/SearchContentsJson` uses the same approach. Login, cookies and API keys
were not needed for these calls. Confirmed queries include Korean titles, ISBN,
C++, no matches, foreign books, ebooks and page 2. No exhaustive claim is made
about unobserved YES24 endpoints.

Product pages contain `application/ld+json` with Book/Product metadata: title,
author, publisher, ISBN, publication date, number of pages and cover. The plugin
reads the top-level Book or @graph Book for the selected product ID, never its
related `workExample` products. Missing/malformed structured data falls back to
semantic HTML selectors and labelled table rows. Full introduction and contents
remain HTML/textarea data. The truncated JSON-LD description is not used as the
full introduction. Parsed markup is not executed or inserted into the modal.

## UI and persistence

Use Obsidian's public `Modal` API with native form controls and result buttons.
Explicit search and pagination fit this UI better than a local fuzzy filter.
All results, including a single match, require user selection. Show title,
author, publisher, publication month, domain and edition. Requests time out after
15 seconds; cancelled/obsolete responses cannot repopulate the modal.
`requestUrl` has no abort facility here; timeout/close discards late results.

Capture the original TFile before opening the modal. Cancellation performs no
writes. Check filename collisions before writes. Use `processFrontMatter` for
properties, `Vault.process` for a managed body block, then await
`FileManager.renameFile`. Personal fields and unrelated properties/body are
preserved. Edits inside the clearly documented generated block are replaced on
reimport. Separate metadata/body/rename operations are not one transaction: a
later failure can leave earlier saves in place; rename failures explicitly say
that the information was saved. No automatic destructive rollback is attempted.

## Verification

- 97 automated tests passed; whole-project statement/line/function coverage 100%,
  branch coverage 98.37% (src branches 98.23%). Thresholds now also cover main.ts
  and require at least 95% branches.
- TypeScript check and production build passed.
- Tests use reduced real responses in `tests/fixtures`; the integration test is
  explicitly distinguished from native app testing.
- Native Obsidian 1.12.7 ran in a separate user-data directory and temporary vault.
  The plugin used real Obsidian `requestUrl` to contact YES24, with no network mock.
- Selected 채식주의자 single volume: ISBN 9788936434595, 276 pages, full introduction;
  existing text, status, rating and custom property remained intact.
- Pagination returned 24 items then 10 items; next disabled on the last page.
- Cancel and no-result search left the file unchanged; ISBN 9788937460449 returned 데미안.
- Final 1.5.0 bundle: checked fresh import/rename, repeat import without duplicate
  generated blocks, and filename collision rejection before any write.
- Mobile-native Obsidian and the minimum supported 1.8.0 were not run. The modal
  uses public APIs available at that minimum version and responsive theme CSS.

## Release/maintenance

CI's pnpm/action-setup version conflicted with package.json's packageManager.
Keep the version solely in package.json; install with the frozen lockfile.
The release workflow validates matching package/manifest/tag versions, runs tests
and builds the release assets, then creates a draft release. GitHub CI and the
new release workflow still require a remote run; local success is not a claim
that a GitHub run or public release has completed.

## Additional regression audit (2026-10-03)

Compared with the initial 37-test implementation, tests now execute every settings
control, all eight output-option combinations, reserved query characters, malformed
metadata, request cleanup/retry, concurrent input changes and production bundle flows.
Five regression tests failed before their fixes and now pass:

1. Disabling the plugin during detail fetch must discard the late result.
2. YAML closing delimiters at EOF must remain on their own line.
3. A note moved during persistence must not be renamed back to its previous folder.
4. Body-write failures after successful frontmatter updates must report partial success.
5. Broken result markup on page 2 must not masquerade as an empty search.

Six deliberate mutations were each detected by the tests: wrong search ordering,
removing page-2 validation, removing the unload guard, overwriting personal values,
leaking request timers, and fetching by the original title instead of the selected ID.
This is a targeted regression check, not an exhaustive mutation-testing score.

The final code was also exercised in native Obsidian 1.13.7 in the isolated vault:
correct product ID, preserved rating/body, a single generated block and cancellation
on plugin unload were confirmed using real YES24 requests.

Removed obsolete 1.4.0 archives, the tracked generated main.js and unused legacy
ESLint configuration/dependencies. Historical release assets remain available on
GitHub. Production assets are rebuilt and tested, then attached to the release.
