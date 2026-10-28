# bsTimeDuration

A small jQuery plugin for entering durations in a human-friendly format and submitting them as total minutes. It works
with Bootstrap 5 form controls, floating labels, and input groups.

**Current release: 1.0.0** · [Changelog](CHANGELOG.md)

```text
1w 2d 3h 15m  →  3,555 minutes
```

## Features

- Accepts unit-based durations, decimal hours, `H:MM`, or a number of minutes.
- Creates a formatted text input and turns the original named input into a hidden field.
- Copies the original input's classes and ID to the visible input, so Bootstrap styling and labels continue to work.
- Submits the duration as an integer number of minutes.
- Supports Bootstrap validation styling without requiring Bootstrap JavaScript.
- Emits namespaced jQuery events when the value changes or is invalid.

## Requirements

- jQuery 3 or later
- Bootstrap 5 CSS (optional, for Bootstrap styling)

Bootstrap JavaScript is not required by the plugin. The demo uses Bootstrap's CSS and JavaScript bundle.

## Getting started

Load jQuery and the plugin, then initialize a named input. The input's `name` stays on the hidden field, while the
plugin creates the visible input next to it.

```html
<label for="work-duration" class="form-label">Work duration</label>
<input
        type="text"
        id="work-duration"
        name="workDuration"
        class="form-control"
        placeholder="e.g. 1h 30m"
        autocomplete="off">

<script src="jquery.min.js"></script>
<script src="bs-time-duration.min.js"></script>
<script>
    $('#work-duration').bsTimeDuration();
</script>
```

When the form is submitted, `workDuration` contains the total number of minutes. For example, `1h 30m` is submitted as
`90`.

The visible input inherits the original input's attributes and classes, except for `name`, which remains on the hidden
input. Its ID is moved to the visible input, so an associated `<label>` continues to target the editable field.

## Accepted formats

| Format          | Example        | Meaning                         |
|-----------------|----------------|---------------------------------|
| Unit expression | `1w 2d 3h 15m` | Weeks, days, hours, and minutes |
| Decimal hours   | `1.5` or `1,5` | 90 minutes                      |
| Decimal units   | `1,5h`         | 90 minutes                      |
| Clock format    | `2:30`         | 2 hours, 30 minutes             |
| Minutes         | `90`           | 90 minutes                      |

Unit expressions accept `w`, `d`, `h`, and `m`, in either case. Spaces are optional, and repeated units are added
together. Values cannot be negative. By default, a day is 480 minutes and a week is five days.

## Options

Pass an options object to `bsTimeDuration()`:

```js
$('.js-duration').bsTimeDuration({
    minutesPerDay: 480,
    daysPerWeek: 5,
    allowDays: true,
    allowWeeks: true,
    required: false,
    normalizeOnBlur: true,
    validateOnInput: true,
    invalidClass: 'is-invalid'
});
```

| Option            | Default        | Description                                                 |
|-------------------|----------------|-------------------------------------------------------------|
| `minutesPerDay`   | `480`          | Number of minutes in a day. Must be a positive integer.     |
| `daysPerWeek`     | `5`            | Number of days in a week. Must be a positive integer.       |
| `allowDays`       | `true`         | Accept and format the `d` unit.                             |
| `allowWeeks`      | `true`         | Accept and format the `w` unit.                             |
| `required`        | `false`        | Treat an empty value as invalid.                            |
| `normalizeOnBlur` | `true`         | Format valid input when it loses focus.                     |
| `validateOnInput` | `true`         | Validate as the user types.                                 |
| `invalidClass`    | `'is-invalid'` | Class added to the visible input when its value is invalid. |

Days and weeks use the configured values consistently for parsing and formatting. For example, with the defaults, `1w`
is `2,400` minutes.

## Methods

Call a method by passing its name to the plugin:

```js
const $duration = $('#work-duration');

$duration.bsTimeDuration('val');           // Read the submitted hidden-field value
$duration.bsTimeDuration('val', 90);       // Set to 90 minutes
$duration.bsTimeDuration('val', '1h 30m'); // Set a duration string
$duration.bsTimeDuration('parse', '1h');   // { valid: true, minutes: 60 }
$duration.bsTimeDuration('format', 90);    // '1h 30m'
$duration.bsTimeDuration('destroy');
```

`minutes(value)` accepts a non-negative integer or `null`. `value(value)` accepts any string the parser understands, or
`null` to clear the field. `destroy` removes the generated input and restores the original input, including its prior
type, ID, classes, and required attribute.

`val` accepts either a number of minutes or a duration string. It returns the hidden field's submitted value when called without an argument. `value` remains available as an alias:

```js
$('.js-duration').bsTimeDuration('val', 566);        // 566 minutes
$('.js-duration').bsTimeDuration('val', '3h 12m');   // 192 minutes
```

Calling jQuery's `.val()` directly would only update the hidden form field, not the visible input. Use the plugin's `val` method to keep the hidden value and formatted display in sync.

Initialization returns the original jQuery selection, so calls can be chained. The generated input does not replace the selected element:

```js
const $duration = $('#work-duration').bsTimeDuration();
// $duration still contains the original input (now hidden).
```

Getter methods such as `minutes()`, `value()`, `parse()`, and `format()` return their result instead of the jQuery selection.

## Events

Events are triggered on the original input element, which becomes the hidden form field. Bind before initialization if
you need to observe an initial conversion of a pre-filled value:

```js
$('#work-duration')
    .on('change.bs.timeDuration', function (event, minutes, formatted) {
        console.log('Duration:', minutes, formatted);
    })
    .on('invalid.bs.timeDuration', function (event, rawValue) {
        console.log('Invalid duration:', rawValue);
    })
    .on('userChange.bs.timeDuration', function (event, rawValue, minutes, formatted, valid) {
        console.log('User edited the duration:', rawValue, minutes, valid);
    })
    .on('all.bs.timeDuration', function (event, eventName, ...args) {
        console.log(eventName, args);
    })
    .bsTimeDuration();
```

| Event                     | Additional arguments                    | When it fires                                  |
|---------------------------|-----------------------------------------|------------------------------------------------|
| `change.bs.timeDuration`  | `minutes`, `formatted`                  | When the hidden submitted value changes, including when it is cleared. |
| `invalid.bs.timeDuration` | `rawValue`                              | Whenever the current input cannot be parsed.   |
| `userChange.bs.timeDuration` | `rawValue`, `minutes`, `formatted`, `valid` | On a user-generated input event, whether or not the value is valid. |
| `all.bs.timeDuration`     | `eventName`, then the event's arguments | Whenever one of the plugin events above fires. |

`eventName` is the full namespaced event name, such as `change.bs.timeDuration`.

## Bootstrap examples

The plugin copies the input's Bootstrap classes to its generated visible field, so standard controls, size variants,
floating labels, and input groups work with the same initialization:

```html

<div class="input-group">
    <span class="input-group-text">Duration</span>
    <input type="text" name="duration" class="form-control js-duration" placeholder="e.g. 1h 30m">
    <span class="input-group-text">total</span>
</div>
```

```js
$('.js-duration').bsTimeDuration();
```

See [`demo/index.html`](demo/index.html) for a complete page with small, default, and large controls, floating labels,
and input-group add-ons.

## License

MIT
