import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
    console.log(email, password);
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        if (res.data.status === 'success') {
            showAlert('success','Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 500);
        }
    }
    catch (err) {
        showAlert('error', err.response.data.message);
    }
};

// logout call

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
        });

        if (res.data.status === 'success') {
            //location.reload(true);
            window.setTimeout(() => {
                location.assign('/login');
            }, 500);
        } // reload the fresh page from server not cache
        
    }
    catch (err) {
        showAlert('error', err.response.data.message);
    }
};



