
/**
 * Declaration of FormValidator.
 * Inspired by jquery-validate.
 */

function FormValidator() {
    this.errors = {};
    this.rules = {};
    this.messages = {};
    this.is_show_alert = true;
    this.is_standart = true;

    this.errorTitle = 'Пожалуйста, исправьте следующие ошибки';
    this.errorNameField = 'Имя';
    this.errorNameMess = 'Укажите своё имя';
    this.errorPhoneField = 'Телефон';
    this.errorPhoneMess = 'Введите правильный телефон';
    this.errorAddress = 'Введите правильный адрес';
    this.errorPhone = 'указан неправильный телефон';
    this.errorRequired = 'обязательное поле';
    this.errorMaxLength = 'допустимо максимум {1} символа';
    this.errorMinLength = 'допустимо минимум {1} символа';
    this.errorEmailField = 'Email';
    this.errorEmail = 'указан не корректный email';

    // Правила валидации привязанные к стране
    this.validateRulesByCountry = {
        // Индия
        IN: {maxLength: 13},
        // Бангладеш
        BD: {minLength: 10, maxLength: 13},
        // Аргентина
        AR: {minLength: 10, maxLength: 12},
        // Кот-д'Ивуар
        CI: {minLength: 11, maxLength: 13},
        // Алжир
        DZ: {minLength: 10, maxLength: 12},
    }
}

FormValidator.prototype.validators = {
  
    length: function(validator, element, rule) {
        var el = $(element);
        var value = el.val();
        var errs = [];
        
        if (rule.args.minlength) {
            var msg = validator.getMessage(element.name, 'minlength');
            msg = msg || this.errorMinLength;
            var check_value = value.toString().replace(/ +/g, ' ').trim();
            if (check_value.length < rule.args.minlength) {
                errs.push(FormValidator.utilStrFormat(msg, rule.name, rule.args.minlength));
            }
        }
            
        if (rule.args.maxlength) {
            var msg = validator.getMessage(element.name, 'maxlength');
            msg = msg || this.errorMaxLength;
            if (value.toString().length > rule.args.maxlength) {
                errs.push(FormValidator.utilStrFormat(msg, rule.name, rule.args.minlength));
            }
        }   
        return errs;
    },
  
    required: function(validator, element, rule) {
        var el = $(element);
        var value = el.val().replace(' ', '');
        var value = el.val().replace(/ +/g, ' ').trim();
        var msg = validator.getMessage(element.name, 'required');
        msg = msg || FormValidator.utilStrFormat(this.errorRequired, rule.name);
        var errs = [];
        if (!value || value === '') {
            errs.push(msg);
        }
        else if ((el.attr('placeholder') || '').toLowerCase() === value.toString().toLowerCase()) {
            errs.push(msg);
        }
        return errs;
    },

    phone: function(validator, element, rule) {
        var errs = [];
        var rawPhone = $(element).val();
        var cleanPhone = rawPhone.replace(/[^\d]/g, '');

        var normalizePhone = FormValidator.normalizePhoneByCountry(rule.args.countryCode, cleanPhone);

        var msg = validator.getMessage(element.name, 'phone');
        msg = msg || FormValidator.utilStrFormat(this.errorPhone, rule.name)

        var minLength = rule.args.minLength || 7;
        var maxLength = rule.args.maxLength || 15;

        if (normalizePhone.length < minLength || normalizePhone.length > maxLength) {
            errs.push(msg);
        }

        if (rule.args.interPhoneCodes && !errs.length) {
            var currentPhoneCode = rule.args.interPhoneCodes.currentPhoneCode;

            if (currentPhoneCode === '7') {
                if (normalizePhone.indexOf('7') !== 0 && normalizePhone.indexOf('8') !== 0) {
                    errs.push(msg);
                }
            }
            else if (normalizePhone.indexOf(currentPhoneCode) !== 0) {
                errs.push(msg);
            }
        }

        if (!errs.length) {
            $(element).val(`+${normalizePhone}`);
        }

        return errs;
    },

    email: function(validator, element, rule) {
        var errs = [];
        if (element) {
            var value = $(element).val();
            // var pattern = /^[a-z0-9_-]+@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/i; //name-_09@mail09-.ru
            var pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/i;
            var msg = validator.getMessage(element.name, 'email');
            msg = msg || FormValidator.utilStrFormat(this.errorEmail, rule.name)
            if (value.search(pattern) !== 0) {
                errs.push(msg);
            }
        }
        return errs;
    }
}

FormValidator.prototype.addRule = function(field, name, rule, args) {
    args = args || null;
    this.rules[field] = this.rules[field] || [];
    this.rules[field].push({
        field: field,
        name: name,
        rule: rule,
        args: args
    });
}

FormValidator.prototype.addMessages = function(field, messages) {
    this.messages[field] = messages;
}

FormValidator.prototype.getMessage = function(field, rule) {
    var msgs = this.messages[field];
    var msg = msgs && msgs[rule]
    return msg;
}

FormValidator.prototype.watch = function(el) {
    if ( this.is_standart === true ) {
        $(document).on('submit', el, {validator: this}, FormValidator.submitHandler);
    }
    $(document).on('change click keyup', el, {validator: this}, FormValidator.changeHandler);
}

FormValidator.submitHandler = function(e) {
    if ( this.is_standart === false ) {
        e.preventDefault();
        return
    }
    var validator = e.data.validator;
    if (FormValidator.isFormLocked(this)) {
        validator.fireEvent('locked', this, e);
        e.preventDefault();
    } else {
        FormValidator.lockForm(this);
        validator.validate(this, true);
        validator.fireEvent(validator.isValid() ? 'valid' : 'error', this);
        if (!validator.isValid()) {
            e.preventDefault();
            validator.showErrors();
            validator.fireEvent('error', this, e);
            FormValidator.unlockForm(this);
        } else {
            validator.fireEvent('success', this, e);
        }
    }
}

FormValidator.changeHandler = function(e) {
    if (!$(this).data('validating')) {
        return;
    }
    var validator = e.data.validator;
    validator.validate(this, true);
    validator.fireEvent(validator.isValid() ? 'valid' : 'error', this);
}

FormValidator.lockForm = function(form) {
    $(form).data('locked', true);
}

FormValidator.unlockForm = function(form) {
    $(form).data('locked', false);
}

FormValidator.isFormLocked = function(form) {
    return $(form).data('locked');
}

FormValidator.prototype.fireEvent = function(eventName, form, submitEvent) {
    var e = jQuery.Event('validate.' + eventName);
    e.submitEvent = submitEvent || null;
    e.validator = this;
    e.form = form;
    $(form).trigger(e);
}

FormValidator.prototype.validate = function(form, changeState) {
    
    var errors = {}
    for (var field in this.rules) {
        var rules = this.rules[field];
        var errs = errors[field] || [];
        for (var i=0; i < rules.length; ++i) {
            var rule = rules[i];
            errors[field] = errs.concat(this.checkRule(form, rule));
        }
    }
    
    if (changeState) {
        $(form).data('validating', true);
        this.errors = errors;
    }
    
    return errors;
    
}

FormValidator.prototype.getErrorsList = function(errors) {
    errors = errors || this.errors;
    var errs = $.map(errors, function(errs, field) {
        return $.map(errs, function(err) {
            return {field: field, msg: err};
        });
    });
    return errs;
}

FormValidator.prototype.showFormErrors = function(form, errors) {

    errors = errors || this.errors;
    $.map(errors, function(errs, field) {
        if (errs.length === 0 ) {
            $(form).find(field).removeClass('field-error').addClass('field-valid');
        } else {
            $(form).find(field).removeClass('field-valid').addClass('field-error');
        }

    });
}


FormValidator.prototype.showErrors = function() {
    if (this.is_show_alert === true ) {
        var errs = $.map(this.getErrorsList(), function(err) {
            return ' - ' + err.msg;
        });
        alert(this.errorTitle + ':\n\n' + errs.join('\n'));
    } else {
        this.showFormErrors();
    }
}

FormValidator.prototype.checkRule = function(form, rule) {
    var validate = this.validators[rule.rule];
    if (rule.field.startsWith("#") === true) {
        var element = $(form).find(rule.field).get(0);
    } else {
        var rule_field = rule.field.replace('[', "\\[").replace(']', "\\]");
        var element = $(form).find('[name=' + rule_field + ']').get(0);
    }
    return validate(this, element, rule);
}

FormValidator.prototype.isValid = function() {
    return this.getErrorsList(this.errors).length == 0;
}

FormValidator.utilStrFormat = function(s) {
    for (var i = 0; i < arguments.length - 1; i++) {       
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        if (s) {
            s = s.replace(reg, arguments[i + 1]);
        }
    }
    return s;
}

FormValidator.getPhoneNumberWithoutZero = function(phoneNumber, phoneCode) {
    if (
        !phoneNumber ||
        !phoneCode ||
        typeof phoneNumber !== "string" ||
        typeof phoneCode !== "string"
    ) {
        return phoneNumber;
    }

    let normalizePhone = phoneNumber;    

    phoneNumber = phoneNumber[0] == '+' ? phoneNumber.replace('+', '') : phoneNumber;
    phoneCode = phoneCode[0] == '+' ? phoneCode.replace('+', '') : phoneCode;

    if (phoneNumber.startsWith(phoneCode)) {
        let phoneWithoutCode = phoneNumber.substring(phoneCode.length);

        let normalizePhoneWithoutCode = phoneWithoutCode.startsWith('0')
            ? phoneWithoutCode.substring(1)
            : phoneWithoutCode;

        normalizePhone = phoneCode + normalizePhoneWithoutCode;
    }
    return normalizePhone;
}

FormValidator.normalizePhoneByCountry = function(countryCode, phoneNumber) {
    if (typeof countryCode !== "string") {
        return phoneNumber;
    }

    let normalizePhone = phoneNumber;
    countryCode = countryCode.toLowerCase();

    // Алжир
    if (countryCode === 'dz') {
        const phoneCode = '213';

        // Если код страны оказался в конце, то переносим в начало 
        if (!phoneNumber.startsWith(phoneCode) && phoneNumber.endsWith('213')) {
            phoneNumber = phoneCode + phoneNumber.substring(0, phoneNumber.length-3);
        }

        // Для алжира номера +213111111111 и +2130111111111 являются одним и тем же номером
        // функция должна вернуть версию номера без нуля т.е. +213111111111 
        normalizePhone = FormValidator.getPhoneNumberWithoutZero(phoneNumber, phoneCode);

    // Кот-д'Ивуар
    } else if(countryCode === 'ci') {
        const phoneCode = '225';

        // Для данной страны 0 после кода должен быть всегда
        if (phoneNumber.startsWith(phoneCode)) {
            let phoneWithoutCode = phoneNumber.substring(phoneCode.length);

            let normalizePhoneWithoutCode = phoneWithoutCode.startsWith('0')
                ? phoneWithoutCode
                : '0' + phoneWithoutCode;
            
            normalizePhone = phoneCode + normalizePhoneWithoutCode;
        }
    
    // Нигерия
    } else if (countryCode === 'ng') {
        const phoneCode = '234';

        // Для нигерии номера +234111111111 и +2340111111111 являются одним и тем же номером
        // функция должна вернуть версию номера без нуля т.е. +254111111111 
        normalizePhone = FormValidator.getPhoneNumberWithoutZero(phoneNumber, phoneCode);
    }

    return normalizePhone;
}
