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


// tooltip
document.addEventListener('DOMContentLoaded', () => {
    const tooltips = document.querySelectorAll('.tooltip');

    tooltips.forEach(trigger => {
        const tooltipId = trigger.getAttribute('aria-describedby');
        const tooltip = document.getElementById(tooltipId);

        if (!tooltip) {
            return;
        }

        function showTooltip() {
            tooltip.classList.add('show');
            tooltip.style.display = 'block';
            trigger.setAttribute('aria-expanded', 'true');
            positionTooltip();
        }

        function hideTooltip() {
            tooltip.classList.remove('show');
            trigger.setAttribute('aria-expanded', 'false');

            setTimeout(() => {
                if (!tooltip.classList.contains('show')) {
                    tooltip.style.display = 'none';
                }
            }, 200);
        }

        function positionTooltip() {
            const rect = trigger.getBoundingClientRect();

            tooltip.style.visibility = 'hidden';
            tooltip.style.display = 'block';
            tooltip.style.opacity = '0';

            const tooltipHeight = tooltip.offsetHeight;
            const tooltipWidth = tooltip.offsetWidth;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let top = rect.bottom + 8; // default below
            let left = rect.left + rect.width / 2 - tooltipWidth / 2;

            tooltip.classList.remove('arrow-up', 'arrow-down');

            // if doesn't fit below, place above
            if (top + tooltipHeight > viewportHeight - 8) {
            top = rect.top - tooltipHeight - 8;
            tooltip.classList.add('arrow-down');
            } else {
            tooltip.classList.add('arrow-up');
            }

            // clamp horizontally within viewport
            left = Math.min(Math.max(left, 8), viewportWidth - tooltipWidth - 8);

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            // show tooltip
            if (tooltip.classList.contains('show')) {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            } else {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
                tooltip.style.display = 'none';
            }
        }

        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
        trigger.addEventListener('focus', showTooltip);
        trigger.addEventListener('blur', hideTooltip);

        window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) positionTooltip();
        });

        window.addEventListener('resize', () => {
            if (tooltip.classList.contains('show')) positionTooltip();
        });
    });
});