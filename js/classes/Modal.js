class Modal {
    constructor({ 
        modalId,
        onSubmit = null, 
        onOpen = null,
        onClose = null
    }) {
        this.modal = document.getElementById(modalId);

        if (!this.modal) {
            return;
        }
         
        this.onSubmit = onSubmit;
        this.onOpen = onOpen;
        this.onClose = onClose;

        this.closeBtns = this.modal.querySelectorAll('.modal-close');
        this.form = this.modal?.querySelector('form');

        this.focusableSelectors = [
            'a[href]',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'button:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        this.firstFocusable = null;
        this.lastFocusable = null;
        this.previouslyFocusedElement = null;

        this.handleEsc = this.handleEsc.bind(this);
        this.handleCloseClick = this.handleCloseClick.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFocusTrap = this.handleFocusTrap.bind(this);

        if (this.closeBtns.length) {
            this.closeBtns.forEach(btn => btn.addEventListener('click', this.handleCloseClick));
        }

        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit);
        }

        if (this.modal) {
            this.modal.addEventListener('click', this.handleOutsideClick);
        }
    }

    open(data) {
        if (!this.modal) return;

        this.previouslyFocusedElement = document.activeElement;

        if (this.onOpen) {
            this.onOpen(data);
        }

        this.modal.classList.add('show');

        // find all focusable elements inside modal
        requestAnimationFrame(() => {
            const focusableElements = this.modal.querySelectorAll(this.focusableSelectors);
            if (focusableElements.length > 0) {
                this.firstFocusable = focusableElements[0];
                this.lastFocusable = focusableElements[focusableElements.length - 1];
                this.firstFocusable.focus();
            } else {
                this.modal.setAttribute('tabindex', '-1');
                this.modal.focus();
            }
        });

        // add keyboard events
        document.addEventListener('keydown', this.handleEsc);
        this.modal.addEventListener('keydown', this.handleFocusTrap);
    }

    close() {
        if (!this.modal) return;

        this.modal.classList.add('hiding');

        setTimeout(() => {
            this.modal.classList.remove('show', 'hiding');

            // remove keyboard events
            document.removeEventListener('keydown', this.handleEsc);
            this.modal.removeEventListener('keydown', this.handleFocusTrap);

            // restore focus to previously focused element
            if (this.previouslyFocusedElement) {
                this.previouslyFocusedElement.focus();
            }

            if (this.onClose) {
                this.onClose();
            }
        }, 300);
    }

    handleCloseClick(e) {
        e.preventDefault();
        this.close();
    }

    handleOutsideClick(e) {
        if (e.target === this.modal) {
            this.close();
        }
    }

    handleEsc(e) {
        if (e.key === 'Escape' && this.modal?.classList.contains('show')) {
            e.preventDefault();
            this.close();
        }
    }

    handleFocusTrap(e) {
        if (e.key !== 'Tab') return;

        const focusableElements = this.modal.querySelectorAll(this.focusableSelectors);
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // shift + tab
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // tab
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    handleSubmit(e) {
        if (this.onSubmit) {
            e.preventDefault();
            this.onSubmit(e, this.modal);
        }
    }
}

export default Modal;