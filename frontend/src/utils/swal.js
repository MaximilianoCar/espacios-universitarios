import Swal from 'sweetalert2';

const base = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    confirmButton: 'swal2-confirm btn-blue',
    cancelButton: 'swal2-cancel btn-red',
    popup: 'swal2-custom-popup',
  },
  reverseButtons: false, // confirmar a la derecha, cancelar a la izquierda
  allowOutsideClick: false,
});

const helpers = {
  fire: options => base.fire(options),

  // colores
  confirm: opts =>
    base.fire({
      icon: opts.icon || 'question',
      showCancelButton: opts.showCancelButton ?? true,
      confirmButtonText: opts.confirmButtonText || 'Continuar',
      cancelButtonText: opts.cancelButtonText || 'Cancelar',
      ...opts,
    }),

  confirmDanger: opts =>
    base.fire({
      icon: opts.icon || 'warning',
      showCancelButton: opts.showCancelButton ?? true,
      confirmButtonText: opts.confirmButtonText || 'Rechazar',
      cancelButtonText: opts.cancelButtonText || 'Cancelar',
      customClass: {
        confirmButton: 'swal2-confirm btn-red',
        cancelButton: 'swal2-cancel btn-blue',
        popup: 'swal2-custom-popup',
      },
      ...opts,
    }),

  success: (title, text, timer = 2500) =>
    base.fire({
      title,
      text,
      icon: 'success',
      showCancelButton: false,
      confirmButtonText: 'Aceptar',
      timer,
      timerProgressBar: true,
    }),

  error: (title, text, timer = 3000) =>
    base.fire({
      title,
      text,
      icon: 'error',
      showCancelButton: false,
      confirmButtonText: 'Aceptar',
      timer,
      timerProgressBar: true,
    }),

  showLoading: () => Swal.showLoading(),
  close: () => Swal.close(),
  mixin: opts => Swal.mixin(opts),
  get showValidationMessage() {
    return Swal.showValidationMessage;
  },
  get validationMessage() {
    return Swal.validationMessage;
  },
};

export default helpers;
