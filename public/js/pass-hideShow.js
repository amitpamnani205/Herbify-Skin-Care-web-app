document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.password-toggle').addEventListener('click', function() {
        const passwordInput = document.querySelector('#password');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '🙈'; // Change icon for hiding
        } else {
            passwordInput.type = 'password';
            this.textContent = '👁️'; // Change icon for showing
        }
    });
});