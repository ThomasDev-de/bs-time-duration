# Changelog

All notable changes to **bsTimeDuration** are documented here.

## [1.0.0] - 2026-10-28

### Added

- Parse durations written as unit expressions (`1w 2d 3h 15m`), decimal hours (`1.5` or `1,5`), decimal units (`1,5h`), clock values (`2:30`), or minutes (`90`).
- Configure the number of minutes per day and days per week, and optionally enable or disable day and week units.
- Convert the original named input into a hidden form field and create a visible input with the original classes and ID.
- Normalize valid input on blur and apply Bootstrap's `is-invalid` validation styling.
- Provide the `parse`, `format`, `minutes`, `value`/`val`, and `destroy` methods.
- Emit `change.bs.timeDuration`, `invalid.bs.timeDuration`, `userChange.bs.timeDuration`, and `all.bs.timeDuration` events.
- Add a Bootstrap demo covering input sizes, floating labels, and input groups.
- Document setup, formats, options, methods, events, and examples in the README.
