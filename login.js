async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('action', 'login');

    const response = await fetch(scriptURL, { method: 'POST', body: formData });
    const result = await response.text();

    if (result === "Login_Success") {
        // Redirect ke folder berbeda yang sudah Anda siapkan
        window.location.href = "app/index.html";
    } else {
        alert("Email atau Password salah!");
    }
}