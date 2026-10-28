/*
 * bsTimeDuration - jQuery time-duration input for Bootstrap 5
 * Requires jQuery; uses Bootstrap 5 validation classes (no Bootstrap JS required).
 * License: MIT
 */
(function ($) {
    'use strict';
    const pluginName = 'bsTimeDuration';
    const defaults = {
        minutesPerDay: 480,
        daysPerWeek: 5,
        allowDays: true,
        allowWeeks: true,
        required: false,
        normalizeOnBlur: true,
        validateOnInput: true,
        decimalSeparator: '.',
        invalidClass: 'is-invalid'
    };

    function TimeDuration(element, options) {
        this.$input = $(element);
        this.$display = this.$input.clone(false)
            .removeAttr('name')
            .attr('type', 'text');
        this.originalType = this.$input.attr('type');
        this.originalClass = this.$input.attr('class');
        this.originalId = this.$input.attr('id');
        this.originalRequired = this.$input.attr('required');
        this.lastSubmittedValue = String(this.$input.val() == null ? '' : this.$input.val());
        this.options = $.extend({}, defaults, options);
        this.currentMinutes = null;
        this.namespace = '.bsTimeDuration';

        if (!Number.isSafeInteger(this.options.minutesPerDay) || this.options.minutesPerDay < 1 ||
            !Number.isSafeInteger(this.options.daysPerWeek) || this.options.daysPerWeek < 1) {
            throw new Error('bsTimeDuration: minutesPerDay and daysPerWeek must be positive integers.');
        }

        this.$input.removeAttr('id').attr('type', 'hidden').removeAttr('class required');
        this.$display.insertAfter(this.$input);
        this.bind();
        this.update(false);
    }

    TimeDuration.prototype.parse = function (value) {
        const text = String(value == null ? '' : value).trim();
        if (!text) return { valid: !this.options.required, minutes: null };
        if (/[+-]/.test(text)) return { valid: false, minutes: null };

        // H:MM (minutes must be 00-59)
        let match = /^(\d+)\s*:\s*(\d{1,2})$/.exec(text);
        if (match) {
            const hours = Number(match[1]);
            const mins = Number(match[2]);
            const result = hours * 60 + mins;
            return { valid: mins < 60 && Number.isSafeInteger(result), minutes: result };
        }

        // An unsigned integer alone represents minutes.
        if (/^\d+$/.test(text)) {
            const result = Number(text);
            return { valid: Number.isSafeInteger(result), minutes: result };
        }

        // A decimal number alone represents hours: 1.5 => 90 minutes.
        if (/^\d+[.,]\d+$/.test(text)) {
            const result = Math.round(Number(text.replace(',', '.')) * 60);
            return { valid: Number.isSafeInteger(result), minutes: result };
        }

        // Unit expressions, with optional spaces: 1w2d3h15m, 1,5h, 90m.
        // Repeated units are added together. Each token must have a unit.
        const tokenPattern = /\s*(\d+(?:[.,]\d+)?)\s*([wdhm])/iy;
        let index = 0;
        let total = 0;
        while (index < text.length) {
            tokenPattern.lastIndex = index;
            match = tokenPattern.exec(text);
            if (!match) {
                if (!text.slice(index).trim()) break;
                return { valid: false, minutes: null };
            }

            const unit = match[2].toLowerCase();
            if ((unit === 'w' && !this.options.allowWeeks) ||
                (unit === 'd' && !this.options.allowDays)) {
                return { valid: false, minutes: null };
            }

            const factors = {
                w: this.options.minutesPerDay * this.options.daysPerWeek,
                d: this.options.minutesPerDay,
                h: 60,
                m: 1
            };
            const amount = Number(match[1].replace(',', '.'));
            const add = Math.round(amount * factors[unit]);
            if (!Number.isSafeInteger(add) || !Number.isSafeInteger(total + add)) {
                return { valid: false, minutes: null };
            }
            total += add;
            index = tokenPattern.lastIndex;
        }
        return { valid: true, minutes: total };
    };

    TimeDuration.prototype.format = function (minutes) {
        if (minutes == null) return '';
        if (!Number.isSafeInteger(minutes) || minutes < 0) return '';
        if (minutes === 0) return '0m';

        let remaining = minutes;
        const chunks = [];
        const units = [];
        if (this.options.allowWeeks) {
            units.push(['w', this.options.minutesPerDay * this.options.daysPerWeek]);
        }
        if (this.options.allowDays) {
            units.push(['d', this.options.minutesPerDay]);
        }
        units.push(['h', 60], ['m', 1]);

        for (const [unit, factor] of units) {
            const count = Math.floor(remaining / factor);
            if (count) {
                chunks.push(count + unit);
                remaining -= count * factor;
            }
        }
        return chunks.join(' ');
    };

    TimeDuration.prototype.update = function (normalize, userChange) {
        const raw = this.$display.val();
        const parsed = this.parse(raw);
        this.$display.toggleClass(this.options.invalidClass, !parsed.valid);
        this.$display.attr('aria-invalid', String(!parsed.valid));

        if (!parsed.valid) {
            this.currentMinutes = null;
            this.$input.val('');
            if (this.lastSubmittedValue !== '') {
                this.lastSubmittedValue = '';
                this.triggerEvent('change', [null, '']);
            }
            this.triggerEvent('invalid', [raw]);
            if (userChange) this.triggerEvent('userChange', [raw, null, '', false]);
            return false;
        }

        this.currentMinutes = parsed.minutes;
        const submittedValue = parsed.minutes == null ? '' : String(parsed.minutes);
        this.$input.val(submittedValue);
        if (this.lastSubmittedValue !== submittedValue) {
            this.lastSubmittedValue = submittedValue;
            this.triggerEvent('change', [parsed.minutes, this.format(parsed.minutes)]);
        }
        if (normalize && this.options.normalizeOnBlur) {
            this.$display.val(this.format(parsed.minutes));
        }
        if (userChange) {
            this.triggerEvent('userChange', [raw, parsed.minutes, this.format(parsed.minutes), true]);
        }
        return true;
    };

    TimeDuration.prototype.triggerEvent = function (name, args) {
        this.$input.trigger(name + '.bs.timeDuration', args);
        this.$input.trigger('all.bs.timeDuration', [name + '.bs.timeDuration'].concat(args));
    };

    TimeDuration.prototype.bind = function () {
        const self = this;
        this.$display.on('input' + this.namespace, function (event) {
            const isUserChange = Boolean(event.originalEvent && event.originalEvent.isTrusted);
            if (self.options.validateOnInput) self.update(false, isUserChange);
            else if (isUserChange) {
                const raw = self.$display.val();
                const parsed = self.parse(raw);
                self.triggerEvent('userChange', [raw, parsed.valid ? parsed.minutes : null,
                    parsed.valid ? self.format(parsed.minutes) : '', parsed.valid]);
            }
        });
        this.$display.on('blur' + this.namespace, function () {
            self.update(true);
        });
        this.$display.on('change' + this.namespace, function () {
            self.update(false);
        });
    };

    TimeDuration.prototype.minutes = function (value) {
        if (arguments.length === 0) return this.currentMinutes;
        if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
            throw new Error('bsTimeDuration: minutes must be a non-negative integer or null.');
        }
        this.$display.val(this.format(value));
        this.update(false);
        return this;
    };

    TimeDuration.prototype.value = function (value) {
        if (arguments.length === 0) return this.$input.val();
        this.$display.val(value == null ? '' : String(value));
        this.update(false);
        return this;
    };

    TimeDuration.prototype.val = TimeDuration.prototype.value;

    TimeDuration.prototype.destroy = function () {
        this.$input.off(this.namespace);
        this.$display.off(this.namespace).remove();
        this.$input.attr('type', this.originalType || 'text');
        if (this.originalClass === undefined) this.$input.removeAttr('class');
        else this.$input.attr('class', this.originalClass);
        if (this.originalId !== undefined) this.$input.attr('id', this.originalId);
        if (this.originalRequired !== undefined) this.$input.attr('required', this.originalRequired);
        this.$input.val(this.$display.val());
        this.$input.removeData(pluginName);
    };

    $.fn[pluginName] = function (methodOrOptions) {
        const args = Array.prototype.slice.call(arguments, 1);
        if (typeof methodOrOptions === 'string') {
            let result;
            this.each(function () {
                const instance = $(this).data(pluginName);
                if (!instance) throw new Error('bsTimeDuration: plugin not initialized.');
                if (!['parse', 'format', 'minutes', 'value', 'val', 'destroy'].includes(methodOrOptions)) {
                    throw new Error('bsTimeDuration: unknown method ' + methodOrOptions);
                }
                const returned = instance[methodOrOptions].apply(instance, args);
                if (result === undefined && returned !== instance) result = returned;
            });
            return result === undefined ? this : result;
        }
        return this.each(function () {
            if (!$(this).data(pluginName)) {
                $(this).data(pluginName, new TimeDuration(this, methodOrOptions));
            }
        });
    };
})(jQuery);
