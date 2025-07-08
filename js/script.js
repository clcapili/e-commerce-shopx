// char counter
function initCharCounters() {
    const wrappers = document.querySelectorAll('.char-limit-wrapper');

    wrappers.forEach(wrapper => {
        const textarea = wrapper.querySelector('textarea');
        const counterSpan = wrapper.querySelector('.char-count span');

        if (!textarea || !counterSpan) return;

        const max = parseInt(textarea.getAttribute('maxlength'), 10);
        const updateCount = () => {
            const remaining = max - textarea.value.length;
            counterSpan.textContent = remaining;
        };

        textarea.addEventListener('input', updateCount);
        updateCount();
    });
}

// char counter global
window.initCharCounters = initCharCounters;