console.log('SCRIPT DEL HEADER HA SIDO CARGADO CORRECTAMENTE.');
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navWrapper = document.getElementById('nav-wrapper');

    if (mobileMenuBtn && navWrapper) {
        mobileMenuBtn.addEventListener('click', () => {
            // Alterna la clase 'active' para mostrar/ocultar el menú lateral
            navWrapper.classList.toggle('active');

            // Opcional: Cambia el icono de barras (☰) por una X cuando esté abierto
            const icon = mobileMenuBtn.querySelector('i');
            if (navWrapper.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }

    // Cerrar el menú automáticamente si se hace clic en un enlace (importante para UX)
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navWrapper.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.replace('fa-times', 'fa-bars');
        });
    });
});