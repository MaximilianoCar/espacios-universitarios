import Swal from 'sweetalert2';

const base = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    confirmButton: 'swal2-confirm btn-blue',
    cancelButton: 'swal2-cancel btn-red',
    popup: 'swal2-custom-popup',
  },
  reverseButtons: false, // confirm on the right, cancel on the left
  allowOutsideClick: false,
});

const helpers = {
  fire: options => base.fire(options),

  // Positive confirmation: confirm (blue) / cancel (red)
  confirm: opts =>
    base.fire({
      icon: opts.icon || 'question',
      showCancelButton: opts.showCancelButton ?? true,
      confirmButtonText: opts.confirmButtonText || 'Continuar',
      cancelButtonText: opts.cancelButtonText || 'Cancelar',
      ...opts,
    }),

  // Negative confirmation: confirm (red) / cancel (blue)
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

  // Success toast/modal with auto close and blue confirm
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

  // Error modal with auto close and blue confirm
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
};

export default helpers;
