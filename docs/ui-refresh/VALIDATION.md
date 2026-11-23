# DENT-Z UI refresh validation

The refresh adds a separate presentation stylesheet to the three existing HTML entry points. It updates the storefront, responsive navigation, articles, ingredients, comparison, reviews, product configurator, consultation, footer and modal styling. The direction follows the supplied INGU reference using DENT-Z branding and existing product assets.

## Preservation

Compared against main commit `398a688744b40a9d420d0d049c06a1c6c0670f89`:

- All 32 original script blocks are byte-identical (30 executable scripts and 2 JSON-LD blocks).
- Form contracts, field names and attributes, static IDs and inline event handlers are unchanged.
- All 42 other original files, including both Apps Script backend files, are byte-identical.
- Root, Deploy and Upload HTML remain identical. Folder stylesheet asset paths resolve to the root images.
- No storage clearing, data migration, Firebase schema, Apps Script change, or authentication change was introduced.
- The companion root-domain repository is unchanged.

## Browser validation

Offline Chromium: original baseline **45/45**, redesigned candidate **45/45**. No uncaught JavaScript errors or local HTTP failures. Additional visual reconciliation verified payment-header and upload-helper contrast on both 390px and 320px screens; the payment heading contrast is 14.21:1. Cancel still returns to checkout.

Checked widths: 1440, 1024, 768, 390 and 320px; no horizontal page overflow. Root, Deploy and Upload entry points load their stylesheet and assets.

Functional scope: section navigation; Google-login modal open/close; all 18 quiz questions, Back, result and guest storage; articles, image zoom, all-articles, Back and close; four support tiers; three product previews and keyboard activation; checkout open/close/reopen; preset and custom amounts; eight-part address concatenation; T&C back/accept; QR amount and cancel; image upload; mocked paid and free submissions; consultation; privacy, terms and FAQ; embedded slip viewer. Existing local-storage sentinel data survived reloads and flows.

## Isolation and limits

All application-service traffic was aborted or fulfilled by explicit local mocks. No real account sign-in, order, consultation, payment, email, Firestore write, Drive upload or production record read occurred. Google Fonts were permitted only in separate visual captures.

These checks establish behavior preservation within the tested scope. Live OAuth, Firebase rules, deployed Apps Script and real fulfillment were not verified. Previously identified backend sync risks, false-success handling and the standalone slip.html syntax defect remain pre-existing; this presentation change does not fix those systems. No claim of a universal absence of bugs is made.

## Review

- [Desktop screenshot](desktop.png)
- [Mobile screenshot](mobile.png)
- [Figma design](https://www.figma.com/design/KkZFY4lhkrgqpi6JPZxivm)

Figma photo import/capture was blocked by HTTP403. Its editable composition uses illustrative product packs; the implemented website and these screenshots use the original product imagery.

The work is prepared on a separate branch and draft PR. Main and the live website are unchanged. Rollback consists of reverting the presentation commit; there is no data rollback or migration step.
