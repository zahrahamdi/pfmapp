function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message || '';
}

function clearAuthErrors(formPrefix) {
  document.querySelectorAll(`[data-error-for^="${formPrefix}-"]`).forEach((el) => {
    el.textContent = '';
  });
}

function setButtonLoading(button, loading, defaultText) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle('loading', loading);
  button.textContent = loading ? 'لطفاً صبر کنید...' : defaultText;
}

function mapRegisterErrors(error) {
  if (error.status === 409) return { email: 'این ایمیل قبلاً ثبت شده است' };
  if (error.status === 429) return { form: 'چند دقیقه دیگر تلاش کنید' };
  if (error.status === 500) return { form: 'خطای سرور، دوباره تلاش کنید' };

  if (error.status === 400 && Array.isArray(error.errors)) {
    const mapped = {};
    error.errors.forEach((msg) => {
      if (msg.includes('نام')) mapped.name = 'نام باید حداقل ۲ کاراکتر باشد';
      else if (msg.includes('رمز')) mapped.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
      else if (msg.includes('ایمیل')) mapped.email = 'ایمیل معتبر وارد کنید';
    });
    if (Object.keys(mapped).length) return mapped;
    return { form: 'لطفاً همه فیلدها را پر کنید' };
  }

  return { form: error.message || 'خطای سرور، دوباره تلاش کنید' };
}

function mapLoginErrors(error, fields) {
  if (error.status === 401) return { password: 'ایمیل یا رمز عبور اشتباه است' };
  if (error.status === 500) return { form: 'خطای سرور، دوباره تلاش کنید' };
  return { form: error.message || 'خطای سرور، دوباره تلاش کنید' };
}

function validateLoginForm(email, password) {
  let valid = true;
  clearAuthErrors('login');

  if (!email || !password) {
    setFieldError('login-form-error', 'لطفاً همه فیلدها را پر کنید');
    valid = false;
  }

  if (email && !isValidEmail(email)) {
    setFieldError('login-email-error', 'ایمیل معتبر وارد کنید');
    valid = false;
  }

  return valid;
}

function validateRegisterForm(name, email, password) {
  let valid = true;
  clearAuthErrors('register');

  if (!name || !email || !password) {
    setFieldError('register-form-error', 'لطفاً همه فیلدها را پر کنید');
    valid = false;
  }

  if (name && name.trim().length < 2) {
    setFieldError('register-name-error', 'نام باید حداقل ۲ کاراکتر باشد');
    valid = false;
  }

  if (email && !isValidEmail(email)) {
    setFieldError('register-email-error', 'ایمیل معتبر وارد کنید');
    valid = false;
  }

  if (password && password.length < 6) {
    setFieldError('register-password-error', 'رمز عبور باید حداقل ۶ کاراکتر باشد');
    valid = false;
  }

  return valid;
}

async function handleAuthSuccess(data) {
  setToken(data.token);
  setUser(data.user);
  updateSidebarUser();
  showToast(`خوش آمدید ${data.user.name}!`, 'success');
  window.location.hash = '#overview';
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  document.getElementById('go-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#register';
  });

  document.getElementById('go-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#login';
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors('login');

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const submitBtn = document.getElementById('login-submit');

    if (!validateLoginForm(email, password)) return;

    setButtonLoading(submitBtn, true, 'ورود');

    try {
      const data = await api.login({ email, password });
      await handleAuthSuccess(data);
    } catch (error) {
      const mapped = mapLoginErrors(error);
      if (mapped.form) setFieldError('login-form-error', mapped.form);
      if (mapped.email) setFieldError('login-email-error', mapped.email);
      if (mapped.password) setFieldError('login-password-error', mapped.password);
    } finally {
      setButtonLoading(submitBtn, false, 'ورود');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors('register');

    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    const submitBtn = document.getElementById('register-submit');

    if (!validateRegisterForm(name, email, password)) return;

    setButtonLoading(submitBtn, true, 'ثبت نام');

    try {
      const data = await api.register({ name, email, password });
      await handleAuthSuccess(data);
    } catch (error) {
      const mapped = mapRegisterErrors(error);
      if (mapped.form) setFieldError('register-form-error', mapped.form);
      if (mapped.name) setFieldError('register-name-error', mapped.name);
      if (mapped.email) setFieldError('register-email-error', mapped.email);
      if (mapped.password) setFieldError('register-password-error', mapped.password);
    } finally {
      setButtonLoading(submitBtn, false, 'ثبت نام');
    }
  });
}
