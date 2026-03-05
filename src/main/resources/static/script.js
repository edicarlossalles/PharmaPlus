function logar() {

    const login = document.getElementById("login").value;
    const senha = document.getElementById("senha").value;

    if (login === "admin" && senha === "admin") {
        window.location.href = "home.html";
    } else {
        alert("Usuário ou senha incorreta!");
    }
}
