const API_URL = "http://localhost:8080";

async function logar() {
    const matricula = parseInt(document.getElementById("login").value);
    const senha = document.getElementById("senha").value;

    try {
        const res = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula, senha })
        });

        const data = await res.json();

        if (data.sucesso) {
            localStorage.setItem("token", data.token);
            window.location.href = "home.html";
        } else {
            alert(data.mensagem);
        }

    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
        alert("Erro ao conectar com o servidor");
    }
}
