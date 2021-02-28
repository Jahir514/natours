import '@babel/polyfill';
import { login } from './login';
import { logout } from './login';
import { updateSetting } from './updateSetting';


const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserBtn = document.querySelector('.form-user-data');
const updatePasswordBtn = document.querySelector('.form-user-password');


if (loginForm) {
    loginForm.addEventListener('submit', e => {  
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {  
        e.preventDefault();
        logout();
    });
}

// update user data except password
if (updateUserBtn) {
    updateUserBtn.addEventListener('submit', e => {  
        e.preventDefault();
        const form = new FormData(); // for image
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        
        updateSetting(form, 'user data');
    });
}

// update user password
if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('submit', async e => {  
        e.preventDefault();
        document.querySelector('.btn-save-passord').textContent = 'updating...';
        const currentPassword = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('password-confirm').value;
        
        await updateSetting({ currentPassword, password, confirmPassword }, 'password');

        // after updating set the form field value empty
        document.querySelector('.btn-save-passord').textContent = 'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value= '';
        document.getElementById('password-confirm').value='';
    });
}

