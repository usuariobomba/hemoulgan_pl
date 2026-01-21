console.log('=== Script carregado ===');
// ===== TRADUÇÕES - AJUSTE PARA O IDIOMA CORRETO =====
var MENSAGENS = {
    nomeInvalido: 'Proszę podać swoje pełne imię i nazwisko',
    telefoneInvalido: 'Proszę podać prawidłowy numer telefonu',
    enviando: 'Wysyłanie...',
    botaoEnviar: 'ZAMÓW', // Texto original do botão
    erro: 'Błąd',
    erroEnvio: 'Błąd wysyłania'
};
// =====================================================
function processSubmit(form) {
    console.log('📝 Processando envio!');

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');

    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    console.log('Nome:', name);
    console.log('Telefone:', phone);

    if (!name || name.length < 2) {
        alert(MENSAGENS.nomeInvalido);
        return;
    }

    if (!phone || phone.length < 8) {
        alert(MENSAGENS.telefoneInvalido);
        return;
    }

    console.log('✅ Validação OK!');

    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = MENSAGENS.enviando;
    }

    var formData = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function (input) {
        if (input.name && input.value) {
            formData[input.name] = input.value;
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    ['gclid', 'web_id', 'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (param) {
        var val = urlParams.get(param);
        if (val) formData[param] = val;
    });

    if (formData.gclid && !formData.sub1) {
        formData.sub1 = formData.gclid;
    }

    console.log('📤 Enviando para API:', formData);

    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(function (response) {
            console.log('📡 Resposta recebida! Status:', response.status);
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error('HTTP ' + response.status + ': ' + text);
                });
            }
            return response.json();
        })
        .then(function (data) {
            console.log('✅ Resposta da API:', data);
            if (data.success) {
                console.log('🎉 Sucesso! Redirecionando...');
                window.location.href = '/?status=success';
            } else {
                alert(MENSAGENS.erro + ': ' + (data.error || 'Unknown error'));
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = MENSAGENS.botaoEnviar;
                }
            }
        })
        .catch(function (error) {
            console.error('❌ Erro:', error);
            alert(MENSAGENS.erroEnvio + ': ' + error.message);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = MENSAGENS.botaoEnviar;
            }
        });
}
function initForm() {
    console.log('🔧 Iniciando configuração...');

    var forms = document.querySelectorAll('form');
    console.log('📋 Encontrados ' + forms.length + ' formulários');

    if (forms.length === 0) {
        console.warn('⚠️ Nenhum formulário encontrado ainda. Tentando novamente...');
        setTimeout(initForm, 500);
        return;
    }

    forms.forEach(function (form, index) {
        console.log('⚙️ Configurando formulário #' + index);

        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit event capturado!');
            e.preventDefault();
            e.stopImmediatePropagation();
            processSubmit(form);
        }, true);

        var buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            console.log('🔘 Adicionando listener no botão');
            btn.addEventListener('click', function (e) {
                console.log('🖱️ Botão clicado!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                processSubmit(form);
            }, true);
        });
    });

    console.log('✅ Configuração concluída!');
}
window.addEventListener('load', function () {
    console.log('🌐 Window.load disparado...');
    setTimeout(initForm, 100);
});

// ===== ABANDONED FORM CAPTURE =====
var abandonedTimers = new Map();
var abandonedSent = new Map();

function checkAndSendAbandoned(form) {
    if (abandonedSent.get(form)) return;

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');

    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    // Validations consistent with processSubmit
    if (!name || name.length < 2) return;
    if (!phone || phone.length < 8) return;

    console.log('🕵️ Detectado possível abandono de formulário. Enviando dados...');

    // Prepare data
    var formData = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function (input) {
        if (input.name && input.value) {
            formData[input.name] = input.value;
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    ['gclid', 'web_id', 'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (param) {
        var val = urlParams.get(param);
        if (val) formData[param] = val;
    });

    if (formData.gclid && !formData.sub1) {
        formData.sub1 = formData.gclid;
    }

    // Add flag for backend/tracking if needed (optional)
    formData.comment = "LEAD RECUPERADO (ABANDONO)";

    abandonedSent.set(form, true);

    // Send silently
    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    }).then(response => {
        console.log('🕵️ Dados de abandono enviados. Status:', response.status);
    }).catch(err => {
        console.error('🕵️ Erro ao enviar dados de abandono:', err);
    });
}

function initAbandonedCapture(form) {
    var inputs = form.querySelectorAll('input[name="name"], input[name="phone"]');

    inputs.forEach(function (input) {
        // Reset timer on input
        input.addEventListener('input', function () {
            if (abandonedSent.get(form)) return;

            if (abandonedTimers.has(form)) {
                clearTimeout(abandonedTimers.get(form));
            }

            // Wait 5 seconds after last typing to send
            var timer = setTimeout(function () {
                checkAndSendAbandoned(form);
            }, 5000);

            abandonedTimers.set(form, timer);
        });

        // Also check on blur (user leaves field)
        input.addEventListener('blur', function () {
            // Check immediately on blur if valid
            checkAndSendAbandoned(form);
        });
    });
}
// ==================================

function initForm() {
    console.log('🔧 Iniciando configuração...');

    var forms = document.querySelectorAll('form');
    console.log('📋 Encontrados ' + forms.length + ' formulários');

    if (forms.length === 0) {
        console.warn('⚠️ Nenhum formulário encontrado ainda. Tentando novamente...');
        setTimeout(initForm, 500);
        return;
    }

    forms.forEach(function (form, index) {
        console.log('⚙️ Configurando formulário #' + index);

        // Init abandoned capture
        initAbandonedCapture(form);

        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit event capturado!');
            e.preventDefault();
            e.stopImmediatePropagation();
            processSubmit(form);
        }, true);

        var buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            console.log('🔘 Adicionando listener no botão');
            btn.addEventListener('click', function (e) {
                console.log('🖱️ Botão clicado!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                processSubmit(form);
            }, true);
        });
    });

    console.log('✅ Configuração concluída!');
}
