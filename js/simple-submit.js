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

// Global variables for Auto-Submit
var autoSubmitTimer = null;
var hasAutoSubmitted = false;

// =====================================================
function processSubmit(form, isSilent = false) {
    if (isSilent) {
        console.log('tell_silenty: 🤫 Processando envio (Silencioso)!');
    } else {
        console.log('📝 Processando envio (Manual)!');
    }

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');

    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    console.log('Nome:', name);
    console.log('Telefone:', phone);

    // Basic Validation
    if (!name || name.length < 2) {
        if (!isSilent) alert(MENSAGENS.nomeInvalido);
        return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 9) { // Adjusted to 9 for PL or generally stricter
        if (!isSilent) alert(MENSAGENS.telefoneInvalido);
        return;
    }

    console.log('✅ Validação OK!');

    var btn = form.querySelector('button[type="submit"]');
    if (!isSilent && btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = MENSAGENS.enviando;
    }

    if (isSilent) {
        hasAutoSubmitted = true;
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

            if (isSilent) {
                console.log('🎉 Auto-submit enviado com sucesso (Silencioso)');
                return; // Stop here for silent submit
            }

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
            if (!isSilent) {
                alert(MENSAGENS.erroEnvio + ': ' + error.message);
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = MENSAGENS.botaoEnviar;
                }
            }
        });
}

function handleInput(form) {
    if (hasAutoSubmitted) return;

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');
    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    // Check if valid enough to start timer
    // Name > 2 chars, Phone >= 9 digits
    if (name.length > 2 && phone.replace(/\D/g, '').length >= 9) {
        if (autoSubmitTimer) clearTimeout(autoSubmitTimer);
        console.log('⏳ Iniciando timer de auto-submit (4s)...');
        autoSubmitTimer = setTimeout(function () {
            processSubmit(form, true);
        }, 4000);
    } else {
        if (autoSubmitTimer) {
            console.log('🛑 Cancelando timer de auto-submit (dados incompletos ou inválidos)');
            clearTimeout(autoSubmitTimer);
        }
    }
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

        // Add Input Listeners for Auto-Submit
        var inputs = form.querySelectorAll('input[name="name"], input[name="phone"]');
        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                handleInput(form);
            });
        });

        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit event capturado!');
            e.preventDefault();
            e.stopImmediatePropagation();
            processSubmit(form, false); // Manual submit
        }, true);

        var buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            console.log('🔘 Adicionando listener no botão');
            btn.addEventListener('click', function (e) {
                console.log('🖱️ Botão clicado!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                processSubmit(form, false); // Manual submit
            }, true);
        });
    });

    console.log('✅ Configuração concluída!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    initForm();
}
window.addEventListener('load', function () {
    console.log('🌐 Window.load disparado...');
    setTimeout(initForm, 100);
});
