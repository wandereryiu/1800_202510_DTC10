document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    mobileMenuButton.addEventListener('click', function () {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';

        mobileMenu.classList.toggle('hidden');

        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);

        if (!isExpanded) {
            menuIcon.innerHTML = `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>`;
        } else {
            menuIcon.innerHTML = `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>`;
        }
    });
});